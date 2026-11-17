'use client';

import BrandCard from '@/components/brands/brandsCard';
import { useGetBrandsQuery } from '@/features/brands/brandsApi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

export default function BrandsSection() {
  const { data: brands = [], isLoading, isError } = useGetBrandsQuery();

  if (isLoading) {
    return (
      <section className="overflow-x-hidden py-12 sm:py-14 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          <h2 className="max-w-[420px] text-[24px] font-extrabold uppercase leading-[1.05] text-[#111111] sm:text-[30px] md:text-[40px]">
            Shop Your Featured
            <br />
            Brands
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:mt-12 sm:gap-5 md:mt-16 md:grid-cols-4 md:gap-8 lg:gap-10">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="mx-auto h-[130px] w-[130px] animate-pulse rounded-full bg-[#ebebeb] sm:h-[150px] sm:w-[150px] md:h-[170px] md:w-[170px] lg:h-[180px] lg:w-[180px]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError || !brands.length) return null;

  return (
    <section className="py-12 sm:py-14 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <h2 className="max-w-[500px] text-[24px] font-bold uppercase leading-[1.05] text-[#111111] sm:text-[30px] md:text-[40px]">
          Shop Your Featured
          <br />
          Brands
        </h2>

        <div className="brands-swiper-wrapper mt-10 w-full -mx-2 px-2">
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{
              clickable: true,
              el: '.brands-pagination',
            }}
            autoplay={{
              delay: 4000,        // slow, 4 seconds between slides
              disableOnInteraction: false, // keeps autoplay after user interaction
              pauseOnMouseEnter: true,     // pauses when user hovers – very user-friendly
            }}
            loop={brands.length > 1}      // infinite loop only if more than 1 slide
            speed={800}                   // smooth transition (800ms)
            spaceBetween={16}
            slidesPerView={2}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 3, spaceBetween: 20 },
              1024: { slidesPerView: 4, spaceBetween: 24 },
              1280: { slidesPerView: 4, spaceBetween: 28 },
            }}
            className="brands-swiper"
          >
            {brands.map((brand) => (
              <SwiperSlide key={brand.id}>
                <div className="flex justify-center">
                  <BrandCard brand={brand} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="brands-pagination mt-6 flex justify-center" />
        </div>
      </div>

      <style jsx global>{`
        .brands-swiper {
          overflow: hidden !important;
          padding: 12px 4px !important;
          margin: -12px -4px !important;
        }
        .brands-swiper .swiper-wrapper {
          align-items: stretch;
        }
        .brands-swiper .swiper-slide {
          height: auto;
        }
        .brands-pagination.swiper-pagination-horizontal {
          position: static;
        }
        .brands-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          margin: 0 5px !important;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.25);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .brands-pagination .swiper-pagination-bullet-active {
          width: 22px;
          background: #000;
        }
        @media (min-width: 1280px) {
          .brands-pagination .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
          }
          .brands-pagination .swiper-pagination-bullet-active {
            width: 28px;
          }
        }
      `}</style>
    </section>
  );
}