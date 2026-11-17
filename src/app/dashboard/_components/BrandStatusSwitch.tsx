'use client';

type BrandStatusSwitchProps = {
  value: 'active' | 'inactive';
  onChange: (value: 'active' | 'inactive') => void;
  disabled?: boolean;
  id?: string;
};

/** Same pill toggle as the brands table — green / gray track, white thumb. */
export function BrandStatusSwitch({
  value,
  onChange,
  disabled = false,
  id,
}: BrandStatusSwitchProps) {
  const on = value === 'active';
  return (
    <div className="flex items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled}
        aria-label={
          on ? 'Brand is active. Switch to inactive.' : 'Brand is inactive. Switch to active.'
        }
        onClick={() => onChange(on ? 'inactive' : 'active')}
        className={`relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
          on ? 'bg-emerald-500' : 'bg-[#d1d5db]'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
            on ? 'translate-x-5' : 'translate-x-0'
          }`}
          aria-hidden
        />
      </button>
      <span className="text-sm font-medium text-[#374151]">{on ? 'Active' : 'Inactive'}</span>
    </div>
  );
}
