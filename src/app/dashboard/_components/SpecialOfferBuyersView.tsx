'use client';

import { useMemo, useState } from 'react';
import SalesOrdersYearView from '@/app/dashboard/_components/SalesOrdersYearView';
import {
  parseInitialMonth1to12,
  parseInitialYear,
} from '@/app/dashboard/_lib/parseAnalyticsYearMonth';
import { normalizeSpecialOfferOrdersYearResponse } from '@/app/dashboard/_lib/normalizeSalesOrdersYear';
import { useGetDashboardSpecialOfferOrdersYearQuery } from '@/app/dashboard/redux/reducers/DashboardSlice/DashboardApiSlice';

type SpecialOfferBuyersViewProps = {
  specialOfferId: string;
  initialFrom?: string;
  initialYear?: number;
  initialMonth?: number;
};

export default function SpecialOfferBuyersView({
  specialOfferId,
  initialFrom,
  initialYear,
  initialMonth,
}: SpecialOfferBuyersViewProps) {
  const defaultYear = useMemo(
    () => parseInitialYear(initialFrom, initialYear),
    [initialFrom, initialYear],
  );

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth1to12, setSelectedMonth1to12] = useState(() =>
    parseInitialMonth1to12(defaultYear, initialFrom, initialMonth),
  );

  const queryArg = useMemo(
    () => ({ specialOfferId, year: selectedYear }),
    [specialOfferId, selectedYear],
  );

  const { data, isLoading, isError, refetch, isFetching } =
    useGetDashboardSpecialOfferOrdersYearQuery(queryArg, { skip: !specialOfferId });

  const normalized = useMemo(() => normalizeSpecialOfferOrdersYearResponse(data), [data]);

  return (
    <SalesOrdersYearView
      normalized={normalized}
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      refetch={refetch}
      entityKindLabel="Special offer"
      ordersLinesLabel="special-offer lines"
      loadingMessage="Loading special-offer orders…"
      errorMessage="Could not load orders for this special offer."
      emptyMonthMessage="No completed orders for this special offer in this month."
      selectedYear={selectedYear}
      setSelectedYear={setSelectedYear}
      selectedMonth1to12={selectedMonth1to12}
      setSelectedMonth1to12={setSelectedMonth1to12}
    />
  );
}
