import { useState } from 'react';
import { getErrorMessage } from '../../lib/apiError';
import { hubApi, type HubGroup, type HubSettings } from '../hubApi';
import { Button, Card, ErrorText, SelectField, TextField } from '../ui';
import { useLoad } from '../useLoad';

const MB = 1024 * 1024;

function toForm(s: HubSettings): Record<string, string> {
  return {
    alertGroupId: s.alertGroupId ?? '',
    warn: s.quotaWarnPercents.join(', '),
    reserve: String(s.quotaReservePercent),
    retention: String(s.retentionDays),
    mediaMb: String(Math.round(s.mediaMaxBytes / MB)),
    signedDays: String(s.signedUrlDays),
    rpm: String(s.llm.maxRpm),
    rpd: String(s.llm.maxRpd),
    interval: String(s.llm.minIntervalMs),
  };
}

export default function HubSettingsPage() {
  const settings = useLoad(() => hubApi.admin.settings().then((r) => r.settings));
  const groups = useLoad(() => hubApi.admin.groups().then((r) => r.groups));
  if (!settings.data) return <Card title="設定"><ErrorText error={settings.error} /><p className="text-sm text-gray-400">載入中...</p></Card>;
  return <SettingsForm initial={settings.data} groups={groups.data ?? []} />;
}

function SettingsForm({ initial, groups }: { initial: HubSettings; groups: HubGroup[] }) {
  const [f, setF] = useState<Record<string, string>>(() => toForm(initial));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string) => (v: string) => setF({ ...f, [k]: v });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await hubApi.admin.saveSettings({
        alertGroupId: f['alertGroupId'] || null,
        quotaWarnPercents: (f['warn'] ?? '').split(/[,，]/).map((v) => Number(v.trim())).filter((n) => Number.isFinite(n) && n > 0),
        quotaReservePercent: Number(f['reserve']),
        retentionDays: Number(f['retention']),
        mediaMaxBytes: Number(f['mediaMb']) * MB,
        signedUrlDays: Number(f['signedDays']),
        llm: { maxRpm: Number(f['rpm']), maxRpd: Number(f['rpd']), minIntervalMs: Number(f['interval']) },
      });
      setMessage('已儲存');
    } catch (err) {
      setError(getErrorMessage(err, '儲存失敗'));
    }
  }

  return (
    <Card title="Agent Hub 設定">
      <form onSubmit={save} className="space-y-3">
        <SelectField label="預警群組" value={f['alertGroupId'] ?? ''} onChange={set('alertGroupId')} options={[{ value: '', label: '未設定' }, ...groups.map((g) => ({ value: g.groupId, label: `${g.name}（${g.memberCount} 人）` }))]} />
        <p className="text-xs text-gray-400">建議用只有你和機器人的群組：發到群組按人數扣額度，這樣每則預警只扣 1 則。</p>
        <TextField label="額度預警門檻（%，逗號分隔）" value={f['warn'] ?? ''} onChange={set('warn')} />
        <TextField label="保留給預警的額度（%）" value={f['reserve'] ?? ''} onChange={set('reserve')} type="number" />
        <TextField label="資料保存天數" value={f['retention'] ?? ''} onChange={set('retention')} type="number" />
        <TextField label="媒體下載上限（MB）" value={f['mediaMb'] ?? ''} onChange={set('mediaMb')} type="number" />
        <TextField label="媒體連結有效天數" value={f['signedDays'] ?? ''} onChange={set('signedDays')} type="number" hint="1–7 天" />
        <TextField label="免費模型每分鐘上限" value={f['rpm'] ?? ''} onChange={set('rpm')} type="number" />
        <TextField label="免費模型每日上限" value={f['rpd'] ?? ''} onChange={set('rpd')} type="number" />
        <TextField label="兩次呼叫最短間隔（毫秒）" value={f['interval'] ?? ''} onChange={set('interval')} type="number" />
        <ErrorText error={error} />
        {message && <p className="text-sm text-emerald-600" role="status">{message}</p>}
        <Button type="submit">儲存設定</Button>
      </form>
    </Card>
  );
}
