import { useId, type ReactNode } from 'react';
import type { HubGroup } from './hubApi';

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold text-gray-800">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export function TextField(props: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; multiline?: boolean; hint?: string }) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-gray-600">{props.label}</label>
      {props.multiline ? (
        <textarea id={id} className={inputClass} rows={4} value={props.value} placeholder={props.placeholder} required={props.required} onChange={(e) => props.onChange(e.target.value)} />
      ) : (
        <input id={id} className={inputClass} type={props.type ?? 'text'} value={props.value} placeholder={props.placeholder} required={props.required} onChange={(e) => props.onChange(e.target.value)} />
      )}
      {props.hint && <p className="text-xs text-gray-400">{props.hint}</p>}
    </div>
  );
}

export function SelectField(props: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-gray-600">{props.label}</label>
      <select id={id} className={inputClass} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function GroupChecklist({ legend, groups, selected, onChange }: { legend: string; groups: HubGroup[]; selected: string[]; onChange: (ids: string[]) => void }) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-xs font-medium text-gray-600">{legend}</legend>
      {groups.length === 0 && <p className="text-xs text-gray-400">還沒有群組</p>}
      {groups.map((g) => (
        <CheckboxField
          key={g.groupId}
          label={g.name}
          checked={selected.includes(g.groupId)}
          onChange={(on) => onChange(on ? [...selected, g.groupId] : selected.filter((id) => id !== g.groupId))}
        />
      ))}
    </fieldset>
  );
}

export function Switch({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Button({ children, onClick, type = 'button', variant = 'primary', disabled, label }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; label?: string }) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} aria-label={label} className={`px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${styles}`}>
      {children}
    </button>
  );
}

export function ErrorText({ error }: { error: string | null }) {
  return error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null;
}
