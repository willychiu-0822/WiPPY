import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const signOutMock = vi.hoisted(() => vi.fn());

vi.mock('firebase/auth', () => ({ signOut: signOutMock }));
vi.mock('../firebase', () => ({ auth: { tag: 'auth' } }));

import Layout from '../components/Layout';

describe('Layout', () => {
  it('shows only the active product nav and no removed legacy pages', () => {
    render(<MemoryRouter><Layout /></MemoryRouter>);

    expect(screen.getByRole('link', { name: '群組' })).toHaveAttribute('href', '/groups');
    expect(screen.getByRole('link', { name: '活動' })).toHaveAttribute('href', '/activities');
    expect(screen.getByRole('link', { name: '記錄' })).toHaveAttribute('href', '/history');
    expect(screen.queryByRole('link', { name: '設定' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '探索' })).not.toBeInTheDocument();
  });

  it('signs out from the header', async () => {
    render(<MemoryRouter><Layout /></MemoryRouter>);

    await userEvent.click(screen.getByRole('button', { name: '登出' }));

    expect(signOutMock).toHaveBeenCalledWith({ tag: 'auth' });
  });
});
