import { useState } from 'react';

const styles = {
  link: {
    trigger: 'text-xs text-red-400 hover:text-red-600 px-1 disabled:opacity-50',
    cancel: 'text-xs text-gray-500 hover:text-gray-700 px-1 disabled:opacity-50',
    confirm: 'text-xs text-red-600 hover:text-red-700 px-1 disabled:opacity-50',
  },
  danger: {
    trigger: 'px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 bg-red-50 text-red-600 hover:bg-red-100',
    cancel: 'px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 bg-gray-100 text-gray-700 hover:bg-gray-200',
    confirm: 'px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 bg-red-50 text-red-600 hover:bg-red-100',
  },
} as const;

export function ConfirmAction({
  label,
  confirmLabel,
  pendingLabel,
  pending = false,
  disabled = false,
  name,
  onConfirm,
  variant = 'link',
}: {
  label: string;
  confirmLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  name?: string;
  onConfirm: () => void | Promise<void>;
  variant?: keyof typeof styles;
}) {
  const [asking, setAsking] = useState(false);
  const [working, setWorking] = useState(false);
  const busy = pending || working;
  const look = styles[variant];

  async function confirm() {
    if (busy) return;
    setWorking(true);
    try {
      await onConfirm();
    } finally {
      setWorking(false);
      setAsking(false);
    }
  }

  if (asking) {
    return (
      <span className="inline-flex items-center gap-1" role="group" aria-label={`確認${label}`}>
        <button type="button" className={look.cancel} disabled={busy} onClick={() => setAsking(false)}>取消</button>
        <button type="button" className={look.confirm} disabled={busy} onClick={() => void confirm()}>
          {busy ? (pendingLabel ?? confirmLabel) : confirmLabel}
        </button>
      </span>
    );
  }

  return (
    <button type="button" aria-label={name} disabled={disabled} className={look.trigger} onClick={() => setAsking(true)}>
      {label}
    </button>
  );
}
