import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { LearningApiProvider } from '../learning/api/LearningApiContext';
import type { LearningApi, LearningRunView, LearningSourceView } from '../learning/api/types';

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

const baseRun: LearningRunView = {
  id: 'run-1',
  sourceId: 'source-1',
  status: 'completed',
  counts: { segments: 2, items: 4, occurrences: 5, verifiedItems: 1 },
  errorCode: null,
  createdAt: '2026-08-10T00:00:00.000Z',
  updatedAt: '2026-08-10T00:00:00.000Z',
};

const sourceWithPractice: LearningSourceView = {
  id: 'source-1',
  title: 'Startup Ideas',
  author: 'Paul Graham',
  url: 'https://paulgraham.com/startupideas.html',
  learningObjective: '理解怎麼找到創業點子',
  verifiedItemCount: 1,
  paragraphs: [
    { id: 'p-2', order: 1, text: 'Second paragraph.' },
    { id: 'p-1', order: 0, text: 'Before building it, run the idea by a few users.' },
  ],
};

function api(overrides: Partial<LearningApi> = {}): LearningApi {
  return {
    getAccess: vi.fn().mockResolvedValue({ enabled: true }),
    createSource: vi.fn().mockResolvedValue({ sourceId: 'source-1', runId: 'run-1', status: 'queued' }),
    getSource: vi.fn().mockResolvedValue(sourceWithPractice),
    getRun: vi.fn().mockResolvedValue(baseRun),
    retryRun: vi.fn().mockResolvedValue({ ...baseRun, status: 'queued' }),
    createRound: vi.fn(),
    submitAttempt: vi.fn(),
    reportChallenge: vi.fn(),
    listKnowledge: vi.fn(),
    setKnowledgeExcluded: vi.fn(),
    ...overrides,
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

describe('learning source flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits pasted English with an optional objective and never claims to fetch the URL', async () => {
    const learningApi = api();
    const user = userEvent.setup();
    renderApp('/learn/sources/new', learningApi);

    expect(await screen.findByLabelText('標題')).toBeRequired();
    expect(screen.getByLabelText('英文內容')).toBeRequired();
    expect(screen.getByLabelText('這次想理解什麼（選填）')).not.toBeRequired();
    expect(screen.queryByText(/抓取|fetch|下載/iu)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('標題'), 'Startup Ideas');
    await user.type(screen.getByLabelText('作者（選填）'), 'Paul Graham');
    await user.type(screen.getByLabelText('原始連結（選填）'), 'https://paulgraham.com/startupideas.html');
    await user.type(screen.getByLabelText('英文內容'), 'Before building it, run the idea by a few users.');
    await user.click(screen.getByRole('button', { name: '收進知識庫' }));

    await waitFor(() =>
      expect(learningApi.createSource).toHaveBeenCalledWith({
        requestId: '00000000-0000-4000-8000-000000000001',
        title: 'Startup Ideas',
        author: 'Paul Graham',
        url: 'https://paulgraham.com/startupideas.html',
        learningObjective: undefined,
        body: 'Before building it, run the idea by a few users.',
      }),
    );
    expect(await screen.findByRole('heading', { name: 'Startup Ideas' })).toBeInTheDocument();
  });

  it('keeps the same request id and preserves text when a server validation error is retried', async () => {
    const learningApi = api({
      createSource: vi
        .fn()
        .mockRejectedValueOnce(new Error('body_too_long'))
        .mockResolvedValueOnce({ sourceId: 'source-1', runId: 'run-1', status: 'completed' }),
    });
    const user = userEvent.setup();
    renderApp('/learn/sources/new', learningApi);

    await user.type(await screen.findByLabelText('標題'), 'Long article');
    await user.type(screen.getByLabelText('英文內容'), 'A sentence worth keeping.');
    await user.click(screen.getByRole('button', { name: '收進知識庫' }));

    expect(await screen.findByText('body_too_long')).toBeInTheDocument();
    expect(screen.getByLabelText('英文內容')).toHaveValue('A sentence worth keeping.');

    await user.click(screen.getByRole('button', { name: '收進知識庫' }));

    await waitFor(() => expect(learningApi.createSource).toHaveBeenCalledTimes(2));
    expect(learningApi.createSource).toHaveBeenNthCalledWith(2, expect.objectContaining({ requestId: '00000000-0000-4000-8000-000000000001' }));
  });

  it('shows neutral processing states, supports manual refresh, and stops polling after completion', async () => {
    const user = userEvent.setup();
    const learningApi = api({
      getRun: vi
        .fn()
        .mockResolvedValueOnce({ ...baseRun, status: 'running', counts: null })
        .mockResolvedValueOnce({ ...baseRun, status: 'publishing', counts: null })
        .mockResolvedValueOnce(baseRun),
    });
    renderApp('/learn/sources/source-1?run=run-1', learningApi);

    expect(await screen.findByText('正在整理內容，閱讀頁可以先看。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '手動刷新' }));
    expect(await screen.findByText('快好了，正在更新知識庫。')).toBeInTheDocument();

    expect(await screen.findByRole('link', { name: '開始 3–5 分鐘練習' }, { timeout: 3500 })).toHaveAttribute(
      'href',
      '/learn/round?sourceId=source-1',
    );
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(learningApi.getRun).toHaveBeenCalledTimes(3);
  });

  it('lets retryable ingestion wait for explicit retry and shows failed safe error codes', async () => {
    const user = userEvent.setup();
    const learningApi = api({
      getRun: vi.fn().mockResolvedValue({ ...baseRun, status: 'retryable', errorCode: 'extractor_timeout' }),
    });
    renderApp('/learn/sources/source-1?run=run-1', learningApi);

    expect(await screen.findByText('處理暫時卡住，可以由你決定要不要重試。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新處理' }));
    expect(learningApi.retryRun).toHaveBeenCalledWith('run-1');

    const failedApi = api({ getRun: vi.fn().mockResolvedValue({ ...baseRun, status: 'failed', errorCode: 'invalid_source' }) });
    renderApp('/learn/sources/source-1?run=run-1', failedApi);
    expect(await screen.findByText('invalid_source')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '加入另一篇' })).toHaveAttribute('href', '/learn/sources/new');
  });

  it('renders ordered paragraphs and uses an honest empty practice state when no verified items exist', async () => {
    const emptySource: LearningSourceView = {
      ...sourceWithPractice,
      learningObjective: null,
      verifiedItemCount: 0,
    };
    renderApp('/learn/sources/source-1', api({ getSource: vi.fn().mockResolvedValue(emptySource) }));

    expect(await screen.findByRole('heading', { name: 'Startup Ideas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://paulgraham.com/startupideas.html' })).toHaveAttribute(
      'href',
      'https://paulgraham.com/startupideas.html',
    );
    expect(screen.queryByText('理解怎麼找到創業點子')).not.toBeInTheDocument();
    const paragraphs = screen.getAllByTestId('source-paragraph').map((node) => node.textContent);
    expect(paragraphs).toEqual(['Before building it, run the idea by a few users.', 'Second paragraph.']);
    expect(screen.queryByRole('link', { name: '開始 3–5 分鐘練習' })).not.toBeInTheDocument();
    expect(screen.getByText('內容已完整收進知識庫；目前沒有足夠可靠、適合出題的英文項目。')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看已收錄內容' })).toHaveAttribute('href', '/learn/knowledge');
  });
});
