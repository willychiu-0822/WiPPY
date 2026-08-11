import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { LearningApiProvider } from '../learning/api/LearningApiContext';
import type { LearningApi } from '../learning/api/types';

vi.mock('../firebase', () => ({ auth: { currentUser: null } }));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'user-a' }, loading: false }),
}));

vi.mock('../pages/GroupsPage', () => ({ default: () => <div>Groups page</div> }));
vi.mock('../pages/ActivitiesPage', () => ({ default: () => <div>Activities page</div> }));
vi.mock('../pages/SendHistoryPage', () => ({ default: () => <div>History page</div> }));
vi.mock('../pages/SettingsPage', () => ({ default: () => <div>Settings page</div> }));
vi.mock('../pages/LoginPage', () => ({ default: () => <div>Login page</div> }));
vi.mock('../pages/OnboardingPage', () => ({ default: () => <div>Onboarding page</div> }));
vi.mock('../pages/TodayPage', () => ({ default: () => <div>Today page</div> }));
vi.mock('../pages/ReportPage', () => ({ default: () => <div>Report page</div> }));
vi.mock('../pages/ActivityDetailPage', () => ({ default: () => <div>Activity detail</div> }));
vi.mock('../pages/liff/WaterTrackerPage', () => ({ default: () => <div>Water page</div> }));
vi.mock('../pages/liff/LiffDevPlaygroundPage', () => ({ default: () => <div>LIFF dev</div> }));

function api(enabled: boolean): LearningApi {
  return {
    getAccess: vi.fn().mockResolvedValue({ enabled }),
    createSource: vi.fn(),
    getSource: vi.fn(),
    getRun: vi.fn(),
    retryRun: vi.fn(),
    createRound: vi.fn(),
    submitAttempt: vi.fn(),
    reportChallenge: vi.fn(),
    listKnowledge: vi.fn(),
    setKnowledgeExcluded: vi.fn(),
  };
}

function renderApp(initialPath: string, learningApi: LearningApi) {
  return render(
    <LearningApiProvider api={learningApi}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </LearningApiProvider>,
  );
}

describe('learning routing', () => {
  it('shows exactly one 探索 nav item for enabled users', async () => {
    renderApp('/groups', api(true));

    await waitFor(() => expect(screen.getAllByRole('link', { name: '探索' })).toHaveLength(1));
    expect(screen.getByRole('link', { name: '探索' })).toHaveAttribute('href', '/learn');
  });

  it('hides 探索 and redirects direct learning routes when disabled', async () => {
    renderApp('/learn/knowledge', api(false));

    await screen.findByText('Groups page');
    expect(screen.queryByRole('link', { name: '探索' })).not.toBeInTheDocument();
  });

  it('renders a neutral access loading state without flashing nav', () => {
    const never: LearningApi = { ...api(true), getAccess: vi.fn(() => new Promise<{ enabled: boolean }>(() => undefined)) };
    renderApp('/learn', never);

    expect(screen.getByText('正在確認使用權限…')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '探索' })).not.toBeInTheDocument();
  });

  it('renders retry UI on learning access failure without breaking existing pages', async () => {
    const failing: LearningApi = { ...api(true), getAccess: vi.fn().mockRejectedValue(new Error('down')) };

    renderApp('/learn', failing);
    expect(await screen.findByRole('button', { name: '重新確認' })).toBeInTheDocument();

    renderApp('/groups', failing);
    expect(await screen.findAllByText('Groups page')).not.toHaveLength(0);
  });

  it('keeps existing routes available', async () => {
    renderApp('/activities', api(false));
    expect(await screen.findByText('Activities page')).toBeInTheDocument();
  });
});
