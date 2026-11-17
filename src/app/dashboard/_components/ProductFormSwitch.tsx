'use client';

type Variant = 'emerald' | 'amber';

type Props = {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  variant: Variant;
  disabled?: boolean;
};

const ring: Record<Variant, string> = {
  /** Vibrant system-style green (active “on” track) */
  emerald: 'focus-visible:ring-[#34C759]',
  amber: 'focus-visible:ring-amber-500',
};

const onBg: Record<Variant, string> = {
  emerald: 'bg-[#34C759]',
  amber: 'bg-amber-500',
};

export default function ProductFormSwitch({
  label,
  checked,
  onCheckedChange,
  variant,
  disabled = false,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={`relative flex h-[26px] w-[46px] shrink-0 items-center rounded-full p-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${ring[variant]} ${
          checked ? onBg[variant] : 'bg-[#d1d5db]'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span
          className={`pointer-events-none block h-[20px] w-[20px] rounded-full bg-white transition-transform duration-200 ease-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
          aria-hidden
        />
      </button>
      <span className="text-sm font-medium text-[#111111]">{label}</span>
    </div>
  );
}
