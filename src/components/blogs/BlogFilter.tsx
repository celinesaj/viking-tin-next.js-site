'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { COLORS } from '@/constants/colors';
import type { BlogSortOption } from '@/types/blogs';
import { useGetBlogCategoriesQuery } from '@/features/blogs/blogCategoriesApi';

type BlogsFiltersProps = {
  selectedCategoryId: string;
  selectedSort: BlogSortOption | '';
  onCategoryChange: (value: string) => void;
  onSortChange: (value: BlogSortOption) => void;
  onApply: () => void;
  onClear: () => void;
};

export default function BlogsFilters({
  selectedCategoryId,
  selectedSort,
  onCategoryChange,
  onSortChange,
  onApply,
  onClear,
}: BlogsFiltersProps) {
  const { data: categories = [], isLoading } = useGetBlogCategoriesQuery();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  const handleApply = () => {
    onApply();
    setMobileOpen(false);
  };

  const handleClear = () => {
    onClear();
    setMobileOpen(false);
  };

  const filtersContent = (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[28px] font-semibold text-bold">Filters</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex lg:hidden"
            aria-label="Close filters"
          >
            <X size={20} className="text-bold" />
          </button>

          <SlidersHorizontal size={18} />
        </div>
      </div>

      <div className="space-y-5 overflow-y-auto">
        <div className="border-t border-black/10 pt-4">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => onCategoryChange('')}
              className="flex w-full items-center justify-between text-left text-[15px]"
              style={{
                color:
                  selectedCategoryId === ''
                    ? COLORS.black
                    : 'rgba(0,0,0,0.45)',
                fontWeight: selectedCategoryId === '' ? 600 : 400,
              }}
            >
              <span>All Categories</span>
              <ChevronRight size={16} />
            </button>

            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-5 w-full animate-pulse rounded bg-black/10"
                />
              ))
              : categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryChange(category.id)}
                  className="flex w-full items-center justify-between text-left text-[15px]"
                  style={{
                    color:
                      selectedCategoryId === category.id
                        ? COLORS.black
                        : 'rgba(0,0,0,0.45)',
                    fontWeight:
                      selectedCategoryId === category.id ? 600 : 400,
                  }}
                >
                  <span>{category.name}</span>
                  <ChevronRight size={16} />
                </button>
              ))}
          </div>
        </div>

        <div className="border-t border-black/10 pt-4">
          <h3 className="mb-4 text-[28px] font-semibold text-bold">Sort By:</h3>

          <div className="space-y-3">
            {[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
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
                      borderColor: checked
                        ? COLORS.black
                        : 'rgba(0,0,0,0.22)',
                    }}
                  >
                    <input
                      type="radio"
                      name="blog-sort"
                      value={option.value}
                      checked={checked}
                      onChange={() => onSortChange(option.value as BlogSortOption)}
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
        {filtersContent}
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'
            }`}
        />

        <div
          className={`absolute left-0 top-0 h-full w-[86%] max-w-[360px] border-r border-black/10 bg-[#f6f6f6] p-5 shadow-xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {filtersContent}
        </div>
      </div>
    </>
  );
}