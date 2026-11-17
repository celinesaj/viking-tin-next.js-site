'use client';

type DashboardActiveToggleProps = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  busy?: boolean;
  'aria-label'?: string;
};

/** Pill switch: green track + white knob when on (dashboard contact social links, drawers). */
export default function DashboardActiveToggle({
  checked,
  onCheckedChange,
  disabled = false,
  busy = false,
  'aria-label': ariaLabel,
}: DashboardActiveToggleProps) {
  const inactive = disabled || busy;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={busy}
      disabled={inactive}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e] focus-visible:ring-offset-2 ${
        checked ? 'bg-[#22c55e]' : 'bg-[#d1d5db]'
      } ${inactive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
        aria-hidden
      />
    </button>
  );
}
