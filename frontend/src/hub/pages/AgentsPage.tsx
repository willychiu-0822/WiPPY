import { useState } from 'react';
import { explainError, explainRaw, plain, shownError, type HelperNotice } from '../../lib/helperCopy';
import { hubApi, type AgentKind, type AgentView, type HubGroup } from '../hubApi';
import { ConfirmAction } from '../../components/ConfirmAction';
import { Button, Card, ErrorText, GroupChecklist, SelectField, TextField } from '../ui';
import { mcpUrl } from '../format';
import { useLoad } from '../useLoad';
import { FriendlyNotice } from '../../components/FriendlyNotice';

type Secret = { kind: AgentKind; name: string; apiKey?: string; password?: string; email?: string | null };

function settingsError(limit: string, hours?: string): string | null {
  const valid = (value: string, min: number, max: number) => value.trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
  if (!valid(limit, 0, 1000)) return '每日發送上限請填 0 到 1000 的整數';
  if (hours !== undefined && !valid(hours, 1, 720)) return '收件匣逾時預警請填 1 到 720 的整數小時';
  return null;
}

function SecretBox({ secret, onClose }: { secret: Secret; onClose: () => void }) {
  return (
    <section role="region" aria-label="只顯示一次的憑證" className="bg-amber-50 text-gray-900 border border-amber-300 rounded-xl p-4 space-y-2 text-sm">
      <p className="font-semibold text-amber-900">只顯示這一次，請立刻複製保存：{secret.name}</p>
      {secret.apiKey && (
        <>
          <p className="text-xs text-amber-800">連線金鑰。貼到 Grok 的連線設定時，授權方式選 Bearer，再貼上這組金鑰。</p>
          <code className="block break-all bg-white rounded px-2 py-1">{secret.apiKey}</code>
          <p className="text-xs text-amber-800">連線網址</p>
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
    if (!name.trim()) { setError('請填寫小幫手名稱'); return; }
    const validation = settingsError(dailySendLimit, kind === 'instinct' ? inboxAlertHours : undefined);
    if (validation) { setError(validation); return; }
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
      setError(shownError(err, '沒有建立成功。請稍後再試一次。'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <SelectField label="類型" value={kind} onChange={(v) => setKind(v as AgentKind)} options={[{ value: 'grok_bot', label: 'Grok Bot（由 WiPPY 主動通知）' }, { value: 'instinct', label: 'Instinct（用帳號登入後自己操作）' }]} />
      <TextField label="名稱" value={name} onChange={setName} required />
      {kind === 'grok_bot' ? (
        <>
          <TextField label="自動通知網址" value={routineUrl} onChange={setRoutineUrl} placeholder="https://..." hint="貼上 Grok 例行工作裡「發送到這個網址」的那一欄。" />
          <TextField label="自動通知金鑰" value={routineKey} onChange={setRoutineKey} type="password" hint="會加密保存。不確定可以先留空。" />
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
      <Button type="submit" disabled={saving}>建立小幫手</Button>
    </form>
  );
}

function AgentRow({ agent, groups, onChanged, onSecret }: { agent: AgentView; groups: HubGroup[]; onChanged: () => void; onSecret: (s: Secret) => void }) {
  const [allowed, setAllowed] = useState(agent.allowedGroupIds);
  const [limit, setLimit] = useState(String(agent.dailySendLimit));
  const [inboxAlertHours, setHours] = useState(String(agent.inboxAlertHours));
  const [routineUrl, setRoutineUrl] = useState(agent.routineUrl ?? '');
  const [routineKey, setRoutineKey] = useState('');
  const [message, setMessage] = useState<HelperNotice | null>(null);

  function settingsPatch(): Record<string, unknown> {
    const patch: Record<string, unknown> = { allowedGroupIds: allowed, dailySendLimit: Number(limit) };
    if (agent.kind === 'instinct') patch['inboxAlertHours'] = Number(inboxAlertHours);
    if (agent.kind === 'grok_bot') {
      if (routineUrl.trim() !== (agent.routineUrl ?? '')) patch['routineUrl'] = routineUrl.trim() || null;
      if (routineKey.trim()) patch['routineKey'] = routineKey.trim();
    }
    return patch;
  }

  async function run(fn: () => Promise<unknown>, done?: string) {
    setMessage(null);
    try {
      await fn();
      if (done) setMessage(plain(done));
      onChanged();
    } catch (err) {
      setMessage(explainError(err, '沒有完成。請稍後再試一次。'));
    }
  }

  return (
    <li className="py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">{agent.name} <span className="text-xs text-gray-400">{agent.kind === 'grok_bot' ? 'Grok Bot' : 'Instinct'}</span></p>
          <p className="text-xs text-gray-400">
            {agent.enabled ? '啟用中' : '已停用'}
            {agent.apiKeyPrefix && `・金鑰 ${agent.apiKeyPrefix}…`}
            {agent.accountEmail && `・${agent.accountEmail}`}
            {agent.kind === 'grok_bot' && (agent.routineUrl ? '・自動通知已設定' : '・自動通知尚未設定')}
          </p>
        </div>
        {agent.enabled ? (
          <ConfirmAction variant="danger" name={`停用 ${agent.name}`} label="停用" confirmLabel="確定停用" onConfirm={() => run(() => hubApi.admin.updateAgent(agent.id, { enabled: false }))} />
        ) : (
          <Button variant="secondary" label={`啟用 ${agent.name}`} onClick={() => run(() => hubApi.admin.updateAgent(agent.id, { enabled: true }))}>啟用</Button>
        )}
      </div>
      <GroupChecklist legend="允許使用的群組" groups={groups} selected={allowed} onChange={setAllowed} />
      <TextField label="每日發送上限" value={limit} onChange={setLimit} type="number" />
      {agent.kind === 'instinct' && (
        <TextField label={`收件匣逾時預警（${agent.name}，小時）`} value={inboxAlertHours} onChange={setHours} type="number" />
      )}
      {agent.kind === 'grok_bot' && (
        <>
          <TextField label={`自動通知網址（${agent.name}）`} value={routineUrl} onChange={setRoutineUrl} placeholder="https://..." />
          <TextField label={`自動通知金鑰（${agent.name}，留空表示不改）`} value={routineKey} onChange={setRoutineKey} type="password" />
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" label={`儲存 ${agent.name} 設定`} onClick={() => {
          const validation = settingsError(limit, agent.kind === 'instinct' ? inboxAlertHours : undefined);
          if (validation) { setMessage(plain(validation)); return; }
          void run(async () => { await hubApi.admin.updateAgent(agent.id, settingsPatch()); setRoutineKey(''); }, '已儲存');
        }}>儲存設定</Button>
        {agent.kind === 'grok_bot' ? (
          <>
            <Button variant="secondary" onClick={() => run(async () => {
              const r = await hubApi.admin.testAgent(agent.id);
              setMessage(r.ok
                ? plain('自動通知測試成功')
                : explainRaw([r.status, r.detail].filter((part) => part !== null && part !== undefined && String(part) !== '').join(' '), '自動通知沒有打通。請檢查網址和金鑰後再試一次。'));
            })}>測試自動通知</Button>
            <Button variant="secondary" onClick={() => run(async () => { const r = await hubApi.admin.rotateKey(agent.id); onSecret({ kind: 'grok_bot', name: agent.name, apiKey: r.apiKey }); })}>重新產生連線金鑰</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => run(async () => { const r = await hubApi.admin.resetPassword(agent.id); onSecret({ kind: 'instinct', name: agent.name, password: r.password, email: agent.accountEmail }); })}>重設密碼</Button>
        )}
      </div>
      <FriendlyNotice notice={message} role="status" className="text-xs text-gray-600" />
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
      <Card title="小幫手名單">
        <ErrorText error={agents.error} />
        {agents.data?.length === 0 && <p className="text-sm text-gray-400">還沒有小幫手</p>}
        <ul className="divide-y divide-gray-100">
          {agents.data?.map((a) => <AgentRow key={a.id} agent={a} groups={groups.data ?? []} onChanged={agents.reload} onSecret={setSecret} />)}
        </ul>
      </Card>
      <Card title="新增小幫手">
        <CreateAgentForm groups={groups.data ?? []} onCreated={(s) => { setSecret(s); void agents.reload(); }} />
      </Card>
    </div>
  );
}
