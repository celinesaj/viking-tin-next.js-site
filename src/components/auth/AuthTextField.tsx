'use client';

type AuthTextFieldProps = {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode; // ✅ NEW
};

export default function AuthTextField({
  label,
  type = 'text',
  value,
  placeholder,
  error,
  onChange,
  rightElement,
  leftElement,
}: AuthTextFieldProps) {
  return (
    <div>
      <label className="mb-3 block text-[24px] uppercase leading-none font-bold md:text-[28px]">
        {label}
      </label>

      <div className="relative flex items-center gap-2">
        
        {/* LEFT ELEMENT (e.g. country code) */}
        {leftElement && (
          <div className="flex-shrink-0">
            {leftElement}
          </div>
        )}

        {/* INPUT */}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-[58px] w-full rounded-[18px] border bg-transparent px-5 ${
            rightElement ? 'pr-16' : ''
          } text-[16px] outline-none placeholder:text-black/35 md:h-[64px] ${
            error ? 'border-red-500' : 'border-black/60'
          }`}
        />

        {/* RIGHT ELEMENT */}
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}