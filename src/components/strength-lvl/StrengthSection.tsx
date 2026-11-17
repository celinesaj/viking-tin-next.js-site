'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import StrengthCard from '@/components/strength-lvl/strength-lvlCard';
import { IMAGES } from '@/constants/images';
import { COLORS } from '@/constants/colors';
import { useGetStrengthLevelsQuery } from '@/features/strength-lvls/strength-levels';

import 'swiper/css';

function StrengthSectionSkeleton() {
  return (
    <section className="relative w-full overflow-hidden py-10">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${IMAGES.strlvl.bgimg})` }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: COLORS.strengthOverlay }} />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="h-10 w-[220px] animate-pulse rounded bg-white/20 md:h-12" />
        <div className="mt-10 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square flex-1 animate-pulse rounded-full bg-white/15" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function StrengthSection() {
  const { data, isLoading, isError } = useGetStrengthLevelsQuery({ page: 1, limit: 8 });
  const strengthLevels = Array.isArray(data) ? data : data?.data ?? [];

  if (isLoading) return <StrengthSectionSkeleton />;
  if (isError) return <section className="py-20 text-center">Error loading strength levels</section>;
  if (!strengthLevels.length) return <section className="py-20 text-center">No strength levels available</section>;

  return (
    <section className="relative w-full overflow-hidden py-10">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${IMAGES.strlvl.bgimg})` }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: COLORS.strengthOverlay }} />

      <div className="relative mx-auto max-w-7xl px-6">
        <h2
          className="max-w-[500px] text-[24px] font-bold uppercase leading-[1.05] sm:text-[30px] md:text-[40px]"
          style={{ color: COLORS.white }}
        >
          Strength Guide
        </h2>
      </div>

      {/*
        On mobile the swiper lives OUTSIDE the px-6 container so it spans full width.
        On md+ it goes back inside the constrained container with normal padding.
      */}
      <div className="relative mt-8">
        {/* Mobile: full-width swiper with px-6 applied as swiper padding so first card aligns with heading */}
        <div className="md:hidden">
          <Swiper
            slidesPerView={2.5}
            spaceBetween={8}
            slidesOffsetBefore={24}
            slidesOffsetAfter={24}
          >
            {strengthLevels.map((item) => (
              <SwiperSlide key={item.id}>
                <StrengthCard label={item.name} slug={item.slug} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Tablet + Desktop: constrained inside max-w-7xl with overflow-hidden for exact 4 */}
        <div className="mx-auto hidden max-w-7xl overflow-hidden px-6 md:block">
          <Swiper
            slidesPerView={4}
            spaceBetween={10}
          >
            {strengthLevels.map((item) => (
              <SwiperSlide key={item.id}>
                <StrengthCard label={item.name} slug={item.slug} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}