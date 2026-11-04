import { useState } from 'react';
import { getErrorMessage } from '../../lib/apiError';
import { hubApi, type AgentKind, type AgentView, type HubGroup } from '../hubApi';
import { Button, Card, ErrorText, GroupChecklist, SelectField, TextField } from '../ui';
import { mcpUrl } from '../format';
import { useLoad } from '../useLoad';

type Secret = { kind: AgentKind; name: string; apiKey?: string; password?: string; email?: string | null };

function SecretBox({ secret, onClose }: { secret: Secret; onClose: () => void }) {
  return (
    <section role="region" aria-label="只顯示一次的憑證" className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2 text-sm">
      <p className="font-semibold text-amber-900">只顯示這一次，請立刻複製保存：{secret.name}</p>
      {secret.apiKey && (
        <>
          <p className="text-xs text-amber-800">API Key（在 Grok Bot 加入 MCP 時，header 填 <code>Authorization: Bearer &lt;key&gt;</code>）</p>
          <code className="block break-all bg-white rounded px-2 py-1">{secret.apiKey}</code>
          <p className="text-xs text-amber-800">MCP 網址</p>
          <code className="block break-all bg-white rounded px-2 py-1">{mcpUrl()}</code>
        </>
      )}
      {secret.password && (
        <>
          <p className="text-xs text-amber-800">Instinct 登入 Email</p>
          <code className="block break-all bg-white rounded px-2 py-1">{secret.email}</code>
          <p className="text-xs text-amber-800">密碼</p>
          <code className="block break-all bg-white rounded px-2 py-1">{secret.password}</code>
        </>
      )}
      <Button variant="secondary" onClick={onClose}>我已保存</Button>
    </section>
  );
}

function CreateAgentForm({ groups, onCreated }: { groups: HubGroup[]; onCreated: (secret: Secret) => void }) {
  const [kind, setKind] = useState<AgentKind>('grok_bot');
  const [name, setName] = useState('');
  const [allowedGroupIds, setAllowed] = useState<string[]>([]);
  const [dailySendLimit, setLimit] = useState('20');
  const [inboxAlertHours, setHours] = useState('24');
  const [routineUrl, setRoutineUrl] = useState('');
  const [routineKey, setRoutineKey] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const base = { kind, name: name.trim(), allowedGroupIds, dailySendLimit: Number(dailySendLimit), inboxAlertHours: Number(inboxAlertHours) };
    const input = kind === 'grok_bot'
      ? { ...base, ...(routineUrl.trim() ? { routineUrl: routineUrl.trim() } : {}), ...(routineKey.trim() ? { routineKey: routineKey.trim() } : {}) }
      : { ...base, email: email.trim() };
    try {
      const res = await hubApi.admin.createAgent(input);
      onCreated({ kind, name: res.agent.name, apiKey: res.apiKey, password: res.password, email: res.agent.accountEmail });
      setName(''); setRoutineUrl(''); setRoutineKey(''); setEmail(''); setAllowed([]);
    } catch (err) {
      setError(getErrorMessage(err, '建立失敗'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <SelectField label="類型" value={kind} onChange={(v) => setKind(v as AgentKind)} options={[{ value: 'grok_bot', label: 'Grok Bot（WiPPY 主動呼叫 + MCP/API）' }, { value: 'instinct', label: 'Instinct（用帳號登入工作台）' }]} />
      <TextField label="名稱" value={name} onChange={setName} required />
      {kind === 'grok_bot' ? (
        <>
          <TextField label="Routine Webhook 網址" value={routineUrl} onChange={setRoutineUrl} placeholder="https://..." hint="Grok Bot Routine 的 Webhook「POST to」網址" />
          <TextField label="Routine Webhook Key" value={routineKey} onChange={setRoutineKey} type="password" hint="Routine 的 Webhook key，會加密保存" />
        </>
      ) : (
        <>
          <TextField label="登入 Email" value={email} onChange={setEmail} type="email" required />
          <TextField label="收件匣逾時預警（小時）" value={inboxAlertHours} onChange={setHours} type="number" />
        </>
      )}
      <TextField label="每日發送上限" value={dailySendLimit} onChange={setLimit} type="number" />
      <GroupChecklist legend="允許使用的群組" groups={groups} selected={allowedGroupIds} onChange={setAllowed} />
      <ErrorText error={error} />
      <Button type="submit" disabled={saving}>建立 Agent</Button>
    </form>
  );
}

function AgentRow({ agent, groups, onChanged, onSecret }: { agent: AgentView; groups: HubGroup[]; onChanged: () => void; onSecret: (s: Secret) => void }) {
  const [allowed, setAllowed] = useState(agent.allowedGroupIds);
  const [limit, setLimit] = useState(String(agent.dailySendLimit));
  const [message, setMessage] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>, done?: string) {
    setMessage(null);
    try {
      await fn();
      if (done) setMessage(done);
      onChanged();
    } catch (err) {
      setMessage(getErrorMessage(err, '操作失敗'));
    }
  }

  return (
    <li className="py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">{agent.name} <span className="text-xs text-gray-400">{agent.kind === 'grok_bot' ? 'Grok Bot' : 'Instinct'}</span></p>
          <p className="text-xs text-gray-400">
            {agent.enabled ? '啟用中' : '已停用'}
            {agent.apiKeyPrefix && `・Key ${agent.apiKeyPrefix}…`}
            {agent.accountEmail && `・${agent.accountEmail}`}
            {agent.kind === 'grok_bot' && (agent.routineUrl ? '・Webhook 已設定' : '・Webhook 未設定')}
          </p>
        </div>
        <Button variant={agent.enabled ? 'danger' : 'secondary'} label={`${agent.enabled ? '停用' : '啟用'} ${agent.name}`} onClick={() => run(() => hubApi.admin.updateAgent(agent.id, { enabled: !agent.enabled }))}>
          {agent.enabled ? '停用' : '啟用'}
        </Button>
      </div>
      <GroupChecklist legend="允許使用的群組" groups={groups} selected={allowed} onChange={setAllowed} />
      <TextField label="每日發送上限" value={limit} onChange={setLimit} type="number" />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" label={`儲存 ${agent.name} 設定`} onClick={() => run(() => hubApi.admin.updateAgent(agent.id, { allowedGroupIds: allowed, dailySendLimit: Number(limit) }), '已儲存')}>儲存設定</Button>
        {agent.kind === 'grok_bot' ? (
          <>
            <Button variant="secondary" onClick={() => run(async () => { const r = await hubApi.admin.testAgent(agent.id); setMessage(r.ok ? `Webhook 測試成功（HTTP ${r.status}）` : `Webhook 測試失敗：${r.status ?? ''} ${r.detail ?? ''}`); })}>測試 Webhook</Button>
            <Button variant="secondary" onClick={() => run(async () => { const r = await hubApi.admin.rotateKey(agent.id); onSecret({ kind: 'grok_bot', name: agent.name, apiKey: r.apiKey }); })}>重新產生 API Key</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => run(async () => { const r = await hubApi.admin.resetPassword(agent.id); onSecret({ kind: 'instinct', name: agent.name, password: r.password, email: agent.accountEmail }); })}>重設密碼</Button>
        )}
      </div>
      {message && <p className="text-xs text-gray-600" role="status">{message}</p>}
    </li>
  );
}

export default function AgentsPage() {
  const groups = useLoad(() => hubApi.admin.groups().then((r) => r.groups));
  const agents = useLoad(() => hubApi.admin.agents().then((r) => r.agents));
  const [secret, setSecret] = useState<Secret | null>(null);

  return (
    <div className="space-y-4">
      {secret && <SecretBox secret={secret} onClose={() => setSecret(null)} />}
      <Card title="Agent 清單">
        <ErrorText error={agents.error} />
        {agents.data?.length === 0 && <p className="text-sm text-gray-400">還沒有 Agent</p>}
        <ul className="divide-y divide-gray-100">
          {agents.data?.map((a) => <AgentRow key={a.id} agent={a} groups={groups.data ?? []} onChanged={agents.reload} onSecret={setSecret} />)}
        </ul>
      </Card>
      <Card title="新增 Agent">
        <CreateAgentForm groups={groups.data ?? []} onCreated={(s) => { setSecret(s); void agents.reload(); }} />
      </Card>
    </div>
  );
}
