'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FiUser, FiShoppingCart, FiSearch, FiX } from 'react-icons/fi';
import { COLORS } from '@/constants/colors';
import { useAppSelector } from '@/store/hook';
import { useSearchSiteQuery } from '@/features/search/search';
import { useDebounce } from '@/lib/useDebounce';

type SearchProductItem = {
  id: string;
  name: string;
  slug: string;
  price: string;
  image_url: string | null;
};

type SearchBundleItem = {
  id: string;
  name: string;
  slug: string;
  price: string;
  image_url: string | null;
};

type SearchSpecialOfferItem = {
  id: string;
  name: string;
  slug: string;
  price: string;
  image_url: string | null;
};

type SearchApiResponse = {
  products: SearchProductItem[];
  bundles: SearchBundleItem[];
  special_offers: SearchSpecialOfferItem[];
};

type SearchItemType = 'product' | 'bundle' | 'special_offer';

type UnifiedSearchItem = {
  id: string;
  name: string;
  slug: string;
  price: string;
  image_url: string | null;
  type: SearchItemType;
  href: string;
};

function getSearchItemHref(type: SearchItemType, slug: string): string {
  switch (type) {
    case 'product':
      return `/products/${slug}`;
    case 'bundle':
      return `/bundles/${slug}`;
    case 'special_offer':
      return `/specialOffers/${slug}`;
    default:
      return '/';
  }
}

function getSearchItemTypeLabel(type: SearchItemType): string {
  switch (type) {
    case 'product':
      return 'Product';
    case 'bundle':
      return 'Bundle';
    case 'special_offer':
      return 'Special Offer';
    default:
      return '';
  }
}

function isVideoUrl(url: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function normalizeSearchResults(data?: SearchApiResponse): UnifiedSearchItem[] {
  if (!data) return [];

  const products: UnifiedSearchItem[] = (data.products ?? []).map((item) => ({
    ...item,
    type: 'product',
    href: getSearchItemHref('product', item.slug),
  }));

  const bundles: UnifiedSearchItem[] = (data.bundles ?? []).map((item) => ({
    ...item,
    type: 'bundle',
    href: getSearchItemHref('bundle', item.slug),
  }));

  const specialOffers: UnifiedSearchItem[] = (data.special_offers ?? []).map(
    (item) => ({
      ...item,
      type: 'special_offer',
      href: getSearchItemHref('special_offer', item.slug),
    })
  );

  return [...products, ...bundles, ...specialOffers];
}

export default function MobileBottomNav() {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    const pathname = usePathname() ?? '';
  const router = useRouter();
  const searchParams = useSearchParams();

  const isDashboardOrAdminRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  const cartItems = useAppSelector((state) => state.cart.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '');

  const debouncedSearch = useDebounce(searchValue.trim(), 350);

  const {
    data: searchData,
    isFetching: isSearchLoading,
    isError: isSearchError,
  } = useSearchSiteQuery(
    { q: debouncedSearch, limit: 20 },
    {
      skip: !isSearchOpen || debouncedSearch.length < 1,
    }
  );

  const searchResults = useMemo(
    () => normalizeSearchResults(searchData as SearchApiResponse | undefined),
    [searchData]
  );

  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  useEffect(() => {
    setSearchValue(searchParams.get('q') ?? '');
  }, [searchParams]);

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      setIsSearchOpen(false);
      return;
    }

    router.push(`/search?q=${encodeURIComponent(value)}`);
    setIsSearchOpen(false);
  };

  const handleResultClick = (href: string) => {
    router.push(href);
    setIsSearchOpen(false);
  };

  const isAccountActive =
    pathname.startsWith('/account') || pathname.startsWith('/create-account');
  const isCartActive = pathname.startsWith('/cart');

  if (isDashboardOrAdminRoute) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-4 z-[70] px-4 md:hidden">
        <div
          className="mx-auto flex h-[68px] max-w-[360px] items-center justify-between rounded-full border px-6 shadow-[0_10px_30px_rgba(0,0,0,0.14)]"
          style={{
            backgroundColor: COLORS.white,
            borderColor: 'rgba(17,17,17,0.08)',
          }}
        >
          <Link
            href="/account"
            className="flex min-w-[72px] flex-col items-center justify-center gap-1"
            aria-label="Account"
          >
            <FiUser
              size={20}
              color={isAccountActive ? COLORS.black : 'rgba(17,17,17,0.55)'}
            />
            <span
              className="text-[11px] font-medium"
              style={{
                color: isAccountActive ? COLORS.black : 'rgba(17,17,17,0.55)',
              }}
            >
              Account
            </span>
          </Link>

          <button
            type="button"
            onClick={handleSearchOpen}
            className="flex min-w-[72px] flex-col items-center justify-center gap-1"
            aria-label="Search"
          >
            <FiSearch
              size={20}
              color={isSearchOpen ? COLORS.black : 'rgba(17,17,17,0.55)'}
            />
            <span
              className="text-[11px] font-medium"
              style={{
                color: isSearchOpen ? COLORS.black : 'rgba(17,17,17,0.55)',
              }}
            >
              Search
            </span>
          </button>

          <Link
            href="/cart"
            className="relative flex min-w-[72px] flex-col items-center justify-center gap-1"
            aria-label="Cart"
          >
            <div className="relative">
              <FiShoppingCart
                size={20}
                color={isCartActive ? COLORS.black : 'rgba(17,17,17,0.55)'}
              />

              {cartCount > 0 && (
                <span
                  className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: COLORS.black }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>

            <span
              className="text-[11px] font-medium"
              style={{
                color: isCartActive ? COLORS.black : 'rgba(17,17,17,0.55)',
              }}
            >
              Cart
            </span>
          </Link>
        </div>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[120] bg-white md:hidden">
          <div className="flex h-full flex-col">
            <div className="border-b border-black/10 px-4 pb-4 pt-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[22px] font-semibold uppercase text-black">
                  Search
                </h2>

                <button
                  type="button"
                  onClick={handleSearchClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10"
                  aria-label="Close search"
                >
                  <FiX size={20} color={COLORS.black} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products, bundles, offers..."
                  autoFocus
                  className="h-12 w-full rounded-full border border-black/10 px-4 text-[14px] text-black outline-none placeholder:text-black/40"
                />

                <button
                  type="submit"
                  className="flex h-12 shrink-0 items-center justify-center rounded-full px-5 text-[14px] font-medium text-white"
                  style={{ backgroundColor: COLORS.black }}
                >
                  Go
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              {!debouncedSearch ? (
                <p className="text-[14px] text-black/50">
                  Search through products, bundles, and offers.
                </p>
              ) : isSearchLoading ? (
                <p className="text-[14px] text-black/50">Searching...</p>
              ) : isSearchError ? (
                <p className="text-[14px] text-red-600">
                  Failed to load search results.
                </p>
              ) : searchResults.length === 0 ? (
                <p className="text-[14px] text-black/50">No results found.</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((item) => {
                    const showImage =
                      item.image_url && !isVideoUrl(item.image_url);

                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => handleResultClick(item.href)}
                        className="flex w-full items-center gap-3 rounded-[18px] border border-black/10 bg-white px-3 py-3 text-left transition hover:bg-black/[0.03]"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] border border-black/10 bg-black/5">
                          {showImage ? (
                            <img
                              src={item.image_url!}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-black/45">
                              No Img
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-black">
                            {item.name}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-black px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.03em] text-white">
                              {getSearchItemTypeLabel(item.type)}
                            </span>

                            <span className="text-[12px] text-black/55">
                              AED {item.price}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
                      setIsSearchOpen(false);
                    }}
                    className="mt-2 w-full rounded-full border border-black/15 px-4 py-3 text-[14px] font-medium text-black transition hover:bg-black/5"
                  >
                    View all results
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}