'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  User,
  X,
  Menu,
} from 'lucide-react';
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
  FaTiktok,
  FaYoutube,
  FaPinterestP,
  FaSnapchat,
  FaGlobe,
} from 'react-icons/fa6';

import { COLORS } from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { useGetBrandsQuery } from '@/features/brands/brandsApi';
import { useGetNavItemsQuery } from '@/features/nav/navApi';
import { useGetContactSocialLinksQuery } from '@/features/contact/contactApi';
import { useGetSitePagesQuery } from '@/features/site-pages/sitePagesApi';

import NavDropdown, { type DropdownItem } from './NavDropdown';
import { useAppSelector } from '@/store/hook';

import {
  getSearchItemTypeLabel,
  isVideoUrl,
  normalizeSearchResults,
} from '@/lib/search';
import { useDebounce } from '@/lib/useDebounce';
import { useSearchSiteQuery } from '@/features/search/search';
import type { ContactSocialLink } from '@/types/contact';

const staticMobileQuickLinks = [{ label: 'FAQ', href: '/faq' }];

const dynamicAllowedSlugs = [
  'privacy-policy',
  'terms-and-conditions',
  'shipping-policy',
  'refund-policy',
  'age-policy',
  'shipping',
];

function normalizeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function getSocialIcon(platform: string) {
  const key = normalizeValue(platform);

  switch (key) {
    case 'facebook':
      return FaFacebookF;
    case 'instagram':
      return FaInstagram;
    case 'linkedin':
    case 'linkedinin':
      return FaLinkedinIn;
    case 'twitter':
    case 'x':
    case 'xtwitter':
      return FaXTwitter;
    case 'tiktok':
      return FaTiktok;
    case 'youtube':
      return FaYoutube;
    case 'pinterest':
      return FaPinterestP;
    case 'snapchat':
      return FaSnapchat;
    default:
      return FaGlobe;
  }
}

function sortSocialLinks(items: ContactSocialLink[]) {
  return [...items];
}

export default function Header() {
  const router = useRouter();

  const { data: brands = [] } = useGetBrandsQuery();
  const { data: navItems = [] } = useGetNavItemsQuery();
  const { data: pages = [] } = useGetSitePagesQuery();
  const { data: socialLinks = [] } = useGetContactSocialLinksQuery({
    page: 1,
    limit: 20,
    is_active: true,
  });

  const cartItems = useAppSelector((state) => state.cart.items);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const displayCount = cartCount > 99 ? '99+' : cartCount;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileBrandsOpen, setMobileBrandsOpen] = useState(false);
  const [mobilePagesOpen, setMobilePagesOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search.trim(), 350);

  const activeNavItems = useMemo(() => {
    return [...navItems]
      .filter((item) => item.is_active)
      .sort((a, b) => a.position - b.position);
  }, [navItems]);

  const brandItems: DropdownItem[] = brands.map((brand) => ({
    id: brand.id,
    label: brand.name,
    href: `/store?brand=${brand.slug}`,
  }));

  const dynamicMobileLinks = pages
    // .filter((item) => dynamicAllowedSlugs.includes(item.slug))
    .map((item) => ({
      label: item.title,
      href: `/policies/${item.slug}`,
    }));

  const mobileQuickLinks = [...dynamicMobileLinks, ...staticMobileQuickLinks];
  const mobileSocialLinks = sortSocialLinks(socialLinks);

  const isBrandsItem = (label: string) => {
    const normalized = label.trim().toLowerCase();
    return normalized === 'our brand' || normalized === 'our brands';
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileBrandsOpen(false);
    setMobilePagesOpen(false);
  };

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

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full"
        style={{ backgroundColor: COLORS.pageBg }}
      >
        <div className="w-full px-4 md:px-6 lg:px-10">
          <div
            className="flex items-center justify-between rounded-full px-4 py-2 md:px-7 lg:px-10"
            style={{ backgroundColor: COLORS.pageBg }}
          >
            <Link href="/" className="shrink-0">
              <img
                src={IMAGES.logo.main}
                alt="Viking Tin"
                className="h-12 w-auto object-contain sm:h-14 md:h-16 lg:h-[100px]"
              />
            </Link>

            <nav className="hidden h-[44px] items-center gap-7 font-bold lg:flex">
              {activeNavItems.map((item) => {
                if (isBrandsItem(item.label)) {
                  return (
                    <div key={item.id} className="flex h-full items-center">
                      <NavDropdown
                        label={item.label}
                        items={brandItems}
                        viewAllHref="/store"
                        viewAllLabel="View All Brands"
                      />
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group relative inline-flex h-full items-center text-sm font-bold uppercase tracking-[0.02em] leading-none align-middle"
                    style={{ color: COLORS.textPrimary }}
                  >
                    <span className="transition-opacity duration-200 group-hover:opacity-75">
                      {item.label}
                    </span>

                    <span className="pointer-events-none absolute bottom-[-6px] left-0 h-[2px] w-full origin-left scale-x-0 bg-black transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <div
                ref={searchRef}
                className="relative hidden items-center md:flex"
              >
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
                      className="h-10 w-[240px] rounded-full border border-black/20 bg-white pl-4 pr-20 text-sm text-black outline-none transition-all duration-300 ease-in-out lg:w-[300px]"
                    />

                    <div className="absolute left-0 top-[calc(100%+10px)] z-[80] w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
                      {isDesktopSearchLoading ? (
                        <div className="px-4 py-4 text-sm text-black/60">
                          Searching...
                        </div>
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
                  className={`group relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-105 ${
                    searchOpen ? 'absolute right-0' : ''
                  }`}
                  style={{ color: COLORS.black }}
                >
                  <span className="absolute inset-0 rounded-full bg-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <Search
                    size={25}
                    strokeWidth={2}
                    className="relative z-[1] transition-transform duration-300 group-hover:scale-110"
                  />
                </button>

                {searchOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSearchOpen(false);
                    }}
                    className="absolute right-10 flex h-10 w-10 items-center justify-center"
                    style={{ color: COLORS.black }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <Link
                href="/cart"
                className="group relative hidden h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-105 md:inline-flex"
                style={{ color: COLORS.black }}
                aria-label="Cart"
              >
                <span className="absolute inset-0 rounded-full bg-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <ShoppingBag
                  size={25}
                  strokeWidth={2}
                  className="relative z-[1] transition-transform duration-300 group-hover:scale-110"
                />
                {mounted && cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 z-[2] flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-[6px] text-[11px] font-bold text-white">
                    {displayCount}
                  </span>
                )}
              </Link>

              <Link
                href="/account"
                className="group relative hidden h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-105 md:inline-flex"
                style={{ color: COLORS.black }}
                aria-label="Account"
              >
                <span className="absolute inset-0 rounded-full bg-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <User
                  size={25}
                  strokeWidth={2}
                  className="relative z-[1] transition-transform duration-300 group-hover:scale-110"
                />
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center lg:hidden"
                style={{ color: COLORS.black }}
                aria-label="Open menu"
              >
                <Menu size={26} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[140] transition-all duration-300 lg:hidden ${
          mobileMenuOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/45"
          onClick={handleCloseMobileMenu}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[88%] max-w-[360px] transform overflow-y-auto overscroll-contain transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ backgroundColor: COLORS.white }}
        >
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-5 py-5"
            style={{
              borderBottom: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.white,
            }}
          >
            <img
              src={IMAGES.logo.main}
              alt="Viking Tin"
              className="h-12 w-auto object-contain"
            />

            <button
              type="button"
              onClick={handleCloseMobileMenu}
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                color: COLORS.black,
              }}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="px-5 py-5">
            <ul className="space-y-2">
              {activeNavItems.map((item) => {
                if (isBrandsItem(item.label)) {
                  return (
                    <li
                      key={item.id}
                      className="overflow-hidden rounded-2xl"
                      style={{ backgroundColor: COLORS.background }}
                    >
                      <button
                        type="button"
                        onClick={() => setMobileBrandsOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between px-4 py-4 text-sm font-medium uppercase"
                      >
                        <span>{item.label}</span>
                        <span
                          className={`transition-transform duration-300 ${
                            mobileBrandsOpen ? 'rotate-180' : ''
                          }`}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </span>
                      </button>

                      {mobileBrandsOpen && (
                        <div className="flex flex-col gap-2 px-4 pb-4">
                          <Link
                            href="/store"
                            onClick={handleCloseMobileMenu}
                            className="block rounded-xl px-3 py-3 text-sm font-medium text-black transition hover:opacity-75"
                          >
                            View All Brands
                          </Link>

                          {brandItems.map((brand) => (
                            <Link
                              key={brand.id}
                              href={brand.href}
                              onClick={handleCloseMobileMenu}
                              className="block rounded-xl px-3 py-3 text-sm font-medium text-black transition hover:opacity-75"
                            >
                              {brand.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={handleCloseMobileMenu}
                      className="block rounded-2xl px-4 py-4 text-sm font-medium uppercase"
                      style={{
                        backgroundColor: COLORS.background,
                        color: COLORS.textPrimary,
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}

              <li
                className="overflow-hidden rounded-2xl"
                style={{ backgroundColor: COLORS.background }}
              >
                <button
                  type="button"
                  onClick={() => setMobilePagesOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-4 py-4 text-sm font-medium uppercase"
                  style={{ color: COLORS.textPrimary }}
                >
                  <span>Other Pages</span>
                  <span
                    className={`transition-transform duration-300 ${
                      mobilePagesOpen ? 'rotate-180' : ''
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>

                {mobilePagesOpen && (
                  <div className="flex flex-col gap-2 px-4 pb-4">
                    {mobileQuickLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleCloseMobileMenu}
                        className="block rounded-xl px-3 py-3 text-sm font-medium text-black transition hover:opacity-75"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            </ul>

            {mobileSocialLinks.length > 0 && (
              <div className="mt-6 rounded-2xl px-4 py-4">
                <p
                  className="mb-3 text-sm font-medium uppercase"
                  style={{ color: COLORS.textPrimary }}
                >
                  Follow Us
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {mobileSocialLinks.map((item) => {
                    const Icon = getSocialIcon(item.platform);

                    return (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.platform}
                        title={item.platform}
                        className="flex h-10 w-10 items-center justify-center rounded-full border transition-opacity hover:opacity-80"
                        style={{
                          color: COLORS.black,
                          borderColor: 'rgba(0,0,0,0.14)',
                          backgroundColor: COLORS.white,
                        }}
                      >
                        <Icon size={16} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
        </aside>
      </div>
    </>
  );
}