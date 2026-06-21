import { useState, useRef } from 'react';
import type { DrinkType } from '../../lib/liffApi';

const DRINK_OPTIONS: Array<{ type: DrinkType; label: string; emoji: string }> = [
  { type: 'water', label: '水', emoji: '💧' },
  { type: 'tea', label: '茶', emoji: '🍵' },
  { type: 'coffee', label: '咖啡', emoji: '☕' },
  { type: 'juice', label: '果汁', emoji: '🧃' },
  { type: 'other', label: '其他', emoji: '🥤' },
];

const ADD_AMOUNTS = [50, 100, 200, 500] as const;
const OVERFLOW_THRESHOLD = 2000;

type OverflowChoice = 'awesome' | 'cumulative' | 'mistake';

interface OverflowDialog {
  open: boolean;
  handled: boolean; // true after user picked option 1 ("awesome") — don't re-trigger
  feedbackMsg: string | null;
}

interface Props {
  onSubmit: (ml: number, drinkType: DrinkType) => Promise<void>;
  submitting?: boolean;
}

export default function DrinkLogger({ onSubmit, submitting = false }: Props) {
  const [drinkType, setDrinkType] = useState<DrinkType>('water');
  const [history, setHistory] = useState<number[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [overflow, setOverflow] = useState<OverflowDialog>({ open: false, handled: false, feedbackMsg: null });
  const prevTotal = useRef(0);

  const total = history.reduce((s, n) => s + n, 0);

  function checkOverflow(newTotal: number) {
    if (newTotal > OVERFLOW_THRESHOLD && prevTotal.current <= OVERFLOW_THRESHOLD && !overflow.handled) {
      setOverflow(o => ({ ...o, open: true }));
    }
    prevTotal.current = newTotal;
  }

  function addAmount(amount: number) {
    setHistory(h => {
      const next = [...h, amount];
      checkOverflow(next.reduce((s, n) => s + n, 0));
      return next;
    });
  }

  function handleBackspace() {
    setHistory(h => h.slice(0, -1));
  }

  function handleReset() {
    setHistory([]);
    prevTotal.current = 0;
    setOverflow({ open: false, handled: false, feedbackMsg: null });
    setCustomInput('');
  }

  function handleCustomAdd() {
    const val = parseInt(customInput, 10);
    if (!val || val <= 0) return;
    setHistory(h => {
      const next = [...h, val];
      checkOverflow(next.reduce((s, n) => s + n, 0));
      return next;
    });
    setCustomInput('');
  }

  function handleCustomKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCustomAdd();
  }

  function handleOverflow(choice: OverflowChoice) {
    if (choice === 'awesome') {
      setOverflow({ open: false, handled: true, feedbackMsg: null });
    } else if (choice === 'cumulative') {
      setOverflow({ open: false, handled: false, feedbackMsg: '記得喔～每次喝都要即時記，這樣排行才準！' });
    } else {
      setOverflow({ open: false, handled: false, feedbackMsg: '齁～這個人很皮欸 😏' });
      setHistory([]);
      prevTotal.current = 0;
      setCustomInput('');
    }
  }

  async function handleSubmit() {
    if (total <= 0 || submitting) return;
    const ml = total;
    const type = drinkType;
    try {
      await onSubmit(ml, type);
      handleReset();
    } catch {
      // parent handles error display; keep the entered values so user can retry
    }
  }

  const drinkLabel = DRINK_OPTIONS.find(d => d.type === drinkType)?.label ?? '';
  const submitLabel = total > 0 ? `記錄 ${Math.round(total)} ml ${drinkLabel}` : '選擇容量後送出';

  const detailRow = history.length > 0 ? history.join(' + ') : null;

  return (
    <div className="flex flex-col gap-4">

      {/* Drink type selector */}
      <div className="flex gap-2 justify-center flex-wrap">
        {DRINK_OPTIONS.map(opt => (
          <button
            key={opt.type}
            onClick={() => setDrinkType(opt.type)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              drinkType === opt.type
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
            }`}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>

      {/* Running total */}
      <div className="text-center">
        <div
          data-testid="running-total"
          className="text-5xl font-bold text-sky-700"
        >
          {Math.round(total)}
        </div>
        <div className="text-sky-400 text-sm">ml</div>
        {detailRow && (
          <div className="text-xs text-sky-300 mt-1 font-mono">{detailRow}</div>
        )}
      </div>

      {/* Add buttons */}
      <div className="grid grid-cols-4 gap-2">
        {ADD_AMOUNTS.map(amt => (
          <button
            key={amt}
            onClick={() => addAmount(amt)}
            className="min-h-[52px] bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all"
          >
            +{amt}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={customInput}
          onChange={e => {
            const v = e.target.value;
            if (v === '' || (parseInt(v, 10) > 0 && /^\d+$/.test(v))) setCustomInput(v);
          }}
          onKeyDown={handleCustomKeyDown}
          placeholder="自訂 ml"
          className="flex-1 min-h-[44px] border border-sky-200 rounded-xl px-3 text-sm text-sky-700 placeholder-sky-300 outline-none focus:border-sky-400"
        />
        <button
          onClick={handleCustomAdd}
          disabled={!customInput || parseInt(customInput, 10) <= 0}
          className="min-h-[44px] px-4 bg-sky-100 hover:bg-sky-200 text-sky-600 font-semibold rounded-xl text-sm disabled:opacity-40 transition-colors"
        >
          加入
        </button>
      </div>

      {/* Overflow feedback */}
      {overflow.feedbackMsg && (
        <p className="text-center text-sm text-orange-500">{overflow.feedbackMsg}</p>
      )}

      {/* Backspace / Reset */}
      <div className="flex gap-2">
        <button
          onClick={handleBackspace}
          disabled={history.length === 0}
          className="flex-1 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-sm disabled:opacity-40 transition-colors"
        >
          ← 退格
        </button>
        <button
          onClick={handleReset}
          disabled={history.length === 0}
          className="flex-1 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-sm disabled:opacity-40 transition-colors"
        >
          歸零
        </button>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={total <= 0 || submitting}
        className="min-h-[52px] bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold rounded-2xl text-base disabled:opacity-40 transition-all shadow-sm"
      >
        {submitting ? '記錄中...' : submitLabel}
      </button>

      {/* Overflow dialog */}
      {overflow.open && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold text-gray-800 mb-1 text-center">
              你真的一次喝那麼多？💧
            </h2>
            <p className="text-xs text-gray-400 text-center mb-4">
              總量已超過 {OVERFLOW_THRESHOLD} ml
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleOverflow('awesome')}
                className="min-h-[48px] bg-sky-500 text-white font-semibold rounded-xl text-sm"
              >
                對阿我很棒 💪
              </button>
              <button
                onClick={() => handleOverflow('cumulative')}
                className="min-h-[48px] bg-sky-50 text-sky-600 font-semibold rounded-xl text-sm"
              >
                累計一起記
              </button>
              <button
                onClick={() => handleOverflow('mistake')}
                className="min-h-[48px] bg-gray-100 text-gray-500 font-semibold rounded-xl text-sm"
              >
                喔我輸錯了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
