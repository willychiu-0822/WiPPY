import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DrinkLogger from '../components/liff/DrinkLogger';

const noop = vi.fn().mockResolvedValue(undefined);

function getTotal() {
  return screen.getByTestId('running-total');
}

beforeEach(() => {
  noop.mockClear();
});

describe('DrinkLogger — drink type selector', () => {
  it('defaults to water', () => {
    render(<DrinkLogger onSubmit={noop} />);
    const waterBtn = screen.getByRole('button', { name: /💧 水/ });
    expect(waterBtn.className).toContain('bg-sky-500');
  });

  it('switches drink type on click', () => {
    render(<DrinkLogger onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /🍵 茶/ }));
    const teaBtn = screen.getByRole('button', { name: /🍵 茶/ });
    expect(teaBtn.className).toContain('bg-sky-500');
  });
});

describe('DrinkLogger — accumulator', () => {
  it('adds +100 to total on click', () => {
    render(<DrinkLogger onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: '+100' }));
    expect(getTotal()).toHaveTextContent('100');
  });

  it('accumulates multiple amounts', () => {
    render(<DrinkLogger onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    fireEvent.click(screen.getByRole('button', { name: '+50' }));
    expect(getTotal()).toHaveTextContent('250');
  });

  it('shows detail row with history', () => {
    render(<DrinkLogger onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: '+500' }));
    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    expect(screen.getByText('500 + 200')).toBeInTheDocument();
  });
});

describe('DrinkLogger — backspace', () => {
  it('removes last entry on backspace', () => {
    render(<DrinkLogger onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: '+100' }));
    fireEvent.click(screen.getByRole('button', { name: '+50' }));
    expect(getTotal()).toHaveTextContent('150');

    fireEvent.click(screen.getByRole('button', { name: '← 退格' }));
    expect(getTotal()).toHaveTextContent('100');
  });

  it('backspace is disabled when total is 0', () => {
    render(<DrinkLogger onSubmit={noop} />);
    expect(screen.getByRole('button', { name: '← 退格' })).toBeDisabled();
  });
});

describe('DrinkLogger — reset', () => {
  it('clears total on reset', () => {
    render(<DrinkLogger onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    fireEvent.click(screen.getByRole('button', { name: '歸零' }));
    expect(getTotal()).toHaveTextContent('0');
  });

  it('reset is disabled when total is 0', () => {
    render(<DrinkLogger onSubmit={noop} />);
    expect(screen.getByRole('button', { name: '歸零' })).toBeDisabled();
  });
});

describe('DrinkLogger — custom input', () => {
  it('adds custom amount to total', () => {
    render(<DrinkLogger onSubmit={noop} />);
    const input = screen.getByPlaceholderText('自訂 ml');
    fireEvent.change(input, { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: '加入' }));
    expect(getTotal()).toHaveTextContent('300');
  });

  it('adds custom amount with Enter key', () => {
    render(<DrinkLogger onSubmit={noop} />);
    const input = screen.getByPlaceholderText('自訂 ml');
    fireEvent.change(input, { target: { value: '150' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(getTotal()).toHaveTextContent('150');
  });
});

describe('DrinkLogger — submit', () => {
  it('submit button is disabled when total is 0', () => {
    render(<DrinkLogger onSubmit={noop} />);
    expect(screen.getByRole('button', { name: '選擇容量後送出' })).toBeDisabled();
  });

  it('submit button shows amount and drink type', () => {
    render(<DrinkLogger onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: '+100' }));
    expect(screen.getByRole('button', { name: '記錄 100 ml 水' })).toBeInTheDocument();
  });

  it('calls onSubmit with correct ml and type', async () => {
    render(<DrinkLogger onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /🍵 茶/ }));
    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    fireEvent.click(screen.getByRole('button', { name: '記錄 200 ml 茶' }));
    await waitFor(() => expect(noop).toHaveBeenCalledWith(200, 'tea'));
  });

  it('resets to 0 after submit', async () => {
    render(<DrinkLogger onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: '+100' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '記錄 100 ml 水' }));
    });
    await waitFor(() => expect(getTotal()).toHaveTextContent('0'));
  });
});

describe('DrinkLogger — overflow dialog (>2000ml)', () => {
  function addUntilOverflow() {
    // 5 × +500 = 2500, crossing the 2000 threshold
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: '+500' }));
    }
  }

  it('shows overflow dialog when total exceeds 2000', () => {
    render(<DrinkLogger onSubmit={noop} />);
    addUntilOverflow();
    expect(screen.getByText('你真的一次喝那麼多？💧')).toBeInTheDocument();
  });

  it('option 1 (awesome) closes dialog and keeps total', () => {
    render(<DrinkLogger onSubmit={noop} />);
    addUntilOverflow();
    fireEvent.click(screen.getByRole('button', { name: /對阿我很棒/ }));
    expect(screen.queryByText('你真的一次喝那麼多？💧')).not.toBeInTheDocument();
    expect(getTotal()).toHaveTextContent('2500');
  });

  it('option 1 does not re-trigger dialog on further additions', () => {
    render(<DrinkLogger onSubmit={noop} />);
    addUntilOverflow();
    fireEvent.click(screen.getByRole('button', { name: /對阿我很棒/ }));
    fireEvent.click(screen.getByRole('button', { name: '+500' }));
    expect(screen.queryByText('你真的一次喝那麼多？💧')).not.toBeInTheDocument();
  });

  it('option 2 (cumulative) closes dialog and keeps total with feedback', () => {
    render(<DrinkLogger onSubmit={noop} />);
    addUntilOverflow();
    fireEvent.click(screen.getByRole('button', { name: /累計一起記/ }));
    expect(screen.queryByText('你真的一次喝那麼多？💧')).not.toBeInTheDocument();
    expect(screen.getByText(/每次喝都要即時記/)).toBeInTheDocument();
    expect(getTotal()).toHaveTextContent('2500');
  });

  it('option 3 (mistake) closes dialog and clears total with feedback', () => {
    render(<DrinkLogger onSubmit={noop} />);
    addUntilOverflow();
    fireEvent.click(screen.getByRole('button', { name: /喔我輸錯了/ }));
    expect(screen.queryByText('你真的一次喝那麼多？💧')).not.toBeInTheDocument();
    expect(screen.getByText(/這個人很皮欸/)).toBeInTheDocument();
    expect(getTotal()).toHaveTextContent('0');
  });
});
