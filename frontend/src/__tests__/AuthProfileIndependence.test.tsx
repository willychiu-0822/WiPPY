import { act, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
const mocks = vi.hoisted(() => ({ listener: null as null | ((user: User | null) => unknown), profile: vi.fn(), unsubscribe: vi.fn() }));
vi.mock('../firebase', () => ({ auth: {} }));
vi.mock('firebase/auth', () => ({ onAuthStateChanged: (_auth: unknown, listener: (user: User | null) => unknown) => { mocks.listener = listener; return mocks.unsubscribe; } }));
vi.mock('../lib/firestore', () => ({ createUserDoc: mocks.profile }));
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../contexts/useAuth';
function State() { const { user, loading } = useAuth(); return <p>{loading ? 'loading' : user?.uid ?? 'signed out'}</p>; }
const user = { uid: 'instinct', email: 'instinct@example.test', displayName: 'Instinct' } as User;
beforeEach(() => { mocks.profile.mockReset(); mocks.unsubscribe.mockReset(); });
it('PR42-UAT-13 admits an authenticated Instinct while its profile write is pending', async () => {
  mocks.profile.mockReturnValue(new Promise(() => {}));
  render(<AuthProvider><State /></AuthProvider>);
  act(() => { void mocks.listener!(user); });
  expect(await screen.findByText('instinct')).toBeInTheDocument();
});
it('PR42-UAT-13 keeps a completed sign-out after an earlier profile write finishes', async () => {
  let finish!: () => void;
  mocks.profile.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
  render(<AuthProvider><State /></AuthProvider>);
  await act(async () => { void mocks.listener!(user); void mocks.listener!(null); finish(); });
  expect(screen.getByText('signed out')).toBeInTheDocument();
});
it('PR42-UAT-13 handles profile errors without rejecting the authentication callback', async () => {
  mocks.profile.mockRejectedValue(new Error('Firestore unavailable'));
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(<AuthProvider><State /></AuthProvider>);
  let rejected = false;
  await act(async () => { await Promise.resolve(mocks.listener!(user)).catch(() => { rejected = true; }); });
  expect(rejected).toBe(false);
  expect(screen.getByText('instinct')).toBeInTheDocument();
  warning.mockRestore();
});
