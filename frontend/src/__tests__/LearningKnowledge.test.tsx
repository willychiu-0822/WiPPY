import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { LearningApiProvider } from '../learning/api/LearningApiContext';
import type { KnowledgePageView, LearningApi } from '../learning/api/types';

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

const firstPage: KnowledgePageView = {
  nextCursor: 'cursor-2',
  items: [
    {
      id: 'item-run-feedback',
      expression: 'run something by someone',
      senseKey: 'seek-feedback',
      senseStatus: 'resolved',
      qualityStatus: 'verified',
      occurrenceCount: 2,
      sourceTitles: ['Startup Ideas'],
      excludedByUser: false,
      challengeabilityLabel: '可出題',
      facets: [
        {
          facet: 'meaning',
          label: '意思',
          evidence: {
            headline: '直接看答案後理解語境義',
            details: ['條件：看過答案，不算無提示成功。'],
            strongestStage: 'explained',
          },
        },
        {
          facet: 'chunk',
          label: '搭配／角色',
          evidence: {
            headline: '提示後辨認 by 後方接對象',
            details: ['條件：使用提示。'],
            strongestStage: 'immediate_source',
          },
        },
        { facet: 'syntax', label: '句法', evidence: null },
        {
          facet: 'pragmatics',
          label: '語氣／作用',
          evidence: {
            headline: '自然重遇時辨認到徵求意見的語氣',
            details: ['條件：organic_reencounter，來自另一篇自選內容。'],
            strongestStage: 'organic_reencounter',
          },
        },
      ],
    },
    {
      id: 'item-run-company',
      expression: 'run',
      senseKey: 'manage-business',
      senseStatus: 'resolved',
      qualityStatus: 'verified',
      occurrenceCount: 1,
      sourceTitles: ['Startup Ideas'],
      excludedByUser: false,
      challengeabilityLabel: '可出題',
      facets: [
        {
          facet: 'meaning',
          label: '意思',
          evidence: {
            headline: '隔天在未看過的新語境辨認出管理公司的意思',
            details: ['條件：delayed_novel，無提示。'],
            strongestStage: 'delayed_novel',
          },
        },
      ],
    },
    {
      id: 'item-run-race',
      expression: 'run',
      senseKey: 'move-fast',
      senseStatus: 'resolved',
      qualityStatus: 'verified',
      occurrenceCount: 1,
      sourceTitles: ['Music Notes'],
      excludedByUser: true,
      challengeabilityLabel: '目前不會出題',
      facets: [{ facet: 'meaning', label: '意思', evidence: null }],
    },
    {
      id: 'item-before',
      expression: 'before',
      senseKey: 'unresolved',
      senseStatus: 'unresolved',
      qualityStatus: 'unverified',
      occurrenceCount: 1,
      sourceTitles: ['Startup Ideas'],
      excludedByUser: false,
      challengeabilityLabel: '需要更多語言證據才會出題',
      facets: [{ facet: 'meaning', label: '意思', evidence: null }],
    },
  ],
};

const secondPage: KnowledgePageView = {
  nextCursor: null,
  items: [
    {
      id: 'item-mix',
      expression: 'mix',
      senseKey: 'audio-production',
      senseStatus: 'resolved',
      qualityStatus: 'verified',
      occurrenceCount: 3,
      sourceTitles: ['Mixing Notes'],
      excludedByUser: false,
      challengeabilityLabel: '可出題',
      facets: [{ facet: 'meaning', label: '意思', evidence: null }],
    },
  ],
};

function api(overrides: Partial<LearningApi> = {}): LearningApi {
  return {
    getAccess: vi.fn().mockResolvedValue({ enabled: true }),
    createSource: vi.fn(),
    getSource: vi.fn(),
    getRun: vi.fn(),
    retryRun: vi.fn(),
    createRound: vi.fn(),
    submitAttempt: vi.fn(),
    reportChallenge: vi.fn(),
    listKnowledge: vi.fn().mockResolvedValue(firstPage),
    setKnowledgeExcluded: vi.fn().mockResolvedValue({ excludedByUser: true }),
    ...overrides,
  };
}

function renderKnowledge(learningApi: LearningApi) {
  return render(
    <LearningApiProvider api={learningApi}>
      <MemoryRouter initialEntries={['/learn/knowledge']}>
        <App />
      </MemoryRouter>
    </LearningApiProvider>,
  );
}

describe('learning knowledge base', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the total knowledge base, including unresolved, excluded, and separate senses', async () => {
    renderKnowledge(api());

    expect(await screen.findByRole('heading', { name: '英文知識庫' })).toBeInTheDocument();
    expect(await screen.findByText('run something by someone')).toBeInTheDocument();
    expect(screen.getAllByText('run')).toHaveLength(2);
    expect(screen.getByText('before')).toBeInTheDocument();
    expect(screen.getByText('seek-feedback')).toBeInTheDocument();
    expect(screen.getByText('move-fast')).toBeInTheDocument();
    expect(screen.getByText('詞義待釐清')).toBeInTheDocument();
    expect(screen.getByText('2 次出現 · Startup Ideas')).toBeInTheDocument();
    expect(screen.getByText('仍保留在知識庫，但不再出題')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/已學會|已掌握|精通|到期|應複習|積欠/u);
  });

  it('shows independent facet evidence and keeps details collapsed until opened', async () => {
    const user = userEvent.setup();
    renderKnowledge(api());

    expect(await screen.findByText('run something by someone')).toBeInTheDocument();
    expect(screen.queryByText('條件：看過答案，不算無提示成功。')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '查看 run something by someone 的證據細節' }));
    expect(screen.getByText('意思')).toBeInTheDocument();
    expect(screen.getByText('搭配／角色')).toBeInTheDocument();
    expect(screen.getByText('句法')).toBeInTheDocument();
    expect(screen.getByText('語氣／作用')).toBeInTheDocument();
    expect(screen.getByText('尚無證據')).toBeInTheDocument();
    expect(screen.getByText('條件：看過答案，不算無提示成功。')).toBeInTheDocument();
    expect(screen.getByText('條件：使用提示。')).toBeInTheDocument();
    expect(screen.getByText('條件：organic_reencounter，來自另一篇自選內容。')).toBeInTheDocument();
  });

  it('optimistically pauses challenge selection and rolls back when the API rejects it', async () => {
    const learningApi = api({ setKnowledgeExcluded: vi.fn().mockRejectedValue(new Error('network_down')) });
    const user = userEvent.setup();
    renderKnowledge(learningApi);

    await user.click(await screen.findByRole('button', { name: '暫停 run something by someone 出題' }));
    expect(screen.getAllByText('仍保留在知識庫，但不再出題')).not.toHaveLength(0);
    expect(await screen.findByText('network_down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '暫停 run something by someone 出題' })).toBeInTheDocument();
  });

  it('loads more with the opaque cursor and appends without duplicates', async () => {
    const learningApi = api({
      listKnowledge: vi.fn().mockResolvedValueOnce(firstPage).mockResolvedValueOnce({
        ...secondPage,
        items: [firstPage.items[0], ...secondPage.items],
      }),
    });
    const user = userEvent.setup();
    renderKnowledge(learningApi);

    await user.click(await screen.findByRole('button', { name: '載入更多' }));

    expect(learningApi.listKnowledge).toHaveBeenNthCalledWith(2, { limit: 50, cursor: 'cursor-2' });
    expect(await screen.findByText('mix')).toBeInTheDocument();
    expect(screen.getAllByText('run something by someone')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: '載入更多' })).not.toBeInTheDocument();
  });
});
