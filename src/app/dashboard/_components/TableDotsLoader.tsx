'use client';

/** Must match keyframe peak at 33.33% so delays of duration/3 alternate which dot is large */
const DOT_CYCLE_S = 1.05;

type TableDotsLoaderProps = {
  className?: string;
};

export default function TableDotsLoader({ className = '' }: TableDotsLoaderProps) {
  return (
    <div
      className={`flex w-full min-h-[220px] items-center justify-center rounded-lg border border-[#e5e5e5] bg-white ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-black"
            style={{
              animation: `dashboard-table-dots ${DOT_CYCLE_S}s ease-in-out infinite`,
              animationDelay: `${i * (DOT_CYCLE_S / 3)}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
