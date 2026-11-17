import { useSearchParams } from 'react-router-dom';
import LogsPage from '../hub/pages/LogsPage';
import RecordsPage from '../hub/pages/RecordsPage';
import SendHistoryPage from './SendHistoryPage';

const FILTERS = [
  { id: 'sent', label: '發出去的訊息', hint: '活動排程和手動發送，發到哪些群、有沒有成功。' },
  { id: 'notes', label: 'Agent 記下的事', hint: 'Agent 從群組對話裡幫你存下來的重點。' },
  { id: 'runs', label: '處理過程', hint: '每一步交給誰、做了什麼、哪裡卡住，卡住的可以在這裡重試。' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

/**
 * The one "紀錄" entry for the owner. What used to be three separate pages
 * (send history, Agent records, Hub logs) are three filters of the same page.
 */
export default function AllRecordsPage() {
  const [params, setParams] = useSearchParams();
  const active: FilterId = FILTERS.find((f) => f.id === params.get('type'))?.id ?? 'sent';
  const current = FILTERS.find((f) => f.id === active)!;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">紀錄</h1>
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="想看哪一種紀錄">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={active === f.id}
            onClick={() => setParams(f.id === 'sent' ? {} : { type: f.id }, { replace: true })}
            className={`px-3 py-1.5 rounded-lg text-sm ${active === f.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">{current.hint}</p>
      {active === 'sent' && <SendHistoryPage />}
      {active === 'notes' && <RecordsPage title="Agent 記下的事" />}
      {active === 'runs' && <LogsPage />}
    </div>
  );
}
