'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import DashboardSalesBarChartSection, {
  coerceDashboardImageUrl,
  ellipsizeSalesName,
  type DashboardSalesBarChartRow,
} from '@/app/dashboard/_components/DashboardSalesBarChartSection';
import { useGetDashboardProductSalesQuery } from '@/app/dashboard/redux/reducers/DashboardSlice/DashboardApiSlice';

export default function ProductSalesChart() {
  const router = useRouter();
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  /** When null, request all-time stats (no query params). Otherwise filter by UTC dates. */
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    if (!draftFrom && !draftTo) {
      setRange((r) => (r ? null : r));
    }
  }, [draftFrom, draftTo]);

  const partialDates = Boolean(draftFrom) !== Boolean(draftTo);
  const queryArg = range ? { from: range.from, to: range.to } : undefined;

  const { data, isLoading, isError, refetch, isFetching } = useGetDashboardProductSalesQuery(
    queryArg,
    { skip: partialDates }
  );

  const effectiveData = partialDates ? undefined : data;

  const chartRows: DashboardSalesBarChartRow[] = useMemo(() => {
    const products = effectiveData?.products ?? [];
    return [...products]
      .map((p) => ({
        id: p.product_id,
        name: p.name,
        label: ellipsizeSalesName(p.name),
        lineRevenue: Number(p.line_revenue) || 0,
        quantity_sold: p.quantity_sold,
        completed_order_count: p.completed_order_count,
        imageUrl: coerceDashboardImageUrl(p.cover_image_url),
      }))
      .sort((a, b) => b.lineRevenue - a.lineRevenue);
  }, [effectiveData?.products]);

  const handleApplyRange = () => {
    if (draftFrom && draftTo) {
      setRange({ from: draftFrom, to: draftTo });
    }
  };

  const handleClearRange = () => {
    setDraftFrom('');
    setDraftTo('');
    setRange(null);
  };

  return (
    <DashboardSalesBarChartSection
      title="Per-product sales (completed orders)"
      description={
        <>
          Product line revenue only — Σ (quantity × unit price) for catalog items. Completed =
          delivered (COD) or paid (card). Click a bar to open buyer breakdown for that product.
        </>
      }
      emptyMessage="No product sales in this period."
      loadingMessage="Loading product sales…"
      errorMessage="Failed to load product sales."
      chartRows={chartRows}
      period={effectiveData?.period}
      completedStatuses={effectiveData?.completed_statuses}
      draftFrom={draftFrom}
      draftTo={draftTo}
      onDraftFromChange={setDraftFrom}
      onDraftToChange={setDraftTo}
      onApplyRange={handleApplyRange}
      onClearRange={handleClearRange}
      partialDates={partialDates}
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      refetch={refetch}
      onBarClick={(entry) => {
        const id = encodeURIComponent(entry.id);
        const params = new URLSearchParams();
        if (range?.from && range?.to) {
          params.set('year', range.from.slice(0, 4));
          params.set('month', range.from.slice(5, 7));
        }
        const qs = params.toString();
        router.push(`/dashboard/analytics/product/${id}${qs ? `?${qs}` : ''}`);
      }}
    />
  );
}
