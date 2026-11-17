'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { COLORS } from '@/constants/colors';
import { useGetBrandsQuery } from '@/features/brands/brandsApi';
import { useGetStrengthLevelsQuery } from '@/features/strength-lvls/strength-levels';
import { useGetFlavorsQuery } from '@/features/flavours/flavoursApi';

type OptionItem = {
  name: string;
  slug?: string;
};

type ProductsFiltersProps = {
  selectedBrand: string;
  selectedStrength: string;
  selectedFlavor: string;
  sortBy: string;
  minPrice: number;
  maxPrice: number;
  onBrandChange: (value: string) => void;
  onStrengthChange: (value: string) => void;
  onFlavorChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
  onApply: () => void;
  onClear: () => void;
};

function extractOptions(source: unknown): OptionItem[] {
  if (Array.isArray(source)) return source as OptionItem[];
  if (
    source &&
    typeof source === 'object' &&
    'data' in source &&
    Array.isArray((source as { data?: unknown }).data)
  ) {
    return (source as { data: OptionItem[] }).data;
  }
  if (
    source &&
    typeof source === 'object' &&
    'items' in source &&
    Array.isArray((source as { items?: unknown }).items)
  ) {
    return (source as { items: OptionItem[] }).items;
  }
  return [];
}

export default function ProductsFilters({
  selectedBrand,
  selectedStrength,
  selectedFlavor,
  sortBy,
  minPrice,
  maxPrice,
  onBrandChange,
  onStrengthChange,
  onFlavorChange,
  onSortChange,
  onMinPriceChange,
  onMaxPriceChange,
  onApply,
  onClear,
}: ProductsFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: brandsResponse, isLoading: brandsLoading } = useGetBrandsQuery();
  const { data: strengthsResponse, isLoading: strengthsLoading } =
    useGetStrengthLevelsQuery();
  const { data: flavorsResponse, isLoading: flavorsLoading } =
    useGetFlavorsQuery({ is_active: true });

  const brands = extractOptions(brandsResponse);
  const strengths = extractOptions(strengthsResponse);
  const flavors = extractOptions(flavorsResponse);

  const brandOptions = brands.map((brand) => ({
    label: brand.name,
    value: brand.slug ?? brand.name,
  }));

  const strengthOptions = strengths.map((strength) => ({
    label: strength.name,
    value: strength.slug ?? strength.name,
  }));

  const flavorOptions = flavors.map((flavor) => ({
    label: flavor.name,
    value: flavor.slug ?? flavor.name,
  }));

  const isLoading = brandsLoading || strengthsLoading || flavorsLoading;

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

  const FilterContent = (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[28px] font-semibold text-bold">Filters</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close filters"
          >
            <X size={22} className="text-bold" />
          </button>

          <ChevronDown size={18} className="rotate-[-90deg] text-bold/70" />
        </div>
      </div>

      <div className="space-y-5 overflow-y-auto pr-1">
        {/* Brand dropdown - fixed arrow spacing */}
        <div className="border-t border-black/10 pt-4">
          <label className="mb-2 block text-sm text-bold/55">Brand</label>
          <div className="relative">
            <select
              value={selectedBrand}
              onChange={(e) => onBrandChange(e.target.value)}
              disabled={brandsLoading}
              className="w-full appearance-none rounded-xl border border-black/10 bg-white px-4 py-3 pr-8 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {brandsLoading ? 'Loading brands...' : 'All Brands'}
              </option>
              {brandOptions.map((brand) => (
                <option key={brand.value} value={brand.value}>
                  {brand.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
            />
          </div>
        </div>

        {/* Strength dropdown - fixed arrow spacing */}
        <div className="border-t border-black/10 pt-4">
          <label className="mb-2 block text-sm text-bold/55">Strength</label>
          <div className="relative">
            <select
              value={selectedStrength}
              onChange={(e) => onStrengthChange(e.target.value)}
              disabled={strengthsLoading}
              className="w-full appearance-none rounded-xl border border-black/10 bg-white px-4 py-3 pr-8 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {strengthsLoading ? 'Loading strengths...' : 'All Strengths'}
              </option>
              {strengthOptions.map((strength) => (
                <option key={strength.value} value={strength.value}>
                  {strength.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
            />
          </div>
        </div>

        {/* Flavor buttons with hover invert */}
        <div className="border-t border-black/10 pt-4">
          <label className="mb-3 block text-sm font-medium text-bold">
            Flavor
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onFlavorChange('')}
              className="rounded-full border px-4 py-2 text-sm transition-all duration-200"
              style={{
                backgroundColor:
                  selectedFlavor === '' ? COLORS.black : 'transparent',
                color: selectedFlavor === '' ? COLORS.white : COLORS.black,
                borderColor: 'rgba(0,0,0,0.12)',
              }}
              onMouseEnter={(e) => {
                if (selectedFlavor !== '') {
                  e.currentTarget.style.backgroundColor = COLORS.black;
                  e.currentTarget.style.color = COLORS.white;
                } else {
                  // active button inverse: white bg, black text
                  e.currentTarget.style.backgroundColor = COLORS.white;
                  e.currentTarget.style.color = COLORS.black;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedFlavor !== '') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = COLORS.black;
                } else {
                  e.currentTarget.style.backgroundColor = COLORS.black;
                  e.currentTarget.style.color = COLORS.white;
                }
              }}
            >
              All
            </button>

            {flavorOptions.map((flavor) => {
              const active = selectedFlavor === flavor.value;

              return (
                <button
                  key={flavor.value}
                  type="button"
                  onClick={() => onFlavorChange(flavor.value)}
                  disabled={flavorsLoading}
                  className="rounded-full border px-4 py-2 text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: active ? COLORS.black : 'transparent',
                    color: active ? COLORS.white : COLORS.black,
                    borderColor: 'rgba(0,0,0,0.12)',
                  }}
                  onMouseEnter={(e) => {
                    if (active) {
                      e.currentTarget.style.backgroundColor = COLORS.white;
                      e.currentTarget.style.color = COLORS.black;
                    } else {
                      e.currentTarget.style.backgroundColor = COLORS.black;
                      e.currentTarget.style.color = COLORS.white;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (active) {
                      e.currentTarget.style.backgroundColor = COLORS.black;
                      e.currentTarget.style.color = COLORS.white;
                    } else {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = COLORS.black;
                    }
                  }}
                >
                  {flavor.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort By (unchanged logic) */}
        <div className="border-t border-black/10 pt-4">
          <h3 className="mb-3 text-[28px] font-semibold text-bold">Sort By:</h3>
          <div className="space-y-3">
            {[
              { value: 'bestSelling', label: 'Best Selling' },
              { value: 'hPrice', label: 'Price Highest to lowest' },
              { value: 'lPrice', label: 'Price Lowest to Highest' },
            ].map((option) => {
              const checked = sortBy === option.value;
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center justify-between text-sm text-bold/65"
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
                      name="sort"
                      value={option.value}
                      checked={checked}
                      onChange={(e) => onSortChange(e.target.value)}
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

{/* Apply Filter button - inverse hover */}
<button
  type="button"
  onClick={handleApply}
  disabled={isLoading}
  className="w-full rounded-full border border-transparent bg-black px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:border-black hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
>
  Apply Filter
</button>

{/* Clear button - inverse hover */}
<button
  type="button"
  onClick={handleClear}
  className="w-full rounded-full border border-black/20 bg-transparent px-5 py-3 text-sm font-medium text-black transition-all duration-200 hover:bg-black hover:text-white"
>
  Clear
</button>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-5 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f6f6f6] px-4 py-3 text-sm font-medium text-bold"
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
        {FilterContent}
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
          {FilterContent}
        </div>
      </div>
    </>
  );
}