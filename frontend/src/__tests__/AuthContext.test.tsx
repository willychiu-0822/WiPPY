import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../contexts/useAuth';

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as User | null },
  listeners: [] as Array<(user: User | null) => void>,
  createUserDoc: vi.fn(),
}));
vi.mock('../firebase', () => ({ auth: mocks.auth }));
vi.mock('../lib/firestore', () => ({ createUserDoc: mocks.createUserDoc }));
vi.mock('firebase/auth', () => ({ onAuthStateChanged: vi.fn((_auth, callback) => {
  mocks.listeners.push(callback);
  return vi.fn();
}) }));

function Probe() {
  const { user, loading, error, retry } = useAuth();
  return <>
    <p>{loading ? 'loading' : user?.uid ?? 'signed out'}</p>
    {error && <p role="alert">{error}</p>}
    <button onClick={retry}>retry</button>
  </>;
}
const user = { uid: 'new-host', displayName: null, email: 'host@example.test' } as User;
beforeEach(() => {
  mocks.listeners.length = 0;
  mocks.auth.currentUser = null;
  mocks.createUserDoc.mockReset();
});

describe('UAT-24 first-login profile recovery', () => {
  it('offers retry when profile initialization never completes, and ignores its late completion', async () => {
    vi.useFakeTimers();
    let finish!: () => void;
    mocks.createUserDoc.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; })).mockResolvedValueOnce(undefined);
    render(<AuthProvider><Probe /></AuthProvider>);
    mocks.auth.currentUser = user;
    act(() => { void mocks.listeners.at(-1)!(user); });
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(screen.getByRole('alert')).toHaveTextContent('無法載入帳號資料');
    fireEvent.click(screen.getByRole('button', { name: 'retry' }));
    await act(async () => {});
    expect(screen.getByText('new-host')).toBeInTheDocument();
    await act(async () => { finish(); });
    expect(screen.getByText('new-host')).toBeInTheDocument();
    vi.useRealTimers();
  });
  it('reports profile failure and retries the authenticated account', async () => {
    mocks.createUserDoc.mockRejectedValueOnce(new Error('Firestore offline')).mockResolvedValueOnce(undefined);
    render(<AuthProvider><Probe /></AuthProvider>);
    mocks.auth.currentUser = user;
    act(() => { void mocks.listeners.at(-1)!(user); });
    expect(await screen.findByRole('alert')).toHaveTextContent('無法載入帳號資料，請檢查網路連線後重試');
    // Blocking entry (formerly asserted here as 'signed out') is role-aware after the
    // PR42 merge and is covered at route level in ProfileGate.test.tsx.
    fireEvent.click(screen.getByRole('button', { name: 'retry' }));
    await waitFor(() => expect(screen.getByText('new-host')).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.createUserDoc).toHaveBeenCalledTimes(2);
    expect(mocks.createUserDoc).toHaveBeenLastCalledWith('new-host', { displayName: null, email: 'host@example.test' });
  });

  it('does not restore a signed-out user when an older profile request completes', async () => {
    let finish!: () => void;
    mocks.createUserDoc.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    render(<AuthProvider><Probe /></AuthProvider>);
    const changed = mocks.listeners.at(-1)!;
    act(() => { void changed(user); });
    mocks.auth.currentUser = null;
    await act(async () => { await changed(null); });
    await act(async () => { finish(); });
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(screen.queryByText('new-host')).not.toBeInTheDocument();
  });
});
