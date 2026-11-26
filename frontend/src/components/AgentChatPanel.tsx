import { useState, useRef, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseDb';
import type { AgentChatApiResponse, HarnessRunSnapshot } from '../lib/api';
import { explainError, explainRaw, OFFLINE_CHAT_MESSAGE, PLAN_BUTTON_LABEL, plain, type HelperNotice } from '../lib/helperCopy';
import type { ActivityWorkflowPrimary } from './activityWorkflow';
import { FriendlyNotice } from './FriendlyNotice';

const CONFIRM_SCHEDULE_DISPLAY = '就照這樣排';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  activityId: string;
  sessionId: string | null;
  onSessionId: (id: string) => void;
  onMessagesGenerated: () => void;
  onKnowledgeExtracted: () => void;
  onSendMessage: (
    message: string,
    sessionId: string | null,
    action?: 'confirm_schedule',
  ) => Promise<AgentChatApiResponse>;
  /** Which single action is solid. Defaults to 送出 so the composer stays usable on its own. */
  workflowPrimary?: ActivityWorkflowPrimary;
  onScheduleConfirmed?: () => void;
}

export default function AgentChatPanel({
  sessionId,
  onSessionId,
  onMessagesGenerated,
  onKnowledgeExtracted,
  onSendMessage,
  workflowPrimary = 'send',
  onScheduleConfirmed,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(Boolean(sessionId));
  const [error, setError] = useState<HelperNotice | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmRunRef = useRef(false);
  const onScheduleConfirmedRef = useRef(onScheduleConfirmed);
  useEffect(() => {
    onScheduleConfirmedRef.current = onScheduleConfirmed;
  }, [onScheduleConfirmed]);

  useEffect(() => {
    const container = scrollRef.current;
    container?.scrollTo?.({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    getDoc(doc(db, 'agentSessions', sessionId)).then(snap => {
      if (cancelled || !snap.exists()) return;
      const history = (snap.data().messages ?? []) as Array<Message & { displayContent?: string }>;
      const visible = history
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.displayContent ?? m.content.split('EXTRACTED_KNOWLEDGE:')[0].trim() }));
      setMessages(current => current.length ? current : visible);
      if (history.some(m => m.role === 'user' && (m.displayContent ?? m.content).trim() === CONFIRM_SCHEDULE_DISPLAY)) {
        onScheduleConfirmedRef.current?.();
      }
    }).catch(() => { if (!cancelled) setError(plain('無法載入歷史對話，請重新開啟活動')); })
      .finally(() => { if (!cancelled) setRestoring(false); });
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => () => unsubRef.current?.(), []);

  // Countdown timer for rate limit
  useEffect(() => {
    if (countdown <= 0) return;
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current!);
  }, [countdown]);

  const subscribeToRun = useCallback((runId: string) => {
    unsubRef.current?.();
    const unsub = onSnapshot(doc(db, 'harnessRuns', runId), (snap) => {
      if (!snap.exists()) return;
      const run = snap.data() as HarnessRunSnapshot;

      if (run.status === 'completed') {
        unsub();
        setLoading(false);
        const reply = run.reply ?? '（已完成，無回覆文字）';
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        if (run.generatedMessageCount > 0) onMessagesGenerated();
        if (run.extractedKnowledgeCount > 0) onKnowledgeExtracted();
        if (confirmRunRef.current) {
          confirmRunRef.current = false;
          onScheduleConfirmedRef.current?.();
        }
      } else if (run.status === 'failed') {
        unsub();
        setLoading(false);
        confirmRunRef.current = false;
        setError(explainRaw(run.lastError, '這次沒有完成。請再送出一次。'));
        setMessages((prev) => prev.slice(0, -1));
      }
    });
    unsubRef.current = unsub;
  }, [onMessagesGenerated, onKnowledgeExtracted]);

  async function send(text: string, action?: 'confirm_schedule') {
    const display = action === 'confirm_schedule' ? CONFIRM_SCHEDULE_DISPLAY : text;
    if (!display || loading || restoring || countdown > 0) return;

    confirmRunRef.current = action === 'confirm_schedule';
    setInput('');
    setError(null);
    setRateLimitWarning(null);
    setMessages((prev) => [...prev, { role: 'user', content: display }]);
    setLoading(true);

    try {
      const result = action
        ? await onSendMessage(display, sessionId, action)
        : await onSendMessage(display, sessionId);

      if (result.status === 'rate_limited') {
        confirmRunRef.current = false;
        setMessages((prev) => prev.slice(0, -1));
        if (!action) setInput(text);
        setLoading(false);
        setCountdown(result.retryAfterSeconds ?? 60);
        return;
      }

      if (result.sessionId && !sessionId) onSessionId(result.sessionId);

      if (result.rateLimitWarning) {
        setRateLimitWarning(`我先喘口氣，這一分鐘還能再回 ${result.rateLimitWarning.remaining} 次，${result.rateLimitWarning.windowResetInSeconds} 秒後恢復。`);
      }

      if (result.status === 'completed') {
        // Dev/sync mode — result is inline
        setLoading(false);
        setMessages((prev) => [...prev, { role: 'assistant', content: result.reply ?? '（已完成）' }]);
        if ((result.generatedMessageCount ?? 0) > 0) onMessagesGenerated();
        if ((result.extractedKnowledgeCount ?? 0) > 0) onKnowledgeExtracted();
        if (confirmRunRef.current) {
          confirmRunRef.current = false;
          onScheduleConfirmedRef.current?.();
        }
      } else {
        // Async mode — subscribe to Firestore
        subscribeToRun(result.runId);
      }
    } catch (err) {
      confirmRunRef.current = false;
      setError(err instanceof TypeError
        ? plain(OFFLINE_CHAT_MESSAGE)
        : explainError(err, '沒能送出。請檢查網路後再按一次送出，剛才打的字還在。'));
      setMessages((prev) => prev.slice(0, -1));
      if (!action) setInput(text);
      setLoading(false);
    }
  }

  function handleSend() { send(input.trim()); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isBlocked = loading || restoring || countdown > 0;
  const confirmIsPrimary = workflowPrimary === 'confirm';
  const showConfirm = confirmIsPrimary || (workflowPrimary === 'send' && messages.length > 0);
  const planCtaIsPrimary = workflowPrimary === 'plan' && messages.length === 0;
  const sendIsPrimary = workflowPrimary === 'send' || (workflowPrimary === 'plan' && messages.length > 0);
  const solidClass = 'text-white disabled:opacity-40 transition-colors';
  const quietClass = 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 disabled:opacity-40 transition-colors';

  return (
    <div className="flex flex-col h-[480px]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 py-2">
        {restoring && <p className="text-sm text-gray-400">載入歷史對話...</p>}
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm text-gray-400">跟小幫手說你的活動，或直接請它安排要發的訊息</p>
            <button
              onClick={() => send('幫我規劃三則活動前的暖場推播訊息')}
              disabled={isBlocked}
              data-primary={planCtaIsPrimary ? 'true' : undefined}
              className={`text-sm rounded-lg px-4 py-2 ${planCtaIsPrimary ? `bg-blue-600 hover:bg-blue-700 ${solidClass}` : quietClass}`}
            >{PLAN_BUTTON_LABEL}</button>
            <div className="flex flex-col gap-1.5 mt-4">
              {[
                '幫我規劃三則活動前的暖場推播訊息',
                '我在辦一個密室逃脫活動，主題是 1920 年代上海...',
                '根據目前知識庫，重新規劃企畫',
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="text-xs text-blue-500 hover:text-blue-700 border border-blue-100 rounded-lg px-3 py-2 hover:border-blue-300 text-left transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Status messages */}
      <FriendlyNotice notice={error} role="alert" className="text-xs text-red-500 px-1 pb-1" />
      {rateLimitWarning && !error && (
        <p className="text-xs text-amber-500 px-1 pb-1">{rateLimitWarning}</p>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        {countdown > 0 && (
          <p className="text-xs text-orange-500 text-center">
            我先喘口氣，請 <span className="font-semibold">{countdown}</span> 秒後再試
          </p>
        )}
        {showConfirm && (
          <button
            type="button"
            onClick={() => send('', 'confirm_schedule')}
            disabled={isBlocked}
            data-primary={confirmIsPrimary ? 'true' : undefined}
            className={`w-full text-sm rounded-xl px-4 py-2 font-medium ${
              confirmIsPrimary ? `bg-green-600 hover:bg-green-700 ${solidClass}` : quietClass
            }`}
          >
            ✅ 討論好了，確認排程
          </button>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 min-h-[40px] max-h-[120px] disabled:bg-gray-50 disabled:text-gray-400"
            placeholder={countdown > 0 ? `請等待 ${countdown} 秒...` : '輸入訊息... (Enter 送出，Shift+Enter 換行)'}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBlocked}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isBlocked || !input.trim()}
            data-primary={sendIsPrimary ? 'true' : undefined}
            className={`rounded-xl px-4 py-2 text-sm font-medium shrink-0 ${
              sendIsPrimary ? `bg-blue-500 hover:bg-blue-600 ${solidClass}` : quietClass
            }`}
          >
            送出
          </button>
        </div>
      </div>
    </div>
  );
}
