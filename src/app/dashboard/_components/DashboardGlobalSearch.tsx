'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useGetDashboardSearchQuery } from '@/features/dashboard-search/dashboardSearchApi';

const DEBOUNCE_MS = 320;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
      {children}
    </p>
  );
}

type HitRowProps = {
  title: string;
  subtitle?: string;
  onPick: () => void;
};

function HitRow({ title, subtitle, onPick }: HitRowProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#f3f4f6]"
    >
      <span className="font-medium text-[#111111]">{title}</span>
      {subtitle ? <span className="text-xs text-[#6b7280]">{subtitle}</span> : null}
    </button>
  );
}

export default function DashboardGlobalSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(raw.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [raw]);

  const canQuery = debounced.length > 0;
  const { data, isFetching, isError } = useGetDashboardSearchQuery(
    { q: debounced, limit: 10 },
    { skip: !canQuery },
  );

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = rootRef.current;
      if (!el || !(e.target instanceof Node)) return;
      if (!el.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const navigateTo = (path: string) => {
    setOpen(false);
    setRaw('');
    setDebounced('');
    router.push(path);
  };

  const totalHits = data
    ? data.products.length +
      data.flavors.length +
      data.brands.length +
      data.strength_levels.length +
      data.offers.length +
      data.special_offers.length +
      data.users.length +
      data.orders.length
    : 0;

  const showDropdown = open && canQuery;

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <Search
        size={16}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]"
      />
      <input
        type="search"
        value={raw}
        autoComplete="off"
        aria-expanded={showDropdown}
        aria-controls="dashboard-global-search-results"
        placeholder="Search catalog, customers, orders…"
        onChange={(e) => {
          setRaw(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        className="h-11 w-full rounded-full border border-[#e5e5e5] bg-white pl-11 pr-4 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:border-[#d1d5db] focus:outline-none"
      />

      {showDropdown ? (
        <div
          id="dashboard-global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-lg"
        >
          <div className="max-h-[min(70vh,520px)] overflow-y-auto py-2">
          {isFetching ? (
            <p className="px-4 py-3 text-sm text-[#6b7280]">Searching…</p>
          ) : null}
          {!isFetching && isError ? (
            <p className="px-4 py-3 text-sm text-red-600">Search failed. Try again.</p>
          ) : null}
          {!isFetching && !isError && canQuery && totalHits === 0 ? (
            <p className="px-4 py-3 text-sm text-[#6b7280]">No matches.</p>
          ) : null}

          {!isFetching && !isError && data && totalHits > 0 ? (
            <div className="space-y-1">
              {data.products.length > 0 ? (
                <div>
                  <SectionTitle>Products</SectionTitle>
                  {data.products.map((p) => (
                    <HitRow
                      key={`p-${p.id}`}
                      title={p.name}
                      subtitle={[p.brand_name, p.flavor_name, p.strength_name]
                        .filter(Boolean)
                        .join(' · ')}
                      onPick={() =>
                        navigateTo(`/dashboard/products?highlight=${encodeURIComponent(p.id)}`)
                      }
                    />
                  ))}
                </div>
              ) : null}

              {data.flavors.length > 0 ? (
                <div>
                  <SectionTitle>Flavors</SectionTitle>
                  {data.flavors.map((f) => (
                    <HitRow
                      key={`f-${f.id}`}
                      title={f.name}
                      subtitle={f.slug}
                      onPick={() =>
                        navigateTo(`/dashboard/flavors?highlight=${encodeURIComponent(f.id)}`)
                      }
                    />
                  ))}
                </div>
              ) : null}

              {data.brands.length > 0 ? (
                <div>
                  <SectionTitle>Brands</SectionTitle>
                  {data.brands.map((b) => (
                    <HitRow
                      key={`b-${b.id}`}
                      title={b.name}
                      subtitle={b.slug}
                      onPick={() =>
                        navigateTo(`/dashboard/brands?highlight=${encodeURIComponent(b.id)}`)
                      }
                    />
                  ))}
                </div>
              ) : null}

              {data.strength_levels.length > 0 ? (
                <div>
                  <SectionTitle>Strength levels</SectionTitle>
                  {data.strength_levels.map((s) => (
                    <HitRow
                      key={`s-${s.id}`}
                      title={s.name}
                      subtitle={s.slug}
                      onPick={() =>
                        navigateTo(
                          `/dashboard/strength-levels?highlight=${encodeURIComponent(s.id)}`,
                        )
                      }
                    />
                  ))}
                </div>
              ) : null}

              {data.offers.length > 0 ? (
                <div>
                  <SectionTitle>Bundles</SectionTitle>
                  {data.offers.map((o) => (
                    <HitRow
                      key={`o-${o.id}`}
                      title={o.name}
                      subtitle={o.slug}
                      onPick={() =>
                        navigateTo(`/dashboard/bundles?highlight=${encodeURIComponent(o.id)}`)
                      }
                    />
                  ))}
                </div>
              ) : null}

              {data.special_offers.length > 0 ? (
                <div>
                  <SectionTitle>Special offers</SectionTitle>
                  {data.special_offers.map((so) => (
                    <HitRow
                      key={`so-${so.id}`}
                      title={so.name}
                      subtitle={so.slug}
                      onPick={() =>
                        navigateTo(
                          `/dashboard/special-offers?highlight=${encodeURIComponent(so.id)}`,
                        )
                      }
                    />
                  ))}
                </div>
              ) : null}

              {data.users.length > 0 ? (
                <div>
                  <SectionTitle>Customers</SectionTitle>
                  {data.users.map((u) => (
                    <HitRow
                      key={`u-${u.id}`}
                      title={u.client_name?.trim() || [u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                      subtitle={[u.email, u.phone].filter(Boolean).join(' · ') || undefined}
                      onPick={() =>
                        navigateTo(`/dashboard/customers?highlight=${encodeURIComponent(u.id)}`)
                      }
                    />
                  ))}
                </div>
              ) : null}

              {data.orders.length > 0 ? (
                <div>
                  <SectionTitle>Orders</SectionTitle>
                  {data.orders.map((o) => (
                    <HitRow
                      key={`ord-${o.id}`}
                      title={o.order_number}
                      subtitle={
                        [
                          o.status ? o.status.replace(/_/g, ' ') : null,
                          o.client_name?.trim(),
                          o.email,
                        ]
                          .filter(Boolean)
                          .join(' · ') || undefined
                      }
                      onPick={() =>
                        navigateTo(`/dashboard/orders?highlight=${encodeURIComponent(o.id)}`)
                      }
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
