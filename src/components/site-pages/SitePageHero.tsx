'use client';

import Image from 'next/image';

type SitePageHeroProps = {
  title: string;
  description?: string;
  imageUrl: string | null;
};

export default function SitePageHero({
  title,
  description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet justo dolor. Duis eu augue laoreet, suscipit tellus id, euismod est.',
  imageUrl,
}: SitePageHeroProps) {
  return (
    <section className="relative">
      <div className="relative min-h-[220px] overflow-hidden rounded-[42px]  md:min-h-[330px]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        ) : null}

        <div className="relative z-10 grid min-h-[220px] items-center px-6 py-8 md:min-h-[330px] md:grid-cols-[1fr_1fr] md:px-10 lg:px-14 " >
          <div className="max-w-[440px] text-white">
            <h1 className="text-[38px] font-bold uppercase leading-none md:text-[68px] hidden md:block">
              {title}
            </h1>

            {/* <p className="mt-4 max-w-[360px] text-[14px] leading-6 text-white/85 md:text-[16px] hidden md:block">
              {description}
            </p> */}
          </div>
        </div>
      </div>
    </section>
  );
}