'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import type {
  ReactElement,
  JSXElementConstructor,
  ReactNode,
  ReactPortal,
} from 'react';

import { COLORS } from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { useGetHeroBannersQuery } from '@/features/heroBanner/heroBanner';

import 'swiper/css';
import 'swiper/css/pagination';

function CTAButton({
  href,
  label,
  secondary = false,
}: {
  href: string;
  label: string;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-[40px] items-center rounded-full pl-3 pr-[5px] text-[10px] font-semibold tracking-[0.02em] transition-transform duration-300 hover:scale-[1.02] sm:h-[44px] sm:pl-4 sm:pr-[6px] sm:text-[11px] md:h-[50px] md:pl-5 md:pr-[7px] md:text-[12px] lg:h-[58px] lg:pl-7 lg:pr-[9px] lg:text-[14px] xl:h-[64px] xl:pl-8 xl:pr-[10px] xl:text-[16px] ${
        secondary
          ? 'border bg-black text-white'
          : 'border bg-white text-black'
      }`}
      style={{
        borderColor: secondary ? COLORS.borderLight : COLORS.white,
      }}
    >
      <span className="mr-2 whitespace-nowrap sm:mr-3 lg:mr-5">{label}</span>

      <span
        className={`flex h-[28px] w-[28px] items-center justify-center rounded-full sm:h-[30px] sm:w-[30px] md:h-[34px] md:w-[34px] lg:h-[40px] lg:w-[40px] xl:h-[46px] xl:w-[46px] ${
          secondary ? 'bg-white' : 'bg-black'
        }`}
      >
        <ArrowUpRight
          size={14}
          strokeWidth={2.4}
          className="sm:h-[15px] sm:w-[15px] md:h-[16px] md:w-[16px] lg:h-[18px] lg:w-[18px] xl:h-[22px] xl:w-[22px]"
          style={{
            color: secondary ? COLORS.black : COLORS.white,
          }}
        />
      </span>
    </Link>
  );
}

type Props = {
  autoPlayMs?: number;
};

export default function HeroBanner({ autoPlayMs = 5000 }: Props) {
  const { data, isLoading, isError } = useGetHeroBannersQuery({
    page: 1,
    limit: 20,
    is_active: true,
  });

  const slides = (data?.data ?? [])
    .slice()
    .sort(
      (
        a: { position: number | null | undefined },
        b: { position: number | null | undefined }
      ) => (a.position ?? 0) - (b.position ?? 0)
    );

  if (isLoading) {
    return (
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 bg-white">
        <div className="h-[320px] w-full animate-pulse bg-gray-200 xs:h-[360px] sm:h-[420px] md:h-[500px] lg:h-[560px] xl:h-[620px]" />
      </section>
    );
  }

  if (isError || !slides.length) return null;

  return (
    <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 bg-white">
      <div className="relative w-full overflow-hidden">
        <Swiper
          modules={[Autoplay, Pagination]}
          slidesPerView={1}
          loop={slides.length > 1}
          speed={700}
          autoplay={
            slides.length > 1
              ? {
                  delay: autoPlayMs,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
          pagination={{
            clickable: true,
            el: '.hero-banner-pagination',
            bulletClass:
              'hero-banner-bullet inline-block h-2.5 w-2.5 rounded-full transition-all duration-300 sm:h-3 sm:w-3',
            bulletActiveClass: 'hero-banner-bullet-active',
          }}
          className="w-full"
        >
          {slides.map(
            (
              banner: {
                headline:
                  | string
                  | number
                  | bigint
                  | boolean
                  | ReactElement<unknown, string | JSXElementConstructor<any>>
                  | Iterable<ReactNode>
                  | ReactPortal
                  | Promise<
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactPortal
                      | ReactElement<
                          unknown,
                          string | JSXElementConstructor<any>
                        >
                      | Iterable<ReactNode>
                      | null
                      | undefined
                    >
                  | null
                  | undefined;
                image_url?: string;
                imageUrl?: string;
                id?: string | number;
                subheadline?:
                  | string
                  | number
                  | bigint
                  | boolean
                  | ReactElement<unknown, string | JSXElementConstructor<any>>
                  | Iterable<ReactNode>
                  | ReactPortal
                  | Promise<
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactPortal
                      | ReactElement<
                          unknown,
                          string | JSXElementConstructor<any>
                        >
                      | Iterable<ReactNode>
                      | null
                      | undefined
                    >
                  | null
                  | undefined;
              },
              index: number
            ) => {
              const heroSrc =
                banner.image_url || banner.imageUrl || IMAGES.hero.main;
              const headlineText = String(banner.headline ?? '').trim();
              const lines = headlineText ? headlineText.split('\n') : [];

              return (
                <SwiperSlide key={banner.id ?? index}>
                  {/* ─── MOBILE + TABLET LAYOUT (up to lg) ─── */}
                  <div
                    className="relative flex flex-col lg:hidden"
                    style={{ backgroundColor: COLORS.pageBg }}
                  >
                    <div className="relative w-full" style={{ aspectRatio: '192 / 65' }}>
                      <img
                        src={heroSrc}
                        alt={String(banner.headline ?? 'Hero banner').replace(/\n/g, ' ')}
                        className="h-full w-full object-cover object-center"
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4 sm:bottom-5 md:bottom-6">
                        <CTAButton href="/store" label="Explore Now" />
                      </div>
                    </div>
                  </div>

                  {/* ─── DESKTOP LAYOUT (lg and above) ─── */}
                  <div
                    className="relative hidden lg:block h-[560px] w-full overflow-hidden xl:h-[620px]"
                    style={{ backgroundColor: COLORS.pageBg }}
                  >
                    <img
                      src={heroSrc}
                      alt={String(banner.headline ?? 'Hero banner').replace(/\n/g, ' ')}
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />

                    <div className="relative z-10 flex h-full">
                      <div className="flex h-full w-full flex-col px-30 xl:px-40 2xl:px-63">
                        {/* Centered headline & subheadline */}
                        <div className="flex-1 flex items-center">
                          <div className="max-w-[520px] xl:max-w-[580px]">
                            {lines.length > 0 ? (
                              <h1 className="text-white">
                                {lines.map((line, lineIndex) => (
                                  <span
                                    key={lineIndex}
                                    className="block text-[35px] font-semibold leading-[1.02] tracking-[-0.02em] xl:text-[35px] 2xl:text-[40px]"
                                  >
                                    {line}
                                  </span>
                                ))}
                              </h1>
                            ) : null}

                            {banner.subheadline ? (
                              <p
                                className={`max-w-[540px] text-[12px] leading-[1.5] text-white/90 xl:text-[14px] xl:leading-[1.45] ${lines.length > 0 ? 'mt-6' : ''}`}
                              >
                                {banner.subheadline}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Button at bottom (same left padding) */}
                        <div className="pb-8 xl:pb-10">
                          <CTAButton href="/store" label="Explore Now" />
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              );
            }
          )}
        </Swiper>

        {slides.length > 1 ? (
          <div className="hero-banner-pagination absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-5 lg:bottom-7" />
        ) : null}
      </div>

      <style jsx global>{`
        .hero-banner-pagination .hero-banner-bullet {
          background: rgba(0, 0, 0, 0.25);
        }
        .hero-banner-pagination .hero-banner-bullet-active {
          width: 2rem;
          background: ${COLORS.black};
        }
        @media (min-width: 640px) {
          .hero-banner-pagination .hero-banner-bullet-active {
            width: 2.5rem;
          }
        }
      `}</style>
    </section>
  );
}