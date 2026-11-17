'use client';

import BrandsTable from '@/app/dashboard/_components/BrandsTable';
import { useGetDashboardOverviewQuery } from '@/app/dashboard/redux/reducers/DashboardSlice/DashboardApiSlice';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDashboardMoney } from '@/lib/formatDashboardMoney';

type KpiCardProps = {
  label: string;
  value: string;
  delta: number;
};

function formatCount(value: string | number): string {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '0';
  return new Intl.NumberFormat('en-US').format(numeric);
}

function KpiCard({ label, value, delta }: KpiCardProps) {
  const trendText = `${delta >= 0 ? '+' : ''}${delta}% from last period`;

  return (
    <article className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5 shadow-[0_2px_12px_rgba(17,17,17,0.04)]">
      <p className="text-sm text-[#6b7280]">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-[#6b7280]">{trendText}</p>
    </article>
  );
}

type TopSellerCardProps = {
  label: string;
  name: string | null;
  quantity: number | null;
};

function TopSellerCard({ label, name, quantity }: TopSellerCardProps) {
  return (
    <article className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5 shadow-[0_2px_12px_rgba(17,17,17,0.04)]">
      <p className="text-sm text-[#6b7280]">{label}</p>
      <p className="mt-3 text-base font-semibold text-[#111111]">{name ?? 'No data yet'}</p>
      <p className="mt-2 text-xs text-[#6b7280]">
        {quantity !== null ? `${quantity} sold this month` : 'No approved orders this month'}
      </p>
    </article>
  );
}

export default function OverviewContent() {
  const { data, isLoading, isFetching, isError, refetch } = useGetDashboardOverviewQuery();
  const salesTrend = data?.charts?.revenue_trend?.points ?? data?.sales_trend ?? [];
  const ordersComparisonPoints = data?.charts?.orders_comparison?.points ?? [
    { label: 'Current Month', value: Number(data?.summary.orders.current ?? 0) },
    { label: 'Previous Month', value: Number(data?.summary.orders.previous ?? 0) },
  ];
  const customersComparisonPoints = data?.charts?.customers_comparison?.points ?? [
    { label: 'Current Month', value: Number(data?.summary.customers.current ?? 0) },
    { label: 'Previous Month', value: Number(data?.summary.customers.previous ?? 0) },
  ];
  const chartData = salesTrend.map((item) => ({
    ...item,
    revenueValue: Number(item.revenue || 0),
  }));

  return (
    <>
      {isLoading ? (
        <div className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5 text-sm text-[#6b7280]">
          Loading dashboard data...
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-[#fecaca] bg-[#fff1f2] p-5 text-sm text-[#991b1b]">
          Failed to load dashboard metrics.
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-3 rounded-md border border-[#fecaca] bg-white px-2 py-1 text-xs font-medium text-[#991b1b]"
          >
            Retry
          </button>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total Revenue"
          value={formatDashboardMoney(data?.summary.revenue.current ?? 0)}
          delta={data?.summary.revenue.change_percent ?? 0}
        />
        <KpiCard
          label="Orders"
          value={formatCount(data?.summary.orders.current ?? 0)}
          delta={data?.summary.orders.change_percent ?? 0}
        />
        <KpiCard
          label="Customers"
          value={formatCount(data?.summary.customers.current ?? 0)}
          delta={data?.summary.customers.change_percent ?? 0}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TopSellerCard
          label="Top Product"
          name={data?.summary.top_product?.name ?? null}
          quantity={data?.summary.top_product?.quantity_sold ?? null}
        />
        <TopSellerCard
          label="Top Bundle"
          name={data?.summary.top_bundle?.name ?? null}
          quantity={data?.summary.top_bundle?.quantity_sold ?? null}
        />
        <TopSellerCard
          label="Top Special Offer"
          name={data?.summary.top_special_offer?.name ?? null}
          quantity={data?.summary.top_special_offer?.quantity_sold ?? null}
        />
      </section>

      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {data?.charts?.revenue_trend?.title ?? 'Sales Trend'}
          </h2>
          <span className="text-xs text-[#9ca3af]">Last 12 months</span>
        </div>
        <div className="h-72 rounded-2xl border border-[#e5e7eb] bg-white/70 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 16, right: 16, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.42} />
                  <stop offset="65%" stopColor="#22d3ee" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatDashboardMoney(Number(value))}
              />
              <Tooltip
                cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                }}
                formatter={(value) => [formatDashboardMoney(Number(value ?? 0)), 'Revenue']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="revenueValue"
                stroke="#2563eb"
                strokeWidth={3}
                fill="url(#salesTrendFill)"
                dot={{ r: 3, fill: '#0f172a', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
          <h3 className="mb-4 text-sm font-semibold">
            {data?.charts?.orders_comparison?.title ?? 'Orders Comparison'}
          </h3>
          <div className="h-56 rounded-xl border border-[#e5e7eb] bg-white/70 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersComparisonPoints} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [formatCount(Number(value ?? 0)), 'Orders']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {ordersComparisonPoints.map((point, index) => (
                    <Cell key={`${point.label}-${index}`} fill={index === 0 ? '#2563eb' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
          <h3 className="mb-4 text-sm font-semibold">
            {data?.charts?.customers_comparison?.title ?? 'Customers Comparison'}
          </h3>
          <div className="h-56 rounded-xl border border-[#e5e7eb] bg-white/70 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={customersComparisonPoints}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [formatCount(Number(value ?? 0)), 'Customers']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {customersComparisonPoints.map((point, index) => (
                    <Cell key={`${point.label}-${index}`} fill={index === 0 ? '#06b6d4' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {isFetching ? <p className="text-xs text-[#9ca3af]">Refreshing dashboard data...</p> : null}

      <BrandsTable />
    </>
  );
}
