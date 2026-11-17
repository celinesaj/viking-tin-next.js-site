import type { HTMLAttributes } from 'react';

export default function Skeleton({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  // Lightweight, single-shape skeleton with a soft light-gray color.
  // Default size is subtle; callers can override with `className`.
  return (
    <div
      className={`animate-pulse rounded-md bg-[#e4e4e4] dark:bg-slate-700/30 h-4 w-full ${className}`}
      {...props}
    />
  );
}
