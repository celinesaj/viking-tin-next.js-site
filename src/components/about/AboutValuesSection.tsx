'use client';

import Image from 'next/image';
import type { AboutValuesSectionData } from '@/types/about';
import ValueCard from './ValueCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

type AboutValuesSectionProps = {
  values: AboutValuesSectionData;
};

export default function AboutValuesSection({
  values,
}: AboutValuesSectionProps) {
  return (
    <section className="py-10 md:py-16">
      <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-start md:justify-between">
        <h2 className="text-[30px] font-bold uppercase leading-none tracking-[-0.04em] text-bold md:text-[64px]">
          {values.title}
        </h2>
      </div>

      <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-white px-5 py-8 md:px-10 md:py-12">
        <Image
          src={values.backgroundImage}
          alt={values.title}
          fill
          className="object-cover opacity-80"
        />

        {/* MOBILE */}
        <div className="relative z-10 md:hidden">
          <div className="about-values-mobile-swiper">
            <Swiper
              modules={[Pagination]}
              slidesPerView={1}
              spaceBetween={10}
              pagination={{
                clickable: true,
                el: '.about-values-pagination',
              }}
            >
              {values.items.map((item) => (
                <SwiperSlide key={item.id}>
                  <ValueCard item={item} />
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="about-values-pagination mt-5 flex justify-center" />
          </div>
        </div>

        {/* DESKTOP */}<div className=" px-50 relative z-10 hidden gap-[2px] md:grid md:grid-cols-3 lg:gap-[4px]">
          {values.items.map((item) => (
            <ValueCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        .about-values-mobile-swiper .swiper {
          width: 100%;
          overflow: hidden;
        }

        .about-values-mobile-swiper .swiper-slide {
          min-width: 0;
          height: auto;
        }

        .about-values-pagination.swiper-pagination-horizontal {
          position: static;
        }

        .about-values-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          margin: 0 5px !important;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.25);
          opacity: 1;
          transition: all 0.3s ease;
        }

        .about-values-pagination .swiper-pagination-bullet-active {
          width: 22px;
          background: #000;
        }
      `}</style>
    </section>
  );
}