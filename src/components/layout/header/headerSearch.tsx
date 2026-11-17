'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/constants/colors';
import {
  getSearchItemTypeLabel,
  isVideoUrl,
  normalizeSearchResults,
} from '@/lib/search';
import { useDebounce } from '@/lib/useDebounce';
import { useSearchSiteQuery } from '@/features/search/search';

export default function HeaderSearch() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search.trim(), 350);

  const {
    data: desktopSearchData,
    isFetching: isDesktopSearchLoading,
    isError: isDesktopSearchError,
  } = useSearchSiteQuery(
    { q: debouncedSearch, limit: 20 },
    {
      skip: debouncedSearch.length < 1 || !searchOpen,
    }
  );

  const desktopResults = useMemo(
    () => normalizeSearchResults(desktopSearchData),
    [desktopSearchData]
  );

  const handleSearchSubmit = () => {
    const query = search.trim();
    if (!query) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={searchRef} className="relative hidden items-center md:flex">
      {searchOpen && (
        <>
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit();
              if (e.key === 'Escape') {
                setSearch('');
                setSearchOpen(false);
              }
            }}
            placeholder="Search products, bundles, offers..."
            className="h-9 w-[200px] rounded-full border border-black/20 bg-white pl-4 pr-16 text-sm text-black outline-none transition-all duration-300 lg:w-[260px]"
          />

          <div className="absolute left-0 top-[calc(100%+10px)] z-[80] w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
            {isDesktopSearchLoading ? (
              <div className="px-4 py-4 text-sm text-black/60">Searching...</div>
            ) : isDesktopSearchError ? (
              <div className="px-4 py-4 text-sm text-red-600">
                Failed to load search results.
              </div>
            ) : debouncedSearch && desktopResults.length === 0 ? (
              <div className="px-4 py-4 text-sm text-black/60">
                No results found.
              </div>
            ) : (
              <ul className="max-h-[420px] overflow-y-auto">
                {desktopResults.slice(0, 8).map((item) => {
                  const showImage =
                    item.image_url && !isVideoUrl(item.image_url);

                  return (
                    <li
                      key={`${item.type}-${item.id}`}
                      className="border-b border-black/5 last:border-b-0"
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearch('');
                        }}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-black/[0.03]"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-black/5">
                          {showImage ? (
                            <img
                              src={item.image_url!}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[11px] text-black/45">
                              No Img
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-black">
                            {item.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex rounded-full bg-black px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.04em] text-white">
                              {getSearchItemTypeLabel(item.type)}
                            </span>
                            <span className="text-xs text-black/55">
                              AED {item.price}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}

                {desktopResults.length > 8 && (
                  <li className="px-4 py-3">
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="text-sm font-semibold text-black underline underline-offset-4"
                    >
                      View all results
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => {
          if (!searchOpen) {
            setSearchOpen(true);
            return;
          }

          if (search.trim()) {
            handleSearchSubmit();
            return;
          }

          setSearchOpen(false);
        }}
        className={`flex h-9 w-9 items-center justify-center ${
          searchOpen ? 'absolute right-0' : ''
        }`}
        style={{ color: COLORS.black }}
      >
        <Search size={22} strokeWidth={2} />
      </button>

      {searchOpen && (
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setSearchOpen(false);
          }}
          className="absolute right-9 flex h-9 w-9 items-center justify-center"
          style={{ color: COLORS.black }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}