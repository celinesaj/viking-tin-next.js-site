'use client';

import Link from 'next/link';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowLeft, X } from 'lucide-react';
import type {
  DashboardSalesYearDataNormalized,
  DashboardSalesYearMonthBucketNormalized,
  DashboardSalesYearOrderRowNormalized,
} from '@/app/dashboard/_lib/normalizeSalesOrdersYear';
import { formatDashboardMoney } from '@/lib/formatDashboardMoney';

function utcYearNow(): number {
  return new Date().getUTCFullYear();
}

function utcMonth1to12Now(): number {
  return new Date().getUTCMonth() + 1;
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Line + marker stroke (terracotta); markers use white fill + this stroke */
const CHART_ACCENT = '#b4532a';

function utcYearOptions(count = 14): number[] {
  const y = utcYearNow();
  return Array.from({ length: count }, (_, i) => y - i);
}

function formatPersonName(name: string | Record<string, unknown> | null): string {
  if (typeof name === 'string' && name.trim()) return name.trim();
  if (name && typeof name === 'object' && !Array.isArray(name)) {
    for (const v of Object.values(name)) {
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return '—';
}

function formatPaymentMethod(
  pm: DashboardSalesYearOrderRowNormalized['payment_method'],
): string {
  let raw = '';
  if (typeof pm === 'string' && pm.trim()) raw = pm.trim();
  else if (pm && typeof pm === 'object' && !Array.isArray(pm)) {
    for (const v of Object.values(pm)) {
      if (typeof v === 'string' && v.trim()) {
        raw = v.trim();
        break;
      }
    }
  }
  if (!raw) return '—';
  const key = raw.toLowerCase().replace(/-/g, '_');
  if (key === 'cod') return 'cash_on_delivery';
  return raw;
}

function formatCount(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

function daysInUtcMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/** Every UTC calendar day in the month — includes zeros; orderCount = distinct order_id per day. */
function buildFullMonthDailySeries(
  year: number,
  month1to12: number,
  bucket: DashboardSalesYearMonthBucketNormalized | null | undefined,
): Array<{
  dayOfMonth: number;
  utcDate: string;
  orderCount: number;
  quantity: number;
  orderRows: DashboardSalesYearOrderRowNormalized[];
}> {
  const lastDay = daysInUtcMonth(year, month1to12);
  const yy = String(year);
  const mm = String(month1to12).padStart(2, '0');

  const byDom = new Map<
    number,
    {
      quantity: number;
      orderRows: DashboardSalesYearOrderRowNormalized[];
      orderIds: Set<string>;
    }
  >();

  for (let d = 1; d <= lastDay; d++) {
    byDom.set(d, { quantity: 0, orderRows: [], orderIds: new Set() });
  }

  for (const o of bucket?.orders ?? []) {
    const utc = new Date(o.created_at);
    const dom = utc.getUTCDate();
    const cell = byDom.get(dom);
    if (!cell) continue;
    cell.quantity += o.line_quantity;
    cell.orderRows.push(o);
    cell.orderIds.add(o.order_id);
  }

  const rows: Array<{
    dayOfMonth: number;
    utcDate: string;
    orderCount: number;
    quantity: number;
    orderRows: DashboardSalesYearOrderRowNormalized[];
  }> = [];

  for (let d = 1; d <= lastDay; d++) {
    const cell = byDom.get(d)!;
    const utcDate = `${yy}-${mm}-${String(d).padStart(2, '0')}`;
    rows.push({
      dayOfMonth: d,
      utcDate,
      orderCount: cell.orderIds.size,
      quantity: cell.quantity,
      orderRows: [...cell.orderRows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    });
  }
  return rows;
}

/** Y-axis top tick from peak daily order count (minimum span so zeros read clearly). */
function ordersAxisCeiling(maxOrdersPerDay: number): number {
  if (maxOrdersPerDay <= 0) return 4;
  const padded = Math.ceil(maxOrdersPerDay * 1.15);
  return Math.max(4, padded);
}

function xAxisTickDays(lastDay: number): number[] {
  return Array.from({ length: lastDay }, (_, i) => i + 1);
}

function customerLine(order: DashboardSalesYearOrderRowNormalized): string {
  const name = formatPersonName(order.user?.name);
  const email = order.user?.email?.trim() || '';
  if (name !== '—' && email) return `${name} (${email})`;
  if (email) return email;
  return name;
}

/** Maps analytics row status → GET /checkout/admin/orders `status` query (defaults to delivered). */
function ordersFilterParamForProductRow(statusRaw: string): string {
  const s = statusRaw.trim().toLowerCase().replace(/\s+/g, '_');
  if (s === 'away') return 'on_the_way';
  if (s === 'approved') return 'delivered';
  if (['pending', 'on_the_way', 'delivered', 'paid', 'failed'].includes(s)) return s;
  return 'delivered';
}

function dashboardOrdersHrefForAnalyticsRow(row: DashboardSalesYearOrderRowNormalized): string {
  const token = String(row.order_number ?? row.order_id).trim();
  const params = new URLSearchParams({
    status: ordersFilterParamForProductRow(row.status),
    order_number: token,
  });
  return `/dashboard/orders?${params.toString()}`;
}

/** One chart point (full month series row + tooltip label). */
type SalesDailyChartRow = {
  utcDate: string;
  tooltipTitle: string;
  orderCount: number;
  quantity: number;
  orderRows: DashboardSalesYearOrderRowNormalized[];
  sequenceIndex?: number;
};

/** Pinned panel anchored to the clicked dot (viewport px), like the hover tooltip. */
type ChartDayPinState =
  | { open: false }
  | {
      open: true;
      utcDate: string;
      anchorLeft: number;
      anchorTop: number;
      flipBelow: boolean;
    };

function DayOrdersPanelBody({
  row,
  interactive,
}: {
  row: SalesDailyChartRow;
  interactive: boolean;
}) {
  const orders = row.orderRows ?? [];
  const oc = row.orderCount;
  return (
    <>
      <p className="font-semibold text-[#3d291c]">{row.tooltipTitle}</p>
      <p className="mt-0.5 font-mono text-[10px] text-[#9ca3af]">{row.utcDate} UTC</p>
      <p className="mt-1 text-[11px] text-[#7c665c]">
        {formatCount(oc)} order{oc === 1 ? '' : 's'} · {formatCount(row.quantity)} units
      </p>
      {!interactive ? (
        <p className="mt-2 border-t border-[#ebe5e0] pt-2 text-[10px] text-[#9ca3af]">
          Double-click this day on the chart to pin the panel and open order links.
        </p>
      ) : null}
      {orders.length === 0 ? (
        <p className="mt-2 text-[11px] text-[#9ca3af]">No rows.</p>
      ) : (
        <div
          className="mt-2 max-h-52 space-y-2 overflow-y-auto overscroll-contain border-t border-[#ebe5e0] pt-2 pr-1"
          role="list"
          aria-label="Orders this UTC day"
          onWheel={(e) => e.stopPropagation()}
        >
          {orders.map((o) =>
            interactive ? (
              <Link
                key={`${o.order_id}-${o.created_at}`}
                href={dashboardOrdersHrefForAnalyticsRow(o)}
                prefetch={false}
                role="listitem"
                className="block rounded-lg bg-white/90 px-2 py-1.5 shadow-[inset_0_0_0_1px_#f0e8e4] transition-colors hover:bg-[#fff8f5] hover:shadow-[inset_0_0_0_1px_#e8d5cc]"
              >
                <p className="font-medium leading-snug text-[#3d291c]">{customerLine(o)}</p>
                <p className="mt-0.5 tabular-nums text-[11px] text-[#5c4d45]">
                  Qty {formatCount(o.line_quantity)} · {formatDashboardMoney(o.unit_price)} / unit
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-[#b4532a] underline decoration-[#b4532a]/35 underline-offset-2">
                  Order #{o.order_number ?? o.order_id} — open in Orders
                </p>
              </Link>
            ) : (
              <div
                key={`${o.order_id}-${o.created_at}`}
                role="listitem"
                className="rounded-lg bg-white/90 px-2 py-1.5 shadow-[inset_0_0_0_1px_#f0e8e4]"
              >
                <p className="font-medium leading-snug text-[#3d291c]">{customerLine(o)}</p>
                <p className="mt-0.5 tabular-nums text-[11px] text-[#5c4d45]">
                  Qty {formatCount(o.line_quantity)} · {formatDashboardMoney(o.unit_price)} / unit
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-[#9ca3af]">
                  Order #{o.order_number ?? o.order_id}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </>
  );
}

export type SalesOrdersYearViewProps = {
  normalized: DashboardSalesYearDataNormalized | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
  entityKindLabel: string;
  ordersLinesLabel: string;
  loadingMessage: string;
  errorMessage: string;
  emptyMonthMessage: string;
  selectedYear: number;
  setSelectedYear: Dispatch<SetStateAction<number>>;
  selectedMonth1to12: number;
  setSelectedMonth1to12: Dispatch<SetStateAction<number>>;
};

export default function SalesOrdersYearView({
  normalized,
  isLoading,
  isError,
  isFetching,
  refetch,
  entityKindLabel,
  ordersLinesLabel,
  loadingMessage,
  errorMessage,
  emptyMonthMessage,
  selectedYear,
  setSelectedYear,
  selectedMonth1to12,
  setSelectedMonth1to12,
}: SalesOrdersYearViewProps) {
  const entityTitle = normalized?.entityTitle ?? entityKindLabel;

  const yearTotals = useMemo(() => {
    const months = normalized?.months ?? [];
    let order_count = 0;
    let quantity_sold = 0;
    let line_revenue = 0;
    for (const m of months) {
      order_count += m.order_count;
      quantity_sold += m.quantity_sold;
      line_revenue += Number(m.line_revenue) || 0;
    }
    return { order_count, quantity_sold, line_revenue };
  }, [normalized?.months]);

  const selectedBucket =
    normalized?.months?.find((m) => m.month_number === selectedMonth1to12) ?? null;
  const ordersForMonth = selectedBucket?.orders ?? [];

  /** Same month as bottom tabs; includes every UTC day (zeros where no orders). */
  const dailySeries = useMemo(() => {
    if (!normalized || normalized.year !== selectedYear) return [];
    const bucket =
      normalized.months?.find((m) => m.month_number === selectedMonth1to12) ?? null;
    const rows = buildFullMonthDailySeries(normalized.year, selectedMonth1to12, bucket);
    return rows.map((d, i) => ({
      ...d,
      sequenceIndex: i,
      tooltipTitle: new Date(d.utcDate + 'T12:00:00.000Z').toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    }));
  }, [normalized, selectedMonth1to12, selectedYear]);

  const lastDayOfMonth = normalized
    ? daysInUtcMonth(normalized.year, selectedMonth1to12)
    : 31;
  const maxOrdersPerDay = useMemo(
    () => Math.max(0, ...dailySeries.map((d) => d.orderCount)),
    [dailySeries]
  );
  const yAxisMax = useMemo(() => ordersAxisCeiling(maxOrdersPerDay), [maxOrdersPerDay]);
  const xTicks = useMemo(() => xAxisTickDays(lastDayOfMonth), [lastDayOfMonth]);

  const [chartPin, setChartPin] = useState<ChartDayPinState>({ open: false });
  /** Positions the pinned panel relative to this chart plot wrapper (not the viewport). */
  const chartPinPanelRootRef = useRef<HTMLDivElement>(null);

  const pinnedRow = useMemo(() => {
    if (!chartPin.open) return null;
    return dailySeries.find((d) => d.utcDate === chartPin.utcDate) ?? null;
  }, [chartPin, dailySeries]);

  const pinPanelActive = chartPin.open && pinnedRow !== null;

  useEffect(() => {
    if (!chartPin.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChartPin({ open: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chartPin.open]);

  const clearChartPin = () => setChartPin({ open: false });

  const togglePinDay = (
    row: SalesDailyChartRow,
    anchorLeftViewport: number,
    anchorTopViewport: number,
  ) => {
    const root = chartPinPanelRootRef.current;
    if (!root) return;

    setChartPin((p) => {
      if (p.open && p.utcDate === row.utcDate) {
        return { open: false };
      }
      const cr = root.getBoundingClientRect();
      const anchorLeft = anchorLeftViewport - cr.left + root.scrollLeft;
      const anchorTop = anchorTopViewport - cr.top + root.scrollTop;
      /** Prefer opening below the point when the dot is high in the chart area. */
      const flipBelow = anchorTop < 100;
      return {
        open: true,
        utcDate: row.utcDate,
        anchorLeft,
        anchorTop,
        flipBelow,
      };
    });
  };

  const yearOptions = useMemo(() => utcYearOptions(14), []);

  const applyYearFromDropdown = (y: number) => {
    clearChartPin();
    setSelectedYear(y);
    if (y === utcYearNow()) {
      setSelectedMonth1to12(utcMonth1to12Now());
    } else {
      setSelectedMonth1to12((m) => Math.min(m, 12));
    }
  };

  const goCurrentYear = () => {
    clearChartPin();
    const y = utcYearNow();
    setSelectedYear(y);
    setSelectedMonth1to12(utcMonth1to12Now());
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/analytics"
          className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f8fafc]"
        >
          <ArrowLeft size={16} aria-hidden />
          Analytics
        </Link>
      </div>

      {isLoading && !normalized ? (
        <div className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-6 text-sm text-[#6b7280]">
          {loadingMessage}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-[#fecaca] bg-[#fff1f2] p-5 text-sm text-[#991b1b]">
          {errorMessage}
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-3 rounded-md border border-[#fecaca] bg-white px-2 py-1 text-xs font-medium text-[#991b1b]"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && normalized ? (
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">{entityKindLabel}</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#111111]">{entityTitle}</h2>
          <p className="text-sm text-[#6b7280]">
            Completed orders only ({normalized.completed_statuses.join(', ') || '—'}). Pick a month below:
            the chart shows <span className="font-medium text-[#374151]">distinct orders per UTC day</span>{' '}
            (every day of the month on the horizontal axis); the orders table matches the same month.
          </p>
        </header>
      ) : null}

      {!isLoading && !isError && normalized ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5 shadow-[0_2px_12px_rgba(17,17,17,0.04)]">
              <p className="text-sm text-[#6b7280]">
                Orders ({normalized.year}, {ordersLinesLabel})
              </p>
              <p className="mt-3 text-2xl font-semibold">{formatCount(yearTotals.order_count)}</p>
            </article>
            <article className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5 shadow-[0_2px_12px_rgba(17,17,17,0.04)]">
              <p className="text-sm text-[#6b7280]">Units sold ({normalized.year})</p>
              <p className="mt-3 text-2xl font-semibold">{formatCount(yearTotals.quantity_sold)}</p>
            </article>
            <article className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5 shadow-[0_2px_12px_rgba(17,17,17,0.04)]">
              <p className="text-sm text-[#6b7280]">Line revenue ({normalized.year})</p>
              <p className="mt-3 text-2xl font-semibold">
                {formatDashboardMoney(yearTotals.line_revenue)}
              </p>
            </article>
          </section>

          <section className="overflow-visible rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] shadow-[0_2px_12px_rgba(17,17,17,0.04)]">
            <div className="border-b border-[#e5e7eb] px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[#111111]">
                    Daily orders —{' '}
                    {selectedBucket?.label ?? `${MONTH_SHORT[selectedMonth1to12 - 1]} ${normalized.year}`}
                  </h3>
                  <p className="mt-1 text-[11px] text-[#9ca3af]">
                    Hover for a preview. Double-click a point to pin the panel (scroll and links). Esc or close clears it.
                  </p>
                </div>
                <label className="flex shrink-0 flex-col gap-1 sm:items-end">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">
                    Year (UTC)
                  </span>
                  <select
                    value={selectedYear}
                    onChange={(e) => applyYearFromDropdown(Number(e.target.value))}
                    aria-label="Calendar year (UTC)"
                    className="min-w-34 cursor-pointer rounded-lg border border-[#e5e7eb] bg-white py-2.5 pl-3 pr-9 text-sm font-semibold text-[#111111] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] focus:border-[#b4532a] focus:outline-none focus:ring-2 focus:ring-[#b4532a]/25"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.65rem center',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                    }}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="relative flex w-full flex-col bg-white">
              <div
                className="relative min-h-0 w-full"
                style={{ minHeight: 'min(52vh, 520px)' }}
              >
                  <div className="absolute inset-0 p-3 sm:p-4">
                    {dailySeries.length === 0 ? (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white px-4 text-center text-sm text-[#6b7280]">
                        Chart data not ready.
                      </div>
                    ) : (
                      <div
                        ref={chartPinPanelRootRef}
                        className="relative h-full w-full min-h-[260px] overflow-visible"
                      >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={dailySeries}
                          margin={{
                            top: 20,
                            right: 16,
                            left: 4,
                            bottom: lastDayOfMonth > 20 ? 52 : 38,
                          }}
                        >
                          <XAxis
                            dataKey="dayOfMonth"
                            type="number"
                            domain={[1, lastDayOfMonth]}
                            ticks={xTicks}
                            allowDecimals={false}
                            interval={0}
                            tick={
                              lastDayOfMonth > 20
                                ? {
                                    fontSize: 9,
                                    fill: '#9ca3af',
                                    angle: -42,
                                    textAnchor: 'end',
                                  }
                                : { fontSize: 10, fill: '#9ca3af' }
                            }
                            axisLine={false}
                            tickLine={false}
                            label={{
                              value: 'Day of month (UTC)',
                              position: 'bottom',
                              offset: lastDayOfMonth > 20 ? 18 : 8,
                              fill: '#9ca3af',
                              fontSize: 11,
                            }}
                          />
                          <YAxis
                            domain={[0, yAxisMax]}
                            allowDecimals={false}
                            width={40}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                            label={{
                              value: 'Orders (distinct / day)',
                              angle: -90,
                              position: 'insideLeft',
                              fill: '#9ca3af',
                              fontSize: 11,
                              style: { textAnchor: 'middle' },
                            }}
                          />
                          {!pinPanelActive ? (
                            <Tooltip
                              trigger="hover"
                              cursor={{ stroke: `${CHART_ACCENT}33`, strokeWidth: 1 }}
                              wrapperStyle={{ outline: 'none', zIndex: 50, pointerEvents: 'none' }}
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const row = payload[0].payload as SalesDailyChartRow;
                                return (
                                  <div className="max-w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[#e8dfd9] bg-[#fdfcfa] px-3 py-2 text-xs shadow-[0_12px_28px_-8px_rgba(90,45,30,0.18)]">
                                    <DayOrdersPanelBody row={row} interactive={false} />
                                  </div>
                                );
                              }}
                            />
                          ) : null}
                          <Line
                            type="linear"
                            dataKey="orderCount"
                            stroke={CHART_ACCENT}
                            strokeWidth={2.25}
                            dot={(dotProps) => {
                              const { cx, cy, payload } = dotProps as {
                                cx?: number;
                                cy?: number;
                                payload?: SalesDailyChartRow;
                              };
                              if (cx === undefined || cy === undefined || !payload) return null;
                              const idx = payload.sequenceIndex ?? 0;
                              const alt = idx % 2 === 1;
                              const oc = payload.orderCount ?? 0;
                              const onPinDoubleClick = (e: {
                                preventDefault(): void;
                                stopPropagation(): void;
                                currentTarget: SVGCircleElement;
                              }) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const r = e.currentTarget.getBoundingClientRect();
                                togglePinDay(
                                  payload,
                                  r.left + r.width / 2,
                                  r.top + r.height / 2,
                                );
                              };
                              const pinned =
                                chartPin.open === true &&
                                chartPin.utcDate === payload.utcDate;
                              if (oc === 0) {
                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={3.25}
                                    fill="#fafafa"
                                    stroke={pinned ? CHART_ACCENT : '#e5e7eb'}
                                    strokeWidth={pinned ? 2 : 1}
                                    className="cursor-pointer"
                                    onDoubleClick={onPinDoubleClick}
                                  />
                                );
                              }
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={alt ? 6.5 : 5.5}
                                  fill="#ffffff"
                                  stroke={CHART_ACCENT}
                                  strokeWidth={pinned ? 3 : alt ? 2.5 : 2}
                                  className="cursor-pointer"
                                  onDoubleClick={onPinDoubleClick}
                                />
                              );
                            }}
                            activeDot={(props) => {
                              const { cx, cy, payload } = props as {
                                cx?: number;
                                cy?: number;
                                payload?: SalesDailyChartRow;
                              };
                              if (cx === undefined || cy === undefined || !payload) return null;
                              const pinned =
                                chartPin.open && chartPin.utcDate === payload.utcDate;
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={8}
                                  fill="#ffffff"
                                  stroke={CHART_ACCENT}
                                  strokeWidth={pinned ? 3 : 2}
                                  className="cursor-pointer"
                                  onDoubleClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const r = e.currentTarget.getBoundingClientRect();
                                    togglePinDay(
                                      payload,
                                      r.left + r.width / 2,
                                      r.top + r.height / 2,
                                    );
                                  }}
                                />
                              );
                            }}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      {chartPin.open === true && pinnedRow ? (
                        <div
                          className="pointer-events-auto absolute z-60 max-h-[min(22rem,calc(100%-1rem))] max-w-[min(22rem,calc(100%-1rem))] overflow-y-auto rounded-xl border border-[#e8dfd9] bg-[#fdfcfa] px-3 py-2 text-xs shadow-[0_12px_28px_-8px_rgba(90,45,30,0.22)]"
                          role="dialog"
                          aria-label={`Pinned orders for ${pinnedRow.utcDate}`}
                          style={{
                            left: chartPin.anchorLeft,
                            top: chartPin.anchorTop,
                            transform: chartPin.flipBelow
                              ? 'translate(-50%, 12px)'
                              : 'translate(-50%, calc(-100% - 12px))',
                          }}
                        >
                          <div className="sticky top-0 z-1 mb-2 flex items-center justify-between gap-2 border-b border-[#ebe5e0] bg-[#fdfcfa] pb-2 pt-0.5">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-[#9ca3af]">
                              Pinned — double-click again to unpin
                            </span>
                            <button
                              type="button"
                              aria-label="Close pinned panel"
                              className="shrink-0 rounded-md p-1 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111]"
                              onClick={clearChartPin}
                            >
                              <X size={16} aria-hidden />
                            </button>
                          </div>
                          <DayOrdersPanelBody row={pinnedRow} interactive />
                        </div>
                      ) : null}
                      </div>
                    )}
                  </div>
              </div>
            </div>

            <div
              className="sticky bottom-0 z-30 shrink-0 border-t-2 border-[#e5e7eb] bg-[#fafafa] px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_28px_-8px_rgba(0,0,0,0.08)]"
            >
              <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wide text-[#9ca3af]">
                Month (UTC) — chart and orders
              </p>
              <nav
                className="-mx-1 flex flex-nowrap gap-1 overflow-x-auto px-1 pb-1 sm:justify-center sm:gap-2"
                role="tablist"
                aria-label="Select month (UTC)"
              >
                {MONTH_SHORT.map((label, i) => {
                  const monthNum = i + 1;
                  const active = selectedMonth1to12 === monthNum;
                  return (
                    <span
                      key={label}
                      role="tab"
                      aria-selected={active}
                      tabIndex={active ? 0 : -1}
                      className={`shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-2 py-2 text-sm transition-colors select-none sm:px-3 ${
                        active
                          ? 'border-[#b4532a] font-semibold text-[#3d291c]'
                          : 'border-transparent text-[#6b7280] hover:border-[#d6cfc9] hover:text-[#374151]'
                      }`}
                      onClick={() => {
                        clearChartPin();
                        setSelectedMonth1to12(monthNum);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          clearChartPin();
                          setSelectedMonth1to12(monthNum);
                        }
                      }}
                    >
                      {label}
                    </span>
                  );
                })}
              </nav>
              <div className="mt-2 flex justify-center border-t border-[#f3f4f6] pt-2">
                <span
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer text-xs font-medium text-[#b4532a] underline decoration-[#b4532a]/40 underline-offset-2 hover:decoration-[#b4532a]"
                  onClick={goCurrentYear}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goCurrentYear();
                    }
                  }}
                >
                  Current year &amp; month
                </span>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-[#F7F7F7]">
            <div className="border-b border-[#e5e7eb] bg-white/80 px-4 py-3">
              <h3 className="text-sm font-semibold text-[#111111]">
                Orders — {selectedBucket?.label ?? MONTH_SHORT[selectedMonth1to12 - 1]}{' '}
                {selectedYear}
              </h3>
              {selectedBucket ? (
                <p className="mt-1 text-xs text-[#6b7280]">
                  {formatCount(selectedBucket.order_count)} orders ·{' '}
                  {formatCount(selectedBucket.quantity_sold)} units ·{' '}
                  {formatDashboardMoney(Number(selectedBucket.line_revenue) || 0)} line revenue
                </p>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb] text-xs uppercase tracking-wide text-[#6b7280]">
                    <th className="px-4 py-3 font-medium">Placed (UTC)</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium text-right">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersForMonth.map((row) => (
                    <tr
                      key={`${row.order_id}-${row.created_at}`}
                      className="border-b border-[#f3f4f6] bg-white/60 last:border-0 hover:bg-white"
                    >
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[#374151]">
                        {new Date(row.created_at).toLocaleString('en-GB', {
                          timeZone: 'UTC',
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link
                          href={dashboardOrdersHrefForAnalyticsRow(row)}
                          prefetch={false}
                          className="text-[#b4532a] underline decoration-[#b4532a]/35 underline-offset-2 hover:decoration-[#b4532a]"
                        >
                          {row.order_number ?? row.order_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#111111]">
                        {formatPersonName(row.user?.name)}
                      </td>
                      <td className="px-4 py-3 text-[#374151]">{row.user?.email ?? '—'}</td>
                      <td className="px-4 py-3 text-[#374151]">{row.status}</td>
                      <td className="px-4 py-3 text-[#374151]">{formatPaymentMethod(row.payment_method)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#374151]">
                        {formatCount(row.line_quantity)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#374151]">
                        {formatDashboardMoney(row.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!ordersForMonth.length ? (
              <p className="px-4 py-6 text-center text-sm text-[#6b7280]">
                {emptyMonthMessage}
              </p>
            ) : null}
          </section>
        </>
      ) : null}

      {isFetching && !isLoading ? (
        <p className="text-xs text-[#9ca3af]">Refreshing…</p>
      ) : null}
    </div>
  );
}
