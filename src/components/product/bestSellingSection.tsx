'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useGetProductsQuery } from '@/features/products/productsApi';
import { COLORS } from '@/constants/colors';
import ProductCard from './ProductCard';
import Skeleton from '@/components/common/Skeleton';

import 'swiper/css';
import 'swiper/css/pagination';

export default function BestSellingProductsSection() {
  const { data, isLoading, isError } = useGetProductsQuery({
    page: 1,
    limit: 12,
    is_active: true,
    isBestSeling: 1,
  });

  const products = data?.data ?? [];

  if (isLoading) {
    return (
      <section className="py-5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10">
            <div className="h-10 w-52 animate-pulse rounded-lg bg-[#ebebeb] md:h-12 md:w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-[260px] w-full rounded-[10px] bg-[#ebebeb]" />
                <div className="mt-2 rounded-[16px] bg-white p-4">
                  <div className="h-5 w-3/4 rounded bg-[#ebebeb]" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-[#ebebeb]" />
                  <div className="mt-3 flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-2.5 w-2.5 rounded-full bg-[#ebebeb]" />
                    ))}
                  </div>
                  <div className="mt-3 h-5 w-1/4 rounded bg-[#ebebeb]" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-9 flex-1 rounded-full bg-[#ebebeb]" />
                    <div className="h-9 flex-1 rounded-full bg-[#ebebeb]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return <div className="py-20 text-center">Error loading products</div>;
  }

  if (!products.length) {
    return (
      <section className="py-5" >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 grid md:grid-cols-2">
            <h2 className="max-w-[500px] text-2xl font-semibold uppercase leading-[1.05] text-[#111111] md:text-4xl">
              BEST SELLING
              <br />
              PRODUCTS
            </h2>
          </div>

          <div className="py-12 text-center text-bold/70">
            No products available
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/store?best_selling=1"
              className="inline-flex h-[58px] items-center rounded-full pl-7 pr-[8px] text-[16px] font-medium transition hover:opacity-90 md:h-[64px] md:pl-8 md:pr-[9px] md:text-[17px]"
              style={{
                backgroundColor: COLORS.black,
                color: COLORS.white,
              }}
            >
              <span className="mr-5 md:mr-6">View Products</span>

              <span
                className="flex h-[42px] w-[42px] items-center justify-center rounded-full md:h-[46px] md:w-[46px]"
                style={{
                  backgroundColor: COLORS.white,
                  color: COLORS.black,
                }}
              >
                <ArrowUpRight size={22} strokeWidth={2.4} />
              </span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5" >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 grid md:grid-cols-2">
          <h2 className="max-w-[500px] text-[24px] font-bold uppercase leading-[1.05] text-[#111111] sm:text-[30px] md:text-[40px]">
            BEST SELLING
            <br />
            PRODUCTS
          </h2>
        </div>

        <div className="best-selling-swiper">
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{
              clickable: true,
              el: '.best-selling-pagination',
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={products.length > 2}
            speed={800}
            spaceBetween={24}
            slidesPerView={2}
            breakpoints={{
              768: {
                slidesPerView: 2,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 3.5,
                spaceBetween: 24,
              },
            }}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="best-selling-pagination mt-4 flex justify-center" />
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/store"
            className="group inline-flex h-[58px] items-center rounded-full border border-black bg-black pl-7 pr-[8px] text-[16px] font-medium text-white transition-all duration-300 hover:bg-white hover:text-black md:h-[64px] md:pl-8 md:pr-[9px] md:text-[17px]"
          >
            <span className="mr-5 md:mr-6">View Products</span>

            <span className="relative flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full bg-white text-black transition-all duration-300 group-hover:bg-black group-hover:text-white md:h-[46px] md:w-[46px]">
              <ArrowUpRight
                size={22}
                strokeWidth={2.4}
                className="absolute transition-all duration-300 group-hover:translate-x-3 group-hover:-translate-y-3 group-hover:opacity-0"
              />

              <span className="absolute translate-x-[-14px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </span>
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .best-selling-swiper .swiper {
          width: 100%;
          overflow: hidden;
        }

        .best-selling-swiper .swiper-wrapper {
          align-items: stretch;
        }

        .best-selling-swiper .swiper-slide {
          height: auto;
          min-width: 0;
        }

        .best-selling-pagination.swiper-pagination-horizontal {
          position: static;
        }

        .best-selling-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          margin: 0 5px !important;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.25);
          opacity: 1;
          transition: all 0.3s ease;
        }

        .best-selling-pagination .swiper-pagination-bullet-active {
          width: 22px;
          background: #000;
        }

        @media (min-width: 1280px) {
          .best-selling-pagination .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
          }

          .best-selling-pagination .swiper-pagination-bullet-active {
            width: 28px;
          }
        }
      `}</style>
    </section>
  );
}