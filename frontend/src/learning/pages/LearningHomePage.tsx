import { Link } from 'react-router-dom';

export function LearningHomePage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-gray-900">探索</h1>
      <p className="text-sm text-gray-600">把英文內容變成低壓、可累積的理解練習。</p>
      <Link to="/learn/sources/new" className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">
        加入英文來源
      </Link>
    </div>
  );
}
