import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HubRoleContext, type HubRoleState } from '../hub/hub-role-context';

const signOutMock = vi.hoisted(() => vi.fn());

vi.mock('firebase/auth', () => ({ signOut: signOutMock }));
vi.mock('../firebase', () => ({ auth: { tag: 'auth' } }));

import Layout from '../components/Layout';

function renderAs(state: HubRoleState) {
  return render(
    <HubRoleContext.Provider value={state}>
      <MemoryRouter><Layout /></MemoryRouter>
    </HubRoleContext.Provider>,
  );
}

const owner: HubRoleState = { me: { role: 'owner', agentId: null, agentName: null, ownerConfigured: true }, loading: false, error: null };
const agent: HubRoleState = { me: { role: 'agent', agentId: 'instinct_1', agentName: 'Instinct', ownerConfigured: true }, loading: false, error: null };

describe('Layout', () => {
  it('shows the owner four top-level entries and no removed legacy pages', () => {
    renderAs(owner);
    expect(screen.getByRole('link', { name: '群組' })).toHaveAttribute('href', '/groups');
    expect(screen.getByRole('link', { name: '活動' })).toHaveAttribute('href', '/activities');
    expect(screen.getByRole('link', { name: '紀錄' })).toHaveAttribute('href', '/records');
    expect(screen.getByRole('link', { name: '小幫手' })).toHaveAttribute('href', '/hub');
    expect(within(screen.getByRole('navigation', { name: '主選單' })).getAllByRole('link')).toHaveLength(4);
    expect(screen.queryByRole('link', { name: '設定' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '探索' })).not.toBeInTheDocument();
  });

  it('shows agent accounts only the workbench and records', () => {
    renderAs(agent);
    expect(screen.getByRole('link', { name: '工作台' })).toHaveAttribute('href', '/workbench');
    expect(screen.getByRole('link', { name: '紀錄' })).toHaveAttribute('href', '/workbench/records');
    expect(screen.queryByRole('link', { name: '群組' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '小幫手' })).not.toBeInTheDocument();
    expect(screen.getByText('Instinct')).toBeInTheDocument();
  });

  it('signs out from the header', async () => {
    renderAs(owner);
    await userEvent.click(screen.getByRole('button', { name: '登出' }));
    expect(signOutMock).toHaveBeenCalledWith({ tag: 'auth' });
  });
});
