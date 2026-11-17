'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import {
  useGetFlavorsQuery,
  useGetFlavorBySlugQuery,
} from '@/features/flavours/flavoursApi';
import { useLazyGetProductsQuery } from '@/features/products/productsApi';
import { COLORS } from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import type { Flavor } from '@/types/flavour';
import type { Product } from '@/types/products';
import Skeleton from '@/components/common/Skeleton';

import 'swiper/css';
import 'swiper/css/pagination';

function getFlavorTitle(flavor: Flavor, product?: Product) {
  if (product?.name?.trim()) {
    return product.name.toUpperCase();
  }
  return `VOX ${flavor.name}`.toUpperCase();
}

function getNicotineDots(product?: Product) {
  const nicotineMg = Number(product?.nicotineMg ?? 0);
  if (!nicotineMg) return 4;
  return Math.max(1, Math.min(5, Math.round(nicotineMg / 2)));
}

function getBrandName(product?: Product) {
  return product?.brandName?.trim() || 'VOX';
}

function resolveFlavorImage(imgUrl?: string | null) {
  const raw = imgUrl?.trim();
  if (!raw || raw.toUpperCase() === 'NULL') {
    return '/images/placeholder-flavor.png';
  }
  return raw;
}

export default function FlavorCategoriesSection() {
  const { data, isLoading, error } = useGetFlavorsQuery({
    page: 1,
    limit: 50,
    is_active: true,
  });

  const flavors = data?.data ?? [];

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        flavors
          .map((item) => item.name?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );
  }, [flavors]);

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeFlavorSlug, setActiveFlavorSlug] = useState<string>('');
  const [requestPage, setRequestPage] = useState(1);

  const selectedCategory = activeCategory || categories[0] || '';

  const filteredFlavors = useMemo(() => {
    if (!selectedCategory) return flavors;
    return flavors.filter((item) => item.name?.trim() === selectedCategory);
  }, [flavors, selectedCategory]);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (!activeFlavorSlug && filteredFlavors.length > 0) {
      setActiveFlavorSlug(filteredFlavors[0].slug);
    }
  }, [filteredFlavors, activeFlavorSlug]);

  useEffect(() => {
    if (!selectedCategory || filteredFlavors.length === 0) return;
    const firstFlavorInCategory = filteredFlavors[0];
    if (firstFlavorInCategory?.slug) {
      setActiveFlavorSlug(firstFlavorInCategory.slug);
      setRequestPage(1);
    }
  }, [selectedCategory, filteredFlavors]);

  const { data: activeFlavor, isFetching: isFetchingFlavor } =
    useGetFlavorBySlugQuery(activeFlavorSlug, { skip: !activeFlavorSlug });

  const [triggerGetProducts, { data: productsResponse, isFetching: isFetchingProduct }] =
    useLazyGetProductsQuery();

  useEffect(() => {
    if (!activeFlavor?.slug) return;
    triggerGetProducts(
      { page: requestPage, limit: 1, is_active: true, flavor_slug: activeFlavor.slug },
      false
    );
  }, [activeFlavor?.slug, requestPage, triggerGetProducts]);

  const relatedProducts = Array.isArray(productsResponse)
    ? productsResponse
    : productsResponse?.data ?? [];

  const activeProduct = relatedProducts[0];

  if (isLoading) {
    return (
      <section className="bg-white py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-12">
          <div className="space-y-8">
            <div className="h-6 w-48 rounded bg-black/10" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-4 rounded-[26px] bg-[#f8f8f8] p-6">
                  <Skeleton className="h-[180px] w-full rounded-[28px]" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !flavors.length || !selectedCategory || !activeFlavor) {
    return null;
  }

  const handleCategoryClick = (category: string) => {
    if (category === selectedCategory) {
      setRequestPage((prev) => prev + 1);
      return;
    }
    setActiveCategory(category);
    setRequestPage(1);
  };

  const handleFlavorClick = (slug: string) => {
    if (slug === activeFlavorSlug) {
      setRequestPage((prev) => prev + 1);
      return;
    }
    setActiveFlavorSlug(slug);
    setRequestPage(1);
  };

  const flavorImageSrc = resolveFlavorImage(activeFlavor.imgUrl);
  const cardHref = `/store?flavor=${encodeURIComponent(activeFlavor.slug)}`;
  const cardTitle = getFlavorTitle(activeFlavor, activeProduct);
  const nicotineDots = getNicotineDots(activeProduct);
  const brandName = getBrandName(activeProduct);
  const flavorName = activeFlavor.name?.toUpperCase() || '';

  return (
    <section
      className="overflow-hidden py-10 md:py-14 lg:py-16"
      style={{ color: COLORS.textPrimary }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-6 md:grid-cols-[1fr_420px] md:items-start">
          <h2 className="max-w-[500px] text-[24px] font-bold uppercase leading-[1.05] text-[#111111] sm:text-[30px] md:text-[40px]">
            Flavor
            <br />
            Categories
          </h2>
        </div>

        <div className="relative z-20 mt-8 md:mt-10">
          <div className="flavor-categories-swiper">
            <Swiper
              modules={[Pagination, Autoplay]}
              spaceBetween={12}
              slidesPerView="auto"
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={categories.length > 1}
              speed={800}
              breakpoints={{
                768: { spaceBetween: 14 },
                1024: { spaceBetween: 16 },
                1280: { spaceBetween: 18 },
              }}
            >
              {categories.map((category) => {
                const isActive = category === selectedCategory;
                return (
                  <SwiperSlide key={category} style={{ width: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(category)}
                      className="flex h-[48px] w-auto items-center justify-center whitespace-nowrap rounded-full px-5 text-[15px] font-semibold uppercase leading-none transition-all duration-200 md:h-[58px] md:px-6 md:text-[18px]"
                      style={{
                        backgroundColor: isActive ? COLORS.black : '#dfdfdf',
                        color: isActive ? COLORS.white : COLORS.textPrimary,
                      }}
                    >
                      {category}
                    </button>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            <div className="flavor-categories-pagination mt-4 hidden justify-center md:flex" />
          </div>
        </div>

        {/* Flavor selector buttons (commented out) */}
      </div>

      <div className="relative mt-6 w-full md:mt-[-20px] lg:mt-[-30px]">
        <div
          className="relative min-h-[320px] w-full overflow-visible md:min-h-[430px] lg:min-h-[550px]"
          style={{
            backgroundImage: `url(${IMAGES.flavour.bg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="relative z-10 mx-auto flex min-h-[unset] max-w-[1440px] flex-col gap-8 px-5 py-10 md:min-h-[520px] md:flex-row md:items-center md:px-8 md:py-0 lg:min-h-[550px] lg:px-12">
            <div className="relative z-20 flex w-full justify-center lg:absolute lg:bottom-[-60px] lg:left-[4%] lg:w-auto lg:justify-start">
              <img
                src={flavorImageSrc}
                alt={activeFlavor?.name || 'Flavor image'}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/placeholder.png';
                }}
                className="w-full max-w-[260px] object-contain sm:max-w-[320px] md:max-w-[380px] lg:max-w-[510px]"
              />
            </div>

            <div className="flex w-full justify-center md:ml-auto md:max-w-[780px]">
              <div
                className="relative z-10 w-full max-w-[340px] rounded-[26px] px-8 pb-20 pt-7 shadow-[0_14px_28px_rgba(0,0,0,0.14)] sm:max-w-[390px] sm:px-8 sm:pb-24 sm:pt-10 md:max-w-[420px] md:rounded-[30px] lg:max-w-[470px] lg:rounded-[34px] lg:px-10 lg:pb-28 lg:pt-12"
                style={{ backgroundColor: COLORS.white }}
              >
                <h3 className="max-w-[240px] text-[24px] font-semibold uppercase leading-[0.96] tracking-[-0.04em] text-black sm:text-[20px] md:max-w-[260px] md:text-[25px] lg:max-w-[290px] lg:text-[30px]">
                  {cardTitle}
                </h3>

                <div className="mt-4 space-y-1.5">
                  <p className="text-[14px] font-bold uppercase text-black/35 md:text-[16px] lg:text-[17px]">
                    Brand:{' '}
                    <span className="font-semibold text-black">{brandName}</span>
                  </p>

                  <p className="text-[14px] font-bold uppercase text-black/35 md:text-[16px] lg:text-[17px]">
                    Flavour:{' '}
                    <span className="font-semibold text-black">{flavorName}</span>
                  </p>

                  <p className="text-[14px] font-bold uppercase text-black/35 md:text-[16px] lg:text-[17px]">
                    Nicotine Strength:
                  </p>

                  <div className="mt-2 flex items-center gap-[8px]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className="h-[11px] w-[11px] rounded-full md:h-[13px] md:w-[13px] lg:h-[14px] lg:w-[14px]"
                        style={{
                          backgroundColor:
                            index < nicotineDots ? COLORS.black : '#d3d3d3',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {(isFetchingFlavor || isFetchingProduct) && (
                  <div className="mt-4 space-y-3">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-30 flex translate-y-1/2 justify-center">
                  <Link
                    href={cardHref}
                    className="group inline-flex h-[54px] items-center rounded-full border border-black bg-black pl-6 pr-[8px] text-[15px] font-medium text-white transition-all duration-300 hover:bg-white hover:text-black sm:h-[58px] sm:pl-7 sm:text-[16px] md:h-[64px] md:pl-8 md:pr-[9px] md:text-[17px]"
                  >
                    <span className="mr-4 md:mr-6">View More</span>

                    <span className="relative flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-full bg-white text-black transition-all duration-300 group-hover:bg-black group-hover:text-white md:h-[46px] md:w-[46px]">
                      <ArrowUpRight
                        size={22}
                        strokeWidth={2.4}
                        className="absolute transition-all duration-300 group-hover:translate-x-3 group-hover:-translate-y-3 group-hover:opacity-0"
                      />
                      <span className="absolute translate-x-[-14px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .flavor-categories-swiper .swiper {
          width: 100%;
          overflow: visible;
          padding-inline: 2px;
        }

        /* slides are width:auto so each one sizes to its button */
        .flavor-categories-swiper .swiper-slide {
          width: auto !important;
          height: auto;
        }

        .flavor-categories-pagination.swiper-pagination-horizontal {
          position: static;
        }

        .flavor-categories-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          margin: 0 5px !important;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.25);
          opacity: 1;
          transition: all 0.3s ease;
        }

        .flavor-categories-pagination .swiper-pagination-bullet-active {
          width: 22px;
          background: #000;
        }

        @media (min-width: 1280px) {
          .flavor-categories-pagination .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
          }
          .flavor-categories-pagination .swiper-pagination-bullet-active {
            width: 28px;
          }
        }
      `}</style>
    </section>
  );
}