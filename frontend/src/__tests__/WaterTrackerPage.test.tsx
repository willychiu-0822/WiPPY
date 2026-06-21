import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

// ─── Mock @line/liff ─────────────────────────────────────────────────────────

const liffMock = vi.hoisted(() => ({
  init: vi.fn().mockResolvedValue(undefined),
  isLoggedIn: vi.fn(() => true),
  getIDToken: vi.fn(() => 'mock-id-token'),
  getProfile: vi.fn().mockResolvedValue({ userId: 'Utest1', displayName: 'Test User', pictureUrl: '' }),
  getContext: vi.fn(() => ({ type: 'group', groupId: 'Ctest1' })),
  isApiAvailable: vi.fn(() => false),
  isInClient: vi.fn(() => true),
  sendMessages: vi.fn().mockResolvedValue(undefined),
  shareTargetPicker: vi.fn().mockResolvedValue({ status: 'success' }),
  login: vi.fn(),
}));

vi.mock('@line/liff', () => ({
  default: liffMock,
}));

// ─── Mock useLiff directly — avoids LIFF init + .env.local DEV_FALLBACK ──────

const mockUseLiff = vi.hoisted(() => ({
  ready: true,
  loading: false,
  error: null as string | null,
  authRedirecting: false,
  profile: { userId: 'Utest1', displayName: 'Test User', pictureUrl: '' },
  context: { type: 'group' as const, groupId: 'Ctest1' },
  idToken: 'mock-id-token',
  groupId: 'Ctest1' as string | null,
}));

vi.mock('../contexts/useLiff', () => ({
  useLiff: () => mockUseLiff,
}));

vi.mock('../contexts/LiffContext', () => ({
  LiffProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// ─── Mock liffApi ─────────────────────────────────────────────────────────────

const { mockSessionData, mockDrinkResponse } = vi.hoisted(() => {
  const sessionData = {
    status: 'ready' as const,
    activeGroup: {
      groupId: 'Ctest1',
      groupName: '測試群',
      entryGroupId: 'Ctest1',
    },
    isNewUser: false,
    user: {
      lineUserId: 'Utest1',
      displayName: 'Test User',
      pictureUrl: '',
      firstSeenAt: { _seconds: 0, _nanoseconds: 0 },
      lastSeenAt: { _seconds: 0, _nanoseconds: 0 },
      lastGroupId: 'Ctest1',
      groupIds: ['Ctest1'],
    },
    member: {
      lineUserId: 'Utest1',
      displayName: 'Test User',
      pictureUrl: '',
      todayMl: 300,
      weekMl: 1000,
      totalMl: 5000,
      streak: 2,
      achievements: [],
      lastDrinkAt: null,
    },
    today: {
      groupName: '測試群',
      memberCount: 2,
      members: [
        { rank: 1, lineUserId: 'Utest1', displayName: 'Test User', pictureUrl: '', todayMl: 300, streak: 2, gapToAbove: null, leadOverSecond: 100, lastDrinkAt: null },
        { rank: 2, lineUserId: 'Uother', displayName: 'Other', pictureUrl: '', todayMl: 200, streak: 0, gapToAbove: 100, leadOverSecond: null, lastDrinkAt: null },
      ],
      me: { lineUserId: 'Utest1', rank: 1, todayMl: 300, gapToAbove: null, leadOverSecond: 100, aboveDisplayName: null, aboveLastDrinkAt: null, belowDisplayName: null },
      group: { todayMl: 500, goalMl: 3000, goalReached: false, perMemberBaselineMl: 1500, firstLoggerDisplayName: null },
      pulse: [],
    },
  };
  const drinkResponse = {
    record: { id: 'rec1', lineUserId: 'Utest1', displayName: 'Test User', ml: 200, drinkType: 'water' as const, date: '2026-06-20', timestamp: { _seconds: 0, _nanoseconds: 0 } },
    member: { ...sessionData.member, todayMl: 500 },
    rankBefore: 1,
    rankAfter: 2,
    surpassedCount: 0,
    eventAchievements: ['now_im_best' as const],
    newPersistentAchievements: [],
    comboCount: 1,
    groupTodayMl: 700,
    groupGoalMl: 3000,
    groupGoalJustReached: false,
    groupDrinkSequence: 3,
    belowDisplayName: null,
    isDailyFirst: false,
  };
  return { mockSessionData: sessionData, mockDrinkResponse: drinkResponse };
});

vi.mock('../lib/liffApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/liffApi')>();
  return {
    ...actual,
    waterApi: {
      session: vi.fn().mockResolvedValue(mockSessionData),
      drink: vi.fn().mockResolvedValue(mockDrinkResponse),
      todayLeaderboard: vi.fn().mockResolvedValue(mockSessionData.today),
      myProfile: vi.fn().mockResolvedValue({ member: mockSessionData.member, rank: 1, gapToAbove: null, leadOverSecond: 100, aboveDisplayName: null }),
      weeklyStats: vi.fn().mockResolvedValue({ dailyTotals: [], memberBreakdown: [] }),
      taunts: vi.fn().mockResolvedValue({ taunts: ['喝多一點！'] }),
    },
  };
});

// ─── Component under test ─────────────────────────────────────────────────────

import WaterTrackerPage from '../pages/liff/WaterTrackerPage';
import { LiffProvider } from '../contexts/LiffContext';

function Wrapper() {
  return (
    <MemoryRouter initialEntries={['/liff/water?wg=Ctest1']}>
      <LiffProvider>
        <WaterTrackerPage />
      </LiffProvider>
    </MemoryRouter>
  );
}

function LegacyWrapper() {
  return (
    <MemoryRouter initialEntries={['/liff/water']}>
      <LiffProvider>
        <WaterTrackerPage />
      </LiffProvider>
    </MemoryRouter>
  );
}

function LiffStateWrapper() {
  return (
    <MemoryRouter initialEntries={['/liff/water?liff.state=%2Fliff%2Fwater%3Fwg%3DC36f826d26cf8adefe4d214993742c230%26wgName%3D%E6%B5%B7%E6%B5%AA%E7%BE%A4']}>
      <LiffProvider>
        <WaterTrackerPage />
      </LiffProvider>
    </MemoryRouter>
  );
}

describe('WaterTrackerPage — initial load', () => {
  it('shows group name after session loads', async () => {
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());
  });

  it('shows member count', async () => {
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('2 位成員')).toBeInTheDocument());
  });

  it('shows current user display name', async () => {
    render(<Wrapper />);
    await waitFor(() => {
      const names = screen.getAllByText(/Test User/);
      expect(names.length).toBeGreaterThan(0);
    });
  });

  it('shows today ml in leaderboard', async () => {
    render(<Wrapper />);
    await waitFor(() => {
      const mlTexts = screen.getAllByText(/300 ml/);
      expect(mlTexts.length).toBeGreaterThan(0);
    });
  });

  it('opens the expanded leaderboard panel', async () => {
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '展開今日排行' }));

    expect(screen.getByText('Today · ml')).toBeInTheDocument();
  });
});

describe('WaterTrackerPage — drink flow', () => {
  it('calls waterApi.drink on submit', async () => {
    const { waterApi } = await import('../lib/liffApi');
    render(<Wrapper />);

    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '記錄 200 ml 水' }));
    });

    await waitFor(() =>
    expect(waterApi.drink).toHaveBeenCalledWith('Ctest1', 200, 'water', 'mock-id-token')
    );
  });

  it('shows result modal with achievement after drink', async () => {
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '記錄 200 ml 水' }));
    });

    await waitFor(() => expect(screen.getByText('現在我最棒！')).toBeInTheDocument());
  });

  it('modal has share and dismiss buttons', async () => {
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '記錄 200 ml 水' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /分享成就到群組/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /忍痛放棄/ })).toBeInTheDocument();
    });
    expect(screen.queryByText(/預覽下一種/)).not.toBeInTheDocument();
  });

  it('modal closes on dismiss', async () => {
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '記錄 200 ml 水' }));
    });
    await waitFor(() => screen.getByText('現在我最棒！'));

    fireEvent.click(screen.getByRole('button', { name: /忍痛放棄/ }));
    await waitFor(() => expect(screen.queryByText('現在我最棒！')).not.toBeInTheDocument());
  });

  it('shows share errors in the result modal', async () => {
    const { waterApi } = await import('../lib/liffApi');
    vi.mocked(waterApi.taunts).mockRejectedValueOnce(new Error('taunts down'));

    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '記錄 200 ml 水' }));
    });

    await waitFor(() => expect(screen.getByText('現在我最棒！')).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /分享成就到群組/ }));
    });

    await waitFor(() => expect(screen.getByText('分享失敗：taunts down')).toBeInTheDocument());
  });

  it('shares to the current LINE group from the result modal', async () => {
    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '記錄 200 ml 水' }));
    });

    await waitFor(() => expect(screen.getByText('現在我最棒！')).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /分享成就到群組/ }));
    });

    await waitFor(() => expect(liffMock.sendMessages).toHaveBeenCalled());
  });
});

describe('WaterTrackerPage — drink error handling', () => {
  it('shows error message when waterApi.drink fails', async () => {
    const { waterApi } = await import('../lib/liffApi');
    vi.mocked(waterApi.drink).mockRejectedValueOnce(new Error('server error'));

    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '記錄 200 ml 水' }));
    });

    await waitFor(() =>
      expect(screen.getByText('記錄失敗：server error')).toBeInTheDocument()
    );
  });

  it('does not show result modal when drink fails', async () => {
    const { waterApi } = await import('../lib/liffApi');
    vi.mocked(waterApi.drink).mockRejectedValueOnce(new Error('server error'));

    render(<Wrapper />);
    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '記錄 200 ml 水' }));
    });

    await waitFor(() => expect(screen.queryByText('現在我最棒！')).not.toBeInTheDocument());
  });
});

describe('WaterTrackerPage — unreliable group context', () => {
  it('still starts a session (backend resolves the group) when context has no groupId', async () => {
    const { waterApi } = await import('../lib/liffApi');
    (waterApi.session as ReturnType<typeof vi.fn>).mockClear();

    mockUseLiff.groupId = null;
    render(<Wrapper />);

    // Even if LIFF context loses the live groupId, the explicit entry link keeps
    // the tracker bootable and the backend still knows which group this launch belongs to.
    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());
    expect(waterApi.session).toHaveBeenCalledWith('Ctest1', undefined, undefined, 'mock-id-token');

    mockUseLiff.groupId = 'Ctest1'; // restore
  });

  it('shows group selector when backend asks the user to choose among multiple groups', async () => {
    const { waterApi } = await import('../lib/liffApi');
    vi.mocked(waterApi.session)
      .mockResolvedValueOnce({
        status: 'needs_group_selection',
        user: mockSessionData.user,
        entryGroup: { groupId: 'Centry', groupName: '入口群組' },
        availableGroups: [
          { groupId: 'Centry', groupName: '入口群組', alreadyBound: false, isEntryGroup: true },
          { groupId: 'Ctest1', groupName: '測試群', alreadyBound: true, isEntryGroup: false },
        ],
      } as Awaited<ReturnType<typeof waterApi.session>>)
      .mockResolvedValueOnce(mockSessionData);

    render(<Wrapper />);

    await waitFor(() => expect(screen.getByText('選擇本次要進入的群組')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /測試群/ }));

    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());
    expect(waterApi.session).toHaveBeenLastCalledWith('Ctest1', undefined, 'Ctest1', 'mock-id-token');
  });

  it('falls back to the live LIFF group context when the URL has no explicit wg param', async () => {
    mockUseLiff.groupId = 'C1234567890abcdef1234567890abcdef';

    render(<LegacyWrapper />);

    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());

    mockUseLiff.groupId = 'Ctest1';
  });

  it('uses the group entry from liff.state when LINE returns a legacy deep link', async () => {
    const { waterApi } = await import('../lib/liffApi');
    (waterApi.session as ReturnType<typeof vi.fn>).mockClear();

    mockUseLiff.groupId = null;

    render(<LiffStateWrapper />);

    await waitFor(() => expect(screen.getByText('測試群')).toBeInTheDocument());
    expect(waterApi.session).toHaveBeenCalledWith(
      'C36f826d26cf8adefe4d214993742c230',
      '海浪群',
      undefined,
      'mock-id-token'
    );

    mockUseLiff.groupId = 'Ctest1';
  });

  it('still rejects entry when neither wg param nor a valid live LINE group id is available', async () => {
    mockUseLiff.groupId = null;

    render(<LegacyWrapper />);

    await waitFor(() =>
      expect(screen.getByText('缺少群組入口資訊，請從群組專屬 LIFF 連結進入。')).toBeInTheDocument()
    );

    mockUseLiff.groupId = 'Ctest1';
  });
});
