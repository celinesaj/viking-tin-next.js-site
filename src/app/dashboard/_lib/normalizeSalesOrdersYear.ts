import type {
  DashboardBundleOrdersYearResponse,
  DashboardProductOrdersYearResponse,
  DashboardProductSalesPeriod,
  DashboardProductYearOrderUser,
  DashboardSpecialOfferOrdersYearResponse,
} from '@/app/dashboard/redux/reducers/DashboardSlice/DashboardApiSlice';

/** Uniform order line for chart + table (product / bundle / special-offer APIs). */
export type DashboardSalesYearOrderRowNormalized = {
  order_id: string;
  order_number?: string | null;
  created_at: string;
  status: string;
  user: DashboardProductYearOrderUser;
  unit_price: string;
  payment_method: string | Record<string, unknown>;
  line_quantity: number;
};

export type DashboardSalesYearMonthBucketNormalized = {
  month: string;
  month_number: number;
  label: string;
  period: DashboardProductSalesPeriod;
  order_count: number;
  quantity_sold: number;
  line_revenue: string;
  orders: DashboardSalesYearOrderRowNormalized[];
};

export type DashboardSalesYearDataNormalized = {
  entityTitle: string;
  year: number;
  completed_statuses: string[];
  months: DashboardSalesYearMonthBucketNormalized[];
};

function mapOrder(o: {
  order_id: string;
  order_number?: string | null;
  created_at: string;
  status: string;
  user: DashboardProductYearOrderUser;
  unit_price: string;
  payment_method: string | Record<string, unknown>;
  line_quantity: number;
}): DashboardSalesYearOrderRowNormalized {
  return {
    order_id: o.order_id,
    order_number: o.order_number,
    created_at: o.created_at,
    status: o.status,
    user: o.user,
    unit_price: o.unit_price,
    payment_method: o.payment_method,
    line_quantity: o.line_quantity,
  };
}

export function normalizeProductOrdersYearResponse(
  data: DashboardProductOrdersYearResponse | undefined,
): DashboardSalesYearDataNormalized | undefined {
  if (!data) return undefined;
  return {
    entityTitle: data.product_name,
    year: data.year,
    completed_statuses: data.completed_statuses,
    months: data.months.map((m) => ({
      ...m,
      orders: m.orders.map((o) =>
        mapOrder({
          ...o,
          line_quantity: o.quantity_for_product,
        }),
      ),
    })),
  };
}

export function normalizeBundleOrdersYearResponse(
  data: DashboardBundleOrdersYearResponse | undefined,
): DashboardSalesYearDataNormalized | undefined {
  if (!data) return undefined;
  return {
    entityTitle: data.bundle_name,
    year: data.year,
    completed_statuses: data.completed_statuses,
    months: data.months.map((m) => ({
      ...m,
      orders: m.orders.map((o) =>
        mapOrder({
          order_id: o.order_id,
          order_number: o.order_number,
          created_at: o.created_at,
          status: o.status,
          user: o.user,
          unit_price: o.unit_price,
          payment_method: o.payment_method,
          line_quantity: o.quantity_for_bundle,
        }),
      ),
    })),
  };
}

export function normalizeSpecialOfferOrdersYearResponse(
  data: DashboardSpecialOfferOrdersYearResponse | undefined,
): DashboardSalesYearDataNormalized | undefined {
  if (!data) return undefined;
  return {
    entityTitle: data.special_offer_name,
    year: data.year,
    completed_statuses: data.completed_statuses,
    months: data.months.map((m) => ({
      ...m,
      orders: m.orders.map((o) =>
        mapOrder({
          order_id: o.order_id,
          order_number: o.order_number,
          created_at: o.created_at,
          status: o.status,
          user: o.user,
          unit_price: o.unit_price,
          payment_method: o.payment_method,
          line_quantity: o.quantity_for_special_offer,
        }),
      ),
    })),
  };
}
