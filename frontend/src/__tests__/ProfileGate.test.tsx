import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HubRoleContext, type HubRoleState } from '../hub/hub-role-context';

const auth = vi.hoisted(() => ({ value: { user: { uid: 'u' }, loading: false, error: null as string | null, retry: vi.fn() } }));
vi.mock('../contexts/useAuth', () => ({ useAuth: () => auth.value }));

import { ProfileGate } from '../components/ProfileGate';

const owner: HubRoleState = { me: { role: 'owner', agentId: null, agentName: null, ownerConfigured: true }, loading: false, error: null };
const agent: HubRoleState = { me: { role: 'agent', agentId: 'i1', agentName: 'Instinct', ownerConfigured: true }, loading: false, error: null };
const MESSAGE = '無法載入帳號資料，請檢查網路連線後重試';

function renderGate(role: HubRoleState) {
  return render(<HubRoleContext.Provider value={role}><ProfileGate><p>back office</p></ProfileGate></HubRoleContext.Provider>);
}

describe('ProfileGate (UAT-24/32 owner recovery, PR42-UAT-13 agent independence)', () => {
  it('blocks the owner back office on a profile failure and retries the account', async () => {
    const retry = vi.fn();
    auth.value = { user: { uid: 'u' }, loading: false, error: MESSAGE, retry };
    const { rerender } = renderGate(owner);
    expect(screen.getByRole('alert')).toHaveTextContent(MESSAGE);
    expect(screen.queryByText('back office')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '重試載入帳號' }));
    expect(retry).toHaveBeenCalledOnce();
    auth.value = { ...auth.value, error: null };
    rerender(<HubRoleContext.Provider value={owner}><ProfileGate><p>back office</p></ProfileGate></HubRoleContext.Provider>);
    expect(screen.getByText('back office')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('never blocks an Instinct agent account on a profile failure', () => {
    auth.value = { user: { uid: 'u' }, loading: false, error: MESSAGE, retry: vi.fn() };
    renderGate(agent);
    expect(screen.getByText('back office')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lets everyone through when the profile is fine', () => {
    auth.value = { user: { uid: 'u' }, loading: false, error: null, retry: vi.fn() };
    renderGate(owner);
    expect(screen.getByText('back office')).toBeInTheDocument();
  });
});
