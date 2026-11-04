import { useState } from 'react';
import { getErrorMessage } from '../../lib/apiError';
import { hubApi, type MessageType, type RuleInput, type RuleTrigger, type RuleView } from '../hubApi';
import { Button, Card, CheckboxField, ErrorText, GroupChecklist, SelectField, Switch, TextField } from '../ui';
import { useLoad } from '../useLoad';

const TRIGGERS: Array<{ value: RuleTrigger['type']; label: string }> = [
  { value: 'keyword', label: '出現關鍵字' },
  { value: 'message_type', label: '某種訊息類型（例如有人傳檔案）' },
  { value: 'mention', label: '有人 @ 機器人' },
  { value: 'volume', label: '訊息量（X 分鐘內超過 Y 則）' },
  { value: 'schedule', label: '定時（每 N 分鐘打包新訊息）' },
];
const TYPES: Array<{ value: MessageType; label: string }> = [
  { value: 'text', label: '文字' }, { value: 'image', label: '圖片' }, { value: 'video', label: '影片' },
  { value: 'audio', label: '語音' }, { value: 'file', label: '檔案' }, { value: 'sticker', label: '貼圖' }, { value: 'location', label: '位置' },
];

const EMPTY: RuleInput = {
  name: '', enabled: true, agentId: '', groupIds: [], trigger: { type: 'keyword', keywords: [] },
  include: { digest: false, raw: true, media: true, contextCount: 20 }, instruction: '', cooldownMinutes: 0,
};

function describeTrigger(t: RuleTrigger): string {
  switch (t.type) {
    case 'keyword': return `關鍵字：${t.keywords.join('、')}${t.regex ? `／regex ${t.regex}` : ''}`;
    case 'message_type': return `訊息類型：${t.messageTypes.join('、')}`;
    case 'mention': return '@ 機器人';
    case 'volume': return `${t.windowMinutes} 分鐘內 ≥ ${t.threshold} 則`;
    case 'schedule': return `每 ${t.intervalMinutes} 分鐘`;
  }
}

function RuleForm({ initial, onSaved, onCancel }: { initial: RuleView | null; onSaved: () => void; onCancel: () => void }) {
  const agents = useLoad(() => hubApi.admin.agents().then((r) => r.agents));
  const groups = useLoad(() => hubApi.admin.groups().then((r) => r.groups));
  const start = initial ?? EMPTY;
  const [name, setName] = useState(start.name);
  const [enabled, setEnabled] = useState(start.enabled);
  const [agentId, setAgentId] = useState(start.agentId);
  const [groupIds, setGroupIds] = useState(start.groupIds);
  const [triggerType, setTriggerType] = useState<RuleTrigger['type']>(start.trigger.type);
  const [keywords, setKeywords] = useState(start.trigger.type === 'keyword' ? start.trigger.keywords.join(', ') : '');
  const [regex, setRegex] = useState(start.trigger.type === 'keyword' ? start.trigger.regex ?? '' : '');
  const [messageTypes, setMessageTypes] = useState<MessageType[]>(start.trigger.type === 'message_type' ? start.trigger.messageTypes : ['file']);
  const [windowMinutes, setWindow] = useState(start.trigger.type === 'volume' ? String(start.trigger.windowMinutes) : '10');
  const [threshold, setThreshold] = useState(start.trigger.type === 'volume' ? String(start.trigger.threshold) : '20');
  const [intervalMinutes, setInterval] = useState(start.trigger.type === 'schedule' ? String(start.trigger.intervalMinutes) : '60');
  const [include, setInclude] = useState(start.include);
  const [instruction, setInstruction] = useState(start.instruction);
  const [cooldown, setCooldown] = useState(String(start.cooldownMinutes));
  const [error, setError] = useState<string | null>(null);

  function buildTrigger(): RuleTrigger {
    switch (triggerType) {
      case 'keyword': return { type: 'keyword', keywords: keywords.split(/[,，]/).map((k) => k.trim()).filter(Boolean), regex: regex.trim() || null };
      case 'message_type': return { type: 'message_type', messageTypes };
      case 'mention': return { type: 'mention' };
      case 'volume': return { type: 'volume', windowMinutes: Number(windowMinutes), threshold: Number(threshold) };
      case 'schedule': return { type: 'schedule', intervalMinutes: Number(intervalMinutes) };
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: RuleInput = { name: name.trim(), enabled, agentId, groupIds, trigger: buildTrigger(), include, instruction: instruction.trim(), cooldownMinutes: Number(cooldown) };
    try {
      if (initial) await hubApi.admin.updateRule(initial.id, input);
      else await hubApi.admin.createRule(input);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, '儲存失敗'));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <TextField label="規則名稱" value={name} onChange={setName} required />
      <SelectField label="交給哪個 Agent" value={agentId} onChange={setAgentId} options={[{ value: '', label: '請選擇' }, ...(agents.data ?? []).map((a) => ({ value: a.id, label: `${a.name}（${a.kind === 'grok_bot' ? 'Grok Bot' : 'Instinct'}）` }))]} />
      <GroupChecklist legend="套用的群組" groups={groups.data ?? []} selected={groupIds} onChange={setGroupIds} />
      <SelectField label="觸發條件" value={triggerType} onChange={(v) => setTriggerType(v as RuleTrigger['type'])} options={TRIGGERS} />
      {triggerType === 'keyword' && (
        <>
          <TextField label="關鍵字（用逗號分隔）" value={keywords} onChange={setKeywords} />
          <TextField label="Regex（選填）" value={regex} onChange={setRegex} />
        </>
      )}
      {triggerType === 'message_type' && (
        <fieldset className="flex flex-wrap gap-3">
          <legend className="text-xs font-medium text-gray-600 w-full">訊息類型</legend>
          {TYPES.map((t) => (
            <CheckboxField key={t.value} label={t.label} checked={messageTypes.includes(t.value)} onChange={(on) => setMessageTypes(on ? [...messageTypes, t.value] : messageTypes.filter((x) => x !== t.value))} />
          ))}
        </fieldset>
      )}
      {triggerType === 'volume' && (
        <>
          <TextField label="時間窗（分鐘）" value={windowMinutes} onChange={setWindow} type="number" />
          <TextField label="訊息數門檻" value={threshold} onChange={setThreshold} type="number" />
        </>
      )}
      {triggerType === 'schedule' && <TextField label="每隔幾分鐘" value={intervalMinutes} onChange={setInterval} type="number" hint="最少 5 分鐘" />}
      <fieldset className="space-y-1">
        <legend className="text-xs font-medium text-gray-600">交給 Agent 的內容</legend>
        <CheckboxField label="附重點整理（會用免費模型）" checked={include.digest} onChange={(v) => setInclude({ ...include, digest: v })} />
        <CheckboxField label="附原始訊息" checked={include.raw} onChange={(v) => setInclude({ ...include, raw: v })} />
        <CheckboxField label="附媒體下載連結" checked={include.media} onChange={(v) => setInclude({ ...include, media: v })} />
      </fieldset>
      <TextField label="上下文訊息數" value={String(include.contextCount)} onChange={(v) => setInclude({ ...include, contextCount: Number(v) })} type="number" hint="即時觸發時，連同前幾則訊息一起送出" />
      <TextField label="給 Agent 的指令" value={instruction} onChange={setInstruction} multiline required />
      <TextField label="冷卻時間（分鐘）" value={cooldown} onChange={setCooldown} type="number" hint="觸發後這段時間內不再觸發" />
      <CheckboxField label="啟用" checked={enabled} onChange={setEnabled} />
      <ErrorText error={error} />
      <div className="flex gap-2">
        <Button type="submit">儲存規則</Button>
        {initial && <Button variant="secondary" onClick={onCancel}>取消編輯</Button>}
      </div>
    </form>
  );
}

export default function RulesPage() {
  const rules = useLoad(() => hubApi.admin.rules().then((r) => r.rules));
  const [editing, setEditing] = useState<RuleView | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    try { await fn(); await rules.reload(); } catch (err) { setError(getErrorMessage(err, '操作失敗')); }
  }

  return (
    <div className="space-y-4">
      <Card title="規則">
        <ErrorText error={rules.error ?? error} />
        {rules.data?.length === 0 && <p className="text-sm text-gray-400">還沒有規則</p>}
        <ul className="divide-y divide-gray-100">
          {rules.data?.map((r) => (
            <li key={r.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-500">{describeTrigger(r.trigger)}・冷卻 {r.cooldownMinutes} 分鐘</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch label={`${r.name} 啟用`} checked={r.enabled} onChange={(on) => act(() => hubApi.admin.updateRule(r.id, { name: r.name, enabled: on, agentId: r.agentId, groupIds: r.groupIds, trigger: r.trigger, include: r.include, instruction: r.instruction, cooldownMinutes: r.cooldownMinutes }))} />
                <Button variant="secondary" label={`編輯 ${r.name}`} onClick={() => { setEditing(r); setFormKey((k) => k + 1); }}>編輯</Button>
                <Button variant="danger" label={`刪除 ${r.name}`} onClick={() => act(() => hubApi.admin.deleteRule(r.id))}>刪除</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={editing ? `編輯規則：${editing.name}` : '新增規則'}>
        <RuleForm key={formKey} initial={editing} onSaved={() => { setEditing(null); setFormKey((k) => k + 1); void rules.reload(); }} onCancel={() => { setEditing(null); setFormKey((k) => k + 1); }} />
      </Card>
    </div>
  );
}
