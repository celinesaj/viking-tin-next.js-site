'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import DashboardSalesBarChartSection, {
  coerceDashboardImageUrl,
  ellipsizeSalesName,
  type DashboardSalesBarChartRow,
} from '@/app/dashboard/_components/DashboardSalesBarChartSection';
import { useGetDashboardBundleSalesQuery } from '@/app/dashboard/redux/reducers/DashboardSlice/DashboardApiSlice';

export default function BundleSalesChart() {
  const router = useRouter();
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    if (!draftFrom && !draftTo) {
      setRange((r) => (r ? null : r));
    }
  }, [draftFrom, draftTo]);

  const partialDates = Boolean(draftFrom) !== Boolean(draftTo);
  const queryArg = range ? { from: range.from, to: range.to } : undefined;

  const { data, isLoading, isError, refetch, isFetching } = useGetDashboardBundleSalesQuery(
    queryArg,
    { skip: partialDates }
  );

  const effectiveData = partialDates ? undefined : data;

  const chartRows: DashboardSalesBarChartRow[] = useMemo(() => {
    const bundles = effectiveData?.bundles ?? [];
    return [...bundles]
      .map((b) => ({
        id: b.bundle_id,
        name: b.name,
        label: ellipsizeSalesName(b.name),
        lineRevenue: Number(b.line_revenue) || 0,
        quantity_sold: b.quantity_sold,
        completed_order_count: b.completed_order_count,
        imageUrl: coerceDashboardImageUrl(b.image_url),
      }))
      .sort((a, b) => b.lineRevenue - a.lineRevenue);
  }, [effectiveData?.bundles]);

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
      title="Per-bundle sales (completed orders)"
      description={
        <>
          Bundle line revenue — Σ (quantity × unit price) for bundle line items only (
          <span className="font-medium text-[#374151]">item_type=bundle</span>). Same completed-order
          rules as product sales. Click a bar to open monthly completed-order breakdown for that bundle.
        </>
      }
      emptyMessage="No bundle sales in this period."
      loadingMessage="Loading bundle sales…"
      errorMessage="Failed to load bundle sales."
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
        router.push(`/dashboard/analytics/bundle/${id}${qs ? `?${qs}` : ''}`);
      }}
    />
  );
}
