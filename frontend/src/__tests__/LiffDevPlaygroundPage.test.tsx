import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseLiff = vi.hoisted(() => ({
  ready: true,
  loading: false,
  error: null as string | null,
  profile: { userId: 'Utest1', displayName: 'Test User', pictureUrl: '' },
  context: { type: 'group' as const, groupId: 'Ctest1' },
  idToken: 'mock-id-token',
  groupId: 'Ctest1' as string | null,
}));

const liffMock = vi.hoisted(() => ({
  isInClient: vi.fn(() => false),
  sendMessages: vi.fn().mockResolvedValue(undefined),
  shareTargetPicker: vi.fn().mockResolvedValue({ status: 'success' }),
}));

vi.mock('@line/liff', () => ({
  default: liffMock,
}));

vi.mock('../contexts/useLiff', () => ({
  useLiff: () => mockUseLiff,
}));

import LiffDevPlaygroundPage from '../pages/liff/LiffDevPlaygroundPage';

function renderPlayground(initialPath = '/dev/liff-playground') {
  window.history.replaceState(null, '', initialPath);
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dev/liff-playground" element={<LiffDevPlaygroundPage />} />
        <Route path="/liff/water" element={<div>Water UAT</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LiffDevPlaygroundPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('VITE_LIFF_DEV', 'true');
    vi.stubEnv('VITE_USE_MOCK_API', 'true');
    window.history.replaceState(null, '', '/');
  });

  it('shows diagnostics in LIFF dev mode', () => {
    renderPlayground('/dev/liff-playground?mockPreset=rank_first');

    expect(screen.getByRole('heading', { name: 'LIFF Playground' })).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Ctest1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open UAT page' })).toHaveAttribute(
      'href',
      '/liff/water?wg=Cdev1&mockPreset=rank_first'
    );
  });

  it('updates the UAT link when changing preset', () => {
    renderPlayground();

    fireEvent.change(screen.getByLabelText('Mock preset'), { target: { value: 'api_500' } });

    expect(screen.getByRole('link', { name: 'Open UAT page' })).toHaveAttribute(
      'href',
      '/liff/water?wg=Cdev1&mockPreset=api_500'
    );
    expect(screen.getByText(/後端錯誤/)).toBeInTheDocument();
  });

  it('surfaces share_unavailable errors from share check', async () => {
    renderPlayground('/dev/liff-playground?mockPreset=share_unavailable');

    fireEvent.click(screen.getByRole('button', { name: 'Check share' }));

    await waitFor(() =>
      expect(screen.getByText(/LINE 分享功能不可用/)).toBeInTheDocument()
    );
  });

  it('redirects away when dev tools are disabled', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_LIFF_DEV', 'false');

    renderPlayground('/dev/liff-playground');

    expect(screen.getByText('Water UAT')).toBeInTheDocument();
  });
});
