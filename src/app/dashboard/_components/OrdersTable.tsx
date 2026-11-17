'use client';

import { ChevronLeft, ChevronRight, Download, MoreHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import {
  type DashboardAdminOrder,
  type DashboardAdminOrderItem,
  useDeliverDashboardOrderMutation,
  useGetDashboardOrdersQuery,
  useLazyGetDashboardOrderByIdQuery,
  useLazyGetDashboardOrdersQuery,
  useMoveDashboardOrderAwayMutation,
} from '@/app/dashboard/redux/reducers/OrdersSlice/OrdersApiSlice';
import { findPaginatedPageForId } from '@/app/dashboard/_lib/findPaginatedPageForId';
import { useDashboardTableHighlight } from '@/app/dashboard/_hooks/useDashboardTableHighlight';
import { formatDashboardMoney } from '@/lib/formatDashboardMoney';
import { useAppSelector } from '@/store/hook';
import * as XLSX from 'xlsx';

const EXPORT_PAGE_SIZE = 500;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const PAGE_SIZE = 20;

/** UUID-style order id — backend often accepts this as `order_number` query value */
function looksLikeUuidOrderId(q: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    q.trim(),
  );
}

/** Maps one search box to GET /checkout/admin/orders query fields (only one param is sent). */
function ordersUnifiedSearchToFilters(raw: string): {
  user_id?: string;
  order_number?: string;
  client_email?: string;
  client_name?: string;
} {
  const q = raw.trim();
  if (!q) return {};
  if (q.includes('@')) return { client_email: q };
  if (looksLikeUuidOrderId(q)) return { order_number: q };
  if (/^ord/i.test(q)) return { order_number: q };
  if (/^\d+$/.test(q)) {
    return q.length >= 5 ? { order_number: q } : { user_id: q };
  }
  return { client_name: q };
}

function compactAddress(value: string | null): string {
  if (!value) return '—';
  if (value.length <= 52) return value;
  return `${value.slice(0, 52)}...`;
}

function getNameInitial(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** Maps API status values to labels shown in the UI */
function formatOrderStatusForDisplay(status: string): string {
  if (status === 'away' || status === 'on_the_way') return 'On the way';
  return toTitleCase(status);
}

/** In-transit: legacy `away` or API `on_the_way` — deliver is allowed in either case */
function isOrderOnTheWay(status: string): boolean {
  return status === 'away' || status === 'on_the_way';
}

/** Matches GET /checkout/admin/orders — omit `status` when `all`. */
type OrdersStatusFilter = 'pending' | 'on_the_way' | 'delivered' | 'paid' | 'failed' | 'all';

function parseOrdersUrlStatus(raw: string | null): OrdersStatusFilter | null {
  if (!raw?.trim()) return null;
  const v = raw.trim().toLowerCase();
  const allowed = new Set<string>(['pending', 'on_the_way', 'delivered', 'paid', 'failed', 'all']);
  return allowed.has(v) ? (v as OrdersStatusFilter) : null;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'approved':
    case 'delivered':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    case 'away':
    case 'on_the_way':
      return 'bg-sky-100 text-sky-800';
    case 'paid':
      return 'bg-violet-100 text-violet-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-[#f3f4f6] text-[#374151]';
  }
}

function formatPaymentMethod(value: string | null): string {
  if (!value) return 'N/A';
  const key = value.trim().toLowerCase().replace(/-/g, '_');
  if (key === 'cod' || key === 'cash_on_delivery') return 'cash_on_delivery';
  return toTitleCase(value.replace(/_/g, ' '));
}

function parsePriceAmount(value: string | null | undefined): number | null {
  if (value == null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** True when every present unit / offer / original amount is the same number (or only one amount exists). */
function orderItemPricesAllSame(item: DashboardAdminOrderItem): boolean {
  const unit = parsePriceAmount(item.unit_price);
  const offer = parsePriceAmount(item.offer_price);
  const original = parsePriceAmount(item.original_price);
  const present = [unit, offer, original].filter((n): n is number => n !== null);
  if (present.length <= 1) return true;
  const ref = present[0];
  return present.every((n) => n === ref);
}

function isPercentageCouponDiscount(discountType: string | null | undefined): boolean {
  const t = discountType?.trim().toLowerCase().replace(/-/g, '_') ?? '';
  return t === 'percentage' || t === 'percent';
}

function isFixedCouponDiscount(discountType: string | null | undefined): boolean {
  const t = discountType?.trim().toLowerCase().replace(/-/g, '_') ?? '';
  return t === 'fixed' || t === 'price';
}

type OrderItemCouponLineBreakdown =
  | { kind: 'none'; gross: number; qty: number }
  | { kind: 'percentage'; gross: number; after: number; qty: number }
  | { kind: 'fixed'; gross: number; discount: number; after: number; qty: number };

/** Line gross before coupon = unit_price × qty; matches invoice per‑item logic where applicable. */
function getOrderItemCouponLineBreakdown(
  item: DashboardAdminOrderItem,
): OrderItemCouponLineBreakdown {
  const qty = Math.max(0, Number(item.quantity) || 0);
  const unit = Number(item.unit_price);
  const gross =
    Number.isFinite(unit) && qty > 0 ? unit * qty : 0;

  const cv = parsePriceAmount(item.coupon_value);
  if (cv == null || cv <= 0 || gross <= 0) {
    return { kind: 'none', gross, qty };
  }

  if (isPercentageCouponDiscount(item.discount_type)) {
    const safePct = Math.min(100, Math.max(0, cv));
    const after = gross * (1 - safePct / 100);
    return { kind: 'percentage', gross, after, qty };
  }

  if (isFixedCouponDiscount(item.discount_type)) {
    const discount = Math.min(gross, Math.max(0, cv));
    const after = gross - discount;
    return { kind: 'fixed', gross, discount, after, qty };
  }

  return { kind: 'none', gross, qty };
}

/** Human-readable label for the Discount type row (API sends snake_case / lowercase). */
function formatOrderItemDiscountTypeLabel(raw: string): string {
  const t = raw.trim().toLowerCase().replace(/-/g, '_');
  if (t === 'percentage' || t === 'percent') return 'Percentage';
  if (t === 'fixed' || t === 'price') return 'Fixed amount (AED)';
  return raw
    .trim()
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => toTitleCase(w))
    .join(' ');
}

/** Percentage coupons → `20%`; fixed amount → AED via {@link formatDashboardMoney}. */
function formatOrderItemCouponValue(
  couponValue: string | null,
  discountType: string | null,
): string {
  if (!couponValue?.trim()) return '—';
  if (isPercentageCouponDiscount(discountType)) {
    const n = Number(couponValue);
    const display = Number.isFinite(n)
      ? Number.isInteger(n)
        ? String(Math.trunc(n))
        : String(n)
      : couponValue.trim();
    return `${display}%`;
  }
  return formatDashboardMoney(couponValue);
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

function trimmedNonEmpty(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

/** Prefer human-readable coupon code when API sends it (snake_case or camelCase). */
function getCouponDisplayForOrder(
  order: DashboardAdminOrder,
): { label: 'Coupon code' | 'Coupon ID'; value: string } | null {
  const rec = order as DashboardAdminOrder & Record<string, unknown>;
  const code =
    trimmedNonEmpty(order.applied_coupon_code) ||
    trimmedNonEmpty(order.coupon_code) ||
    trimmedNonEmpty(rec.appliedCouponCode) ||
    trimmedNonEmpty(rec.couponCode);
  if (code) return { label: 'Coupon code', value: code };
  if (order.coupon_id) return { label: 'Coupon ID', value: order.coupon_id };
  return null;
}

function dashboardOrderToExportSheetRow(order: DashboardAdminOrder): Record<string, string> {
  const u = order.user;
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    invoice_number: order.invoice_number != null ? String(order.invoice_number) : '',
    subtotal: order.subtotal,
    subtotal_after_coupon: order.subtotal_after_coupon,
    delivery_fee: order.delivery_fee,
    shipping_cost: order.shipping_cost,
    tax: order.tax,
    total: order.total,
    status: order.status,
    shipping_address: order.shipping_address ?? '',
    billing_address: order.billing_address ?? '',
    delivery_zone_id:
      order.delivery_zone_id === null || order.delivery_zone_id === undefined
        ? ''
        : String(order.delivery_zone_id),
    tax_rate_id: order.tax_rate_id ?? '',
    coupon_id: order.coupon_id ?? '',
    applied_coupon_code: order.applied_coupon_code ?? '',
    coupon_code: order.coupon_code ?? '',
    payment_method: order.payment_method ?? '',
    payment_intent_id: order.payment_intent_id ?? '',
    created_at: order.created_at ?? '',
    user_id: order.user_id,
    user_name: u?.name ?? '',
    user_email: u?.email ?? '',
    user_phone: u?.phone ?? '',
    user_json: JSON.stringify(u ?? null),
    items_json: JSON.stringify(order.items ?? []),
    full_order_json: JSON.stringify(order),
  };
}

function dashboardOrderItemsToExportRows(order: DashboardAdminOrder): Record<string, string>[] {
  const items = order.items ?? [];
  return items.map((item) => ({
    order_id: order.order_id,
    order_number: order.order_number,
    line_item_id: item.id,
    line_order_id: item.order_id,
    item_type: item.item_type,
    item_id: item.item_id,
    item_name: item.item_name,
    item_image_url: item.item_image_url ?? '',
    quantity: String(item.quantity),
    unit_price: item.unit_price,
    offer_price: item.offer_price ?? '',
    original_price: item.original_price ?? '',
    coupon_value: item.coupon_value ?? '',
    discount_type: item.discount_type ?? '',
    offer_id: item.offer_id ?? '',
    line_created_at: item.created_at ?? '',
    full_line_item_json: JSON.stringify(item),
  }));
}

function OrderThumb({ labelForInitial, orderNumber }: { labelForInitial?: string; orderNumber: string }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#eef2f7] text-xs font-semibold uppercase text-[#4b5563]"
      title="Order"
    >
      {getNameInitial(labelForInitial?.trim() || orderNumber)}
    </div>
  );
}

export default function OrdersTable() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const urlStatusRaw = searchParams.get('status');
  const urlOrderNumber = searchParams.get('order_number');
  const urlQ = searchParams.get('q');

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrdersStatusFilter>('pending');
  const [searchInput, setSearchInput] = useState('');

  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [awayDialog, setAwayDialog] = useState<{ id: string; orderNumber: string } | null>(null);
  const [deliverDialog, setDeliverDialog] = useState<{ id: string; orderNumber: string } | null>(
    null,
  );
  const [invoicePdfBusyOrderId, setInvoicePdfBusyOrderId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const adminAccessToken = useAppSelector((s) => s.adminAuth.accessToken);

  const searchFilters = useMemo(
    () => ordersUnifiedSearchToFilters(debouncedSearch),
    [debouncedSearch],
  );

  const queryArgs = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(status !== 'all' ? { status } : {}),
      ...searchFilters,
    }),
    [page, status, searchFilters],
  );

  const { data, isLoading, isFetching, isError, error: loadError, refetch } =
    useGetDashboardOrdersQuery(queryArgs);
  const [triggerOrdersPageLookup] = useLazyGetDashboardOrdersQuery();
  const [fetchOrderById, { data: orderDetails, isFetching: isFetchingOrderDetails, isError: isOrderDetailsError }]
    = useLazyGetDashboardOrderByIdQuery();
  const [moveOrderAway, { isLoading: isMovingAway }] = useMoveDashboardOrderAwayMutation();
  const [deliverOrder, { isLoading: isDelivering }] = useDeliverDashboardOrderMutation();

  const rows = data?.data ?? [];
  const rowOnPage = Boolean(highlightId && rows.some((r) => r.order_id === highlightId));
  const { highlightRef, rowHighlightClass } = useDashboardTableHighlight(rowOnPage);

  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);
  const activeRowForMenu =
    actionsMenuId !== null ? rows.find((r) => r.order_id === actionsMenuId) ?? null : null;

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

  useEffect(() => {
    if (!actionsMenuId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-order-actions-root]')) return;
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

  useEffect(() => {
    if (highlightId) {
      setStatus('all');
      setSearchInput('');
      setPage(1);
      return;
    }
    const parsed = parseOrdersUrlStatus(urlStatusRaw);
    if (parsed != null) setStatus(parsed);
    const onum = urlOrderNumber?.trim();
    const qq = urlQ?.trim();
    if (onum) setSearchInput(onum);
    else if (qq) setSearchInput(qq);
  }, [highlightId, urlStatusRaw, urlOrderNumber, urlQ]);

  useEffect(() => {
    if (!highlightId) return;
    let cancelled = false;
    void (async () => {
      const found = await findPaginatedPageForId(highlightId, async (p) => {
        const res = await triggerOrdersPageLookup({
          page: p,
          limit: PAGE_SIZE,
        }).unwrap();
        return {
          data: res.data.map((o) => ({ id: o.order_id })),
          totalPages: Math.max(1, res.pagination?.totalPages ?? 1),
        };
      });
      if (!cancelled && found != null) setPage(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [highlightId, triggerOrdersPageLookup]);

  const onStatusChange = (next: OrdersStatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  const onResetFilters = () => {
    setStatus('pending');
    setSearchInput('');
    setPage(1);
  };

  const exportOrdersToExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      const baseArgs = {
        limit: EXPORT_PAGE_SIZE,
        ...(status !== 'all' ? { status } : {}),
        ...searchFilters,
      };

      let pageNum = 1;
      let totalExportPages = 1;
      const allOrders: DashboardAdminOrder[] = [];

      do {
        const res = await triggerOrdersPageLookup({
          ...baseArgs,
          page: pageNum,
        }).unwrap();
        allOrders.push(...res.data);
        totalExportPages = Math.max(1, res.pagination?.totalPages ?? 1);
        pageNum += 1;
      } while (pageNum <= totalExportPages);

      const orderSheetRows = allOrders.map(dashboardOrderToExportSheetRow);
      const lineSheetRows = allOrders.flatMap(dashboardOrderItemsToExportRows);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(orderSheetRows),
        'Orders',
      );
      if (lineSheetRows.length > 0) {
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(lineSheetRows),
          'Line items',
        );
      }

      const stamp = new Date().toISOString().slice(0, 10);
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `orders-export-${stamp}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success(
        `Exported ${allOrders.length} order${allOrders.length === 1 ? '' : 's'} (full API payload columns + JSON).`,
      );
    } catch (err) {
      toast.error(extractServerMessage(err, 'Export failed. Please try again.'));
    } finally {
      setIsExporting(false);
    }
  }, [status, searchFilters, triggerOrdersPageLookup]);

  const handleView = async (orderId: string) => {
    setActionsMenuId(null);
    setViewOrderId(orderId);
    await fetchOrderById(orderId);
  };

  const runMoveAway = async (id: string) => {
    await moveOrderAway(id).unwrap();
    await refetch();
    if (viewOrderId === id) {
      await fetchOrderById(id);
    }
  };

  const handleMoveAwayFromDrawer = async () => {
    if (!viewOrderId || !orderDetails || orderDetails.status !== 'pending') return;
    try {
      await runMoveAway(viewOrderId);
      toast.success(`Order ${orderDetails.order_number} is now on the way.`);
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not mark order as on the way.'));
    }
  };

  const openAwayConfirmFromMenu = (id: string, orderNumber: string) => {
    setActionsMenuId(null);
    setAwayDialog({ id, orderNumber });
  };

  const handleConfirmAway = async () => {
    if (!awayDialog) return;
    try {
      await runMoveAway(awayDialog.id);
      toast.success(`Order ${awayDialog.orderNumber} is now on the way.`);
      setAwayDialog(null);
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not mark order as on the way.'));
    }
  };

  const runDeliver = async (id: string) => {
    await deliverOrder(id).unwrap();
    await refetch();
    if (viewOrderId === id) {
      await fetchOrderById(id);
    }
  };

  const handleDeliverFromDrawer = async () => {
    if (!viewOrderId || !orderDetails || !isOrderOnTheWay(orderDetails.status)) return;
    try {
      await runDeliver(viewOrderId);
      toast.success(`Order ${orderDetails.order_number} marked as delivered.`);
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not mark order as delivered.'));
    }
  };

  const openDeliverConfirmFromMenu = (id: string, orderNumber: string) => {
    setActionsMenuId(null);
    setDeliverDialog({ id, orderNumber });
  };

  const handleConfirmDeliver = async () => {
    if (!deliverDialog) return;
    try {
      await runDeliver(deliverDialog.id);
      toast.success(`Order ${deliverDialog.orderNumber} marked as delivered.`);
      setDeliverDialog(null);
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not mark order as delivered.'));
    }
  };

  const handleDownloadInvoicePdf = async (orderId: string, orderNumber: string) => {
    if (invoicePdfBusyOrderId || !adminAccessToken) return;

    setActionsMenuId(null);
    setInvoicePdfBusyOrderId(orderId);

    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/invoice/pdf`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminAccessToken}` },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const msg =
          errBody && typeof errBody === 'object' && 'message' in errBody
            ? String((errBody as { message?: unknown }).message ?? '')
            : '';
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const safeName = `${orderNumber.replace(/[^a-zA-Z0-9._-]+/g, '_')}-invoice-vikingtin.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Invoice ${orderNumber} downloaded.`);
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not download invoice PDF.'));
    } finally {
      setInvoicePdfBusyOrderId(null);
    }
  };

  const mutationBusy = isMovingAway || isDelivering;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Orders</h2>
            <p className="mt-1 text-xs text-[#9ca3af]">GET /checkout/admin/orders (paginated)</p>
          </div>

          <div className="flex w-full max-w-4xl flex-col gap-3">
            <div className="flex flex-wrap items-end gap-2" role="group" aria-label="Order status">
              {(
                [
                  { key: 'pending' as const, label: 'Pending' },
                  { key: 'on_the_way' as const, label: 'On the way' },
                  { key: 'delivered' as const, label: 'Delivered' },
                  { key: 'paid' as const, label: 'Paid' },
                  { key: 'failed' as const, label: 'Failed' },
                  { key: 'all' as const, label: 'All statuses' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onStatusChange(key)}
                  disabled={isFetching}
                  className={`h-9 rounded-lg border px-3 text-xs font-medium transition-colors ${
                    status === key
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f8fafc]'
                  } disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <input
                id="orders-unified-search"
                type="search"
                autoComplete="off"
                aria-label="Search orders"
                placeholder="Search order #, email, name, or user ID…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="h-9 min-w-[min(100%,18rem)] flex-1 rounded-lg border border-[#d1d5db] bg-white px-3 text-xs text-[#111827] placeholder:text-[#9ca3af]"
              />
              <button
                type="button"
                onClick={onResetFilters}
                className="h-9 shrink-0 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f8fafc]"
              >
                Reset filters
              </button>
              <button
                type="button"
                disabled={total === 0 || isError || showLoader || isExporting}
                onClick={() => void exportOrdersToExcel()}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={14} aria-hidden />
                {isExporting ? 'Exporting…' : 'Export Excel (full data)'}
              </button>
            </div>
          </div>
        </div>

        {showLoader ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {loadError && typeof loadError === 'object' && 'data' in loadError
              ? String((loadError as { data?: { message?: string } }).data?.message ?? 'Failed to load orders.')
              : 'Failed to load orders.'}{' '}
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
          <p className="text-sm text-[#6b7280]">No orders found.</p>
        ) : null}

        {!showLoader && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="min-w-[240px] px-3 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Order</th>
                    <th className="min-w-[140px] px-3 py-3 font-medium">Invoice #</th>
                    <th className="px-3 py-3 font-medium">Items</th>
                    <th className="px-3 py-3 font-medium">Total</th>
                    <th className="px-3 py-3 font-medium">Payment</th>
                    <th className="px-3 py-3 font-medium">Shipping</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="w-12 px-3 py-3 text-right font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((order) => (
                    <tr
                      key={order.order_id}
                      ref={highlightId === order.order_id ? highlightRef : undefined}
                      className={`border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc] ${rowHighlightClass(order.order_id)}`}
                    >
                      <td className="min-w-0 max-w-[280px] px-3 py-4">
                        <div className="flex items-start gap-3">
                          <OrderThumb
                            orderNumber={order.order_number}
                            labelForInitial={order.user?.name}
                          />
                          <div className="min-w-0 space-y-0.5">
                            <p
                              className="truncate text-sm font-medium text-[#111111]"
                              title={order.user?.name?.trim() || undefined}
                            >
                              {order.user?.name?.trim() || '—'}
                            </p>
                            <p
                              className="truncate text-xs text-[#6b7280]"
                              title={order.user?.email?.trim() || undefined}
                            >
                              {order.user?.email?.trim() || '—'}
                            </p>
                            <p
                              className="truncate text-xs text-[#6b7280]"
                              title={order.user?.phone?.trim() || undefined}
                            >
                              {order.user?.phone?.trim() || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 font-medium text-[#111111]">
                        <div className="min-w-0">
                          <p className="truncate">{order.order_number}</p>
                          <p className="text-xs text-[#6b7280]">#{order.order_id}</p>
                        </div>
                      </td>
                      <td className="max-w-[180px] px-3 py-4 font-medium text-[#111111]">
                        <p className="truncate" title={order.order_number}>
                          {order.order_number}
                        </p>
                      </td>
                      <td className="max-w-[200px] px-3 py-4 text-[#6b7280]">
                        <p className="truncate text-sm text-[#111111]" title={order.items?.[0]?.item_name ?? undefined}>
                          {order.items?.[0]?.item_name
                            ? compactAddress(order.items[0].item_name)
                            : '—'}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-[#111111]">{formatDashboardMoney(order.total)}</td>
                      <td className="px-3 py-4 text-[#6b7280]">{formatPaymentMethod(order.payment_method)}</td>
                      <td
                        className="max-w-[200px] truncate px-3 py-4 text-[#6b7280]"
                        title={order.shipping_address ?? ''}
                      >
                        {order.shipping_address ? compactAddress(order.shipping_address) : '—'}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                            order.status,
                          )}`}
                        >
                          {formatOrderStatusForDisplay(order.status)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-order-actions-root="">
                          <button
                            ref={actionsMenuId === order.order_id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuId === order.order_id}
                            aria-haspopup="menu"
                            aria-label={`Actions for order ${order.order_number}`}
                            onClick={() =>
                              setActionsMenuId((current) => (current === order.order_id ? null : order.order_id))
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
                  onClick={() => void handleView(activeRowForMenu.order_id)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  View
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={invoicePdfBusyOrderId !== null || !adminAccessToken}
                  onClick={() =>
                    void handleDownloadInvoicePdf(
                      activeRowForMenu.order_id,
                      activeRowForMenu.order_number,
                    )
                  }
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {invoicePdfBusyOrderId === activeRowForMenu.order_id
                    ? 'Preparing PDF…'
                    : 'Download invoice'}
                </button>
                {activeRowForMenu.status === 'pending' ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      openAwayConfirmFromMenu(activeRowForMenu.order_id, activeRowForMenu.order_number)
                    }
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-sky-800 hover:bg-sky-50"
                  >
                    Mark as on the way
                  </button>
                ) : null}
                {isOrderOnTheWay(activeRowForMenu.status) ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      openDeliverConfirmFromMenu(activeRowForMenu.order_id, activeRowForMenu.order_number)
                    }
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    Mark delivered
                  </button>
                ) : null}
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

      {viewOrderId ? (
        <div className="fixed inset-0 z-110 flex justify-end bg-black/45">
          <div className="flex h-full w-full max-w-2xl flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <div className="shrink-0 border-b border-[#e5e7eb] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Order details</h3>
                  <p className="text-sm text-[#6b7280]">Order ID: {viewOrderId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewOrderId(null)}
                  aria-label="Close order details"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#fecaca] bg-[#fff1f2] text-[#dc2626] transition-colors hover:bg-[#ffe4e6]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {isFetchingOrderDetails ? (
              <p className="text-sm text-[#6b7280]">Loading order details...</p>
            ) : null}

            {isOrderDetailsError ? (
              <p className="text-sm text-[#991b1b]">Failed to load this order.</p>
            ) : null}

            {orderDetails ? (
              <div className="space-y-4">
                <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                  <div className="border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
                    <p className="text-base font-semibold text-[#111827]">#{orderDetails.order_number}</p>
                    <p className="text-xs text-[#6b7280]">Order details</p>
                  </div>
                  <div className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-2">
                    <p className="text-[#6b7280]">Order ID</p>
                    <p className="font-medium text-[#111827]">{orderDetails.order_id}</p>
                    <p className="text-[#6b7280]">Status</p>
                    <p className="font-medium text-[#111827]">{formatOrderStatusForDisplay(orderDetails.status)}</p>
                    <p className="text-[#6b7280]">User name</p>
                    <p className="font-medium text-[#111827]">
                      {orderDetails.user?.name?.trim() || '—'}
                    </p>
                    {orderDetails.user ? (
                      <>
                        <p className="text-[#6b7280]">Email</p>
                        <p className="font-medium text-[#111827]">{orderDetails.user.email?.trim() || '—'}</p>
                        <p className="text-[#6b7280]">Phone</p>
                        <p className="font-medium text-[#111827]">
                          {orderDetails.user.phone?.trim() || '—'}
                        </p>
                      </>
                    ) : null}
                    {formatDate(orderDetails.created_at) ? (
                      <>
                        <p className="text-[#6b7280]">Created at</p>
                        <p className="font-medium text-[#111827]">{formatDate(orderDetails.created_at)}</p>
                      </>
                    ) : null}
                    {orderDetails.payment_method ? (
                      <>
                        <p className="text-[#6b7280]">Payment method</p>
                        <p className="font-medium text-[#111827]">
                          {formatPaymentMethod(orderDetails.payment_method)}
                        </p>
                      </>
                    ) : null}
                    {orderDetails.payment_intent_id ? (
                      <>
                        <p className="text-[#6b7280]">Payment intent</p>
                        <p className="break-all font-medium text-[#111827]">{orderDetails.payment_intent_id}</p>
                      </>
                    ) : null}
                    {(() => {
                      const row = getCouponDisplayForOrder(orderDetails);
                      if (!row) return null;
                      return (
                        <>
                          <p className="text-[#6b7280]">{row.label}</p>
                          <p className="font-medium text-[#111827]">{row.value}</p>
                        </>
                      );
                    })()}
                  </div>
                </section>

                {orderDetails.shipping_address ? (
                  <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                    <div className="border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
                      <p className="text-sm font-semibold text-[#374151]">Shipping address</p>
                    </div>
                    <div className="px-4 py-3 text-sm">
                      <p className="font-medium text-[#111827]">{orderDetails.shipping_address}</p>
                    </div>
                  </section>
                ) : null}

                <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                  <div className="border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
                    <p className="text-sm font-semibold text-[#374151]">Items</p>
                  </div>
                  <div className="space-y-3 px-4 py-3">
                    {orderDetails.items.map((item) => (
                      <div key={item.id} className="rounded-lg border border-[#eef2f7] bg-[#fafcff] p-3">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {item.item_image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.item_image_url}
                                alt={item.item_name}
                                className="h-12 w-12 rounded-full border border-[#e5e7eb] object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e2e8f0] text-sm font-semibold text-[#334155]">
                                {getNameInitial(item.item_name)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-[#111827]">{item.item_name}</p>
                              <p className="text-xs text-[#6b7280]">
                                {toTitleCase(item.item_type)} - Qty {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#111827]">
                              {formatDashboardMoney(
                                orderItemPricesAllSame(item)
                                  ? item.original_price ?? item.unit_price
                                  : item.unit_price,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-2 text-xs sm:grid-cols-2">
                          <p className="text-[#6b7280]">Quantity</p>
                          <p className="font-medium text-[#111827]">{item.quantity}</p>
                          {orderItemPricesAllSame(item) ? (
                            <>
                              <p className="text-[#6b7280]">Original price</p>
                              <p className="font-medium text-[#111827]">
                                {formatDashboardMoney(item.original_price ?? item.unit_price)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-[#6b7280]">Unit price</p>
                              <p className="font-medium text-[#111827]">
                                {formatDashboardMoney(item.unit_price)}
                              </p>
                              <p className="text-[#6b7280]">Offer price</p>
                              <p className="font-medium text-[#111827]">
                                {parsePriceAmount(item.offer_price) != null
                                  ? formatDashboardMoney(item.offer_price!)
                                  : '—'}
                              </p>
                              <p className="text-[#6b7280]">Original price</p>
                              <p className="font-medium text-[#111827]">
                                {parsePriceAmount(item.original_price) != null
                                  ? formatDashboardMoney(item.original_price!)
                                  : '—'}
                              </p>
                            </>
                          )}
                          {item.coupon_value ? (
                            <>
                              <p className="text-[#6b7280]">Coupon value</p>
                              <p className="font-medium text-[#111827]">
                                {formatOrderItemCouponValue(item.coupon_value, item.discount_type)}
                              </p>
                            </>
                          ) : null}
                          {item.offer_id ? (
                            <>
                              <p className="text-[#6b7280]">Offer ID</p>
                              <p className="font-medium text-[#111827]">{item.offer_id}</p>
                            </>
                          ) : null}
                          {item.created_at ? (
                            <>
                              <p className="text-[#6b7280]">Created at</p>
                              <p className="font-medium text-[#111827]">{item.created_at}</p>
                            </>
                          ) : null}
                          {item.discount_type ? (
                            <>
                              <p className="text-[#6b7280]">Discount type</p>
                              <p className="font-medium text-[#111827]">
                                {formatOrderItemDiscountTypeLabel(item.discount_type)}
                              </p>
                            </>
                          ) : null}
                        </div>

                        <div className="mt-3 border-t border-[#eef2f7] pt-3 text-xs leading-relaxed">
                          {(() => {
                            const b = getOrderItemCouponLineBreakdown(item);
                            if (b.kind === 'none') {
                              return (
                                <p className="text-[#6b7280]">
                                  Line total ×{b.qty} {formatDashboardMoney(b.gross)}
                                </p>
                              );
                            }
                            const pctLabel = formatOrderItemCouponValue(
                              item.coupon_value,
                              item.discount_type,
                            );
                            if (b.kind === 'percentage') {
                              return (
                                <>
                                  <p className="text-[#6b7280]">Subtotal after coupon</p>
                                  <p className="mt-0.5 text-[#374151]">
                                    {formatDashboardMoney(b.gross)} - {pctLabel} =
                                  </p>
                                  <p className="mt-0.5 text-sm font-semibold text-[#111827]">
                                    {formatDashboardMoney(b.after)}
                                  </p>
                                </>
                              );
                            }
                            return (
                              <>
                                <p className="text-[#6b7280]">Subtotal after coupon</p>
                                <p className="mt-0.5 text-[#374151]">
                                  {formatDashboardMoney(b.gross)} -{' '}
                                  {formatDashboardMoney(b.discount)} =
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-[#111827]">
                                  {formatDashboardMoney(b.after)}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                  <div className="border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
                    <p className="text-sm font-semibold text-[#374151]">Payment summary</p>
                  </div>
                  <div className="space-y-2 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6b7280]">Subtotal</span>
                      <span className="font-medium text-[#111827]">{formatDashboardMoney(orderDetails.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6b7280]">Subtotal after coupon</span>
                      <span className="font-medium text-[#111827]">
                        {formatDashboardMoney(orderDetails.subtotal_after_coupon)}
                      </span>
                    </div>
                    {Number(orderDetails.delivery_fee) > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-[#6b7280]">Delivery fee</span>
                        <span className="font-medium text-[#111827]">{formatDashboardMoney(orderDetails.delivery_fee)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <span className="text-[#6b7280]">Tax</span>
                      <span className="font-medium text-[#111827]">{formatDashboardMoney(orderDetails.tax)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-2">
                      <span className="font-semibold text-[#111827]">Total</span>
                      <span className="text-base font-semibold text-[#111827]">
                        {formatDashboardMoney(orderDetails.total)}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            ) : null}
            </div>

            {viewOrderId &&
            orderDetails?.order_id === viewOrderId &&
            orderDetails.status === 'pending' ? (
              <div className="shrink-0 border-t border-[#e5e7eb] bg-[#fafafa] px-4 py-2.5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleMoveAwayFromDrawer()}
                    disabled={mutationBusy}
                    className="inline-flex items-center justify-center rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isMovingAway ? 'Updating...' : 'Mark as on the way'}
                  </button>
                </div>
              </div>
            ) : null}
            {viewOrderId &&
            orderDetails?.order_id === viewOrderId &&
            isOrderOnTheWay(orderDetails.status) ? (
              <div className="shrink-0 border-t border-[#e5e7eb] bg-[#fafafa] px-4 py-2.5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleDeliverFromDrawer()}
                    disabled={mutationBusy}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDelivering ? 'Updating...' : 'Mark delivered'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {awayDialog ? (
        <div className="fixed inset-0 z-130 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Mark order as on the way</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              This sets the order to <span className="font-medium text-[#111111]">on the way</span> (only allowed while
              status is pending). Order{' '}
              <span className="font-semibold text-[#111111]">{awayDialog.orderNumber}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAwayDialog(null)}
                disabled={mutationBusy}
                className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmAway()}
                disabled={mutationBusy}
                className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-70"
              >
                {isMovingAway ? 'Updating...' : 'Yes, mark as on the way'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deliverDialog ? (
        <div className="fixed inset-0 z-130 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Mark order delivered</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              This sets the order to <span className="font-medium text-[#111111]">delivered</span> (only allowed
              while status is on the way). Order{' '}
              <span className="font-semibold text-[#111111]">{deliverDialog.orderNumber}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeliverDialog(null)}
                disabled={mutationBusy}
                className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeliver()}
                disabled={mutationBusy}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
              >
                {isDelivering ? 'Updating...' : 'Yes, mark delivered'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
