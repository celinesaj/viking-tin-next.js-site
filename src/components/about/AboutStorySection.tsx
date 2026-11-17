'use client';

import Image from 'next/image';
import type { AboutStory } from '@/types/about';

type AboutStorySectionProps = {
  story: AboutStory;
};

export default function AboutStorySection({ story }: AboutStorySectionProps) {
  return (
    <section className="py-6 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10">
        <div>
          <h2 className="max-w-[250px] text-[42px] font-bold uppercase leading-[0.95] tracking-[-0.04em] text-bold md:text-[64px]">
            {story.title}
          </h2>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[36px]">
            <Image
              src={story.collageImage}
              alt={story.title}
              width={1100}
              height={900}
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="relative z-10 mt-6 rounded-[32px] bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)] md:-mt-[353px] md:ml-[-370px] md:max-w-[640px] md:p-8">
            <p className="text-[14px] leading-6 text-bold/45 md:text-[16px] md:leading-7">
              {story.descriptionTop}
            </p>

            <p className="mt-6 text-[14px] leading-6 text-bold/45 md:text-[16px] md:leading-7">
              {story.descriptionMiddle}
            </p>

            <p className="mt-6 text-[14px] leading-6 text-bold/45 md:text-[16px] md:leading-7">
              {story.descriptionBottom}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}