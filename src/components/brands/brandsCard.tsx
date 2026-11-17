'use client';

import Link from 'next/link';
import type { Brand } from '@/types/brands';
import { COLORS } from '@/constants/colors';

type BrandCardProps = {
  brand: Brand;
};

export default function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link
      href={`/store?brand=${brand.slug}`}
      className="
        group flex items-center justify-center rounded-full
        transition-transform duration-300 hover:-translate-y-1

        h-[145px] w-[145px]
        sm:h-[165px] sm:w-[165px]
        md:h-[170px] md:w-[170px]
        lg:h-[200px] lg:w-[200px]
        xl:h-[220px] xl:w-[220px]
      "
      style={{
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.brandCardBorder}`,
        boxShadow: `0 4px 12px ${COLORS.brandCardShadow}`,
      }}
      aria-label={brand.name}
    >
      <div
        className="
          flex items-center justify-center

          h-[70px] w-[90px]
          sm:h-[78px] sm:w-[98px]
          md:h-[85px] md:w-[95px]
          lg:h-[95px] lg:w-[105px]
        "
      >
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span
            className="
              text-center text-[12px] font-semibold
              sm:text-[13px]
              md:text-[14px]
            "
            style={{ color: COLORS.textPrimary }}
          >
            {brand.name}
          </span>
        )}
      </div>
    </Link>
  );
}