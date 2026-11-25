import type { HelperNotice } from '../lib/helperCopy';

/** Friendly sentence, with the raw code only inside a collapsed detail. */
export function FriendlyNotice({
  notice,
  className,
  role,
}: {
  notice: HelperNotice | null;
  className?: string;
  role?: 'alert' | 'status';
}) {
  if (!notice) return null;
  return (
    <div className={className}>
      <p {...(role ? { role } : {})}>{notice.message}</p>
      {notice.raw && (
        <details className="mt-1 text-xs text-gray-500">
          <summary className="cursor-pointer">技術細節</summary>
          <p className="break-words">{notice.raw}</p>
        </details>
      )}
    </div>
  );
}
