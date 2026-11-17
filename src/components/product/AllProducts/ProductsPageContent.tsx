'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetProductsQuery } from '@/features/products/productsApi';
import type { Product } from '@/types/products';
import ProductsFilters from './ProductsFilters';
import ProductsGrid from './ProductsGrid';
import Pagination from '@/components/common/pagination';

const PRODUCTS_PER_PAGE = 9;

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-black/8">
      <div className="animate-pulse">
        <div className="aspect-[4/4.4] w-full bg-[#ececec]" />
        <div className="space-y-4 p-5 sm:p-6">
          <div className="h-3 w-20 rounded-full bg-[#ececec]" />
          <div className="h-6 w-[75%] rounded-full bg-[#ececec]" />
          <div className="h-4 w-[55%] rounded-full bg-[#ececec]" />
          <div className="flex items-center gap-2 pt-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className="h-[10px] w-[10px] rounded-full bg-[#e3e3e3]"
              />
            ))}
          </div>
          <div className="flex items-center justify-between pt-4">
            <div className="h-6 w-24 rounded-full bg-[#ececec]" />
            <div className="h-10 w-10 rounded-full bg-[#ececec]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:gap-6 xl:grid-cols-3">
      {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function ProductsPageContent() {
  const searchParams = useSearchParams();
  const brandFromUrl = searchParams.get('brand')?.trim() ?? '';
  const bestSellingFromUrl = searchParams.get('best_selling')?.trim() ?? '';
  const flavorFromUrl = searchParams.get('flavor')?.trim() ?? '';
  const strengthFromUrl = searchParams.get('strength')?.trim() ?? '';

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStrength, setSelectedStrength] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(200);

  const [appliedBrand, setAppliedBrand] = useState('');
  const [appliedStrength, setAppliedStrength] = useState('');
  const [appliedFlavor, setAppliedFlavor] = useState('');
  const [appliedSort, setAppliedSort] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setSelectedBrand('');
    setAppliedBrand('');
    setSelectedStrength('');
    setAppliedStrength('');
    setSelectedFlavor('');
    setAppliedFlavor('');
    setSelectedSort('');
    setAppliedSort('');

    if (brandFromUrl) {
      setSelectedBrand(brandFromUrl);
      setAppliedBrand(brandFromUrl);
    }

    if (strengthFromUrl) {
      setSelectedStrength(strengthFromUrl);
      setAppliedStrength(strengthFromUrl);
    }

    if (flavorFromUrl) {
      setSelectedFlavor(flavorFromUrl);
      setAppliedFlavor(flavorFromUrl);
    }

    if (bestSellingFromUrl === '1') {
      setSelectedSort('bestSelling');
      setAppliedSort('bestSelling');
    }

    setCurrentPage(1);
  }, [brandFromUrl, strengthFromUrl, flavorFromUrl, bestSellingFromUrl]);

  const priceSort =
    appliedSort === 'lPrice'
      ? 'asc'
      : appliedSort === 'hPrice'
        ? 'desc'
        : undefined;

  const { data, isLoading, isFetching, isError } = useGetProductsQuery({
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    is_active: true,
    flavor_slug: appliedFlavor || undefined,
    brand_slug: appliedBrand || undefined,
    strength_slug: appliedStrength || undefined,
    isBestSeling: appliedSort === 'bestSelling' ? 1 : undefined,
    price_sort: priceSort,
  });

  const filteredProducts: Product[] = Array.isArray(data)
    ? data
    : data?.data || [];

  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalProducts = data?.pagination?.total ?? 0;

  const applyFilters = () => {
    setAppliedBrand(selectedBrand);
    setAppliedStrength(selectedStrength);
    setAppliedFlavor(selectedFlavor);
    setAppliedSort(selectedSort);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedBrand('');
    setSelectedStrength('');
    setSelectedFlavor('');
    setSelectedSort('');
    setMinPrice(0);
    setMaxPrice(200);

    setAppliedBrand('');
    setAppliedStrength('');
    setAppliedFlavor('');
    setAppliedSort('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showingFrom =
    totalProducts === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;

  const showingTo = Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts);

  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-10 md:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[270px_minmax(0,1fr)] lg:items-start lg:gap-12">
          <ProductsFilters
            selectedBrand={selectedBrand}
            selectedStrength={selectedStrength}
            selectedFlavor={selectedFlavor}
            sortBy={selectedSort}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onBrandChange={setSelectedBrand}
            onStrengthChange={setSelectedStrength}
            onFlavorChange={setSelectedFlavor}
            onSortChange={setSelectedSort}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onApply={applyFilters}
            onClear={clearFilters}
          />

          <section>
            <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
              <h1 className="text-4xl font-bold uppercase tracking-[-0.03em] md:text-6xl">
                Products
              </h1>

              <p className="text-sm font-medium text-black/70 md:text-base">
                Showing {showingFrom}-{showingTo} of {totalProducts} Products
              </p>
            </div>

            {(isLoading || isFetching) ? (
              <ProductsGridSkeleton />
            ) : isError ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-600">
                Failed to load products.
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-[28px] border border-black/10 p-10 text-center">
                <h2 className="text-2xl font-semibold text-black">
                  No products found
                </h2>
                <p className="mt-3 text-black/60">
                  Try changing your filters.
                </p>
              </div>
            ) : (
              <div className="space-y-8 md:space-y-10">
                <ProductsGrid products={filteredProducts} />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}