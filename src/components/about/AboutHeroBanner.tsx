'use client';

import Image from 'next/image';
import type { AboutHero } from '@/types/about';

type AboutHeroBannerProps = {
  hero: AboutHero;
};

export default function AboutHeroBanner({ hero }: AboutHeroBannerProps) {
  return (
    <section className="relative">
      <div className="relative overflow-hidden rounded-[42px] min-h-[260px] md:min-h-[340px]">
        <Image
          src={hero.backgroundImage}
          alt={hero.title}
          fill
          className="object-cover"
          priority
        />

        <div className="relative z-10 grid min-h-[260px] items-center px-6 py-8 md:min-h-[340px] md:grid-cols-[1.1fr_1fr] md:px-10 lg:px-14">
          
          {/* TEXT → HIDDEN ON MOBILE */}
          <div className="hidden max-w-[360px] text-white md:block mt-4">
            <h1 className="text-[14px] font-bold leading-none uppercase md:text-[26px]">
              {hero.title}
            </h1>
            <p className="mt-4 text-[14px] leading-6 text-white/85 md:text-[16px]">
              {hero.description}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}