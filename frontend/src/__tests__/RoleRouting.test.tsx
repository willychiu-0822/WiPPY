import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HubRoleContext, type HubRoleState } from '../hub/hub-role-context';

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }));
vi.mock('../firebase', () => ({ auth: {} }));

import { RoleGate } from '../hub/RoleGate';

function renderAt(path: string, state: HubRoleState) {
  return render(
    <HubRoleContext.Provider value={state}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/groups" element={<RoleGate allow={['owner']}><p>owner page</p></RoleGate>} />
          <Route path="/workbench" element={<RoleGate allow={['owner', 'agent']}><p>workbench</p></RoleGate>} />
        </Routes>
      </MemoryRouter>
    </HubRoleContext.Provider>,
  );
}

describe('RoleGate', () => {
  it('sends agent accounts away from owner pages to the workbench', () => {
    renderAt('/groups', { me: { role: 'agent', agentId: 'i1', agentName: 'Instinct', ownerConfigured: true }, loading: false, error: null });
    expect(screen.getByText('workbench')).toBeInTheDocument();
    expect(screen.queryByText('owner page')).not.toBeInTheDocument();
  });

  it('lets the owner in', () => {
    renderAt('/groups', { me: { role: 'owner', agentId: null, agentName: null, ownerConfigured: true }, loading: false, error: null });
    expect(screen.getByText('owner page')).toBeInTheDocument();
  });

  it('shows a no-access screen for accounts that were not created by the owner', () => {
    renderAt('/groups', { me: null, loading: false, error: 'account_not_allowed' });
    expect(screen.getByText('此帳號沒有 WiPPY 存取權限')).toBeInTheDocument();
  });
});
