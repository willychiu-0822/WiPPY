import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GroupsPage from '../pages/GroupsPage';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({ api: { groups: { list: vi.fn(), messages: vi.fn(), send: vi.fn() } } }));
const group = { groupId: 'Cuat', name: '讀書會', memberCount: 5, lastMessageAt: { _seconds: 1, _nanoseconds: 0 }, lastMessagePreview: '歡迎', isActive: true };
const history = { groupName: '讀書會', messages: [{ id: 'message-1', senderId: 'friend', senderName: '夥伴', content: '帶一本書', messageType: 'text', timestamp: { _seconds: 1, _nanoseconds: 0 } }] };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.groups.list).mockResolvedValue({ groups: [group] });
  vi.mocked(api.groups.messages).mockResolvedValue(history);
  vi.mocked(api.groups.send).mockResolvedValue({ ok: true, sendLogId: 'sent-1' });
});
async function openGroup() {
  render(<GroupsPage />);
  fireEvent.click(await screen.findByText('讀書會'));
}

describe('UAT-28 — LINE drawer recovery', () => {
  it('does not report an empty conversation after load failure and retries without losing a draft', async () => {
    vi.mocked(api.groups.messages).mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(history);
    await openGroup();
    expect(await screen.findByRole('alert')).toHaveTextContent('無法載入訊息');
    expect(screen.queryByText('尚無訊息記錄')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('輸入訊息...'), { target: { value: '想提醒大家' } });
    fireEvent.click(screen.getByRole('button', { name: '重新載入訊息' }));
    expect(await screen.findByText('帶一本書')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('輸入訊息...')).toHaveValue('想提醒大家');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the reply and shows Chinese recovery guidance when sending offline', async () => {
    vi.mocked(api.groups.send).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await openGroup();
    await screen.findByText('帶一本書');
    fireEvent.change(screen.getByPlaceholderText('輸入訊息...'), { target: { value: '活動在圖書館' } });
    fireEvent.click(screen.getByRole('button', { name: '發送' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/無法連線.*輸入內容已保留/);
    expect(screen.getByPlaceholderText('輸入訊息...')).toHaveValue('活動在圖書館');
    expect(screen.getByText('帶一本書')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '發送' }));
    expect(await screen.findByRole('status')).toHaveTextContent('訊息已送出');
    expect(screen.getByPlaceholderText('輸入訊息...')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps delivery success distinct from a later history refresh failure', async () => {
    vi.mocked(api.groups.messages).mockResolvedValueOnce(history).mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(history);
    await openGroup();
    await screen.findByText('帶一本書');
    fireEvent.change(screen.getByPlaceholderText('輸入訊息...'), { target: { value: '已送達的提醒' } });
    fireEvent.click(screen.getByRole('button', { name: '發送' }));
    expect(await screen.findByRole('status')).toHaveTextContent('訊息已送出');
    expect(await screen.findByRole('alert')).toHaveTextContent('無法載入訊息');
    expect(screen.getByPlaceholderText('輸入訊息...')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: '重新載入訊息' }));
    expect(api.groups.send).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('帶一本書')).toBeInTheDocument();
  });
});
