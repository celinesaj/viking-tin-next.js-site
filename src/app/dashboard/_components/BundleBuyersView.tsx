'use client';

import { useMemo, useState } from 'react';
import SalesOrdersYearView from '@/app/dashboard/_components/SalesOrdersYearView';
import {
  parseInitialMonth1to12,
  parseInitialYear,
} from '@/app/dashboard/_lib/parseAnalyticsYearMonth';
import { normalizeBundleOrdersYearResponse } from '@/app/dashboard/_lib/normalizeSalesOrdersYear';
import { useGetDashboardBundleOrdersYearQuery } from '@/app/dashboard/redux/reducers/DashboardSlice/DashboardApiSlice';

type BundleBuyersViewProps = {
  bundleId: string;
  initialFrom?: string;
  initialYear?: number;
  initialMonth?: number;
};

export default function BundleBuyersView({
  bundleId,
  initialFrom,
  initialYear,
  initialMonth,
}: BundleBuyersViewProps) {
  const defaultYear = useMemo(
    () => parseInitialYear(initialFrom, initialYear),
    [initialFrom, initialYear],
  );

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth1to12, setSelectedMonth1to12] = useState(() =>
    parseInitialMonth1to12(defaultYear, initialFrom, initialMonth),
  );

  const queryArg = useMemo(() => ({ bundleId, year: selectedYear }), [bundleId, selectedYear]);

  const { data, isLoading, isError, refetch, isFetching } = useGetDashboardBundleOrdersYearQuery(
    queryArg,
    { skip: !bundleId },
  );

  const normalized = useMemo(() => normalizeBundleOrdersYearResponse(data), [data]);

  return (
    <SalesOrdersYearView
      normalized={normalized}
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      refetch={refetch}
      entityKindLabel="Bundle"
      ordersLinesLabel="bundle lines"
      loadingMessage="Loading bundle orders…"
      errorMessage="Could not load orders for this bundle."
      emptyMonthMessage="No completed orders for this bundle in this month."
      selectedYear={selectedYear}
      setSelectedYear={setSelectedYear}
      selectedMonth1to12={selectedMonth1to12}
      setSelectedMonth1to12={setSelectedMonth1to12}
    />
  );
}
