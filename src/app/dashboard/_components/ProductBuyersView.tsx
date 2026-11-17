'use client';

import { useMemo, useState } from 'react';
import SalesOrdersYearView from '@/app/dashboard/_components/SalesOrdersYearView';
import {
  parseInitialMonth1to12,
  parseInitialYear,
} from '@/app/dashboard/_lib/parseAnalyticsYearMonth';
import { normalizeProductOrdersYearResponse } from '@/app/dashboard/_lib/normalizeSalesOrdersYear';
import { useGetDashboardProductOrdersYearQuery } from '@/app/dashboard/redux/reducers/DashboardSlice/DashboardApiSlice';

type ProductBuyersViewProps = {
  productId: string;
  initialFrom?: string;
  initialYear?: number;
  initialMonth?: number;
};

export default function ProductBuyersView({
  productId,
  initialFrom,
  initialYear,
  initialMonth,
}: ProductBuyersViewProps) {
  const defaultYear = useMemo(
    () => parseInitialYear(initialFrom, initialYear),
    [initialFrom, initialYear],
  );

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth1to12, setSelectedMonth1to12] = useState(() =>
    parseInitialMonth1to12(defaultYear, initialFrom, initialMonth),
  );

  const queryArg = useMemo(
    () => ({ productId, year: selectedYear }),
    [productId, selectedYear],
  );

  const { data, isLoading, isError, refetch, isFetching } = useGetDashboardProductOrdersYearQuery(
    queryArg,
    { skip: !productId },
  );

  const normalized = useMemo(() => normalizeProductOrdersYearResponse(data), [data]);

  return (
    <SalesOrdersYearView
      normalized={normalized}
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      refetch={refetch}
      entityKindLabel="Product"
      ordersLinesLabel="product lines"
      loadingMessage="Loading product orders…"
      errorMessage="Could not load orders for this product."
      emptyMonthMessage="No completed orders for this product in this month."
      selectedYear={selectedYear}
      setSelectedYear={setSelectedYear}
      selectedMonth1to12={selectedMonth1to12}
      setSelectedMonth1to12={setSelectedMonth1to12}
    />
  );
}
