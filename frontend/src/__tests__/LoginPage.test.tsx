import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase/auth', () => ({ signInWithPopup: vi.fn(), signInWithEmailAndPassword: vi.fn() }));
vi.mock('../firebase', () => ({ auth: {}, googleProvider: {} }));

import LoginPage from '../pages/LoginPage';

describe('LoginPage', () => {
  it('offers sign-in only — no public sign-up', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /註冊/ })).not.toBeInTheDocument();
    expect(screen.getByText('帳號由 WiPPY 擁有者建立，不開放註冊。')).toBeInTheDocument();
    expect(screen.queryByText('建立帳號')).not.toBeInTheDocument();
  });

  it('has one solid primary button; Google is a secondary link', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getAllByRole('button', { name: '登入' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /使用 Google 繼續/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '改用 Google 帳號登入' })).toBeInTheDocument();
  });
});
