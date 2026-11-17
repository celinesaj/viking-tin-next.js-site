'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import { useGetAdminCouponUsageQuery } from '@/app/dashboard/redux/reducers/CouponsSlice/CouponsApiSlice';
import { formatDashboardMoney } from '@/lib/formatDashboardMoney';

const PAGE_SIZE = 20;

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

export default function CouponUsageTable() {
  const [page, setPage] = useState(1);
  const [couponIdInput, setCouponIdInput] = useState('');
  const [couponIdFilter, setCouponIdFilter] = useState('');

  const queryArgs = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      coupon_id: couponIdFilter || undefined,
    }),
    [page, couponIdFilter],
  );

  const { data, isLoading, isFetching, isError, error: loadError, refetch } =
    useGetAdminCouponUsageQuery(queryArgs);

  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);

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

  const onApplyFilter = () => {
    setPage(1);
    setCouponIdFilter(couponIdInput.trim());
  };

  const onResetFilters = () => {
    setCouponIdInput('');
    setCouponIdFilter('');
    setPage(1);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Coupon usage</h2>
            <p className="mt-1 text-xs text-[#9ca3af]">
              GET /coupons/admin/usage (paginated, optional <span className="font-mono">coupon_id</span>)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={couponIdInput}
              onChange={(e) => setCouponIdInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onApplyFilter();
              }}
              placeholder="Coupon ID (optional)"
              className="h-9 min-w-32 rounded-lg border border-[#d1d5db] bg-white px-3 text-xs text-[#111827]"
              aria-label="Filter by coupon id"
            />
            <button
              type="button"
              onClick={onApplyFilter}
              className="h-9 rounded-lg bg-[#111111] px-3 text-xs font-medium text-white"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              className="h-9 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f8fafc]"
            >
              Reset
            </button>
          </div>
        </div>

        {showLoader ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {loadError && typeof loadError === 'object' && 'data' in loadError
              ? String(
                  (loadError as { data?: { message?: string } }).data?.message ??
                    'Failed to load coupon usage.',
                )
              : 'Failed to load coupon usage.'}{' '}
            <button
              type="button"
              onClick={() => void refetch()}
              className="ml-1 font-medium underline underline-offset-2"
            >
              Retry
            </button>
          </p>
        ) : null}

        {!showLoader && !isError && total === 0 ? (
          <p className="text-sm text-[#6b7280]">No usage records found.</p>
        ) : null}

        {!showLoader && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">ID</th>
                    <th className="px-3 py-3 font-medium">Coupon</th>
                    <th className="px-3 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Order</th>
                    <th className="px-3 py-3 font-medium">Used at</th>
                    <th className="px-3 py-3 font-medium">Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc]"
                    >
                      <td className="px-3 py-4 font-mono text-xs text-[#6b7280]">{row.id}</td>
                      <td className="px-3 py-4 text-[#111111]">
                        <div className="font-mono text-sm font-semibold">
                          {row.couponCode.trim() || '—'}
                        </div>
                        {row.couponId ? (
                          <div className="mt-0.5 font-mono text-xs text-[#9ca3af]">id {row.couponId}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-4 text-[#111111]">
                        <div className="text-sm">
                          {row.userName.trim() || '—'}
                        </div>
                        {row.userId ? (
                          <div className="mt-0.5 font-mono text-xs text-[#9ca3af]">id {row.userId}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-4 font-mono text-sm text-[#111111]">{row.orderId}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-[#6b7280]">
                        {formatDateTime(row.usedAt)}
                      </td>
                      <td className="px-3 py-4 font-medium text-[#111111]">
                        {formatDashboardMoney(row.discountAmountApplied)}
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
    </>
  );
}
