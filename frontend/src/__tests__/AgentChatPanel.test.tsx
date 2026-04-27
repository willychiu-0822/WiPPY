import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgentChatPanel from '../components/AgentChatPanel';
import type { AgentChatApiResponse, HarnessRunSnapshot } from '../lib/api';

// ─── Mock firebase/firestore & ../firebase ────────────────────────────────────

let capturedSnapshotCallback: ((snap: unknown) => void) | null = null;

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn().mockImplementation((_ref: unknown, cb: (snap: unknown) => void) => {
    capturedSnapshotCallback = cb;
    return vi.fn(); // unsubscribe fn
  }),
}));

vi.mock('../firebase', () => ({ db: {} }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQueuedResponse(overrides: Partial<AgentChatApiResponse> = {}): AgentChatApiResponse {
  return { status: 'queued', runId: 'run_1', sessionId: 'session_1', ...overrides };
}

function makeSyncResponse(overrides: Partial<AgentChatApiResponse> = {}): AgentChatApiResponse {
  return { status: 'completed', runId: 'run_1', sessionId: 'session_1', reply: 'Agent 回覆', generatedMessageCount: 0, extractedKnowledgeCount: 0, ...overrides };
}

function triggerSnapshot(data: Partial<HarnessRunSnapshot>) {
  act(() => {
    capturedSnapshotCallback?.({
      exists: () => true,
      data: () => ({ status: 'running', reply: null, generatedMessageCount: 0, extractedKnowledgeCount: 0, lastError: null, ...data }),
    });
  });
}

function renderPanel(onSendMessage = vi.fn()) {
  const onSessionId = vi.fn();
  const onMessagesGenerated = vi.fn();
  const onKnowledgeExtracted = vi.fn();

  const utils = render(
    <AgentChatPanel
      activityId="act_1"
      sessionId={null}
      onSessionId={onSessionId}
      onMessagesGenerated={onMessagesGenerated}
      onKnowledgeExtracted={onKnowledgeExtracted}
      onSendMessage={onSendMessage}
    />
  );
  return { ...utils, onSessionId, onMessagesGenerated, onKnowledgeExtracted };
}

beforeEach(() => {
  capturedSnapshotCallback = null;
});

// ─── Initial state ────────────────────────────────────────────────────────────

describe('AgentChatPanel — initial state', () => {
  it('shows placeholder hint message', () => {
    renderPanel();
    expect(screen.getByText(/向 Agent 描述活動/)).toBeInTheDocument();
  });

  it('shows hint shortcut buttons', () => {
    renderPanel();
    expect(screen.getByText(/幫我規劃三則活動前的暖場推播訊息/)).toBeInTheDocument();
  });

  it('clicking hint fills input', () => {
    renderPanel();
    fireEvent.click(screen.getByText(/幫我規劃三則活動前的暖場推播訊息/));
    const textarea = screen.getByPlaceholderText(/輸入訊息/) as HTMLTextAreaElement;
    expect(textarea.value).toContain('幫我規劃');
  });

  it('送出 is disabled when input is empty', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: '送出' })).toBeDisabled();
  });
});

// ─── Sync (status: completed) path ───────────────────────────────────────────

describe('AgentChatPanel — sync completed', () => {
  it('shows assistant reply immediately', async () => {
    const { onSessionId } = renderPanel(vi.fn().mockResolvedValue(makeSyncResponse({ reply: '已規劃完成' })));

    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '規劃訊息' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(screen.getByText('已規劃完成')).toBeInTheDocument());
    expect(onSessionId).toHaveBeenCalledWith('session_1');
  });

  it('calls onMessagesGenerated when generatedMessageCount > 0', async () => {
    const { onMessagesGenerated } = renderPanel(vi.fn().mockResolvedValue(makeSyncResponse({ generatedMessageCount: 2 })));
    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '規劃' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));
    await waitFor(() => expect(onMessagesGenerated).toHaveBeenCalledTimes(1));
  });

  it('calls onKnowledgeExtracted when extractedKnowledgeCount > 0', async () => {
    const { onKnowledgeExtracted } = renderPanel(vi.fn().mockResolvedValue(makeSyncResponse({ extractedKnowledgeCount: 1 })));
    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '說明' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));
    await waitFor(() => expect(onKnowledgeExtracted).toHaveBeenCalledTimes(1));
  });

  it('clears input after send', async () => {
    renderPanel(vi.fn().mockResolvedValue(makeSyncResponse()));
    const textarea = screen.getByPlaceholderText(/輸入訊息/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '測試' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));
    await waitFor(() => expect(textarea.value).toBe(''));
  });
});

// ─── Async (status: queued) + onSnapshot path ────────────────────────────────

describe('AgentChatPanel — async queued + onSnapshot', () => {
  it('shows loading indicator after queued response', async () => {
    renderPanel(vi.fn().mockResolvedValue(makeQueuedResponse()));
    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '規劃' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(capturedSnapshotCallback).not.toBeNull());
    // Loading dots are rendered via the bouncing spans — check input is disabled
    expect(screen.getByPlaceholderText(/輸入訊息/)).toBeDisabled();
  });

  it('shows reply when snapshot status = completed', async () => {
    const { onMessagesGenerated } = renderPanel(vi.fn().mockResolvedValue(makeQueuedResponse()));
    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '規劃' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(capturedSnapshotCallback).not.toBeNull());
    triggerSnapshot({ status: 'completed', reply: '規劃完成！', generatedMessageCount: 2 });

    await waitFor(() => expect(screen.getByText('規劃完成！')).toBeInTheDocument());
    expect(onMessagesGenerated).toHaveBeenCalledTimes(1);
  });

  it('shows error when snapshot status = failed', async () => {
    renderPanel(vi.fn().mockResolvedValue(makeQueuedResponse()));
    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '規劃' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(capturedSnapshotCallback).not.toBeNull());
    triggerSnapshot({ status: 'failed', lastError: 'max_llm_calls_exceeded' });

    await waitFor(() => expect(screen.getByText(/AI 嘗試次數已達上限/)).toBeInTheDocument());
  });

  it('shows generic error for unknown failure reason', async () => {
    renderPanel(vi.fn().mockResolvedValue(makeQueuedResponse()));
    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '規劃' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(capturedSnapshotCallback).not.toBeNull());
    triggerSnapshot({ status: 'failed', lastError: 'persistence_error' });

    await waitFor(() => expect(screen.getByText(/處理失敗/)).toBeInTheDocument());
  });
});

// ─── Rate limit ───────────────────────────────────────────────────────────────

describe('AgentChatPanel — rate limited', () => {
  it('shows countdown when status = rate_limited', async () => {
    renderPanel(vi.fn().mockResolvedValue({ status: 'rate_limited', runId: '', sessionId: '', retryAfterSeconds: 30 } as AgentChatApiResponse));
    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '測試' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(screen.getByText(/稍作休息/)).toBeInTheDocument());
    expect(screen.getByText(/30/)).toBeInTheDocument();
  });

  it('input is disabled during countdown', async () => {
    renderPanel(vi.fn().mockResolvedValue({ status: 'rate_limited', runId: '', sessionId: '', retryAfterSeconds: 5 } as AgentChatApiResponse));
    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '測試' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(screen.getByText(/稍作休息/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '送出' })).toBeDisabled();
  });

  it('restores input value after rate limited', async () => {
    renderPanel(vi.fn().mockResolvedValue({ status: 'rate_limited', runId: '', sessionId: '', retryAfterSeconds: 5 } as AgentChatApiResponse));
    const textarea = screen.getByPlaceholderText(/輸入訊息/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '被限制的訊息' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(screen.getByText(/稍作休息/)).toBeInTheDocument());
    expect(textarea.value).toBe('被限制的訊息');
  });

  it('shows rateLimitWarning when near limit', async () => {
    renderPanel(vi.fn().mockResolvedValue(makeSyncResponse({
      rateLimitWarning: { remaining: 2, windowResetInSeconds: 35 },
    })));
    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/), { target: { value: '測試' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(screen.getByText(/剩餘 2 次/)).toBeInTheDocument());
  });
});

// ─── Input behavior ───────────────────────────────────────────────────────────

describe('AgentChatPanel — input behavior', () => {
  it('Enter key submits message', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(makeSyncResponse());
    renderPanel(onSendMessage);
    const textarea = screen.getByPlaceholderText(/輸入訊息/);
    fireEvent.change(textarea, { target: { value: 'Enter 測試' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    await waitFor(() => expect(onSendMessage).toHaveBeenCalledWith('Enter 測試', null));
  });

  it('Shift+Enter does NOT submit', () => {
    const onSendMessage = vi.fn();
    renderPanel(onSendMessage);
    const textarea = screen.getByPlaceholderText(/輸入訊息/);
    fireEvent.change(textarea, { target: { value: '換行測試' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('shows error and restores input when onSendMessage throws', async () => {
    renderPanel(vi.fn().mockRejectedValue(new Error('Agent request failed')));
    const textarea = screen.getByPlaceholderText(/輸入訊息/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '失敗的訊息' } });
    fireEvent.click(screen.getByRole('button', { name: '送出' }));
    await waitFor(() => expect(screen.getByText(/Agent request failed/)).toBeInTheDocument());
    expect(textarea.value).toBe('失敗的訊息');
  });
});
