import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../lib/apiError';
import { hubApi, type ActionResult, type ActionType, type DispatchPayload, type InboxItem, type MessageView } from '../hubApi';
import { Button, Card, ErrorText, SelectField, TextField } from '../ui';
import { describeResult, formatTime } from '../format';
import { useLoad } from '../useLoad';

const ACTIONS: Array<{ value: ActionType; label: string }> = [
  { value: 'send_message', label: '發訊息到群組' },
  { value: 'send_alert', label: '發預警給擁有者' },
  { value: 'send_link', label: '發連結卡片（網頁/檔案）' },
  { value: 'send_image', label: '發圖片' },
  { value: 'send_video', label: '發影片' },
  { value: 'send_audio', label: '發語音' },
  { value: 'record', label: '存一筆紀錄' },
  { value: 'schedule_message', label: '排程訊息' },
];

const GROUP_ACTIONS: ActionType[] = ['send_message', 'send_link', 'send_image', 'send_video', 'send_audio', 'schedule_message'];

function MessageList({ messages }: { messages: MessageView[] }) {
  if (!messages.length) return <p className="text-xs text-gray-400">沒有訊息</p>;
  return (
    <ul className="space-y-2">
      {messages.map((m) => (
        <li key={m.id} className="text-sm">
          <span className="text-xs text-gray-400">{formatTime(m.at)}・{m.sender}</span>
          <div className="text-gray-800 whitespace-pre-wrap">{m.text ?? `[${m.type}${m.fileName ? ` ${m.fileName}` : ''}]`}</div>
          {m.media?.url && <a className="text-xs text-blue-600 underline" href={m.media.url} target="_blank" rel="noreferrer">下載媒體（{m.media.contentType ?? m.type}）</a>}
        </li>
      ))}
    </ul>
  );
}

function ActionForm({ defaultGroupId }: { defaultGroupId: string | null }) {
  const groups = useLoad(() => hubApi.agent.groups().then((r) => r.groups));
  const [type, setType] = useState<ActionType>('send_message');
  const [groupId, setGroupId] = useState(defaultGroupId ?? '');
  const [f, setF] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (defaultGroupId) setGroupId(defaultGroupId); }, [defaultGroupId]);

  const field = (key: string, label: string, opts: { type?: string; multiline?: boolean; hint?: string } = {}) => (
    <TextField label={label} value={f[key] ?? ''} onChange={(v) => setF({ ...f, [key]: v })} {...opts} />
  );

  function params(): Record<string, unknown> {
    const p: Record<string, unknown> = {};
    const set = (k: string, v: unknown) => { if (v !== '' && v !== undefined && v !== null) p[k] = v; };
    if (GROUP_ACTIONS.includes(type) || (type === 'record' && groupId)) set('groupId', groupId);
    switch (type) {
      case 'send_message': set('text', f['text']?.trim()); break;
      case 'send_alert': set('text', f['alertText']?.trim()); set('severity', f['severity'] || 'warning'); break;
      case 'send_link': set('url', f['url']?.trim()); set('title', f['title']?.trim()); set('description', f['description']?.trim()); set('imageUrl', f['imageUrl']?.trim()); break;
      case 'send_image': set('url', f['imageUrl']?.trim()); set('previewUrl', f['previewUrl']?.trim()); break;
      case 'send_video': set('url', f['videoUrl']?.trim()); set('previewUrl', f['previewUrl']?.trim()); break;
      case 'send_audio': set('url', f['audioUrl']?.trim()); if (f['durationMs']) set('durationMs', Number(f['durationMs'])); break;
      case 'record':
        set('category', f['category']?.trim()); set('title', f['title']?.trim()); set('content', f['content']?.trim());
        if (f['tags']) set('tags', f['tags'].split(/[,，]/).map((t) => t.trim()).filter(Boolean));
        break;
      case 'schedule_message':
        set('text', f['text']?.trim());
        if (f['sendAt']) set('sendAt', `${f['sendAt']}:00+08:00`);
        break;
      default: break;
    }
    return p;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await hubApi.agent.act(type, params()));
    } catch (err) {
      setError(getErrorMessage(err, '送出失敗'));
    } finally {
      setBusy(false);
    }
  }

  const needsGroup = GROUP_ACTIONS.includes(type) || type === 'record';
  return (
    <form onSubmit={submit} className="space-y-3">
      <SelectField label="動作" value={type} onChange={(v) => { setType(v as ActionType); setResult(null); }} options={ACTIONS} />
      {needsGroup && (
        <SelectField label="群組" value={groupId} onChange={setGroupId} options={[{ value: '', label: type === 'record' ? '不指定群組' : '請選擇群組' }, ...(groups.data ?? []).map((g) => ({ value: g.groupId, label: `${g.name}（${g.memberCount} 人）` }))]} />
      )}
      {type === 'send_message' && field('text', '訊息內容', { multiline: true })}
      {type === 'send_alert' && (
        <>
          {field('alertText', '預警內容', { multiline: true })}
          <SelectField label="嚴重程度" value={f['severity'] ?? 'warning'} onChange={(v) => setF({ ...f, severity: v })} options={[{ value: 'info', label: '資訊' }, { value: 'warning', label: '警告' }, { value: 'critical', label: '緊急' }]} />
        </>
      )}
      {type === 'send_link' && (
        <>
          {field('url', '網址', { hint: '必須是 https，而且不用登入就能打開' })}
          {field('title', '標題')}
          {field('description', '說明（選填）')}
          {field('imageUrl', '封面圖網址（選填）')}
        </>
      )}
      {type === 'send_image' && (<>{field('imageUrl', '圖片網址', { hint: '直接指向 jpeg/png 檔案，≤ 10MB' })}{field('previewUrl', '預覽圖網址（選填）', { hint: '原圖超過 1MB 時必填，≤ 1MB' })}</>)}
      {type === 'send_video' && (<>{field('videoUrl', '影片網址', { hint: 'mp4，≤ 200MB' })}{field('previewUrl', '預覽圖網址')}</>)}
      {type === 'send_audio' && (<>{field('audioUrl', '語音網址', { hint: 'm4a' })}{field('durationMs', '長度（毫秒）', { type: 'number' })}</>)}
      {type === 'record' && (<>{field('category', '分類')}{field('title', '標題')}{field('content', '內容', { multiline: true })}{field('tags', '標籤（逗號分隔）')}</>)}
      {type === 'schedule_message' && (<>{field('text', '訊息內容', { multiline: true })}{field('sendAt', '發送時間（台北時間）', { type: 'datetime-local' })}</>)}
      <ErrorText error={error ?? groups.error} />
      <Button type="submit" disabled={busy}>送出動作</Button>
      {result && <p role="status" className={`text-sm ${result.status === 'done' ? 'text-emerald-600' : result.status === 'queued' ? 'text-blue-600' : 'text-red-600'}`}>{describeResult(result)}</p>}
    </form>
  );
}

export default function WorkbenchPage() {
  const inbox = useLoad(() => hubApi.agent.inbox('open').then((r) => r.items));
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [detail, setDetail] = useState<DispatchPayload | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [doneResult, setDoneResult] = useState<ActionResult | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<MessageView[] | null>(null);

  async function open(item: InboxItem) {
    setSelected(item);
    setDetail(null);
    setDetailError(null);
    setDoneResult(null);
    try {
      setDetail(await hubApi.agent.dispatch(item.dispatchId));
    } catch (err) {
      setDetailError(getErrorMessage(err, '載入失敗'));
    }
  }

  async function complete() {
    if (!selected) return;
    const res = await hubApi.agent.act('complete_inbox', { itemId: selected.id, note: note.trim() });
    setDoneResult(res);
    if (res.status === 'done') {
      setNote('');
      void inbox.reload();
    }
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setHits((await hubApi.agent.search(query.trim())).messages);
  }

  return (
    <div className="space-y-4">
      <Card title="收件匣（待處理）" actions={<Button variant="secondary" onClick={() => void inbox.reload()}>重新整理</Button>}>
        <ErrorText error={inbox.error} />
        {inbox.data?.length === 0 && <p className="text-sm text-gray-400">目前沒有待處理的項目</p>}
        <ul className="space-y-2">
          {inbox.data?.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => void open(item)} className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${selected?.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                {item.ruleName}｜{item.groupName}
                <span className="block text-xs text-gray-400">{formatTime(item.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {selected && (
        <Card title={`項目：${selected.ruleName}｜${selected.groupName}`}>
          <ErrorText error={detailError} />
          <div>
            <p className="text-xs font-medium text-gray-600">擁有者的指令</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{selected.instruction}</p>
          </div>
          {detail?.digest && (
            <div>
              <p className="text-xs font-medium text-gray-600">重點整理{detail.digest.skipped ? `（未整理：${detail.digest.skipReason}）` : ''}</p>
              {detail.digest.summary && <p className="text-sm text-gray-900">{detail.digest.summary}</p>}
              <ul className="list-disc pl-5 text-sm text-gray-700">{detail.digest.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}
          {detail && (
            <div>
              <p className="text-xs font-medium text-gray-600">訊息（{detail.messageCount} 則）</p>
              <MessageList messages={detail.messages} />
              <p className="text-xs text-gray-400 mt-2">LINE 剩餘額度 {detail.quota.lineRemaining ?? '未知'} 則・今天還能發 {detail.quota.agentDailyRemaining} 次</p>
            </div>
          )}
          <TextField label="完成備註" value={note} onChange={setNote} multiline />
          <Button onClick={() => void complete()}>標記完成</Button>
          {doneResult && <p className="text-sm text-gray-600">{describeResult(doneResult)}</p>}
        </Card>
      )}

      <Card title="執行動作">
        <ActionForm defaultGroupId={selected?.groupId ?? null} />
      </Card>

      <Card title="搜尋訊息">
        <form onSubmit={search} className="flex gap-2 items-end">
          <div className="flex-1"><TextField label="搜尋關鍵字" value={query} onChange={setQuery} /></div>
          <Button type="submit" variant="secondary">搜尋</Button>
        </form>
        {hits && <MessageList messages={hits} />}
      </Card>
    </div>
  );
}
