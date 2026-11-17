'use client';

import Link from 'next/link';
import toast from 'react-hot-toast';
import { useMemo, useState } from 'react';
import { formatPrice } from '@/lib/PriceFormat';
import { useGetMyOrdersQuery } from '@/features/orders/ordersApi';
import Pagination from '../common/pagination';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useRef } from 'react';
import type { Swiper as SwiperType } from 'swiper';

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatOrderDate(value?: string | null) {
  if (!value) return 'No date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';


  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getStatusClasses(status: string) {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'bg-black text-white';
    case 'failed':
      return 'bg-red-100 text-red-700';
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'on_the_way':
      return 'bg-blue-100 text-blue-700';
    case 'pending':
    default:
      return 'bg-[#f1f1f1] text-black';
  }
}
function getOrdersList(data: any) {
  return Array.isArray(data?.data) ? data.data : [];
}

function getPagination(data: any) {
  return {
    page: toNumber(data?.pagination?.page, 1),
    totalPages: toNumber(data?.pagination?.totalPages, 1),
  };
}

export default function OrderHistoryContent() {
  const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('all');


  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetMyOrdersQuery({
      page,
      limit: 20,
         status: statusFilter !== 'all' ? statusFilter : undefined,
    });

  const orders = useMemo(() => getOrdersList(data), [data]);
  const pagination = useMemo(() => getPagination(data), [data]);

  const handleReorder = (orderId: string) => {
    toast('Reorder flow is not connected yet.');
    console.log('Reorder:', orderId);
  };

  const handleRetry = async () => {
    try {
      await refetch();
    } catch {
      toast.error('Failed to retry fetching orders.');
    }
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isError) {
    let message = 'Failed to load your orders.';

    if (error && typeof error === 'object' && 'data' in error) {
      const err = error as {
        data?: { message?: string | string[] };
      };

      if (Array.isArray(err.data?.message)) {
        message = err.data.message.join(', ');
      } else if (typeof err.data?.message === 'string') {
        message = err.data.message;
      }
    }

    return (
      <div className="w-full max-w-[900px]">
        <Breadcrumb />

        <PageHeader />

        <div className="mt-7 rounded-[20px] border border-red-200 bg-red-50 px-4 py-5 sm:mt-8 sm:rounded-[24px] sm:px-5 md:mt-10 md:px-6 md:py-6">
          <p className="text-[14px] font-medium text-red-700 sm:text-[15px] md:text-[16px]">
            {message}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex h-[40px] min-w-[105px] items-center justify-center rounded-full bg-black px-4 text-[12px] font-semibold uppercase text-white transition hover:opacity-90 sm:h-[42px] sm:min-w-[112px] md:h-[44px] md:min-w-[120px] md:text-[13px]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[900px]">
      <Breadcrumb />

      <PageHeader />

  <StatusFilter
  value={statusFilter}
  onChange={(nextStatus) => {
    setStatusFilter(nextStatus);
    setPage(1);
  }}
/>

      {isLoading ? (
        <div className="mt-8 space-y-3 sm:mt-10 sm:space-y-4 md:mt-12">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-[20px] border border-black/10 bg-white px-4 py-4 sm:rounded-[24px] sm:px-5 md:rounded-[26px] md:px-6 md:py-5"
            >
              <div className="h-5 w-36 rounded bg-black/10" />
              <div className="mt-3 h-4 w-24 rounded bg-black/10" />
              <div className="mt-5 h-8 w-full rounded bg-black/10" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-[20px] border border-black/10 bg-white px-4 py-8 text-center sm:mt-10 sm:rounded-[24px] sm:px-5 md:mt-12 md:rounded-[26px] md:px-6 md:py-10">
          <p className="text-[18px] font-semibold text-black sm:text-[19px] md:text-[20px]">
            No orders found
          </p>
          <p className="mt-2 text-[14px] text-[#8c8c8c] sm:text-[15px] md:text-[16px]">
            You have not placed any orders yet.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`mt-8 space-y-3 sm:mt-10 sm:space-y-4 md:mt-12 ${
              isFetching ? 'opacity-70' : ''
            }`}
          >
            {orders.map((order: any) => {
              const statusLabel = String(order.status || 'pending');
              const orderItems = Array.isArray(order.items) ? order.items : [];
              const itemPreview = orderItems.slice(0, 2);
              const hiddenCount = Math.max(orderItems.length - 2, 0);

              return (
                <article
                  key={String(order.order_id)}
                  className="rounded-[20px] border border-black/10 bg-white px-4 py-4 sm:rounded-[22px] sm:px-5 sm:py-5 md:rounded-[24px] md:px-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-[0.02em] text-black/45 sm:text-[12px]">
                        Order ID
                      </p>

                      <h3 className="mt-1 line-clamp-1 text-[16px] font-bold uppercase text-black sm:text-[18px] md:text-[20px]">
                        {order.order_number || order.order_id}
                      </h3>

                      <p className="mt-2 text-[13px] text-[#7d7d7d] sm:text-[14px]">
                        {formatOrderDate(order.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase sm:text-[11px] ${getStatusClasses(
                          statusLabel
                        )}`}
                      >
                        {statusLabel}
                      </span>

                      <p className="text-[17px] font-bold uppercase text-black sm:text-[19px] md:text-[20px]">
                        {formatPrice(toNumber(order.total))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-black/10 pt-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.02em] text-black/45 sm:text-[12px]">
                          Items
                        </p>

                        <p className="mt-1 text-[13px] font-medium text-black sm:text-[14px]">
                          {orderItems.length} item
                          {orderItems.length === 1 ? '' : 's'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:justify-end">
                        {itemPreview.length > 0 ? (
                          <>
                            {itemPreview.map((item: any) => (
                              <span
                                key={String(item.id)}
                                className="max-w-[150px] truncate rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-black sm:max-w-[170px] sm:text-[12px]"
                              >
                                {item.item_name ||
                                  `${item.item_type} #${item.item_id}`}
                              </span>
                            ))}

                            {hiddenCount > 0 ? (
                              <span className="rounded-full border border-black/10 bg-[#f7f7f7] px-3 py-1.5 text-[11px] font-medium text-black/60 sm:text-[12px]">
                                +{hiddenCount} more
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-black sm:text-[12px]">
                            No items
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 xs:flex-row sm:flex-row">
                    <Link
                      href={{
                        pathname: `/account/order-history/${order.order_id}`,
                        query: {
                          data: encodeURIComponent(JSON.stringify(order)),
                        },
                      }}
                      className="inline-flex h-[40px] w-full items-center justify-center rounded-full bg-black px-4 text-[12px] font-semibold uppercase text-white transition hover:opacity-90 sm:w-auto sm:min-w-[112px] md:h-[42px]"
                    >
                      View Order
                    </Link>

                    {/* <button
                      type="button"
                      onClick={() => handleReorder(String(order.order_id))}
                      className="inline-flex h-[40px] w-full items-center justify-center rounded-full border border-black px-4 text-[12px] font-semibold uppercase text-black transition hover:bg-black hover:text-white sm:w-auto sm:min-w-[112px] md:h-[42px]"
                    >
                      Reorder
                    </button> */}
                  </div>
                </article>
              );
            })}
          </div>

          {pagination.totalPages > 1 ? (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function Breadcrumb() {
  return (
    <p className="text-[13px] text-[#8c8c8c] sm:text-[14px] md:text-[15px]">
      Home <span className="mx-2">{'>'}</span>
      <span className="text-black">Order History</span>
    </p>
  );
}

function PageHeader() {
  return (
    <>
      <h1 className="mt-8 text-[34px] font-bold uppercase leading-none tracking-[-0.03em] text-black sm:mt-10 sm:text-[44px] md:mt-12 md:text-[56px] lg:text-[64px]">
        Order History
      </h1>

      <p className="mt-4 max-w-[680px] text-[14px] leading-[1.5] text-[#8c8c8c] sm:text-[16px] md:mt-5 md:text-[17px]">
        Review your recent orders and their current status.
      </p>
    </>
  );
}



const ORDER_STATUS_FILTERS = [
  { label: 'All',        value: 'all'        },
  { label: 'Pending',    value: 'pending'    },
  { label: 'Paid',       value: 'paid'       },
  { label: 'On the Way', value: 'on_the_way' },
  { label: 'Delivered',  value: 'delivered'  },
  { label: 'Failed',     value: 'failed'     },
];
function StatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const swiperRef = useRef<SwiperType | null>(null);

  const handleClick = (index: number, val: string) => {
    onChange(val);

    // ✅ auto-center active item
    if (swiperRef.current) {
      swiperRef.current.slideTo(index - 1);
    }
  };

  return (
    <div className="sticky top-0 z-20 mt-6 py-3 md:static md:mt-8 md:py-0">
      
      {/* MOBILE (Swiper) */}
      <div className="md:hidden">
        <Swiper
          spaceBetween={8}
          slidesPerView="auto"
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          className="!px-4"
        >
          {ORDER_STATUS_FILTERS.map((item, index) => {
            const active = value === item.value;

            return (
              <SwiperSlide key={item.value} className="!w-auto">
                <button
                  type="button"
                  onClick={() => handleClick(index, item.value)}
                  className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase transition-all duration-200 ${
                    active
                      ? 'border-black bg-black text-white scale-[1.05]'
                      : 'border-black/10 bg-white text-black'
                  }`}
                >
                  {item.label}
                </button>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* DESKTOP */}
      <div className="hidden flex-wrap gap-2 md:flex">
        {ORDER_STATUS_FILTERS.map((item) => {
          const active = value === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={`rounded-full border px-4 py-2 text-[12px] font-semibold uppercase transition-all duration-200 ${
                active
                  ? 'border-black bg-black text-white scale-[1.05]'
                  : 'border-black/10 bg-white text-black hover:border-black/40'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}