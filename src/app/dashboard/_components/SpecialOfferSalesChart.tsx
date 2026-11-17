'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import DashboardSalesBarChartSection, {
  coerceDashboardImageUrl,
  ellipsizeSalesName,
  type DashboardSalesBarChartRow,
} from '@/app/dashboard/_components/DashboardSalesBarChartSection';
import { useGetDashboardSpecialOfferSalesQuery } from '@/app/dashboard/redux/reducers/DashboardSlice/DashboardApiSlice';

export default function SpecialOfferSalesChart() {
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

  const { data, isLoading, isError, refetch, isFetching } =
    useGetDashboardSpecialOfferSalesQuery(queryArg, { skip: partialDates });

  const effectiveData = partialDates ? undefined : data;

  const chartRows: DashboardSalesBarChartRow[] = useMemo(() => {
    const offers = effectiveData?.special_offers ?? [];
    return [...offers]
      .map((o) => ({
        id: o.special_offer_id,
        name: o.name,
        label: ellipsizeSalesName(o.name),
        lineRevenue: Number(o.line_revenue) || 0,
        quantity_sold: o.quantity_sold,
        completed_order_count: o.completed_order_count,
        imageUrl: coerceDashboardImageUrl(o.image_url),
      }))
      .sort((a, b) => b.lineRevenue - a.lineRevenue);
  }, [effectiveData?.special_offers]);

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
      title="Per-special-offer sales (completed orders)"
      description={
        <>
          Special-offer line revenue — Σ (quantity × unit price) for offer lines (
          <span className="font-medium text-[#374151]">item_type=special_offer</span>). Same
          completed-order rules as product sales. Click a bar to open monthly completed-order breakdown
          for that offer.
        </>
      }
      emptyMessage="No special-offer sales in this period."
      loadingMessage="Loading special-offer sales…"
      errorMessage="Failed to load special-offer sales."
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
        router.push(`/dashboard/analytics/special-offer/${id}${qs ? `?${qs}` : ''}`);
      }}
    />
  );
}
