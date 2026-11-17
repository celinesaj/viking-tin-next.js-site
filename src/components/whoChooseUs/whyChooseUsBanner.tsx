'use client';

import { IMAGES } from '@/constants/images';
import { COLORS } from '@/constants/colors';
import { whyChooseUsData } from '@/mock/whyChooseUs';
import WhyChooseUsItem from './whyChooseUsItem';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

export default function WhyChooseUsBanner() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        backgroundImage: `url(${IMAGES.whyChooseUs.bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16 lg:px-6 lg:py-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[320px]">
            <h2
              className="max-w-[500px] text-[24px] font-bold uppercase leading-[1.05] text-[#111111] sm:text-[30px] md:text-[40px]"
              style={{ color: COLORS.white }}
            >
              Why
              <br />
              Viking Tin
            </h2>
          </div>

          {/* Mobile swiper */}
          <div className="why-choose-mobile-swiper sm:hidden">
            <Swiper
              modules={[Pagination, Autoplay]}
              slidesPerView={1}
              spaceBetween={20}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={whyChooseUsData.length > 1}
              speed={800}
              pagination={{
                clickable: true,
                el: '.why-choose-mobile-pagination',
              }}
            >
              {whyChooseUsData.map((item) => (
                <SwiperSlide key={item.id}>
                  <div className="flex justify-center">
                    <WhyChooseUsItem item={item} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="why-choose-mobile-pagination mt-6 flex justify-center" />
          </div>

          {/* Tablet/Desktop layout */}
          <div className="hidden items-center gap-8 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-start lg:gap-10">
            {whyChooseUsData.map((item) => (
              <WhyChooseUsItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .why-choose-mobile-swiper .swiper {
          width: 100%;
          overflow: hidden;
        }

        .why-choose-mobile-swiper .swiper-slide {
          min-width: 0;
          height: auto;
        }

        .why-choose-mobile-pagination.swiper-pagination-horizontal {
          position: static;
        }

        .why-choose-mobile-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          margin: 0 5px !important;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.35);
          opacity: 1;
          transition: all 0.3s ease;
        }

        .why-choose-mobile-pagination .swiper-pagination-bullet-active {
          width: 22px;
          background: #ffffff;
        }
      `}</style>
    </section>
  );
}