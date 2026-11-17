'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { COLORS } from '@/constants/colors';

const storyContent = {
  title: 'Our Story',
  imageUrl1: '/images/ourStory.png',
  content: `It started far from here.

In colder lands, where journeys were long and choices were simple, Vikings carried only what they trusted. Something small. Something reliable. Something that stayed with them through every mile.

It wasn't about having more.

It was about having the right thing.

That idea didn't stay there. It traveled. Across time. Across places. Until it found its way here.

Viking Tin is part of that journey.

Taking something born from that mindset and bringing it into a new world, a faster life, a different rhythm, a new generation looking for something cleaner and more refined.

Same idea. Different time.

From where it began… to where you are now.

Today, Viking Tin brings this heritage of trusted, clean nicotine experiences to Dubai and the wider UAE.`,
};

export default function HomePageStory() {
  const [expanded, setExpanded] = useState(false);

  const paragraphs = storyContent.content
    .split('\n')
    .filter((p) => p.trim() !== '');

  const preview = paragraphs.slice(0, 6);
  const rest = paragraphs.slice(6);
  const hasMore = rest.length > 0;

  return (
    <section className="relative overflow-hidden px-5 py-12 sm:py-14 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="grid items-center gap-8 md:gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">

          {/* IMAGE */}
          <div className="relative order-1">
            <div className="overflow-hidden rounded-[12px]">
              {storyContent.imageUrl1 ? (
                <img
                  src={storyContent.imageUrl1}
                  alt={storyContent.title}
                  className="h-[260px] w-full object-cover sm:h-[320px] md:h-[380px] lg:h-[440px]"
                />
              ) : (
                <div className="h-[260px] w-full bg-gray-200 sm:h-[320px] md:h-[380px] lg:h-[440px]" />
              )}
            </div>
          </div>

          {/* CONTENT */}
          <div className="order-2 flex flex-col justify-center">
            <div className="max-w-[640px]">

              <h2
                className="text-[24px] font-extrabold uppercase leading-[1.05] sm:text-[30px] md:text-[36px] lg:text-[40px]"
                style={{ color: COLORS.textPrimary }}
              >
                {storyContent.title}
              </h2>

              <div
                className="mt-4 space-y-2 text-[13px] leading-[1.7] sm:text-[14px] md:mt-5 md:text-[15px] lg:text-base transition-all duration-300"
                style={{ color: COLORS.textPrimary }}
              >
                {preview.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}

                {hasMore && expanded && (
                  <div className="space-y-2">
                    {rest.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SINGLE BUTTON (TOGGLE ONLY) */}
            {hasMore && (
              <div className="mt-5 flex items-center justify-center md:mt-6 md:justify-start">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="group inline-flex h-[50px] items-center rounded-full border border-black bg-black pl-5 pr-[6px] text-[14px] font-medium text-white transition-all duration-300 hover:bg-white hover:text-black sm:h-[54px] sm:pl-6 sm:pr-[7px] sm:text-[15px] md:h-[56px] md:pl-7 md:pr-[8px] md:text-[16px]"
                >
                  <span className="mr-3 sm:mr-4 md:mr-5">
                    {expanded ? 'Show Less' : 'Read More'}
                  </span>

                  <span className="relative flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full bg-white text-black transition-all duration-300 group-hover:bg-black group-hover:text-white sm:h-[40px] sm:w-[40px] md:h-[42px] md:w-[42px]">

                    <ArrowUpRight
                      size={18}
                      strokeWidth={2.4}
                      className={`absolute transition-all duration-300 md:h-5 md:w-5 ${
                        expanded ? 'rotate-180' : ''
                      }`}
                    />

                    <span className="absolute translate-x-[-12px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="md:h-5 md:w-5"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </span>

                  </span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}