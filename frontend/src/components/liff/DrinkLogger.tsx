import { useRef, useState } from 'react';
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
  initialAmount?: number;
  onSubmitted?: () => void;
}

export default function DrinkLogger({ onSubmit, submitting = false, initialAmount, onSubmitted }: Props) {
  const [drinkType, setDrinkType] = useState<DrinkType>('water');
  const [history, setHistory] = useState<number[]>(() => initialAmount && initialAmount > 0 ? [initialAmount] : []);
  const [customInput, setCustomInput] = useState('');
  const [overflow, setOverflow] = useState<OverflowDialog>({ open: false, handled: false, feedbackMsg: null });
  const prevTotal = useRef(initialAmount && initialAmount > 0 ? initialAmount : 0);

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
      onSubmitted?.();
    } catch {
      // parent handles error display; keep the entered values so user can retry
    }
  }

  const drinkLabel = DRINK_OPTIONS.find(d => d.type === drinkType)?.label ?? '';
  const submitLabel = total > 0 ? `記錄 ${Math.round(total)} ml ${drinkLabel}` : '選擇容量後送出';

  const detailRow = history.length > 0 ? history.join(' + ') : null;

  return (
    <div className="flex flex-col gap-[clamp(8px,1.6dvh,16px)]">

      {/* Drink type selector */}
      <div className="flex flex-wrap justify-center gap-2">
        {DRINK_OPTIONS.map(opt => (
          <button
            key={opt.type}
            onClick={() => setDrinkType(opt.type)}
            aria-label={`${opt.emoji} ${opt.label}`}
            className={`min-h-[clamp(38px,5.6dvh,44px)] flex-1 rounded-2xl px-2 py-1.5 text-sm font-black transition ${
              drinkType === opt.type
                ? 'bg-sky-500 bg-white text-sky-900 shadow-lg shadow-black/20'
                : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Running total */}
      <div className="text-center">
        <div
          data-testid="running-total"
          className="font-['Archivo'] text-[clamp(44px,10dvh,64px)] font-black leading-none tracking-normal text-white drop-shadow-lg"
        >
          {Math.round(total)}
          <span className="ml-1 text-2xl font-black text-white/60">ml</span>
        </div>
        {detailRow && (
          <div className="mt-1 font-['Archivo'] text-xs font-bold text-white/80">{detailRow}</div>
        )}
      </div>

      {/* Add buttons */}
      <div className="grid grid-cols-4 gap-2">
        {ADD_AMOUNTS.map(amt => (
          <button
            key={amt}
            onClick={() => addAmount(amt)}
            className="min-h-[clamp(44px,6.2dvh,54px)] rounded-2xl border border-white/25 bg-white/10 font-['Archivo'] text-lg font-black text-white transition hover:bg-white/20 active:scale-95"
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
          className="min-h-[clamp(42px,5.8dvh,48px)] flex-1 rounded-2xl border border-white/25 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-sky-300"
        />
        <button
          onClick={handleCustomAdd}
          disabled={!customInput || parseInt(customInput, 10) <= 0}
          className="min-h-[clamp(42px,5.8dvh,48px)] rounded-2xl bg-white px-5 text-sm font-black text-sky-900 transition hover:bg-sky-50 disabled:opacity-40"
        >
          加入
        </button>
      </div>

      {/* Overflow feedback */}
      {overflow.feedbackMsg && (
        <p className="text-center text-sm text-orange-200">{overflow.feedbackMsg}</p>
      )}

      {/* Backspace / Reset */}
      <div className="flex gap-2">
        <button
          onClick={handleBackspace}
          disabled={history.length === 0}
          aria-label="← 退格"
          className="min-h-[clamp(40px,5.5dvh,44px)] flex-1 rounded-2xl border border-white/15 bg-black/20 text-sm font-bold text-white/80 transition hover:bg-black/30 disabled:opacity-40"
        >
          移除累加
        </button>
        <button
          onClick={handleReset}
          disabled={history.length === 0}
          aria-label="歸零"
          className="min-h-[clamp(40px,5.5dvh,44px)] flex-1 rounded-2xl border border-white/15 bg-black/20 text-sm font-bold text-white/80 transition hover:bg-black/30 disabled:opacity-40"
        >
          重置
        </button>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={total <= 0 || submitting}
        className="min-h-[clamp(48px,6.8dvh,56px)] rounded-3xl bg-white text-base font-black text-sky-900 shadow-xl shadow-black/30 transition hover:bg-sky-50 active:scale-95 disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none"
      >
        {submitting ? '記錄中...' : submitLabel}
      </button>

      {/* Overflow dialog */}
      {overflow.open && (
        <div className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center bg-black/60 p-4 backdrop-blur">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#071326] p-5 shadow-xl">
            <h2 className="mb-1 text-center text-base font-black text-sky-50">
              你真的一次喝那麼多？💧
            </h2>
            <p className="mb-4 text-center text-xs text-slate-500">
              總量已超過 {OVERFLOW_THRESHOLD} ml
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleOverflow('awesome')}
                className="min-h-[48px] rounded-2xl bg-sky-400 text-sm font-black text-[#03060e]"
              >
                對阿我很棒 💪
              </button>
              <button
                onClick={() => handleOverflow('cumulative')}
                className="min-h-[48px] rounded-2xl bg-white/10 text-sm font-bold text-sky-100"
              >
                累計一起記
              </button>
              <button
                onClick={() => handleOverflow('mistake')}
                className="min-h-[48px] rounded-2xl bg-white/5 text-sm font-bold text-slate-400"
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
