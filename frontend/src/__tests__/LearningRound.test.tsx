import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { LearningApiProvider } from '../learning/api/LearningApiContext';
import type { AttemptResultView, ChallengeReportResultView, LearningApi, PublicLearningChallenge } from '../learning/api/types';

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

const forbiddenCopy = /複習|到期|連勝|XP|排行榜|剩餘.*題|未完成|欠題|待辦/u;

const mainChallenge: PublicLearningChallenge = {
  id: 'challenge-main',
  facet: 'meaning',
  taskMode: 'meaning_choice',
  promptZh: '這裡的 run the idea by a few users 比較接近哪個意思？',
  excerptEn: 'Before building it, run the idea by a few users.',
  options: [
    { id: 'a', text: '把點子跑起來' },
    { id: 'b', text: '拿點子去問幾位使用者的看法' },
    { id: 'c', text: '快速完成點子' },
  ],
  hints: ['注意 by 後面接的是人。', 'run something by someone 常是「拿去給某人看／聽，徵求意見」。'],
  contextProvenance: 'source',
  recommendedSupport: 'hint_1',
};

const nextChallenge: PublicLearningChallenge = {
  ...mainChallenge,
  id: 'challenge-novel',
  excerptEn: 'Can I run this mix by you before I publish it?',
  contextProvenance: 'synthetic',
};

function result(overrides: Partial<AttemptResultView> = {}): AttemptResultView {
  return {
    feedback: {
      correctOptionId: 'b',
      explanationZh: '這裡最有證據的讀法是「徵求意見」。',
      decisiveCluesZh: ['by 後面接 users，指出互動對象。'],
      optionExplanations: [
        { optionId: 'a', explanationZh: '跑起來會少掉「問人」這層。' },
        { optionId: 'b', explanationZh: '保留了 seek feedback 的意思。' },
        { optionId: 'c', explanationZh: '快速完成不是這個片語的核心。' },
      ],
      evidence: [{ sourceType: 'dictionary', sourceName: 'Cambridge Dictionary', locator: 'run sth by sb' }],
      ambiguityNoteZh: '作者效果只能說是一種可能解讀，不是作者內心事實。',
    },
    evidence: {
      headline: '你在原文語境中辨認出這個片語的意思。',
      details: ['這是 immediate_source 證據，還不是延遲記憶。'],
      strongestStage: 'immediate_source',
    },
    replayed: false,
    nextChallenge: null,
    roundComplete: true,
    ...overrides,
  };
}

function reportResult(overrides: Partial<ChallengeReportResultView> = {}): ChallengeReportResultView {
  return { suspended: true, evidenceInvalidated: false, nextChallenge: null, roundComplete: true, ...overrides };
}

function api(overrides: Partial<LearningApi> = {}): LearningApi {
  return {
    getAccess: vi.fn().mockResolvedValue({ enabled: true }),
    createSource: vi.fn(),
    getSource: vi.fn(),
    getRun: vi.fn(),
    retryRun: vi.fn(),
    createRound: vi.fn().mockResolvedValue({ roundId: 'round-1', challenge: mainChallenge, roundComplete: false }),
    submitAttempt: vi.fn().mockResolvedValue(result()),
    reportChallenge: vi.fn().mockResolvedValue(reportResult()),
    listKnowledge: vi.fn(),
    setKnowledgeExcluded: vi.fn(),
    ...overrides,
  };
}

function renderRound(learningApi: LearningApi, path = '/learn/round?sourceId=source-1') {
  return render(
    <LearningApiProvider api={learningApi}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </LearningApiProvider>,
  );
}

describe('learning round', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts a source-scoped low-pressure round without debt or gamified pressure copy', async () => {
    const learningApi = api();
    renderRound(learningApi);

    expect(await screen.findByText(mainChallenge.promptZh)).toBeInTheDocument();
    expect(learningApi.createRound).toHaveBeenCalledWith({ sourceId: 'source-1' });
    expect(screen.getByRole('button', { name: '確認答案' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再給我一點提示' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '直接看答案' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '跳過' })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(forbiddenCopy);
  });

  it('records first answer once, lets the user change final answer after a hint, and only submits on confirmation', async () => {
    const learningApi = api();
    const user = userEvent.setup();
    renderRound(learningApi);

    await user.click(await screen.findByRole('radio', { name: '把點子跑起來' }));
    expect(learningApi.submitAttempt).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '再給我一點提示' }));
    expect(screen.getByText('注意 by 後面接的是人。')).toBeInTheDocument();
    expect(learningApi.submitAttempt).not.toHaveBeenCalled();

    await user.click(screen.getByRole('radio', { name: '拿點子去問幾位使用者的看法' }));
    await user.click(screen.getByRole('button', { name: '確認答案' }));

    await waitFor(() =>
      expect(learningApi.submitAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          challengeId: 'challenge-main',
          firstAnswerId: 'a',
          finalAnswerId: 'b',
          supportLevel: 'hint_1',
          answerRevealed: false,
          skipped: false,
        }),
      ),
    );
  });

  it('handles direct answer and skip without unaided-success or punishment language', async () => {
    const learningApi = api();
    const user = userEvent.setup();
    renderRound(learningApi);

    await user.click(await screen.findByRole('button', { name: '直接看答案' }));
    await waitFor(() =>
      expect(learningApi.submitAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ firstAnswerId: null, finalAnswerId: null, supportLevel: 'answer', answerRevealed: true }),
      ),
    );
    expect(await screen.findByText('這裡最有證據的讀法是「徵求意見」。')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/無提示成功|答錯|失敗/u);

    const skipApi = api();
    renderRound(skipApi);
    await user.click(await screen.findByRole('button', { name: '跳過' }));
    await waitFor(() =>
      expect(skipApi.submitAttempt).toHaveBeenCalledWith(expect.objectContaining({ supportLevel: 'skip', skipped: true })),
    );
    expect(document.body.textContent).not.toMatch(/答錯|失敗|欠題/u);
  });

  it('preserves the provisional first answer when the user reveals the answer after choosing', async () => {
    const learningApi = api();
    const user = userEvent.setup();
    renderRound(learningApi);

    await user.click(await screen.findByRole('radio', { name: '把點子跑起來' }));
    await user.click(screen.getByRole('button', { name: '直接看答案' }));

    await waitFor(() =>
      expect(learningApi.submitAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ firstAnswerId: 'a', finalAnswerId: null, supportLevel: 'answer', answerRevealed: true }),
      ),
    );
  });

  it('renders full feedback evidence and advances through next challenges without exposing remaining counts', async () => {
    const learningApi = api({
      submitAttempt: vi
        .fn()
        .mockResolvedValueOnce(result({ nextChallenge, roundComplete: false }))
        .mockResolvedValueOnce(result({ evidence: { headline: '你在新語境辨認出同一個片語。', details: ['這仍不是 delayed retention。'], strongestStage: 'immediate_novel' } })),
    });
    const user = userEvent.setup();
    renderRound(learningApi);

    await user.click(await screen.findByRole('radio', { name: '拿點子去問幾位使用者的看法' }));
    await user.click(screen.getByRole('button', { name: '確認答案' }));

    expect(await screen.findByRole('heading', { name: '這題的語言證據' })).toBeInTheDocument();
    expect(screen.getByText('正解：拿點子去問幾位使用者的看法')).toBeInTheDocument();
    expect(screen.getByText('by 後面接 users，指出互動對象。')).toBeInTheDocument();
    expect(screen.getByText('Cambridge Dictionary · run sth by sb')).toBeInTheDocument();
    expect(screen.getByText('作者效果只能說是一種可能解讀，不是作者內心事實。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '繼續' }));
    expect(screen.getByText(nextChallenge.excerptEn)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/剩餘/u);

    await user.click(screen.getByRole('radio', { name: '拿點子去問幾位使用者的看法' }));
    await user.click(screen.getByRole('button', { name: '確認答案' }));
    await user.click(await screen.findByRole('button', { name: '完成' }));

    expect(screen.getByRole('heading', { name: '這輪先到這裡' })).toBeInTheDocument();
    expect(screen.getByText('你在新語境辨認出同一個片語。')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/延遲記憶已建立|已學會|未完成/u);
  });

  it('reports challenge issues before or after submission without creating stronger claims than the server returned', async () => {
    const learningApi = api({
      reportChallenge: vi.fn().mockResolvedValueOnce(reportResult({ nextChallenge, roundComplete: false })),
    });
    const user = userEvent.setup();
    const firstRender = renderRound(learningApi);

    await user.click(await screen.findByRole('button', { name: '這題有問題' }));
    await user.click(screen.getByRole('button', { name: '題意有歧義' }));
    expect(learningApi.submitAttempt).not.toHaveBeenCalled();
    expect(learningApi.reportChallenge).toHaveBeenCalledWith('challenge-main', { issue: 'ambiguous', detail: undefined });
    expect(await screen.findByText('已暫停這題，這次不會產生學習證據')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '繼續' }));
    expect(screen.getByText(nextChallenge.excerptEn)).toBeInTheDocument();
    firstRender.unmount();

    const invalidatedApi = api({
      reportChallenge: vi.fn().mockResolvedValue(reportResult({ evidenceInvalidated: true })),
    });
    renderRound(invalidatedApi);
    await user.click(await screen.findByRole('radio', { name: '拿點子去問幾位使用者的看法' }));
    await user.click(screen.getByRole('button', { name: '確認答案' }));
    await user.click(await screen.findByRole('button', { name: '這題有問題' }));
    await user.click(screen.getByRole('button', { name: '語言證據可能有誤' }));
    expect(await screen.findByText('這次證據已標記為有疑問，不會用來更新記憶模型')).toBeInTheDocument();
  });

  it('shows an honest empty state when no reliable challenge is available', async () => {
    renderRound(api({ createRound: vi.fn().mockResolvedValue({ roundId: 'round-1', challenge: null, roundComplete: true }) }), '/learn/round');

    expect(await screen.findByText('目前沒有足夠可靠、適合出題的英文項目')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看知識庫' })).toHaveAttribute('href', '/learn/knowledge');
    expect(screen.getByRole('link', { name: '加入另一篇' })).toHaveAttribute('href', '/learn/sources/new');
    expect(document.body.textContent).not.toMatch(/能力不足|欠題|待辦/u);
  });
});
