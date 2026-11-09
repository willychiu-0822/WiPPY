import { useState } from 'react';
import { LiffProvider } from '../contexts/LiffContext';
import { useLiff } from '../contexts/useLiff';
import { getLiffEntryParam } from '../lib/liffEntry';
import { shareLineMessage } from '../lib/liffShare';

export function LiffCheckContent() {
  const { loading, error, profile, groupId } = useLiff();
  const [result, setResult] = useState('');
  const [shareError, setShareError] = useState('');
  const [sharing, setSharing] = useState(false);
  async function share() {
    setShareError('');
    setResult('');
    setSharing(true);
    try {
      setResult(await shareLineMessage({ type: 'flex', altText: 'WiPPY 本機驗證',
        contents: { type: 'bubble', body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: 'WiPPY 本機驗證' }] } },
      }));
    } catch (err) { setShareError(err instanceof Error ? err.message : '分享失敗，請重試'); }
    finally { setSharing(false); }
  }
  return (
    <main className="max-w-lg mx-auto p-4 space-y-4 break-words">
      <h1 className="text-xl font-bold">LIFF 本機檢查</h1>
      <p>此頁驗證既有 LIFF 共用工具，使用 mock，尚無正式 LIFF 活動業務入口。</p>
      <nav className="flex flex-wrap gap-3 text-blue-600">
        <a href="?mockPreset=default">default</a>
        <a href="?mockPreset=no_group">no_group</a>
        <a href="?mockPreset=share_unavailable">share_unavailable</a>
      </nav>
      {loading ? <p>LIFF 載入中...</p> : error ? <p role="alert">{error}</p> : <>
        <p>{profile?.displayName}</p>
        <p>{groupId || '請從 LINE 群組開啟活動連結'}</p>
        <p>{getLiffEntryParam(window.location.search, 'activityId') || '未指定活動'}</p>
        <button className="bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50" disabled={!groupId || sharing} onClick={share}>測試分享</button>
        {result && <p role="status">{result}</p>}
        {shareError && <p role="alert">{shareError}</p>}
      </>}
      <a className="block text-blue-600" href="/login">返回 WiPPY</a>
    </main>
  );
}
export default function LiffCheck() {
  return <LiffProvider><LiffCheckContent /></LiffProvider>;
}
