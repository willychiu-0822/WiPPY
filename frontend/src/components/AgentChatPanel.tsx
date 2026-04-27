import { useState, useRef, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { AgentChatApiResponse, HarnessRunSnapshot } from '../lib/api';

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
  onSendMessage: (message: string, sessionId: string | null) => Promise<AgentChatApiResponse>;
}

export default function AgentChatPanel({
  sessionId,
  onSessionId,
  onMessagesGenerated,
  onKnowledgeExtracted,
  onSendMessage,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      } else if (run.status === 'failed') {
        unsub();
        setLoading(false);
        const errMsg = run.lastError?.includes('max_llm_calls_exceeded')
          ? 'AI 嘗試次數已達上限，請稍後再試'
          : run.lastError?.includes('llm_rate_limit_error')
          ? 'AI 服務忙碌中，請稍後再試'
          : `處理失敗：${run.lastError ?? '未知錯誤'}`;
        setError(errMsg);
        setMessages((prev) => prev.slice(0, -1));
      }
    });
    unsubRef.current = unsub;
  }, [onMessagesGenerated, onKnowledgeExtracted]);

  async function send(text: string) {
    if (!text || loading || countdown > 0) return;

    setInput('');
    setError(null);
    setRateLimitWarning(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const result = await onSendMessage(text, sessionId);

      if (result.status === 'rate_limited') {
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
        setLoading(false);
        setCountdown(result.retryAfterSeconds ?? 60);
        return;
      }

      if (result.sessionId && !sessionId) onSessionId(result.sessionId);

      if (result.rateLimitWarning) {
        setRateLimitWarning(`本分鐘剩餘 ${result.rateLimitWarning.remaining} 次 AI 請求，${result.rateLimitWarning.windowResetInSeconds} 秒後重置`);
      }

      if (result.status === 'completed') {
        // Dev/sync mode — result is inline
        setLoading(false);
        setMessages((prev) => [...prev, { role: 'assistant', content: result.reply ?? '（已完成）' }]);
        if ((result.generatedMessageCount ?? 0) > 0) onMessagesGenerated();
        if ((result.extractedKnowledgeCount ?? 0) > 0) onKnowledgeExtracted();
      } else {
        // Async mode — subscribe to Firestore
        subscribeToRun(result.runId);
      }
    } catch (err) {
      setError(String(err).replace('Error: ', ''));
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
      setLoading(false);
    }
  }

  function handleSend() { send(input.trim()); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isBlocked = loading || countdown > 0;

  return (
    <div className="flex flex-col h-[480px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 py-2">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm text-gray-400">向 Agent 描述活動，或直接請它規劃推播企畫</p>
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

        <div ref={bottomRef} />
      </div>

      {/* Status messages */}
      {error && (
        <p className="text-xs text-red-500 px-1 pb-1">{error}</p>
      )}
      {rateLimitWarning && !error && (
        <p className="text-xs text-amber-500 px-1 pb-1">{rateLimitWarning}</p>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        {countdown > 0 && (
          <p className="text-xs text-orange-500 text-center">
            AI 助理需要稍作休息，請 <span className="font-semibold">{countdown}</span> 秒後再試
          </p>
        )}
        {messages.length > 0 && (
          <button
            onClick={() => send('確認排程。請立即輸出純 JSON 陣列，不可有任何說明文字或 markdown code fence，格式：[{"content":"...","targetGroups":["all"],"triggerValue":"YYYY-MM-DDTHH:MM:SS+08:00","sequenceOrder":1},...]')}
            disabled={isBlocked}
            className="w-full text-sm bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl px-4 py-2 font-medium disabled:opacity-40 transition-colors"
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
            onClick={handleSend}
            disabled={isBlocked || !input.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40 shrink-0 transition-colors"
          >
            送出
          </button>
        </div>
      </div>
    </div>
  );
}
