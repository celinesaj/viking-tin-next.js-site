'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddCouponDrawer from '@/app/dashboard/_components/AddCouponDrawer';
import CouponStorefrontUsersDrawer from '@/app/dashboard/_components/CouponStorefrontUsersDrawer';
import EditCouponDrawer from '@/app/dashboard/_components/EditCouponDrawer';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import {
  useDeleteAdminCouponMutation,
  useGetAdminCouponsQuery,
  useUpdateAdminCouponMutation,
} from '@/app/dashboard/redux/reducers/CouponsSlice/CouponsApiSlice';
import type { AdminCoupon, CreateAdminCouponRequest } from '@/app/dashboard/redux/reducers/CouponsSlice/CouponsApiSlice';
import { formatDashboardMoney } from '@/lib/formatDashboardMoney';

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

function buildCouponUpdateBody(c: AdminCoupon, is_active: boolean): CreateAdminCouponRequest {
  const t = c.discountType?.toLowerCase() ?? 'percentage';
  const discount_type: 'percentage' | 'fixed' =
    t === 'fixed' || t === 'fixed_amount' ? 'fixed' : 'percentage';
  const discount_value = Number(c.discountValue);
  const start = new Date(c.startDate);
  const end = new Date(c.endDate);
  return {
    code: c.code,
    description: c.description?.trim() || '—',
    discount_type,
    discount_value: Number.isFinite(discount_value) ? discount_value : 0,
    start_date: Number.isNaN(start.getTime()) ? new Date().toISOString() : start.toISOString(),
    end_date: Number.isNaN(end.getTime()) ? new Date().toISOString() : end.toISOString(),
    min_order_amount: Number(c.minOrderAmount) || 0,
    max_discount_amount: Number(c.maxDiscountAmount) || 0,
    usage_limit: c.usageLimit,
    is_active,
  };
}

function getNameInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function compactText(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
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

function formatDiscount(coupon: AdminCoupon): string {
  const v = Number(coupon.discountValue);
  const type = coupon.discountType?.toLowerCase() ?? '';
  if (type === 'percentage' || type === 'percent') {
    if (Number.isNaN(v)) return '—';
    return `${v}%`;
  }
  if (type === 'fixed' || type === 'fixed_amount') {
    return formatDashboardMoney(coupon.discountValue);
  }
  if (Number.isNaN(v)) return String(coupon.discountValue);
  return `${type}: ${formatDashboardMoney(coupon.discountValue)}`;
}

function CodeThumb({ code }: { code: string }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#eef2f7] text-xs font-semibold uppercase text-[#4b5563]"
      title="Coupon"
    >
      {getNameInitial(code)}
    </div>
  );
}

type CouponActiveSwitchProps = {
  row: AdminCoupon;
  disabled: boolean;
  busy: boolean;
  onToggle: (row: AdminCoupon) => void;
};

function CouponActiveSwitch({ row, disabled, busy, onToggle }: CouponActiveSwitchProps) {
  const on = row.isActive;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-busy={busy}
      aria-label={on ? `Deactivate ${row.code}` : `Activate ${row.code}`}
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

export default function CouponsTable() {
  const [page, setPage] = useState(1);
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [storefrontUsersTarget, setStorefrontUsersTarget] = useState<{ id: string; code: string } | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);
  const [editCoupon, setEditCoupon] = useState<AdminCoupon | null>(null);
  const [couponPatchPending, setCouponPatchPending] = useState<Record<string, boolean>>({});

  const [updateCoupon] = useUpdateAdminCouponMutation();
  const [deleteCoupon, { isLoading: isDeletingCoupon }] = useDeleteAdminCouponMutation();

  const queryArgs = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
    }),
    [page],
  );

  const { data, isLoading, isFetching, isError, error: loadError, refetch } = useGetAdminCouponsQuery(queryArgs);

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

  const activeRowForMenu =
    actionsMenuId !== null ? rows.find((r) => r.id === actionsMenuId) ?? null : null;

  useEffect(() => {
    if (!actionsMenuId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-coupon-actions-root]')) return;
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

  function setCouponRowPatchPending(id: string, pending: boolean) {
    setCouponPatchPending((prev) => {
      if (pending) return { ...prev, [id]: true };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const handleToggleActive = async (row: AdminCoupon) => {
    if (editCoupon?.id === row.id) return;
    const next = !row.isActive;
    setCouponRowPatchPending(row.id, true);
    try {
      await updateCoupon({
        id: row.id,
        body: buildCouponUpdateBody(row, next),
      }).unwrap();
      toast.success(
        next ? `Coupon “${row.code}” is now active.` : `Coupon “${row.code}” is now inactive.`,
      );
    } catch (error) {
      console.error('Failed to update coupon status', error);
      toast.error(extractServerMessage(error, 'Could not update status. Try again.'));
    } finally {
      setCouponRowPatchPending(row.id, false);
    }
  };

  const confirmDeleteCoupon = async () => {
    if (!deleteTarget) return;
    const { id, code } = deleteTarget;
    try {
      await deleteCoupon(id).unwrap();
      toast.success(`Coupon “${code}” deleted.`);
      setDeleteTarget(null);
      setEditCoupon((c) => (c?.id === id ? null : c));
    } catch (error) {
      console.error('Failed to delete coupon', error);
      toast.error(extractServerMessage(error, 'Delete failed. Please try again.'));
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Coupons</h2>
            <p className="mt-1 text-xs text-[#9ca3af]">
              GET/POST/PATCH/DELETE /coupons/admin · POST/DELETE /coupons/admin/:id/users · GET
              /coupons/admin/:id/storefront-users
            </p>
          </div>
          <div className="flex shrink-0">
            <AddCouponDrawer />
          </div>
        </div>

        {showLoader ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {loadError && typeof loadError === 'object' && 'data' in loadError
              ? String((loadError as { data?: { message?: string } }).data?.message ?? 'Failed to load coupons.')
              : 'Failed to load coupons.'}{' '}
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
          <p className="text-sm text-[#6b7280]">No coupons found.</p>
        ) : null}

        {!showLoader && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Code</th>
                    <th className="min-w-[160px] px-3 py-3 font-medium">Description</th>
                    <th className="px-3 py-3 font-medium">Discount</th>
                    <th className="px-3 py-3 font-medium">Starts</th>
                    <th className="px-3 py-3 font-medium">Ends</th>
                    <th className="px-3 py-3 font-medium">Min order</th>
                    <th className="px-3 py-3 font-medium">Max disc.</th>
                    <th className="px-3 py-3 font-medium">Usage limit</th>
                    <th className="px-3 py-3 font-medium">Active</th>
                    <th className="w-12 px-3 py-3 text-right font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((coupon) => (
                    <tr
                      key={coupon.id}
                      className="border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc]"
                    >
                      <td className="px-3 py-4 font-medium text-[#111111]">
                        <div className="flex items-center gap-3">
                          <CodeThumb code={coupon.code} />
                          <div className="min-w-0">
                            <p className="truncate font-mono text-sm">{coupon.code}</p>
                            <p className="text-xs text-[#6b7280]">ID {coupon.id}</p>
                          </div>
                        </div>
                      </td>
                      <td
                        className="max-w-[220px] px-3 py-4 text-[#374151]"
                        title={coupon.description}
                      >
                        <p className="line-clamp-2 text-sm">
                          {compactText(coupon.description || '—', 80)}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-medium text-[#111111]">{formatDiscount(coupon)}</p>
                        <p className="mt-0.5 text-xs capitalize text-[#9ca3af]">
                          {coupon.discountType?.replace(/_/g, ' ') || '—'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-[#6b7280]">
                        {formatDateTime(coupon.startDate)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-[#6b7280]">
                        {formatDateTime(coupon.endDate)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-[#111111]">
                        {formatDashboardMoney(coupon.minOrderAmount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-[#111111]">
                        {formatDashboardMoney(coupon.maxDiscountAmount)}
                      </td>
                      <td className="px-3 py-4 text-[#6b7280]">{coupon.usageLimit}</td>
                      <td className="px-3 py-4">
                        <CouponActiveSwitch
                          row={coupon}
                          busy={Boolean(couponPatchPending[coupon.id])}
                          disabled={isFetching}
                          onToggle={(r) => {
                            void handleToggleActive(r);
                          }}
                        />
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-coupon-actions-root="">
                          <button
                            ref={actionsMenuId === coupon.id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuId === coupon.id}
                            aria-haspopup="menu"
                            aria-label={`Actions for coupon ${coupon.code}`}
                            onClick={() =>
                              setActionsMenuId((current) => (current === coupon.id ? null : coupon.id))
                            }
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8fafc]"
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
                    setEditCoupon(activeRowForMenu);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsMenuId(null);
                    setStorefrontUsersTarget({ id: activeRowForMenu.id, code: activeRowForMenu.code });
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Users & whitelist
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsMenuId(null);
                    setDeleteTarget({ id: activeRowForMenu.id, code: activeRowForMenu.code });
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
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

      <EditCouponDrawer
        key={editCoupon?.id ?? 'closed'}
        open={editCoupon != null}
        coupon={editCoupon}
        onClose={() => setEditCoupon(null)}
      />

      <CouponStorefrontUsersDrawer
        open={storefrontUsersTarget != null}
        target={storefrontUsersTarget}
        onClose={() => setStorefrontUsersTarget(null)}
      />

      {deleteTarget ? (
        <div className="fixed inset-0 z-130 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete coupon</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#111111]">&quot;{deleteTarget.code}&quot;</span>? This
              cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingCoupon}
                className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteCoupon()}
                disabled={isDeletingCoupon}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
              >
                {isDeletingCoupon ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
