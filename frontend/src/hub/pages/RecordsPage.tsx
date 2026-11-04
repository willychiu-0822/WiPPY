import { useState } from 'react';
import { hubApi } from '../hubApi';
import { Button, Card, ErrorText, TextField } from '../ui';
import { formatTime } from '../format';
import { useLoad } from '../useLoad';

export default function RecordsPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState<{ q?: string; category?: string }>({});
  const records = useLoad(() => hubApi.agent.records(filter).then((r) => r.records), [filter]);

  return (
    <Card title="紀錄">
      <form onSubmit={(e) => { e.preventDefault(); setFilter({ q: q.trim() || undefined, category: category.trim() || undefined }); }} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
        <TextField label="關鍵字" value={q} onChange={setQ} />
        <TextField label="分類" value={category} onChange={setCategory} />
        <Button type="submit" variant="secondary">查詢</Button>
      </form>
      <ErrorText error={records.error} />
      {records.data?.length === 0 && <p className="text-sm text-gray-400">沒有紀錄</p>}
      <ul className="divide-y divide-gray-100">
        {records.data?.map((r) => (
          <li key={r.id} className="py-3">
            <p className="text-sm font-medium text-gray-900">{r.title} <span className="text-xs text-gray-400">［{r.category}］</span></p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</p>
            <p className="text-xs text-gray-400">{formatTime(r.createdAt)}・{r.agentId}{r.tags.length ? `・#${r.tags.join(' #')}` : ''}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
