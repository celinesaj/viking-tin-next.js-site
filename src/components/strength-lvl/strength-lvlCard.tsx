'use client';

import Link from 'next/link';
import { COLORS } from '@/constants/colors';
import { ArrowUpRight } from 'lucide-react';

type StrengthCardProps = {
  label: string;
  slug: string;
};

export default function StrengthCard({ label, slug }: StrengthCardProps) {
  return (
    <Link
      href={`/store?strength=${encodeURIComponent(slug)}`}
      className="relative mx-auto flex aspect-square w-full max-w-[140px] items-center justify-center rounded-full transition-transform duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: COLORS.white,
        boxShadow: `0 6px 20px ${COLORS.brandCardShadow}`,
      }}
      aria-label={label}
    >
      <span
        className="px-2 text-center text-[14px] font-semibold uppercase tracking-wide sm:text-[16px] lg:text-[18px]"
        style={{ color: COLORS.black }}
      >
        {label}
      </span>

      <div
        className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8"
        style={{ backgroundColor: COLORS.black, color: COLORS.white }}
      >
        <ArrowUpRight size={18} strokeWidth={2.4} />
      </div>
    </Link>
  );
}