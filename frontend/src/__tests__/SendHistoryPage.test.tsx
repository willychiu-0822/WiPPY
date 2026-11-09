import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { api } from '../lib/api';
import SendHistoryPage from '../pages/SendHistoryPage';

vi.mock('../lib/api', () => ({ api: { sendLogs: { list: vi.fn() } } }));

describe('UAT-17 — history failure recovery', () => {
  it('distinguishes a failed load from empty history and recovers on retry', async () => {
    vi.mocked(api.sendLogs.list).mockRejectedValueOnce(new Error('Network offline')).mockResolvedValueOnce({
      logs: [{ id: 'log-1', groupId: 'Cmock', content: '原本已送出的訊息', status: 'success', errorMessage: null,
        triggerType: 'manual', sentAt: { _seconds: 1, _nanoseconds: 0 }, activityId: null }], hasMore: false,
    });
    render(<SendHistoryPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('無法載入發送紀錄');
    expect(screen.queryByText('尚無發送記錄')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重試' }));
    expect(await screen.findByText('原本已送出的訊息')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
