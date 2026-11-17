'use client';

import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardProductSalesPeriod } from '@/app/dashboard/redux/reducers/DashboardSlice/DashboardApiSlice';
import { formatDashboardMoney } from '@/lib/formatDashboardMoney';

const NAME_MAX = 32;

export function ellipsizeSalesName(name: string, max = NAME_MAX) {
  const t = name.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export type DashboardSalesBarChartRow = {
  id: string;
  name: string;
  label: string;
  lineRevenue: number;
  quantity_sold: number;
  completed_order_count: number;
  imageUrl?: string | null;
};

export function coerceDashboardImageUrl(raw: unknown): string | null {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

export type DashboardSalesBarChartSectionProps = {
  title: string;
  description: ReactNode;
  emptyMessage: string;
  loadingMessage: string;
  errorMessage: string;
  chartRows: DashboardSalesBarChartRow[];
  period: DashboardProductSalesPeriod | undefined;
  completedStatuses: string[] | undefined;
  draftFrom: string;
  draftTo: string;
  onDraftFromChange: (value: string) => void;
  onDraftToChange: (value: string) => void;
  onApplyRange: () => void;
  onClearRange: () => void;
  partialDates: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
  onBarClick?: (row: DashboardSalesBarChartRow) => void;
};

export default function DashboardSalesBarChartSection({
  title,
  description,
  emptyMessage,
  loadingMessage,
  errorMessage,
  chartRows,
  period,
  completedStatuses,
  draftFrom,
  draftTo,
  onDraftFromChange,
  onDraftToChange,
  onApplyRange,
  onClearRange,
  partialDates,
  isLoading,
  isError,
  isFetching,
  refetch,
  onBarClick,
}: DashboardSalesBarChartSectionProps) {
  const chartHeight = Math.min(1200, Math.max(320, chartRows.length * 40));

  const periodLabel = (() => {
    if (!period) return '';
    const { from, to } = period;
    if (from && to) {
      return `${from} – ${to} (UTC)`;
    }
    return 'All time';
  })();

  return (
    <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <div className="mt-1 text-xs text-[#6b7280]">{description}</div>
          {completedStatuses?.length ? (
            <p className="mt-1 text-xs text-[#9ca3af]">
              Counted statuses: {completedStatuses.join(', ')}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col text-xs text-[#6b7280]">
              From (UTC)
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => onDraftFromChange(e.target.value)}
                className="mt-0.5 rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm text-[#111111]"
              />
            </label>
            <label className="flex flex-col text-xs text-[#6b7280]">
              To (UTC)
              <input
                type="date"
                value={draftTo}
                onChange={(e) => onDraftToChange(e.target.value)}
                className="mt-0.5 rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm text-[#111111]"
              />
            </label>
            <button
              type="button"
              onClick={onApplyRange}
              disabled={!draftFrom || !draftTo}
              className="rounded-lg bg-[#111111] px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Apply range
            </button>
            <button
              type="button"
              onClick={onClearRange}
              className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-medium text-[#374151]"
            >
              All time
            </button>
          </div>
          {partialDates ? (
            <p className="text-xs text-amber-800">Set both dates or clear both for all-time stats.</p>
          ) : null}
        </div>
      </div>

      <p className="mb-3 text-xs text-[#6b7280]">
        <span className="font-medium text-[#374151]">{periodLabel}</span>
        {period?.start && period?.end ? (
          <span className="ml-2 text-[#9ca3af]">
            ({period.start} → {period.end})
          </span>
        ) : null}
      </p>

      {isLoading ? (
        <div className="rounded-xl border border-[#e5e5e5] bg-white/70 p-8 text-sm text-[#6b7280]">
          {loadingMessage}
        </div>
      ) : null}

      {isError && !partialDates ? (
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

      {!isLoading && !isError && !chartRows.length ? (
        <div className="rounded-xl border border-[#e5e5e5] bg-white/70 p-8 text-sm text-[#6b7280]">
          {emptyMessage}
        </div>
      ) : null}

      {!isLoading && !isError && chartRows.length > 0 ? (
        <div
          className="overflow-auto rounded-2xl border border-[#e5e7eb] bg-white/70 p-3"
          style={{ maxHeight: 'min(70vh, 960px)' }}
        >
          <div style={{ height: chartHeight, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartRows}
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatDashboardMoney(Number(v))}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={148}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as DashboardSalesBarChartRow;
                    const img = coerceDashboardImageUrl(row.imageUrl);
                    return (
                      <div className="max-w-[18rem] rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-xs shadow-lg">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnails from admin API
                          <img
                            src={img}
                            alt=""
                            className="mb-2 h-14 w-14 rounded-md border border-[#e5e7eb] object-cover"
                          />
                        ) : null}
                        <p className="font-medium text-[#111111]">{row.name}</p>
                        <p className="mt-1 text-[#111111]">
                          {formatDashboardMoney(row.lineRevenue)}{' '}
                          <span className="text-[#6b7280]">line revenue</span>
                        </p>
                        <p className="mt-1 text-[#6b7280]">
                          {row.quantity_sold} units · {row.completed_order_count} completed orders
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="lineRevenue"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={28}
                  isAnimationActive={false}
                >
                  {chartRows.map((entry) => (
                    <Cell
                      key={entry.id}
                      cursor={onBarClick ? 'pointer' : 'default'}
                      fill="#2563eb"
                      stroke="transparent"
                      strokeWidth={0}
                      onClick={
                        onBarClick
                          ? () => {
                              onBarClick(entry);
                            }
                          : undefined
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {isFetching && !isLoading ? (
        <p className="mt-2 text-xs text-[#9ca3af]">Refreshing…</p>
      ) : null}
    </section>
  );
}
