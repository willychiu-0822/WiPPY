import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../pages/GroupsPage', () => ({ default: () => <p>chat list</p> }));
vi.mock('../hub/pages/GroupAccessPage', () => ({ default: () => <p>agent access</p> }));

import GroupsSection from '../pages/GroupsSection';
import HubLayout from '../hub/pages/HubLayout';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/groups" element={<GroupsSection />} />
        <Route path="/hub" element={<HubLayout />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('one 群組 entry', () => {
  it('opens on chat and switches to Agent access in the same page', async () => {
    renderAt('/groups');
    expect(screen.getByText('chat list')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: '交給 Agent' }));
    expect(screen.getByText('agent access')).toBeInTheDocument();
    expect(screen.queryByText('chat list')).not.toBeInTheDocument();
  });

  it('lands on Agent access when linked with ?tab=agent', () => {
    renderAt('/groups?tab=agent');
    expect(screen.getByText('agent access')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '交給 Agent' })).toHaveAttribute('aria-selected', 'true');
  });

  it('Agent Hub no longer has a second 群組 tab', () => {
    renderAt('/hub');
    expect(screen.queryByRole('link', { name: /群組/ })).not.toBeInTheDocument();
  });
});
