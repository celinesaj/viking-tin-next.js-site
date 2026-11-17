'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EditBundleDrawer from '@/app/dashboard/_components/EditBundleDrawer';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import {
  buildBundleUpdateBodyFromRow,
  bundleSuccessToastText,
  useDeleteBundleMutation,
  useGetBundlesQuery,
  useLazyGetBundlesQuery,
  useUpdateBundleMutation,
  type GetBundlesParams,
} from '@/features/bundles/bundlesApi';
import { findPaginatedPageForId } from '@/app/dashboard/_lib/findPaginatedPageForId';
import { useDashboardTableHighlight } from '@/app/dashboard/_hooks/useDashboardTableHighlight';
import type { Bundle } from '@/types/bundles';
import { formatDashboardPrice } from '@/lib/formatDashboardMoney';

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

      const errorText = (data as { error?: unknown }).error;
      if (typeof errorText === 'string' && errorText.trim()) return errorText;
    }
  }

  if ('error' in error) {
    const errorText = (error as { error?: unknown }).error;
    if (typeof errorText === 'string' && errorText.trim()) return errorText;
  }

  return fallbackMessage;
}

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

type ActiveFilter = 'all' | 'active' | 'inactive';

type BundleActiveSwitchProps = {
  row: Bundle;
  disabled: boolean;
  busy: boolean;
  onToggle: (row: Bundle) => void;
};

function BundleActiveSwitch({ row, disabled, busy, onToggle }: BundleActiveSwitchProps) {
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

function displayName(value: string | null | undefined) {
  if (value == null || String(value).trim() === '') return '—';
  return value;
}

function bundleProductsSummary(row: Bundle): string {
  const lines = row.products ?? [];
  if (lines.length === 0) return '—';
  return lines
    .map((line) => {
      const name = line.product?.name?.trim() || 'Product';
      const q = line.quantity ?? 0;
      return `${name} ×${q}`;
    })
    .join(', ');
}

function BundleThumb({ row }: { row: Bundle }) {
  const url = row.imageUrl?.trim();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={row.name ? `${row.name} bundle` : 'Bundle'}
        className="h-10 w-10 shrink-0 rounded-lg border border-[#e5e7eb] bg-white object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#eef2f7] text-xs font-semibold uppercase text-[#4b5563]"
      title="No image"
    >
      {row.name?.[0] ?? 'B'}
    </div>
  );
}

export default function BundlesTable() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [editBundle, setEditBundle] = useState<Bundle | null>(null);
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [bundlePatchPending, setBundlePatchPending] = useState<Record<string, boolean>>({});

  const queryArgs = useMemo(() => {
    const base: GetBundlesParams = {
      page,
      limit: PAGE_SIZE,
    };
    if (activeFilter === 'active') base.is_active = true;
    if (activeFilter === 'inactive') base.is_active = false;
    return base;
  }, [page, activeFilter]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: loadError,
  } = useGetBundlesQuery(queryArgs);

  const [triggerPageLookup] = useLazyGetBundlesQuery();

  const [updateBundle] = useUpdateBundleMutation();
  const [deleteBundle, { isLoading: isDeleting }] = useDeleteBundleMutation();

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  useEffect(() => {
    if (!pagination) return;
    if (pagination.totalPages >= 1 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

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

  const activeRowForMenu =
    actionsMenuId !== null ? rows.find((r) => r.id === actionsMenuId) ?? null : null;

  useEffect(() => {
    if (!actionsMenuId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-bundle-actions-root]')) return;
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

  function setBundleRowPatchPending(id: string, pending: boolean) {
    setBundlePatchPending((prev) => {
      if (pending) return { ...prev, [id]: true };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const handleToggleActive = async (row: Bundle) => {
    if (editBundle?.id === row.id) return;
    const next = !row.isActive;
    setBundleRowPatchPending(row.id, true);
    try {
      const result = await updateBundle({
        id: row.id,
        ...buildBundleUpdateBodyFromRow(row, { is_active: next }),
      }).unwrap();
      toast.success(
        bundleSuccessToastText(
          result,
          next ? `"${row.name}" is now active.` : `"${row.name}" is now inactive.`,
        ),
      );
    } catch (error) {
      console.error('Failed to update bundle status', error);
      toast.error(extractServerMessage(error, 'Could not update status. Try again.'));
    } finally {
      setBundleRowPatchPending(row.id, false);
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
      const res = await deleteBundle(id).unwrap();
      const msg = typeof res?.message === 'string' && res.message.trim() ? res.message.trim() : null;
      toast.success(msg ?? `"${name}" deleted.`);
      setDeleteTarget(null);
      setEditBundle((current) => (current?.id === id ? null : current));
    } catch (error) {
      console.error('Failed to delete bundle', error);
      toast.error(extractServerMessage(error, 'Delete failed. Please try again.'));
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-semibold">Bundles</h2>
          <p className="mt-1 text-xs text-[#9ca3af]">GET /bundles (paginated)</p>
        </div>

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
      </div>

      {showLoader ? <TableDotsLoader /> : null}

      {isError ? (
        <p className="text-sm text-red-600">
          {extractServerMessage(loadError, 'Failed to load bundles.')}
        </p>
      ) : null}

      {!showLoader && !isError && total === 0 ? (
        <p className="text-sm text-[#6b7280]">No bundles found.</p>
      ) : null}

      {!showLoader && !isError && total > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                  <th className="px-3 py-3 font-medium">Bundle</th>
                  <th className="px-3 py-3 font-medium">Slug</th>
                  <th className="max-w-[280px] px-3 py-3 font-medium">Products</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Origin total</th>
                  <th className="px-3 py-3 font-medium">Gallery</th>
                  <th className="px-3 py-3 font-medium">Active</th>
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
                        <BundleThumb row={row} />
                        <span className="min-w-0 truncate">{row.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-4 text-[#6b7280]">
                      {displayName(row.slug)}
                    </td>
                    <td className="max-w-[280px] px-3 py-4 text-[#6b7280]">
                      <span className="line-clamp-2" title={bundleProductsSummary(row)}>
                        {bundleProductsSummary(row)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-[#111111]">{formatDashboardPrice(row.price)}</td>
                    <td className="px-3 py-4 text-[#6b7280]">{formatDashboardPrice(row.originTotal)}</td>
                    <td className="px-3 py-4 text-[#6b7280]">{row.galleryImages.length}</td>
                    <td className="px-3 py-4">
                      <BundleActiveSwitch
                        row={row}
                        busy={Boolean(bundlePatchPending[row.id])}
                        disabled={
                          isDeleting || Boolean(editBundle && editBundle.id === row.id)
                        }
                        onToggle={(r) => {
                          void handleToggleActive(r);
                        }}
                      />
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="inline-block text-left" data-bundle-actions-root>
                        <button
                          ref={actionsMenuId === row.id ? actionsBtnRef : undefined}
                          type="button"
                          aria-expanded={actionsMenuId === row.id}
                          aria-haspopup="menu"
                          aria-label={`Actions for ${row.name}`}
                          onClick={() =>
                            setActionsMenuId((current) => (current === row.id ? null : row.id))
                          }
                          disabled={
                            isDeleting || Boolean(bundlePatchPending[row.id])
                          }
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
                  onClick={() => {
                    setActionsMenuId(null);
                    setEditBundle(activeRowForMenu);
                  }}
                  disabled={
                    isDeleting || Boolean(bundlePatchPending[activeRowForMenu.id])
                  }
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    handleDelete(activeRowForMenu.id, activeRowForMenu.name)
                  }
                  disabled={
                    isDeleting || Boolean(bundlePatchPending[activeRowForMenu.id])
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

      <EditBundleDrawer bundle={editBundle} onClose={() => setEditBundle(null)} />

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete bundle</h3>
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
    </section>
    </>
  );
}
