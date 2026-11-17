'use client';

import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { COLORS } from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { useGetTestimonialsQuery } from '@/features/testimonials/testimonialsApi';
import TestimonialCard from './testimonialCard';
import { EffectFade } from 'swiper/modules';
import 'swiper/css/effect-fade';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function TestimonialsSection() {
  const { data, isLoading, isError } = useGetTestimonialsQuery({
    page: 1,
    limit: 20,
    is_active: true,
  });

  const testimonials = (data?.data ?? [])
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);



  if (isLoading) {
    return (
      <section
        className="relative z-[2] overflow-visible py-16 md:py-20 lg:py-24"
        style={{
          backgroundImage: `url(${IMAGES.testimonials.bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/80" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8 lg:px-12">
          <div className="text-center">
            <h2
              className="text-4xl font-semibold md:text-5xl lg:text-6xl"
              style={{ color: COLORS.white }}
            >
              What Our Customers Say
            </h2>

          
          </div>

          <div className="mt-10 sm:mt-12">
            <div className="mx-auto h-[280px] max-w-[760px] animate-pulse rounded-[10px] bg-white/20" />
          </div>
        </div>
      </section>
    );
  }

  if (isError || !testimonials.length) return null;

  return (
    <section
      className="relative z-[2] overflow-visible py-16 md:py-20 lg:py-24"
      style={{
        backgroundImage: `url(${IMAGES.testimonials.bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/90" />

      {/* TOP RIGHT DECOR */}
      <div className="pointer-events-none absolute right-5 top-0 z-[3] hidden translate-x-[42%] -translate-y-[38%] md:block">
        <img
          src={IMAGES.testimonials.decorTopRight}
          alt=""
          className="decor-rotate w-[260px] lg:w-[340px] object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)]"
        />
      </div>

      {/* BOTTOM LEFT DECOR */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-[3] hidden -translate-x-[42%] translate-y-[42%] md:block">
        <img
          src={IMAGES.testimonials.decorBottomLeft}
          alt=""
          className="decor-rotate-reverse w-[260px] lg:w-[340px] object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)]"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8 lg:px-12">
        <div className="text-center">
          <h2
            className="text-4xl font-semibold md:text-5xl lg:text-6xl"
            style={{ color: COLORS.white }}
          >
          What Our Customers Say
          </h2>

         
        </div>

        <div className="relative mx-auto mt-10 max-w-[980px] sm:mt-12">
          <button
            className="testimonial-prev absolute left-[-8px] top-1/2 z-20 hidden h-[48px] w-[48px] -translate-y-1/2 items-center justify-center rounded-full lg:flex"
            style={{ backgroundColor: COLORS.white, color: COLORS.black }}
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            className="testimonial-next absolute right-[-8px] top-1/2 z-20 hidden h-[48px] w-[48px] -translate-y-1/2 items-center justify-center rounded-full lg:flex"
            style={{ backgroundColor: COLORS.black, color: COLORS.white }}
            aria-label="Next testimonial"
          >
            <ChevronRight size={22} />
          </button>

          <Swiper
            modules={[Navigation, Pagination, Autoplay, EffectFade]}
            slidesPerView={1}
            loop={testimonials.length > 1}
            speed={900}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            navigation={{
              prevEl: '.testimonial-prev',
              nextEl: '.testimonial-next',
            }}
            pagination={{
              clickable: true,
              el: '.testimonial-pagination',
              bulletClass: 'testimonial-bullet',
              bulletActiveClass: 'testimonial-bullet-active',
            }}
            className="pb-12"
          >
            {testimonials.map((testimonial) => (
              <SwiperSlide key={testimonial.id}>
                <TestimonialCard testimonial={testimonial} />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="testimonial-pagination mt-6 flex justify-center gap-2" />
        </div>
      </div>

      <style jsx global>{`
        .testimonial-bullet {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.55);
          display: inline-block;
          transition: all 0.25s ease;
          cursor: pointer;
        }
          .swiper-wrapper {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
}

        .testimonial-bullet-active {
          background: #ffffff;
          transform: scale(1.15);
        }

        @keyframes rotateFloat {
  0% {
    transform: rotate(0deg) translateY(0px);
  }
  50% {
    transform: rotate(180deg) translateY(-10px);
  }
  100% {
    transform: rotate(360deg) translateY(0px);
  }
}

@keyframes rotateFloatReverse {
  0% {
    transform: rotate(0deg) translateY(0px);
  }
  50% {
    transform: rotate(-180deg) translateY(10px);
  }
  100% {
    transform: rotate(-360deg) translateY(0px);
  }
}

.decor-rotate {
  animation: rotateFloat 18s linear infinite;
}

.decor-rotate-reverse {
  animation: rotateFloatReverse 22s linear infinite;
}
      `}</style>
    </section>
  );


}

