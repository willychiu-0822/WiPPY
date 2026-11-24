import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../pages/SendHistoryPage', () => ({ default: () => <p>sent list</p> }));
vi.mock('../hub/pages/RecordsPage', () => ({ default: ({ title }: { title?: string }) => <p>notes list {title}</p> }));
vi.mock('../hub/pages/LogsPage', () => ({ default: () => <p>runs list</p> }));
vi.mock('../hub/pages/DashboardPage', () => ({ default: () => <p>dashboard</p> }));
vi.mock('../hub/pages/HubSettingsPage', () => ({ default: () => <p>settings</p> }));

import AllRecordsPage from '../pages/AllRecordsPage';
import HubLayout from '../hub/pages/HubLayout';
import HubOverviewPage from '../hub/pages/HubOverviewPage';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/records" element={<AllRecordsPage />} />
        <Route path="/hub" element={<HubLayout />}>
          <Route index element={<HubOverviewPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('W-18 — one 紀錄 page, fewer entries', () => {
  it('opens on sent messages and switches between the three kinds with a filter', async () => {
    renderAt('/records');
    expect(screen.getByRole('heading', { name: '紀錄' })).toBeInTheDocument();
    expect(screen.getByText('sent list')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '發出去的訊息' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(screen.getByRole('tab', { name: 'Agent 記下的事' }));
    expect(await screen.findByText('notes list Agent 記下的事')).toBeInTheDocument();
    expect(screen.queryByText('sent list')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '處理過程' }));
    expect(await screen.findByText('runs list')).toBeInTheDocument();
  });

  it('old links land on the right filter', async () => {
    const runs = renderAt('/records?type=runs');
    expect(await screen.findByText('runs list')).toBeInTheDocument();
    runs.unmount();

    const notes = renderAt('/records?type=notes');
    expect(await screen.findByText('notes list Agent 記下的事')).toBeInTheDocument();
    notes.unmount();

    renderAt('/records?type=nope');
    expect(screen.getByText('sent list')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '發出去的訊息' })).toHaveAttribute('aria-selected', 'true');
  });

  it('a settings bookmark lands on the settings section of the overview', () => {
    const previous = HTMLElement.prototype.scrollIntoView;
    const scroll = vi.fn();
    HTMLElement.prototype.scrollIntoView = scroll;
    try {
      renderAt('/hub?section=settings');
      expect(screen.getByRole('region', { name: '設定' })).toContainElement(screen.getByText('settings'));
      expect(scroll).toHaveBeenCalled();
    } finally {
      HTMLElement.prototype.scrollIntoView = previous;
    }
  });

  it('Agent Hub is down to three tabs; overview and settings share one, workbench is not a tab', () => {
    renderAt('/hub');
    const tabs = within(screen.getByRole('navigation', { name: 'Agent Hub' })).getAllByRole('link');
    expect(tabs.map((t) => t.textContent)).toEqual(['總覽與設定', 'Agent', '規則']);
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('settings')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '打開試跑台' })).toHaveAttribute('href', '/hub/workbench');
    expect(screen.queryByRole('link', { name: '工作台' })).not.toBeInTheDocument();
  });
});
