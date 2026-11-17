'use client';

import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { COLORS } from '@/constants/colors';
import { formatPrice } from '@/lib/PriceFormat';

export type BundleSortOption = 'asc' | 'desc';

type BundlesFiltersProps = {
  selectedSort: BundleSortOption;
  minPrice: number;
  maxPrice: number;
  onSortChange: (value: BundleSortOption) => void;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
  onApply: () => void;
  onClear: () => void;
};

const MIN_ALLOWED_PRICE = 0;
const MAX_ALLOWED_PRICE = 2000;

export default function BundlesFilters({
  selectedSort,
  minPrice,
  maxPrice,
  onSortChange,
  onMinPriceChange,
  onMaxPriceChange,
  onApply,
  onClear,
}: BundlesFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const safeMinPrice = useMemo(
    () => Math.max(MIN_ALLOWED_PRICE, Math.min(minPrice, maxPrice)),
    [minPrice, maxPrice]
  );

  const safeMaxPrice = useMemo(
    () => Math.min(MAX_ALLOWED_PRICE, Math.max(minPrice, maxPrice)),
    [minPrice, maxPrice]
  );

  const handleMinRangeChange = (value: number) => {
    onMinPriceChange(Math.min(value, safeMaxPrice));
  };

  const handleMaxRangeChange = (value: number) => {
    onMaxPriceChange(Math.max(value, safeMinPrice));
  };

  const handleApply = () => {
    onApply();
    setMobileOpen(false);
  };

  const handleClear = () => {
    onClear();
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  const filtersContent = (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[28px] font-semibold text-black">Filters</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex lg:hidden"
            aria-label="Close filters"
          >
            <X size={20} className="text-black" />
          </button>

          <SlidersHorizontal size={18} className="text-black" />
        </div>
      </div>

      <div className="space-y-5 overflow-y-auto">
        <div className="border-t border-black/10 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[20px] font-semibold text-black">Price Range</h3>
          </div>

          <div className="px-1">
            <div className="relative mb-4 h-8">
              <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-black/15" />

              <div
                className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-black"
                style={{
                  left: `${(safeMinPrice / MAX_ALLOWED_PRICE) * 100}%`,
                  right: `${100 - (safeMaxPrice / MAX_ALLOWED_PRICE) * 100}%`,
                }}
              />

              <input
                type="range"
                min={MIN_ALLOWED_PRICE}
                max={MAX_ALLOWED_PRICE}
                value={safeMinPrice}
                onChange={(e) => handleMinRangeChange(Number(e.target.value))}
                className="pointer-events-none absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:shadow-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-black"
              />

              <input
                type="range"
                min={MIN_ALLOWED_PRICE}
                max={MAX_ALLOWED_PRICE}
                value={safeMaxPrice}
                onChange={(e) => handleMaxRangeChange(Number(e.target.value))}
                className="pointer-events-none absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:shadow-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-black"
              />
            </div>

            <div className="flex items-center justify-between text-[15px] font-medium text-black/75">
              <span>{formatPrice(safeMinPrice)}</span>
              <span>{formatPrice(safeMaxPrice)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-black/10 pt-4">
          <h3 className="mb-4 text-[28px] font-semibold text-black">Sort By:</h3>

          <div className="space-y-3">
            {[
              { value: 'asc', label: 'Price: Low to High' },
              { value: 'desc', label: 'Price: High to Low' },
            ].map((option) => {
              const checked = selectedSort === option.value;

              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center justify-between text-[15px]"
                  style={{ color: 'rgba(0,0,0,0.45)' }}
                >
                  <span>{option.label}</span>

                  <span
                    className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full border"
                    style={{
                      borderColor: checked ? COLORS.black : 'rgba(0,0,0,0.22)',
                    }}
                  >
                    <input
                      type="radio"
                      name="bundle-sort"
                      value={option.value}
                      checked={checked}
                      onChange={() =>
                        onSortChange(option.value as BundleSortOption)
                      }
                      className="sr-only"
                    />
                    <span
                      className="h-[8px] w-[8px] rounded-full"
                      style={{
                        backgroundColor: COLORS.black,
                        opacity: checked ? 1 : 0,
                      }}
                    />
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button
            type="button"
            onClick={handleApply}
            className="w-full rounded-full px-5 py-3 text-sm font-medium text-white"
            style={{ backgroundColor: COLORS.black }}
          >
            Apply Filter
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="w-full rounded-full border px-5 py-3 text-sm font-medium"
            style={{
              borderColor: 'rgba(0,0,0,0.18)',
              color: COLORS.black,
              backgroundColor: 'transparent',
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-5 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f6f6f6] px-4 py-3 text-sm font-medium text-black"
        >
          <SlidersHorizontal size={18} />
          <span>Filters</span>
        </button>
      </div>

      <aside
        className="hidden rounded-[30px] border p-5 lg:sticky lg:top-[120px] lg:block"
        style={{
          backgroundColor: '#f6f6f6',
          borderColor: 'rgba(0,0,0,0.08)',
        }}
      >
        {filtersContent}
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          className={`absolute left-0 top-0 h-full w-[86%] max-w-[360px] border-r border-black/10 bg-[#f6f6f6] p-5 shadow-xl transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {filtersContent}
        </div>
      </div>
    </>
  );
}