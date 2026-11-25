import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Activity, ActivityMessage, Group } from '../lib/api';

const mocks = vi.hoisted(() => ({
  getActivity: vi.fn(),
  listMessages: vi.fn(),
  listKnowledge: vi.fn(),
  listGroups: vi.fn(),
  approve: vi.fn(),
  requestRevision: vi.fn(),
  chat: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  onSnapshot: vi.fn(() => vi.fn()),
}));
vi.mock('../firebaseDb', () => ({ db: {} }));
vi.mock('../lib/api', () => ({
  api: {
    activities: {
      get: mocks.getActivity,
      approve: mocks.approve,
      requestRevision: mocks.requestRevision,
      update: vi.fn(),
      messages: { list: mocks.listMessages, update: vi.fn(), delete: vi.fn() },
      knowledge: { list: mocks.listKnowledge, create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    },
    groups: { list: mocks.listGroups },
    agent: { chat: mocks.chat },
    sendLogs: { list: vi.fn().mockResolvedValue({ logs: [] }) },
  },
}));

import ActivityDetailPage from '../pages/ActivityDetailPage';

const ts = { _seconds: 0, _nanoseconds: 0 };

function activity(patch: Partial<Activity> = {}): Activity {
  return {
    id: 'act_1',
    userId: 'user_1',
    name: '新手讀書交流活動',
    targetGroups: ['g1'],
    status: 'draft',
    reviewStatus: 'pending_review',
    approvedAt: null,
    agentSessionId: null,
    eventStartAt: null,
    eventEndAt: null,
    createdAt: ts,
    updatedAt: ts,
    ...patch,
  };
}

function pendingMessage(): ActivityMessage {
  return {
    id: 'msg_1',
    activityId: 'act_1',
    userId: 'user_1',
    content: '歡迎參加',
    targetGroups: ['g1'],
    triggerType: 'scheduled',
    triggerValue: '2030-01-01T10:00:00+08:00',
    cooldownMinutes: null,
    status: 'pending',
    reviewStatus: 'pending_review',
    generatedByAgent: true,
    agentSessionId: null,
    sequenceOrder: 1,
    sendWindowStart: null,
    sendWindowEnd: null,
    sentAt: null,
    processingAt: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

const group: Group = {
  groupId: 'g1',
  name: 'UAT 讀書會',
  memberCount: 5,
  lastMessageAt: ts,
  lastMessagePreview: '',
  isActive: true,
};

function onlyPrimary(name: RegExp) {
  const buttons = screen.getAllByRole('button').filter((button) => button.getAttribute('data-primary') === 'true');
  expect(buttons).toHaveLength(1);
  expect(buttons[0]).toHaveAccessibleName(name);
  return buttons[0];
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/activities/act_1']}>
      <Routes>
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  mocks.getActivity.mockReset();
  mocks.listMessages.mockReset();
  mocks.listKnowledge.mockReset();
  mocks.listGroups.mockReset();
  mocks.approve.mockReset();
  mocks.requestRevision.mockReset();
  mocks.chat.mockReset();
  mocks.listKnowledge.mockResolvedValue({ knowledge: [] });
  mocks.listGroups.mockResolvedValue({ groups: [group] });
  mocks.chat.mockResolvedValue({
    status: 'completed', runId: 'run_1', sessionId: 'session_1', reply: '已排好', generatedMessageCount: 0, extractedKnowledgeCount: 0,
  });
});

describe('Activity detail — one primary action', () => {
  it('shows 核准企畫, then 確認排程, then 送出', async () => {
    mocks.getActivity.mockResolvedValue({ activity: activity() });
    mocks.listMessages.mockResolvedValue({ messages: [pendingMessage()] });
    renderPage();

    expect(await screen.findByRole('heading', { name: '新手讀書交流活動' })).toBeVisible();
    expect(screen.getByRole('navigation', { name: '活動流程' })).toHaveTextContent('1 核准企畫');
    expect(screen.getByRole('navigation', { name: '活動流程' })).toHaveTextContent('→');
    expect(screen.getByRole('navigation', { name: '活動流程' })).toHaveTextContent('2 確認排程');
    expect(screen.getByRole('navigation', { name: '活動流程' })).toHaveTextContent('3 送出');
    expect(screen.getByRole('navigation', { name: '活動流程' }).querySelector('[aria-current="step"]')).toHaveTextContent('核准企畫');
    onlyPrimary(/^核准企畫$/);
    expect(screen.queryByRole('button', { name: /確認排程/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送出' })).not.toHaveAttribute('data-primary');

    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '先聊一句' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));
    await waitFor(() => expect(mocks.chat).toHaveBeenCalledWith('act_1', '先聊一句', undefined, undefined));
    onlyPrimary(/^核准企畫$/);

    mocks.approve.mockResolvedValue({ activity: activity({ status: 'active', reviewStatus: 'approved' }) });
    fireEvent.click(screen.getByRole('button', { name: '核准企畫' }));
    await waitFor(() => expect(screen.getByText('企畫已核准')).toBeVisible());
    expect(screen.getByRole('navigation', { name: '活動流程' }).querySelector('[aria-current="step"]')).toHaveTextContent('確認排程');
    onlyPrimary(/確認排程/);
    expect(screen.queryByRole('button', { name: '核准企畫' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送出' })).not.toHaveAttribute('data-primary');

    fireEvent.click(screen.getByRole('button', { name: /確認排程/ }));
    await waitFor(() => expect(mocks.chat).toHaveBeenLastCalledWith('act_1', '就照這樣排', 'session_1', 'confirm_schedule'));
    await waitFor(() => expect(screen.getByRole('navigation', { name: '活動流程' }).querySelector('[aria-current="step"]')).toHaveTextContent('送出'));
    onlyPrimary(/^送出$/);
    expect(screen.getByRole('button', { name: /確認排程/ })).not.toHaveAttribute('data-primary');
  });

  it('uses 重新核准 as the primary while a revision is open', async () => {
    mocks.getActivity.mockResolvedValue({ activity: activity({ reviewStatus: 'revision_requested' }) });
    mocks.listMessages.mockResolvedValue({ messages: [pendingMessage()] });
    renderPage();
    expect(await screen.findByRole('button', { name: '重新核准' })).toBeVisible();
    onlyPrimary(/^重新核准$/);
    expect(screen.queryByRole('button', { name: /確認排程/ })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '活動流程' }).querySelector('[aria-current="step"]')).toHaveTextContent('核准企畫');
  });

  it('asks for a plan before 核准企畫 when nothing is pending', async () => {
    mocks.getActivity.mockResolvedValue({ activity: activity() });
    mocks.listMessages.mockResolvedValue({ messages: [] });
    renderPage();
    expect(await screen.findByRole('button', { name: '請 AI 規劃第一份推播' })).toBeVisible();
    onlyPrimary(/請 AI 規劃第一份推播/);
    expect(screen.queryByRole('button', { name: '核准企畫' })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '活動流程' }).querySelector('[aria-current="step"]')).toHaveTextContent('核准企畫');
  });

  it('keeps 送出 primary across a reload after confirmation, and returns to 重新核准 if revision is requested', async () => {
    localStorage.setItem('wippy_schedule_confirmed_act_1', '1');
    mocks.getActivity.mockResolvedValue({ activity: activity({ status: 'active', reviewStatus: 'approved' }) });
    mocks.listMessages.mockResolvedValue({ messages: [pendingMessage()] });
    renderPage();
    expect(await screen.findByRole('heading', { name: '新手讀書交流活動' })).toBeVisible();
    onlyPrimary(/^送出$/);

    mocks.requestRevision.mockResolvedValue({ activity: activity({ reviewStatus: 'revision_requested' }) });
    fireEvent.click(screen.getByRole('button', { name: '要求修改' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '重新核准' })).toBeVisible());
    onlyPrimary(/^重新核准$/);
    expect(localStorage.getItem('wippy_schedule_confirmed_act_1')).toBeNull();
  });

  it('shows the same primary on the plan tab, and opening it returns to the conversation', async () => {
    mocks.getActivity.mockResolvedValue({ activity: activity({ status: 'active', reviewStatus: 'approved' }) });
    mocks.listMessages.mockResolvedValue({ messages: [pendingMessage()] });
    renderPage();
    expect(await screen.findByRole('heading', { name: '新手讀書交流活動' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /推播企畫/ }));
    expect(screen.queryByPlaceholderText(/輸入訊息/)).not.toBeInTheDocument();
    onlyPrimary(/確認排程/);
    fireEvent.click(screen.getByRole('button', { name: /確認排程/ }));
    expect(await screen.findByPlaceholderText(/輸入訊息/)).toBeVisible();
    onlyPrimary(/確認排程/);
    expect(mocks.chat).not.toHaveBeenCalled();
  });
});
