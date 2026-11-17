import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export default function MediaFallback({
  className = '',
  label = 'Media unavailable',
  ...rest
}: Props) {
  return (
    <div
      className={`h-full w-full bg-[#d9d9dd] text-[#111] ${className}`}
      {...rest}
    >
      <div className="flex h-full w-full items-center justify-center p-6">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-14 w-14 text-[#2f363f]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="3" width="14" height="14" rx="2" />
          <rect x="3" y="6" width="14" height="14" rx="2" />
          <path d="M6.5 14.5l3-4 4 5 3.5-5" />
          <circle cx="13.5" cy="8" r="1.5" />
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
