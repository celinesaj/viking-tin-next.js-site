'use client';

import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import { findPaginatedPageForId } from '@/app/dashboard/_lib/findPaginatedPageForId';
import { useDashboardTableHighlight } from '@/app/dashboard/_hooks/useDashboardTableHighlight';
import {
  useGetStorefrontUsersAdminQuery,
  useLazyGetStorefrontUsersAdminQuery,
} from '@/features/users/storefrontUsersAdminApi';
import type { StorefrontUserAdmin } from '@/types/storefront-users-admin';

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
const EXPORT_PAGE_SIZE = 500;

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatProvider(provider: string): string {
  const p = provider.trim().toLowerCase();
  if (p === 'local') return 'Local';
  if (p === 'google') return 'Google';
  return provider || '—';
}

function UserAvatar({ row }: { row: StorefrontUserAdmin }) {
  const url = row.avatarUrl?.trim();
  const initial = row.name?.trim()?.[0] ?? row.email?.[0] ?? '?';
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full border border-[#e5e7eb] bg-[#f3f4f6] object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-[#eef2f7] text-xs font-semibold uppercase text-[#4b5563]"
      aria-hidden
    >
      {initial}
    </div>
  );
}

export default function StorefrontUsersAdminTable() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const queryArgs = useMemo(() => ({ page, limit: PAGE_SIZE }), [page]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: loadError,
  } = useGetStorefrontUsersAdminQuery(queryArgs);

  const [triggerPageLookup] = useLazyGetStorefrontUsersAdminQuery();

  const pagination = data?.pagination;
  const rows = data?.data ?? [];
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);

  const rowOnPage = Boolean(highlightId && rows.some((r) => r.id === highlightId));
  const { highlightRef, rowHighlightClass } = useDashboardTableHighlight(rowOnPage);

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

  const exportToExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      let pageNum = 1;
      let totalExportPages = 1;
      const allRows: StorefrontUserAdmin[] = [];

      do {
        const res = await triggerPageLookup({
          page: pageNum,
          limit: EXPORT_PAGE_SIZE,
        }).unwrap();
        allRows.push(...res.data);
        totalExportPages = Math.max(1, res.pagination?.totalPages ?? 1);
        pageNum += 1;
      } while (pageNum <= totalExportPages);

      const sheetRows = allRows.map((row) => ({
        ID: row.id,
        Name: row.name?.trim() || '—',
        Email: row.email || '—',
        Phone: row.phone?.trim() || '—',
        'Sign-in': formatProvider(row.authProvider),
        'Phone verified': row.phoneVerifiedAt ? 'Yes' : '—',
        'Phone verified at': row.phoneVerifiedAt ? formatWhen(row.phoneVerifiedAt) : '—',
      }));

      const worksheet = XLSX.utils.json_to_sheet(sheetRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Storefront users');
      const stamp = new Date().toISOString().slice(0, 10);

      // Force a real file download so Chrome saves it instead of opening it
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `storefront-users-${stamp}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allRows.length} user${allRows.length === 1 ? '' : 's'}.`);
    } catch (err) {
      toast.error(extractServerMessage(err, 'Export failed. Please try again.'));
    } finally {
      setIsExporting(false);
    }
  }, [triggerPageLookup]);

  const showLoader = isLoading || (isFetching && !data);

  return (
    <>
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Storefront users</h2>
            <p className="mt-1 text-xs text-[#9ca3af]">
              GET /users/admin — newest first; passwords and OTPs are not returned
            </p>
          </div>
          <button
            type="button"
            disabled={total === 0 || isError || showLoader || isExporting}
            onClick={() => void exportToExcel()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-medium text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} aria-hidden />
            {isExporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>

        {showLoader ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {extractServerMessage(loadError, 'Failed to load users.')}
          </p>
        ) : null}

        {!showLoader && !isError && total === 0 ? (
          <p className="text-sm text-[#6b7280]">No users found.</p>
        ) : null}

        {!showLoader && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Email</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">Sign-in</th>
                    <th className="px-3 py-3 font-medium">Phone ✓</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      ref={highlightId === row.id ? highlightRef : undefined}
                      className={`border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc] ${rowHighlightClass(row.id)}`}
                    >
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar row={row} />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-[#111111]">
                              {row.name?.trim() || '—'}
                            </div>
                            <div className="truncate text-xs text-[#6b7280]">ID {row.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-4 text-[#111111]">
                        {row.email || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-[#6b7280]">
                        {row.phone?.trim() || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-[#6b7280]">
                        {formatProvider(row.authProvider)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-[#6b7280]">
                        {row.phoneVerifiedAt ? (
                          <span
                            className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
                            title={formatWhen(row.phoneVerifiedAt)}
                          >
                            Yes
                          </span>
                        ) : (
                          <span className="text-[#9ca3af]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}