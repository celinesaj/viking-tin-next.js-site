'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  type GetProductsParams,
  buildProductMultipartBodyFromRow,
  useDeleteProductMutation,
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useUpdateProductMutation,
} from '@/features/products/productsApi';
import { findPaginatedPageForId } from '@/app/dashboard/_lib/findPaginatedPageForId';
import { useDashboardTableHighlight } from '@/app/dashboard/_hooks/useDashboardTableHighlight';
import { useGetFlavorsQuery } from '@/features/flavours/flavoursApi';
import DashboardSelect from '@/app/dashboard/_components/DashboardSelect';
import EditProductDrawer from '@/app/dashboard/_components/EditProductDrawer';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import type { Product } from '@/types/products';
import { extractServerMessage } from '@/lib/extractServerMessage';
import { formatDashboardPrice } from '@/lib/formatDashboardMoney';

function getVisiblePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    if (index > 0 && sorted[index] - sorted[index - 1] > 1) {
      out.push('ellipsis');
    }
    out.push(sorted[index]);
  }
  return out;
}

const PAGE_SIZE = 10;
const FLAVOR_FILTER_LIMIT = 200;

type ActiveFilter = 'all' | 'active' | 'inactive';
type BestFilter = 'all' | 'yes' | 'no';

function displayName(value: string | null | undefined) {
  if (value == null || String(value).trim() === '') return '—';
  return value;
}

function ProductThumb({ row }: { row: Product }) {
  const url = row.media?.[0]?.url;
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={row.name ? `${row.name} product` : 'Product'}
        className="h-10 w-10 shrink-0 rounded-lg border border-[#e5e7eb] bg-white object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#eef2f7] text-xs font-semibold uppercase text-[#4b5563]"
      title="No image"
    >
      {row.name?.[0] ?? 'P'}
    </div>
  );
}

type ProductActiveSwitchProps = {
  row: Product;
  disabled: boolean;
  busy: boolean;
  onToggle: (row: Product) => void;
};

function ProductActiveSwitch({ row, disabled, busy, onToggle }: ProductActiveSwitchProps) {
  const on = row.isActive;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-busy={busy}
      aria-label={on ? `Deactivate ${row.name}` : `Activate ${row.name}`}
      disabled={disabled || busy}
      onClick={() => onToggle(row)}
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
        on ? 'bg-emerald-500' : 'bg-[#d1d5db]'
      } ${disabled || busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
        aria-hidden
      />
    </button>
  );
}

type ProductBestSellingSwitchProps = {
  row: Product;
  disabled: boolean;
  busy: boolean;
  onToggle: (row: Product) => void;
};

function ProductBestSellingSwitch({
  row,
  disabled,
  busy,
  onToggle,
}: ProductBestSellingSwitchProps) {
  const on = row.isBestSelling ?? false;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-busy={busy}
      aria-label={
        on ? `Remove ${row.name} from best selling` : `Mark ${row.name} as best selling`
      }
      disabled={disabled || busy}
      onClick={() => onToggle(row)}
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
        on ? 'bg-amber-500' : 'bg-[#d1d5db]'
      } ${disabled || busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
        aria-hidden
      />
    </button>
  );
}

export default function ProductsTable() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [bestFilter, setBestFilter] = useState<BestFilter>('all');
  const [flavorSlug, setFlavorSlug] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [productPatchPending, setProductPatchPending] = useState<Record<string, boolean>>({});

  const { data: flavorsRes } = useGetFlavorsQuery({ page: 1, limit: FLAVOR_FILTER_LIMIT });
  const flavorOptions = useMemo(() => {
    const list = flavorsRes?.data ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [flavorsRes?.data]);

  const flavorFilterOptions = useMemo(
    () => [
      { value: '', label: 'All flavors' },
      ...flavorOptions.map((f) => ({ value: f.slug, label: f.name })),
    ],
    [flavorOptions],
  );

  const queryArgs = useMemo(() => {
    const base: GetProductsParams = {
      page,
      limit: PAGE_SIZE,
    };
    if (activeFilter === 'active') base.is_active = true;
    if (activeFilter === 'inactive') base.is_active = false;
    if (bestFilter === 'yes') base.isBestSeling = 1;
    if (bestFilter === 'no') base.isBestSeling = 0;
    if (flavorSlug.trim()) base.flavor_slug = flavorSlug.trim();
    return base;
  }, [page, activeFilter, bestFilter, flavorSlug]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: loadError,
  } = useGetProductsQuery(queryArgs);

  const [triggerPageLookup] = useLazyGetProductsQuery();

  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const pagination = data?.pagination;
  const rows = data?.data ?? [];
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);

  const rowOnPage = Boolean(highlightId && rows.some((r) => r.id === highlightId));
  const { highlightRef, rowHighlightClass } = useDashboardTableHighlight(rowOnPage);

  useEffect(() => {
    if (!highlightId) return;
    setActiveFilter('all');
    setBestFilter('all');
    setFlavorSlug('');
  }, [highlightId]);

  useEffect(() => {
    if (!highlightId) return;
    let cancelled = false;
    void (async () => {
      const found = await findPaginatedPageForId(highlightId, async (p) => {
        const res = await triggerPageLookup({ page: p, limit: PAGE_SIZE }).unwrap();
        return {
          data: res.data,
          totalPages: Math.max(1, res.pagination?.totalPages ?? 1),
        };
      });
      if (!cancelled && found != null) setPage(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [highlightId, triggerPageLookup]);

  const activeRowForMenu =
    actionsMenuId !== null ? rows.find((r) => r.id === actionsMenuId) ?? null : null;

  useEffect(() => {
    setPage(1);
  }, [activeFilter, bestFilter, flavorSlug]);

  useEffect(() => {
    if (!pagination) return;
    if (pagination.totalPages >= 1 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  useEffect(() => {
    if (!actionsMenuId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-product-actions-root]')) return;
      if (target.closest(ROW_ACTIONS_PORTAL_SELECTOR)) return;
      setActionsMenuId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActionsMenuId(null);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsMenuId]);

  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  const rangeLabel = useMemo(() => {
    if (!pagination || rows.length === 0) return { start: 0, end: 0 };
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = start + rows.length - 1;
    return { start, end };
  }, [pagination, rows.length]);

  const showLoader = isLoading || (isFetching && !data);

  function setProductRowPatchPending(id: string, pending: boolean) {
    setProductPatchPending((prev) => {
      if (pending) return { ...prev, [id]: true };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const handleToggleActive = async (row: Product) => {
    if (editProduct?.id === row.id) return;
    const next = !row.isActive;
    setProductRowPatchPending(row.id, true);
    try {
      await updateProduct({
        id: row.id,
        ...buildProductMultipartBodyFromRow(row, { is_active: next }),
      }).unwrap();
      toast.success(next ? `"${row.name}" is now active.` : `"${row.name}" is now inactive.`);
    } catch (error) {
      console.error('Failed to update product status', error);
      toast.error(extractServerMessage(error, 'Could not update status. Try again.'));
    } finally {
      setProductRowPatchPending(row.id, false);
    }
  };

  const handleToggleBestSelling = async (row: Product) => {
    if (editProduct?.id === row.id) return;
    const next = !(row.isBestSelling ?? false);
    setProductRowPatchPending(row.id, true);
    try {
      await updateProduct({
        id: row.id,
        ...buildProductMultipartBodyFromRow(row, { is_best_selling: next }),
      }).unwrap();
      toast.success(
        next ? `"${row.name}" is now best selling.` : `"${row.name}" removed from best selling.`,
      );
    } catch (error) {
      console.error('Failed to update best selling', error);
      toast.error(extractServerMessage(error, 'Could not update best selling. Try again.'));
    } finally {
      setProductRowPatchPending(row.id, false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setActionsMenuId(null);
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    try {
      await deleteProduct(id).unwrap();
      toast.success(`"${name}" deleted.`);
      setDeleteTarget(null);
      setEditProduct((current) => (current?.id === id ? null : current));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete product:', extractServerMessage(error, 'Unknown error'));
      }
      toast.error(extractServerMessage(error, 'Delete failed. Please try again.'));
    }
  };

  const handleEditFromMenu = (row: Product) => {
    setActionsMenuId(null);
    setEditProduct(row);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Products</h2>
            <p className="mt-1 text-xs text-[#9ca3af]">GET /products (paginated)</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by active status"
            >
              {(
                [
                  { key: 'all' as const, label: 'All' },
                  { key: 'active' as const, label: 'Active' },
                  { key: 'inactive' as const, label: 'Inactive' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  disabled={isFetching}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeFilter === key
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f8fafc]'
                  } disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter best selling"
            >
              {(
                [
                  { key: 'all' as const, label: 'All sales' },
                  { key: 'yes' as const, label: 'Best selling' },
                  { key: 'no' as const, label: 'Not best selling' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBestFilter(key)}
                  disabled={isFetching}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    bestFilter === key
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f8fafc]'
                  } disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex min-w-[200px] flex-col gap-1 sm:max-w-xs">
              <label
                htmlFor="products-filter-flavor"
                className="text-xs font-medium text-[#374151]"
              >
                Flavor
              </label>
              <DashboardSelect
                id="products-filter-flavor"
                value={flavorSlug}
                onChange={setFlavorSlug}
                options={flavorFilterOptions}
                placeholder="All flavors"
                disabled={isFetching}
                size="compact"
                aria-label="Filter products by flavor"
              />
            </div>
          </div>
        </div>

        {showLoader ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {extractServerMessage(loadError, 'Failed to load products.')}
          </p>
        ) : null}

        {!showLoader && !isError && total === 0 ? (
          <p className="text-sm text-[#6b7280]">No products found.</p>
        ) : null}

        {!showLoader && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">Brand</th>
                    <th className="px-3 py-3 font-medium">Flavor</th>
                    <th className="px-3 py-3 font-medium">Strength</th>
                    <th className="px-3 py-3 font-medium">Slug</th>
                    <th className="px-3 py-3 font-medium">Price</th>
                    <th className="px-3 py-3 font-medium">Stock</th>
                    <th className="px-3 py-3 font-medium">Active</th>
                    <th className="px-3 py-3 font-medium">Best selling</th>
                    <th className="w-12 px-3 py-3 text-right font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      ref={highlightId === row.id ? highlightRef : undefined}
                      className={`border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc] ${rowHighlightClass(row.id)}`}
                    >
                      <td className="px-3 py-4 font-medium text-[#111111]">
                        <div className="flex items-center gap-3">
                          <ProductThumb row={row} />
                          <span className="min-w-0 truncate">{row.name}</span>
                        </div>
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-4 text-[#6b7280]">
                        {displayName(row.brandName)}
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-4 text-[#6b7280]">
                        {displayName(row.flavorName)}
                      </td>
                      <td className="max-w-[100px] truncate px-3 py-4 text-[#6b7280]">
                        {displayName(row.strengthName)}
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-4 text-[#6b7280]">
                        {row.slug || '—'}
                      </td>
                      <td className="px-3 py-4 text-[#111111]">{formatDashboardPrice(row.price)}</td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.stock}</td>
                      <td className="px-3 py-4">
                        <ProductActiveSwitch
                          row={row}
                          busy={Boolean(productPatchPending[row.id])}
                          disabled={
                            isDeleting || Boolean(editProduct && editProduct.id === row.id)
                          }
                          onToggle={(r) => {
                            void handleToggleActive(r);
                          }}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <ProductBestSellingSwitch
                          row={row}
                          busy={Boolean(productPatchPending[row.id])}
                          disabled={
                            isDeleting || Boolean(editProduct && editProduct.id === row.id)
                          }
                          onToggle={(r) => {
                            void handleToggleBestSelling(r);
                          }}
                        />
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-product-actions-root>
                          <button
                            ref={actionsMenuId === row.id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuId === row.id}
                            aria-haspopup="menu"
                            aria-label={`Actions for ${row.name}`}
                            onClick={() =>
                              setActionsMenuId((current) => (current === row.id ? null : row.id))
                            }
                            disabled={isDeleting || Boolean(productPatchPending[row.id])}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8fafc] disabled:opacity-50"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {activeRowForMenu ? (
              <RowActionsFloatingMenu open triggerRef={actionsBtnRef}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleEditFromMenu(activeRowForMenu)}
                  disabled={
                    isDeleting || Boolean(productPatchPending[activeRowForMenu.id])
                  }
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleDelete(activeRowForMenu.id, activeRowForMenu.name)}
                  disabled={
                    isDeleting || Boolean(productPatchPending[activeRowForMenu.id])
                  }
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </RowActionsFloatingMenu>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#6b7280]">
                Showing {rangeLabel.start}–{rangeLabel.end} of {total}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <div className="flex flex-wrap items-center gap-1">
                  {visiblePages.map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${idx}`} className="px-2 text-xs text-[#9ca3af]">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        disabled={isFetching}
                        onClick={() => setPage(item)}
                        className={`min-w-8 rounded-lg px-2 py-1 text-xs font-medium ${
                          item === safePage
                            ? 'bg-[#111111] text-white'
                            : 'border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f8fafc]'
                        } disabled:opacity-50`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
                <button
                  type="button"
                  disabled={safePage >= totalPages || isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete product</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#111111]">&quot;{deleteTarget.name}&quot;</span>?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <EditProductDrawer product={editProduct} onClose={() => setEditProduct(null)} />
    </>
  );
}
