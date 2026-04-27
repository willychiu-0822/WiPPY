import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReviewBanner from '../components/ReviewBanner';
import type { Activity } from '../lib/api';

const baseActivity: Activity = {
  id: 'act_1',
  userId: 'user_1',
  name: '密室逃脫',
  targetGroups: ['g1'],
  status: 'draft',
  reviewStatus: 'pending_review',
  approvedAt: null,
  agentSessionId: null,
  eventStartAt: null,
  eventEndAt: null,
  createdAt: { _seconds: 0, _nanoseconds: 0 },
  updatedAt: { _seconds: 0, _nanoseconds: 0 },
};

describe('ReviewBanner — pending_review', () => {
  it('shows 企畫待審核 label', () => {
    render(
      <ReviewBanner
        activity={baseActivity}
        onApprove={vi.fn()}
        onRequestRevision={vi.fn()}
      />
    );
    expect(screen.getByText('企畫待審核')).toBeInTheDocument();
  });

  it('shows 核准企畫 button', () => {
    render(
      <ReviewBanner
        activity={baseActivity}
        onApprove={vi.fn()}
        onRequestRevision={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: '核准企畫' })).toBeInTheDocument();
  });

  it('calls onApprove when 核准企畫 is clicked', () => {
    const onApprove = vi.fn();
    render(
      <ReviewBanner
        activity={baseActivity}
        onApprove={onApprove}
        onRequestRevision={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '核准企畫' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('disables button when loading=true', () => {
    render(
      <ReviewBanner
        activity={baseActivity}
        onApprove={vi.fn()}
        onRequestRevision={vi.fn()}
        loading={true}
      />
    );
    expect(screen.getByRole('button', { name: '處理中...' })).toBeDisabled();
  });
});

describe('ReviewBanner — approved', () => {
  const approved: Activity = { ...baseActivity, status: 'active', reviewStatus: 'approved' };

  it('shows 企畫已核准 label', () => {
    render(
      <ReviewBanner activity={approved} onApprove={vi.fn()} onRequestRevision={vi.fn()} />
    );
    expect(screen.getByText('企畫已核准')).toBeInTheDocument();
  });

  it('shows 要求修改 button', () => {
    render(
      <ReviewBanner activity={approved} onApprove={vi.fn()} onRequestRevision={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: '要求修改' })).toBeInTheDocument();
  });

  it('calls onRequestRevision when 要求修改 is clicked', () => {
    const onRequestRevision = vi.fn();
    render(
      <ReviewBanner activity={approved} onApprove={vi.fn()} onRequestRevision={onRequestRevision} />
    );
    fireEvent.click(screen.getByRole('button', { name: '要求修改' }));
    expect(onRequestRevision).toHaveBeenCalledTimes(1);
  });

  it('does NOT show 核准企畫 button when already approved', () => {
    render(
      <ReviewBanner activity={approved} onApprove={vi.fn()} onRequestRevision={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: '核准企畫' })).not.toBeInTheDocument();
  });
});

describe('ReviewBanner — revision_requested', () => {
  const revision: Activity = { ...baseActivity, reviewStatus: 'revision_requested' };

  it('shows 修改中 label', () => {
    render(
      <ReviewBanner activity={revision} onApprove={vi.fn()} onRequestRevision={vi.fn()} />
    );
    expect(screen.getByText(/修改中/)).toBeInTheDocument();
  });

  it('shows 重新核准 button', () => {
    render(
      <ReviewBanner activity={revision} onApprove={vi.fn()} onRequestRevision={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: '重新核准' })).toBeInTheDocument();
  });

  it('calls onApprove when 重新核准 is clicked', () => {
    const onApprove = vi.fn();
    render(
      <ReviewBanner activity={revision} onApprove={onApprove} onRequestRevision={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: '重新核准' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });
});
