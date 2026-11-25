import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}));
vi.mock('../firebase', () => ({ auth: {}, googleProvider: {} }));
vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'owner' }, loading: false, error: null, syncing: false, retry: vi.fn() }),
}));
vi.mock('../hub/hubApi', () => ({
  HubApiError: class HubApiError extends Error {
    status: number;
    code: string | null;
    constructor(message: string, status: number, code: string | null) {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
  hubApi: {
    me: vi.fn().mockResolvedValue({ role: 'owner', agentId: null, agentName: null, ownerConfigured: true }),
    agent: {
      inbox: vi.fn().mockResolvedValue({ items: [] }),
      groups: vi.fn().mockResolvedValue({ groups: [] }),
    },
  },
}));
vi.mock('../pages/GroupsSection', () => ({ default: () => <p>groups section</p> }));
vi.mock('../pages/AllRecordsPage', () => ({ default: () => <p>all records</p> }));
vi.mock('../pages/ActivitiesPage', () => ({ default: () => <p>activities</p> }));
vi.mock('../pages/ActivityDetailPage', () => ({ default: () => <p>activity</p> }));
vi.mock('../hub/pages/AgentsPage', () => ({ default: () => <p>agents</p> }));
vi.mock('../hub/pages/RulesPage', () => ({ default: () => <p>rules</p> }));
vi.mock('../hub/pages/RecordsPage', () => ({ default: () => <p>agent records</p> }));
vi.mock('../hub/pages/DashboardPage', () => ({ default: () => <p>dashboard</p> }));
vi.mock('../hub/pages/HubSettingsPage', () => ({ default: () => <p>settings form</p> }));

import App from '../App';

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Where />
    </MemoryRouter>,
  );
}

async function expectLanding(path: string, landing: string) {
  renderAt(path);
  await waitFor(() => expect(screen.getByTestId('where').textContent).toBe(landing));
}

describe('W-18 owner navigation', () => {
  it('shows seven entries and no removed names', async () => {
    renderAt('/hub');
    expect(await screen.findByText('dashboard')).toBeInTheDocument();
    const main = within(screen.getByRole('navigation', { name: '主選單' })).getAllByRole('link');
    const hub = within(screen.getByRole('navigation', { name: '小幫手' })).getAllByRole('link');
    expect(main.map((link) => link.textContent)).toEqual(['群組', '活動', '紀錄', '小幫手']);
    expect(hub.map((link) => link.textContent)).toEqual(['總覽與設定', '小幫手名單', '規則']);
    expect(main.length + hub.length).toBe(7);
    expect(screen.queryByRole('link', { name: '記錄' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '執行紀錄' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '工作台' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '打開試跑台' })).toHaveAttribute('href', '/hub/workbench');
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href') ?? '');
    expect(hrefs.every((href) => /^\/(groups|activities|records|hub|workbench)(\/|$|\?)/.test(href))).toBe(true);
  });

  it.each([
    ['/hub/agents', 'agents'],
    ['/hub/rules', 'rules'],
    ['/groups', 'groups section'],
    ['/activities', 'activities'],
    ['/records', 'all records'],
  ])('keeps %s on that page', async (path, marker) => {
    renderAt(path);
    expect(await screen.findByText(marker)).toBeInTheDocument();
    expect(screen.getByTestId('where').textContent).toBe(path);
  });

  it.each([
    ['/history', '/records'],
    ['/hub/groups', '/groups?tab=agent'],
    ['/hub/records', '/records?type=notes'],
    ['/hub/logs', '/records?type=runs'],
    ['/hub/settings', '/hub?section=settings'],
    ['/hub/not-a-page', '/hub'],
  ])('redirects %s to %s', async (from, to) => {
    await expectLanding(from, to);
  });

  it('keeps the owner trial desk on its own page, titled 試跑台, outside the hub tabs', async () => {
    renderAt('/hub/workbench');
    expect(await screen.findByRole('heading', { name: '試跑台' })).toBeInTheDocument();
    expect(screen.getByTestId('where').textContent).toBe('/hub/workbench');
    const hub = within(screen.getByRole('navigation', { name: '小幫手' })).getAllByRole('link');
    expect(hub.map((link) => link.textContent)).toEqual(['總覽與設定', '小幫手名單', '規則']);
  });

  it('scrolls a settings bookmark to the settings section', async () => {
    const previous = HTMLElement.prototype.scrollIntoView;
    const scroll = vi.fn();
    HTMLElement.prototype.scrollIntoView = scroll;
    try {
      await expectLanding('/hub/settings', '/hub?section=settings');
      expect(await screen.findByRole('region', { name: '設定' })).toContainElement(await screen.findByText('settings form'));
      expect(scroll).toHaveBeenCalled();
    } finally {
      HTMLElement.prototype.scrollIntoView = previous;
    }
  });
});
