import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LiffCheckContent } from '../uat/LiffCheck';
const mocks = vi.hoisted(() => ({ groupId: 'Cdev1' as string | null, share: vi.fn() }));
vi.mock('../contexts/useLiff', () => ({ useLiff: () => ({ loading: false, error: null, groupId: mocks.groupId, profile: { displayName: 'Dev User' } }) }));
vi.mock('../lib/liffShare', () => ({ shareLineMessage: mocks.share }));
beforeEach(() => { mocks.groupId = 'Cdev1'; mocks.share.mockReset(); });
describe('UAT-10 LIFF local check', () => {
  it('guards sharing when opened without group context', () => {
    mocks.groupId = null;
    render(<LiffCheckContent />);
    expect(screen.getByText('請從 LINE 群組開啟活動連結')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '測試分享' })).toBeDisabled();
  });
  it('shows readable share errors and allows retry', async () => {
    mocks.share.mockRejectedValueOnce(new Error('LINE 分享功能不可用')).mockResolvedValueOnce('shared');
    render(<LiffCheckContent />);
    fireEvent.click(screen.getByRole('button', { name: '測試分享' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('LINE 分享功能不可用');
    fireEvent.click(screen.getByRole('button', { name: '測試分享' }));
    expect(await screen.findByRole('status')).toHaveTextContent('shared');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
