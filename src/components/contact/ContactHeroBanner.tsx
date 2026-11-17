'use client';

import Image from 'next/image';
import type { ContactHero } from '@/types/contact';

type ContactHeroBannerProps = {
  hero: ContactHero;
};

export default function ContactHeroBanner({
  hero,
}: ContactHeroBannerProps) {
  return (
    <section className="relative">
      <div className="relative min-h-[230px] overflow-hidden rounded-[42px]  md:min-h-[340px]">
        <Image
          src={hero.backgroundImage}
          alt={hero.title}
          fill
          className="object-cover"
          priority
        />
<div className="relative z-10 hidden min-h-[230px] flex-col justify-center px-6 py-8 md:flex md:min-h-[340px] md:px-10 lg:px-14">
  <div className="max-w-[360px] text-white">
    <h1 className="text-[36px] font-bold leading-none uppercase md:text-[58px]">
      {hero.title}
    </h1>
  </div>
</div>
      </div>
    </section>
  );
}