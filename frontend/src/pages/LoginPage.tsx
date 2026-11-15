import { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogle, setShowGoogle] = useState(false);
  const navigate = useNavigate();

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/groups');
    } catch {
      setError('Google 登入失敗，請再試一次');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/groups');
    } catch (e: unknown) {
      const msg = (e as { code?: string }).code;
      if (msg === 'auth/user-not-found' || msg === 'auth/wrong-password' || msg === 'auth/invalid-credential') {
        setError('Email 或密碼錯誤');
      } else if (msg === 'auth/user-disabled') {
        setError('此帳號已停用，請聯絡擁有者重新啟用後再登入。');
      } else {
        setError('登入失敗，請再試一次');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤖</div>
          <h1 className="text-3xl font-bold text-gray-900">WiPPY</h1>
          <p className="text-gray-500 mt-1 text-sm">LINE 群組 × AI Agent 中樞</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">登入</h2>

          {/* Email form */}
          <form onSubmit={handleEmail} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white text-gray-900 placeholder:text-gray-500 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
            <input
              type="password"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white text-gray-900 placeholder:text-gray-500 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
            {error && <p role="alert" className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '處理中...' : '登入'}
            </button>
          </form>

          <div className="mt-4 text-center">
            {!showGoogle ? (
              <button
                type="button"
                onClick={() => setShowGoogle(true)}
                className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-700"
              >
                改用 Google 帳號登入
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">只有擁有者事先加進名單的 Google 帳號進得來，其他帳號會被擋下。</p>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="text-sm text-blue-700 underline underline-offset-2 hover:text-blue-900 disabled:opacity-50"
                >
                  用 Google 帳號登入
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">帳號由 WiPPY 擁有者建立，不開放註冊。</p>
        </div>
      </div>
    </div>
  );
}
