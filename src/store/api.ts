import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import { resolveLocalApi } from '@/data/localApi';

const sameOriginQuery = fetchBaseQuery({
  baseUrl: '',
  credentials: 'include',
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const url = typeof args === 'string' ? args : args.url;
  if (url.startsWith('/api/')) {
    return sameOriginQuery(args, api, extraOptions);
  }
  return resolveLocalApi(args);
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 600,
  refetchOnMountOrArgChange: 600,
  tagTypes: [
    'Brand',
    'HeroBanner',
    'StrengthLevel',
    'Flavor',
    'Product',
    'ProductWhyChoose',
    'Bundle',
    'SpecialOffer',
    'BlogCategory',
    'FaqCategory',
    'FaqEntry',
    'BlogPost',
    'Testimonial',
    'ContactInfo',
    'ContactFormSubmission',
    'ContactSocialLink',
    'RelatedItem',
    'Page',
    'Offer',
    'DeliveryZone',
    'TaxRate',
    'ProductReviewAdmin',
    'StorefrontUser',
    'PointOfSale',
    'Reviews',
    'User',
    'Address',
    'DashboardOverview',
    'DashboardProductSales',
    'DashboardBundleSales',
    'DashboardSpecialOfferSales',
    'DashboardProductBuyers',
    'DashboardProductOrdersYear',
    'DashboardBundleOrdersYear',
    'DashboardSpecialOfferOrdersYear',
    'DashboardOrders',
    'DashboardCoupons',
    'DashboardCouponStorefrontUsers',
    'DashboardCouponUsage',
    'AdminAccount',
    'Marquee',
    'Eligibility',
    'FreebieAdminProducts',
    'FreebieAdminConfig',
    'FreebieAdminEligibility',
  ],
  endpoints: () => ({}),
});

export default api;
