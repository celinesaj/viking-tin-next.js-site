'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import {
  useGetAdminCouponStorefrontUsersQuery,
  useRemoveUserFromCouponWhitelistMutation,
  useWhitelistUserForCouponMutation,
} from '@/app/dashboard/redux/reducers/CouponsSlice/CouponsApiSlice';

const PAGE_SIZE = 20;

function extractServerMessage(error: unknown, fallbackMessage: string) {
  if (!error || typeof error !== 'object') return fallbackMessage;
  if ('data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
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

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type Target = { id: string; code: string };

type Props = {
  open: boolean;
  target: Target | null;
  onClose: () => void;
};

export default function CouponStorefrontUsersDrawer({ open, target, onClose }: Props) {
  const couponId = target?.id ?? '';
  const [page, setPage] = useState(1);
  /** Draft text in the search box (Coupon usage–style: Apply to query API). */
  const [searchInput, setSearchInput] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (open && target) {
      setPage(1);
      setSearchInput('');
      setEmailFilter('');
      setNameFilter('');
      setPendingUserId(null);
    }
  }, [open, target]);

  const { data, isLoading, isFetching, isError, error: loadError, refetch } =
    useGetAdminCouponStorefrontUsersQuery(
      {
        couponId,
        page,
        limit: PAGE_SIZE,
        email: emailFilter || undefined,
        name: nameFilter || undefined,
      },
      { skip: !open || !couponId },
    );

  const [whitelistUser] = useWhitelistUserForCouponMutation();
  const [removeWhitelistUser] = useRemoveUserFromCouponWhitelistMutation();

  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);

  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  const rangeLabel = useMemo(() => {
    const rows = data?.data ?? [];
    if (!pagination || rows.length === 0) return { start: 0, end: 0 };
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = start + rows.length - 1;
    return { start, end };
  }, [pagination, data?.data]);

  const rows = data?.data ?? [];

  const applyFilters = () => {
    const q = searchInput.trim();
    setPage(1);
    if (!q) {
      setEmailFilter('');
      setNameFilter('');
      return;
    }
    if (q.includes('@')) {
      setEmailFilter(q);
      setNameFilter('');
    } else {
      setNameFilter(q);
      setEmailFilter('');
    }
  };

  const resetFilters = () => {
    setPage(1);
    setSearchInput('');
    setEmailFilter('');
    setNameFilter('');
  };

  const hasActiveFilters = Boolean(emailFilter.trim() || nameFilter.trim());

  const appliedFilterHint = useMemo(() => {
    const e = emailFilter.trim();
    const n = nameFilter.trim();
    if (e) return { label: 'email', value: e } as const;
    if (n) return { label: 'name', value: n } as const;
    return null;
  }, [emailFilter, nameFilter]);

  const showLoader = isLoading || (isFetching && !data);

  async function handleAddToWhitelist(rowId: string) {
    if (!target) return;
    const n = Number.parseInt(rowId, 10);
    if (!Number.isFinite(n) || n < 1) {
      toast.error('Invalid user id.');
      return;
    }
    setPendingUserId(rowId);
    try {
      await whitelistUser({ couponId: target.id, user_id: n }).unwrap();
      toast.success('User added to whitelist.');
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not add user to whitelist.'));
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleRemoveFromWhitelist(rowId: string) {
    if (!target) return;
    setPendingUserId(rowId);
    try {
      await removeWhitelistUser({ couponId: target.id, userId: rowId }).unwrap();
      toast.success('User removed from whitelist.');
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not remove user from whitelist.'));
    } finally {
      setPendingUserId(null);
    }
  }

  if (!open || !target) return null;

  const couponCodeLabel = data?.couponCode?.trim() || target.code;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="h-full flex-1 bg-black/40"
      />
      <aside className="flex h-full max-h-screen min-h-0 w-full max-w-5xl flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
        <header className="shrink-0 flex items-start justify-between gap-3 border-b border-[#eef2f7] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[#111111]">Users & whitelist</h3>
            <p className="mt-1 font-mono text-xs text-[#6b7280]">{couponCodeLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-3 border-b border-[#eef2f7] px-5 py-3">
            <p className="text-xs text-[#6b7280]">
              Same pattern as Coupon usage: type a substring, then Apply. Server match is case-insensitive.
              Use <span className="font-mono text-[#374151]">@</span> in your text to filter by{' '}
              <span className="font-mono text-[#374151]">email</span>; otherwise by{' '}
              <span className="font-mono text-[#374151]">name</span> (first, last, or display).
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="coupon-sfu-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyFilters();
                }}
                placeholder="Search name or email…"
                autoComplete="off"
                aria-label="Search storefront users"
                className="h-9 min-w-[200px] flex-1 rounded-lg border border-[#d1d5db] bg-white px-3 text-xs text-[#111827]"
              />
              <button
                type="button"
                onClick={applyFilters}
                disabled={isFetching}
                className="h-9 rounded-lg bg-[#111111] px-3 text-xs font-medium text-white hover:bg-[#1f1f1f] disabled:opacity-60"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={resetFilters}
                disabled={
                  !searchInput.trim() && !emailFilter.trim() && !nameFilter.trim()
                }
                className="h-9 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
            </div>
            {appliedFilterHint ? (
              <p className="text-xs text-[#6b7280]">
                Active filter ({appliedFilterHint.label}):{' '}
                <span className="font-medium text-[#111111]">{appliedFilterHint.value}</span>
              </p>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {showLoader ? <TableDotsLoader /> : null}

            {isError ? (
              <p className="text-sm text-red-600">
                {loadError && typeof loadError === 'object' && 'data' in loadError
                  ? String(
                      (loadError as { data?: { message?: string } }).data?.message ??
                        'Failed to load storefront users.',
                    )
                  : 'Failed to load storefront users.'}{' '}
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="font-medium underline underline-offset-2"
                >
                  Retry
                </button>
              </p>
            ) : null}

            {!showLoader && !isError && total === 0 ? (
              <p className="text-sm text-[#6b7280]">
                {hasActiveFilters
                  ? 'No storefront users match these filters.'
                  : 'No storefront users found.'}
              </p>
            ) : null}

            {!showLoader && !isError && total > 0 && rows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                      <th className="px-3 py-3 font-medium">User</th>
                      <th className="px-3 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium">Redeemed</th>
                      <th className="px-3 py-3 font-medium">Whitelist</th>
                      <th className="px-3 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const busy = pendingUserId === row.id;
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc]"
                        >
                          <td className="px-3 py-3 text-[#111111]">
                            <div className="font-medium">{row.name || '—'}</div>
                            <div className="mt-0.5 font-mono text-xs text-[#9ca3af]">
                              id {row.id}
                            </div>
                          </td>
                          <td className="max-w-[200px] truncate px-3 py-3 text-[#374151]">
                            {row.email || '—'}
                          </td>
                          <td className="px-3 py-3">
                            {row.hasCoupon ? (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                                Yes
                              </span>
                            ) : (
                              <span className="text-xs text-[#9ca3af]">No</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {row.isWhitelisted ? (
                              <div>
                                <span className="inline-flex rounded-full bg-[#dbeafe] px-2 py-0.5 text-xs font-medium text-[#1e40af]">
                                  Listed
                                </span>
                                {row.whitelistAddedAt ? (
                                  <div className="mt-1 text-xs text-[#9ca3af]">
                                    {formatShortDate(row.whitelistAddedAt)}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-[#9ca3af]">Not listed</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right">
                            {row.isWhitelisted ? (
                              <button
                                type="button"
                                disabled={busy || Boolean(pendingUserId)}
                                onClick={() => void handleRemoveFromWhitelist(row.id)}
                                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {busy ? 'Removing…' : 'Remove'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy || Boolean(pendingUserId)}
                                onClick={() => void handleAddToWhitelist(row.id)}
                                className="rounded-lg bg-[#111111] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {busy ? 'Adding…' : 'Add'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          {!showLoader && !isError && total > 0 ? (
            <footer className="shrink-0 border-t border-[#eef2f7] bg-[#fafafa] px-5 py-3">
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
            </footer>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
