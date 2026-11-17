'use client';

import { useState } from 'react';
import { useGetBundlesQuery } from '@/features/bundles/bundlesApi';
import type { Bundle } from '@/types/bundles';
import BundlesGrid from './BundlesGrid';
import Pagination from '@/components/common/pagination';
import BundlesFilters, { type BundleSortOption } from './BundlesFilter';

const BUNDLES_PER_PAGE = 9;
const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 500;
const DEFAULT_SORT: BundleSortOption = 'asc';

function BundlesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: BUNDLES_PER_PAGE }).map((_, index) => (
        <div
          key={index}
          className="h-[460px] animate-pulse rounded-[28px] bg-gray-200"
        />
      ))}
    </div>
  );
}

export default function BundlesPageContent() {
  const [currentPage, setCurrentPage] = useState(1);

  // local UI state
  const [selectedSort, setSelectedSort] =
    useState<BundleSortOption>(DEFAULT_SORT);
  const [minPrice, setMinPrice] = useState(DEFAULT_MIN_PRICE);
  const [maxPrice, setMaxPrice] = useState(DEFAULT_MAX_PRICE);

  // applied state used by API
  const [appliedSort, setAppliedSort] =
    useState<BundleSortOption>(DEFAULT_SORT);
  const [appliedMinPrice, setAppliedMinPrice] = useState(DEFAULT_MIN_PRICE);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(DEFAULT_MAX_PRICE);

  const { data, isLoading, isFetching, isError } = useGetBundlesQuery({
    page: currentPage,
    limit: BUNDLES_PER_PAGE,
    is_active: true,
    price_min: appliedMinPrice,
    price_max: appliedMaxPrice,
    price_sort: appliedSort,
  });

  const bundles: Bundle[] = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalBundles = data?.pagination?.total ?? 0;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyFilters = () => {
    setAppliedSort(selectedSort);
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSelectedSort(DEFAULT_SORT);
    setMinPrice(DEFAULT_MIN_PRICE);
    setMaxPrice(DEFAULT_MAX_PRICE);

    setAppliedSort(DEFAULT_SORT);
    setAppliedMinPrice(DEFAULT_MIN_PRICE);
    setAppliedMaxPrice(DEFAULT_MAX_PRICE);
    setCurrentPage(1);
  };

  const showingFrom =
    totalBundles === 0 ? 0 : (currentPage - 1) * BUNDLES_PER_PAGE + 1;

  const showingTo = Math.min(currentPage * BUNDLES_PER_PAGE, totalBundles);

  const showSkeleton = isLoading || isFetching;

  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-10 md:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)] lg:items-start">
          <BundlesFilters
            selectedSort={selectedSort}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onSortChange={setSelectedSort}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />

          <section>
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h1 className="text-4xl font-bold tracking-[-0.03em] text-bold md:text-6xl uppercase">
                Bundles
              </h1>

              <p className="text-sm text-bold/70 md:text-base">
                Showing {showingFrom}-{showingTo} of {totalBundles} Bundles
              </p>
            </div>

            <div>
              {showSkeleton ? (
                <BundlesGridSkeleton />
              ) : isError ? (
                <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-600">
                  Failed to load bundles.
                </div>
              ) : bundles.length === 0 ? (
                <div className="rounded-[28px] border border-black/10  p-10 text-center">
                  <h2 className="text-2xl font-semibold text-bold">
                    No bundles found
                  </h2>
                  <p className="mt-2 text-bold/60">
                    There are no bundles available right now.
                  </p>
                </div>
              ) : (
                <>
                  <BundlesGrid bundles={bundles} />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}