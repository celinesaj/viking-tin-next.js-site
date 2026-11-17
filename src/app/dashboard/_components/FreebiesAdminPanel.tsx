'use client';

import { Check, ChevronDown, Trash2, UserPlus } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GrantFreebieEligibilityDrawer from '@/app/dashboard/_components/GrantFreebieEligibilityDrawer';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import ProductFormSwitch from '@/app/dashboard/_components/ProductFormSwitch';
import {
  type AdminFreebieEligibilityRow,
  useAddAdminFreebieProductMutation,
  useDeleteAdminFreebieProductMutation,
  useGetAdminFreebieConfigQuery,
  useGetAdminFreebieEligibilityQuery,
  useGetAdminFreebieProductsQuery,
  useGrantAdminFreebieEligibilityMutation,
  usePatchAdminFreebieConfigMutation,
  useRevokeAdminFreebieEligibilityMutation,
} from '@/features/freebie/freebiesAdminApi';
import { useGetProductsQuery } from '@/features/products/productsApi';
import { useGetStorefrontUsersAdminQuery } from '@/features/users/storefrontUsersAdminApi';
import type { Product } from '@/types/products';
import type { StorefrontUserAdmin } from '@/types/storefront-users-admin';
import { formatDashboardMoney } from '@/lib/formatDashboardMoney';

/** Page size for the eligibility overview table (storefront users). */
const STOREFRONT_TABLE_PAGE_SIZE = 15;
/** Large snapshot of GET /freebies/admin/eligibility to resolve Yes/No per user on the current table page. */
const ELIGIBILITY_INDEX_LIMIT = 1000;

function displayUserName(u: StorefrontUserAdmin): string | null {
  const n = u.name?.trim();
  if (!n) return null;
  if (u.email?.trim() && n.toLowerCase() === u.email.trim().toLowerCase()) return null;
  return n;
}

function extractServerMessage(error: unknown, fallbackMessage: string) {
  if (!error || typeof error !== 'object') return fallbackMessage;
  if ('data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message)) {
        const list = message.filter((item): item is string => typeof item === 'string');
        if (list.length > 0) return list.join(', ');
      }
    }
  }
  return fallbackMessage;
}

function formatMoney(value: string | number): string {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return formatDashboardMoney(n);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ProductThumb({ product }: { product: Product }) {
  const cls =
    'h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f9fafb] object-cover';
  if (product.coverImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- dashboard admin thumb
      <img src={product.coverImageUrl} alt="" className={cls} />
    );
  }
  if (product.coverGifUrl) {
    const url = product.coverGifUrl;
    const looksLikeVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
    if (looksLikeVideo) {
      return (
        <video
          src={url}
          className={cls}
          muted
          playsInline
          loop
          aria-hidden
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={cls} />
    );
  }
  return (
    <div
      className={`${cls} flex items-center justify-center text-[10px] font-medium text-[#9ca3af]`}
      aria-hidden
    >
      —
    </div>
  );
}

type CatalogProductPickerProps = {
  id?: string;
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  disabled?: boolean;
  placeholder: string;
};

function CatalogProductPicker({
  id: idProp,
  products,
  value,
  onChange,
  disabled = false,
  placeholder,
}: CatalogProductPickerProps) {
  const autoId = useId();
  const buttonId = idProp ?? `freebie-catalog-picker-${autoId}`;
  const listboxId = `${buttonId}-listbox`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const selected = useMemo(() => products.find((p) => p.id === value), [products, value]);

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 6;
    const maxH = 320;
    const edgePad = 12;
    const spaceBelow = window.innerHeight - rect.bottom - gap - edgePad;
    const spaceAbove = rect.top - gap - edgePad;
    const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow && spaceAbove >= 120;
    const zIndex = 10050;

    if (openUpward) {
      const maxHeight = Math.min(maxH, Math.max(160, spaceAbove));
      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        top: 'auto',
        bottom: window.innerHeight - rect.top + gap,
        maxHeight,
        zIndex,
      });
    } else {
      const maxHeight = Math.min(maxH, Math.max(160, spaceBelow));
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        bottom: 'auto',
        maxHeight,
        zIndex,
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const t = event.target;
      if (!(t instanceof Node)) return;
      if (rootRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const listContent = open ? (
    <ul
      ref={listRef}
      id={listboxId}
      role="listbox"
      aria-labelledby={buttonId}
      data-dashboard-select-menu=""
      style={menuStyle}
      className="overflow-y-auto overscroll-contain rounded-xl border border-[#e5e7eb] bg-white py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]"
    >
      {products.length === 0 ? (
        <li className="px-3 py-4 text-center text-sm text-[#9ca3af]">No products to show</li>
      ) : (
        products.map((p) => {
          const isSelected = value === p.id;
          return (
            <li
              key={p.id}
              role="option"
              aria-selected={isSelected}
              className={`cursor-pointer px-3 py-2 transition-colors hover:bg-[#f3f4f6] ${
                isSelected ? 'bg-[#eef2f7]' : ''
              }`}
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
            >
              <div className="flex items-center gap-3">
                <ProductThumb product={p} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[#111827]">{p.name}</div>
                  <div className="truncate text-xs text-[#9ca3af]">#{p.id}</div>
                </div>
              </div>
            </li>
          );
        })
      )}
    </ul>
  ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex h-[52px] w-full items-center justify-between gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 text-left text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-[#111827]/15 ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[#c5cdd8]'
        } ${open ? 'ring-2 ring-[#111827]/15' : ''}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {selected ? (
            <>
              <ProductThumb product={selected} />
              <span className="min-w-0 truncate font-medium text-[#111827]">{selected.name}</span>
            </>
          ) : value ? (
            <>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[10px] font-medium text-[#9ca3af]"
                aria-hidden
              >
                ?
              </div>
              <span className="min-w-0 truncate text-[#6b7280]">Product #{value}</span>
            </>
          ) : (
            <>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb] text-[10px] font-medium text-[#9ca3af]"
                aria-hidden
              >
                —
              </div>
              <span className="truncate text-[#9ca3af]">{placeholder}</span>
            </>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#6b7280] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {typeof document !== 'undefined' && listContent
        ? createPortal(listContent, document.body)
        : null}
    </div>
  );
}

const panelClass =
  'rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]';
const labelClass = 'mb-1.5 block text-xs font-medium text-[#374151]';
const inputClass =
  'w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] outline-none ring-[#111827]/10 focus:border-[#111827]/25 focus:ring-2';
const btnPrimary =
  'inline-flex items-center justify-center rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-50';

export default function FreebiesAdminPanel() {
  const {
    data: freebieConfig,
    isLoading: loadingFreebieConfig,
    isError: freebieConfigError,
  } = useGetAdminFreebieConfigQuery();
  const [patchFreebieConfig, { isLoading: savingFreebieConfig }] =
    usePatchAdminFreebieConfigMutation();

  const { data: freebieRows = [], isLoading: loadingFreebies, isFetching, refetch } =
    useGetAdminFreebieProductsQuery();
  const { data: productsPage, isLoading: loadingProducts } = useGetProductsQuery({
    page: 1,
    limit: 200,
  });

  const [storefrontTablePage, setStorefrontTablePage] = useState(1);

  const {
    data: storefrontUsersTableResponse,
    isLoading: loadingUsersTable,
    isFetching: fetchingUsersTable,
  } = useGetStorefrontUsersAdminQuery({
    page: storefrontTablePage,
    limit: STOREFRONT_TABLE_PAGE_SIZE,
  });

  const [addFreebieProduct, { isLoading: adding }] = useAddAdminFreebieProductMutation();
  const [deleteFreebieProduct, { isLoading: deletingFreebieProduct }] =
    useDeleteAdminFreebieProductMutation();
  const [, { isLoading: granting }] = useGrantAdminFreebieEligibilityMutation();
  const [revokeEligibility, { isLoading: revoking }] = useRevokeAdminFreebieEligibilityMutation();

  const {
    data: eligibilityIndexResponse,
    isLoading: loadingEligibilityIndex,
    isFetching: fetchingEligibilityIndex,
  } = useGetAdminFreebieEligibilityQuery({
    page: 1,
    limit: ELIGIBILITY_INDEX_LIMIT,
  });

  const freebieProductIds = useMemo(
    () => new Set(freebieRows.map((r) => r.productId)),
    [freebieRows],
  );

  const catalogOptions = useMemo(() => {
    const rows = productsPage?.data ?? [];
    return rows
      .filter((p) => p.isActive && !freebieProductIds.has(p.id))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [productsPage?.data, freebieProductIds]);

  const eligibilityByUserId = useMemo(() => {
    const m = new Map<string, AdminFreebieEligibilityRow>();
    for (const row of eligibilityIndexResponse?.data ?? []) {
      if (row.userId) {
        m.set(row.userId, row);
      }
    }
    return m;
  }, [eligibilityIndexResponse?.data]);

  const storefrontTableUsers = storefrontUsersTableResponse?.data ?? [];
  const usersTablePagination = storefrontUsersTableResponse?.pagination;

  const sortedStorefrontTableUsers = useMemo(
    () =>
      [...storefrontTableUsers].sort((a, b) =>
        (a.email || '').localeCompare(b.email || '', undefined, {
          sensitivity: 'base',
        }),
      ),
    [storefrontTableUsers],
  );

  const eligibilityTotalLoaded = eligibilityIndexResponse?.pagination?.total ?? 0;
  const eligibilitySnapshotIncomplete =
    eligibilityTotalLoaded > ELIGIBILITY_INDEX_LIMIT;

  const [selectedProductId, setSelectedProductId] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [eligibilityActionUserId, setEligibilityActionUserId] = useState<string | null>(
    null,
  );
  const [grantDrawerUser, setGrantDrawerUser] = useState<StorefrontUserAdmin | null>(null);
  const [removeFreebieTarget, setRemoveFreebieTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [maxFreeItemsDraft, setMaxFreeItemsDraft] = useState(0);
  const [freebieProgramActiveDraft, setFreebieProgramActiveDraft] = useState(true);

  useEffect(() => {
    if (!freebieConfig) return;
    setMaxFreeItemsDraft(freebieConfig.maxFreeItems);
    setFreebieProgramActiveDraft(freebieConfig.isActive);
  }, [freebieConfig]);

  async function handleSaveFreebieConfig(e: React.FormEvent) {
    e.preventDefault();
    const max = Math.max(0, Math.floor(Number(maxFreeItemsDraft)) || 0);
    try {
      await patchFreebieConfig({
        max_free_items: max,
        is_active: freebieProgramActiveDraft,
      }).unwrap();
      toast.success('Freebie checkout settings saved.');
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not save freebie settings.'));
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    const pid = selectedProductId.trim();
    if (!pid) {
      toast.error('Choose a catalog product.');
      return;
    }
    try {
      await addFreebieProduct({
        product_id: pid,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      }).unwrap();
      toast.success('Product added to the freebie list.');
      setSelectedProductId('');
      setSortOrder(0);
      refetch();
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not add freebie product.'));
    }
  }

  function openRemoveFreebieModal(freebieRowId: string, productName: string) {
    setRemoveFreebieTarget({ id: freebieRowId, name: productName });
  }

  async function confirmRemoveFreebie() {
    if (!removeFreebieTarget) return;
    const { id, name } = removeFreebieTarget;
    try {
      await deleteFreebieProduct({ id }).unwrap();
      toast.success(`"${name}" removed from the freebie list.`);
      setRemoveFreebieTarget(null);
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not remove freebie product.'));
    }
  }

  async function handleTableRevoke(userId: string) {
    const uid = userId.trim();
    if (!uid) return;
    setEligibilityActionUserId(uid);
    try {
      await revokeEligibility({ userId: uid }).unwrap();
      toast.success('Eligibility removed.');
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not revoke eligibility.'));
    } finally {
      setEligibilityActionUserId(null);
    }
  }

  const usersTableTotalPages = Math.max(1, usersTablePagination?.totalPages ?? 1);

  useEffect(() => {
    if (storefrontTablePage > usersTableTotalPages && usersTableTotalPages >= 1) {
      setStorefrontTablePage(usersTableTotalPages);
    }
  }, [storefrontTablePage, usersTableTotalPages]);

  const tableBusy = loadingFreebies || isFetching;

  return (
    <div className="min-w-0 space-y-6">
      <ToastContainer position="top-right" autoClose={3200} />

      <section className={panelClass}>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#111827]">Checkout configuration</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Primary freebie config row (
            <code className="rounded bg-[#f3f4f6] px-1 py-0.5 text-xs">GET/PATCH /freebies/admin/config</code>
            ).{' '}
            <span className="text-[#6b7280]">
              Max free items caps total free units at checkout for eligible users only, not how many SKUs appear in
              the catalog list.
            </span>
          </p>
        </div>

        {loadingFreebieConfig ? (
          <div className="flex justify-center py-12">
            <TableDotsLoader />
          </div>
        ) : freebieConfigError ? (
          <p className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-800">
            Could not load freebie configuration.
          </p>
        ) : (
          <form
            onSubmit={handleSaveFreebieConfig}
            className="flex flex-col gap-5 rounded-xl border border-[#eef2f7] bg-[#fafafa]/50 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="sm:w-44">
              <label htmlFor="freebie-max-items" className={labelClass}>
                Max free items per checkout
              </label>
              <input
                id="freebie-max-items"
                type="number"
                min={0}
                step={1}
                className={inputClass}
                value={maxFreeItemsDraft}
                onChange={(ev) => setMaxFreeItemsDraft(Number(ev.target.value))}
                disabled={savingFreebieConfig}
              />
            </div>
            <div className="flex items-center rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 sm:min-h-[46px] sm:flex-1 sm:max-w-md">
              <ProductFormSwitch
                label="Freebie program active"
                checked={freebieProgramActiveDraft}
                onCheckedChange={setFreebieProgramActiveDraft}
                variant="emerald"
                disabled={savingFreebieConfig}
              />
            </div>
            <div className="flex flex-col gap-2 sm:ml-auto sm:items-end">
              {freebieConfig?.updatedAt ? (
                <p className="text-xs text-[#9ca3af]">
                  Config last updated {formatDateTime(freebieConfig.updatedAt)}
                </p>
              ) : null}
              <button type="submit" className={btnPrimary} disabled={savingFreebieConfig}>
                {savingFreebieConfig ? 'Saving…' : 'Save settings'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className={panelClass}>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">Freebie catalog</h2>
            <p className="text-sm text-[#6b7280]">
              SKUs shoppers may pick as free units (GET/POST{' '}
              <code className="rounded bg-[#f3f4f6] px-1 py-0.5 text-xs">/freebies/admin/products</code>
              ).
            </p>
          </div>
        </div>

        {tableBusy ? (
          <div className="flex justify-center py-16">
            <TableDotsLoader />
          </div>
        ) : freebieRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafafa] py-10 text-center text-sm text-[#6b7280]">
            No freebie products yet. Add one below.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#eef2f7]">
            <table className="min-w-[640px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#eef2f7] bg-[#f9fafb] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Sort</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {freebieRows.map((row) => (
                  <tr key={row.id} className="bg-white hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb product={row.product} />
                        <div className="min-w-0">
                          <div className="font-medium text-[#111827]">{row.product.name}</div>
                          <div className="text-xs text-[#9ca3af]">ID {row.product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-[#4b5563]" title={row.product.slug}>
                      {row.product.slug || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#111827]">
                      {formatMoney(row.product.price)}
                    </td>
                    <td className="px-4 py-3 text-[#4b5563]">{row.sortOrder}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#6b7280]">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        title="Remove from freebie list"
                        disabled={deletingFreebieProduct || tableBusy}
                        onClick={() =>
                          openRemoveFreebieModal(
                            row.id,
                            row.product.name || `Product #${row.product.id}`,
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={16} strokeWidth={2} aria-hidden />
                        <span className="sr-only">Remove from freebie list</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={handleAddProduct} className="mt-6 grid gap-4 border-t border-[#f3f4f6] pt-6 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <label htmlFor="freebie-product" className={labelClass}>
              Add catalog product
            </label>
            <CatalogProductPicker
              id="freebie-product"
              products={catalogOptions}
              value={selectedProductId}
              onChange={setSelectedProductId}
              disabled={loadingProducts || adding}
              placeholder={loadingProducts ? 'Loading products…' : 'Select an active product…'}
            />
            {!loadingProducts && catalogOptions.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">
                No eligible products in the first 200 catalog rows, or all are already listed.
              </p>
            )}
          </div>
          <div className="sm:w-28">
            <label htmlFor="freebie-sort" className={labelClass}>
              Sort order
            </label>
            <input
              id="freebie-sort"
              type="number"
              className={inputClass}
              value={sortOrder}
              onChange={(ev) => setSortOrder(Number(ev.target.value))}
              disabled={adding}
            />
          </div>
          <div>
            <button type="submit" className={`${btnPrimary} w-full sm:w-auto`} disabled={adding}>
              {adding ? 'Adding…' : 'Add to list'}
            </button>
          </div>
        </form>
      </section>

      <section className={panelClass}>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#111827]">User eligibility</h2>
          {eligibilitySnapshotIncomplete ? (
            <p className="mt-2 text-sm text-amber-800">
              Warning: more than {ELIGIBILITY_INDEX_LIMIT} eligible records exist ({eligibilityTotalLoaded}). Some rows may
              show No until the snapshot is expanded.
            </p>
          ) : null}
        </div>

        {loadingUsersTable || (loadingEligibilityIndex && !eligibilityIndexResponse) ? (
          <div className="mb-8 flex justify-center py-12">
            <TableDotsLoader />
          </div>
        ) : sortedStorefrontTableUsers.length === 0 ? (
          <p className="mb-8 rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafafa] py-10 text-center text-sm text-[#6b7280]">
            No storefront users on this page.
          </p>
        ) : (
          <div className="mb-8 space-y-3">
            <div className="overflow-x-auto rounded-xl border border-[#eef2f7]">
              <table className="min-w-[800px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#eef2f7] bg-[#f9fafb] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Eligible</th>
                    <th className="px-4 py-3">Claimed</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {sortedStorefrontTableUsers.map((u) => {
                    const eligRow = eligibilityByUserId.get(u.id);
                    const isEligible = !!eligRow?.isEligible;
                    const label =
                      u.email?.trim() ||
                      displayUserName(u) ||
                      u.name?.trim() ||
                      null;
                    const grantPendingForRow = granting && grantDrawerUser?.id === u.id;
                    const rowBusy = eligibilityActionUserId === u.id || grantPendingForRow;
                    const actionsLocked =
                      eligibilityActionUserId !== null ||
                      granting ||
                      revoking ||
                      grantDrawerUser !== null;
                    return (
                      <tr key={u.id} className="bg-white hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <div className="font-medium text-[#111827]">{label ?? `User ${u.id}`}</div>
                            <div className="truncate text-xs text-[#9ca3af]" title={u.id}>
                              ID {u.id}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {isEligible ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium text-[#6b7280]">
                              No
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#4b5563]">
                          {!isEligible ? (
                            <span className="text-[#9ca3af]">—</span>
                          ) : eligRow?.usedAt ? (
                            <span title={eligRow.usedAt}>{formatDateTime(eligRow.usedAt)}</span>
                          ) : (
                            <span className="text-[#9ca3af]">Not yet</span>
                          )}
                        </td>
                        <td className="max-w-[200px] px-4 py-3 text-[#4b5563]">
                          {!isEligible ? (
                            <span className="text-[#9ca3af]">—</span>
                          ) : (
                            <span className="line-clamp-2" title={eligRow?.reason ?? undefined}>
                              {eligRow?.reason?.trim() ? eligRow.reason : '—'}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#6b7280]">
                          {!isEligible ? (
                            <span className="text-[#9ca3af]">—</span>
                          ) : (
                            formatDateTime(eligRow?.updatedAt)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEligible ? (
                            <button
                              type="button"
                              title="Remove freebie eligibility"
                              disabled={actionsLocked || fetchingUsersTable}
                              onClick={() => handleTableRevoke(u.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={14} strokeWidth={2} aria-hidden />
                              {rowBusy ? '…' : 'Remove'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Grant freebie eligibility"
                              disabled={actionsLocked || fetchingUsersTable}
                              onClick={() => setGrantDrawerUser(u)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <UserPlus size={14} strokeWidth={2} aria-hidden />
                              {rowBusy ? '…' : 'Grant'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {usersTablePagination ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#6b7280]">
                  Users page {usersTablePagination.page} of {usersTablePagination.totalPages} ·{' '}
                  {usersTablePagination.total} account
                  {usersTablePagination.total === 1 ? '' : 's'}
                  {(fetchingUsersTable || fetchingEligibilityIndex) &&
                  eligibilityActionUserId === null &&
                  grantDrawerUser === null
                    ? ' · Updating…'
                    : ''}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={usersTablePagination.page <= 1 || fetchingUsersTable}
                    onClick={() => setStorefrontTablePage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      usersTablePagination.page >= usersTablePagination.totalPages ||
                      fetchingUsersTable
                    }
                    onClick={() =>
                      setStorefrontTablePage((p) =>
                        Math.min(usersTablePagination.totalPages, p + 1),
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {removeFreebieTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Remove from freebie list</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-[#111111]">
                &quot;{removeFreebieTarget.name}&quot;
              </span>{' '}
              from the freebie list? The catalog product will not be deleted.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRemoveFreebieTarget(null)}
                disabled={deletingFreebieProduct}
                className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveFreebie}
                disabled={deletingFreebieProduct}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
              >
                {deletingFreebieProduct ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <GrantFreebieEligibilityDrawer
        user={grantDrawerUser}
        onClose={() => setGrantDrawerUser(null)}
      />
    </div>
  );
}
