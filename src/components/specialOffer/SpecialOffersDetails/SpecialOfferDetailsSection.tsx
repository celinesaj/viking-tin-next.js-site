'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import MediaFallback from '@/components/common/MediaFallback';

import { useAppDispatch } from '@/store/hook';
import { IMAGES } from '@/constants/images';
import type { SpecialOffer } from '@/types/special-offers';

import 'swiper/css';
import 'swiper/css/pagination';
import { addSpecialOfferToCart } from '@/features/cart/cartSlice';
import { stringLooksLikeSimpleHtml } from '@/lib/adminRichText';
import { formatPrice } from '@/lib/PriceFormat';
import toast from 'react-hot-toast';

const detailsBodyClassName =
  'mt-2 max-w-[320px] text-[12px] leading-[1.5] text-[#666] xl:mt-3 xl:max-w-[460px] xl:text-[14px] xl:leading-[1.65] 2xl:max-w-[540px] 2xl:text-[15px]';

const detailsHtmlClassName = `${detailsBodyClassName} [&_a]:font-inherit [&_a]:text-[#2563eb] [&_a]:underline [&_a]:hover:text-[#1d4ed8]`;

type Props = {
  offer: SpecialOffer;
};

type TimeLeft = {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type OfferMediaItem = {
  id?: string | number;
  mediaType: 'image' | 'video';
  url: string;
  sortOrder?: number | null;
  createdAt?: string | null;
};

function getTimeLeft(endDate: string | null): TimeLeft {
  if (!endDate) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const target = new Date(endDate).getTime();
  const now = Date.now();
  const total = Math.max(target - now, 0);

  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDate(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export default function SpecialOfferDetailsSection({ offer }: Props) {
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    getTimeLeft(offer.endDate)
  );
  const [mediaError, setMediaError] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setTimeLeft(getTimeLeft(offer.endDate));

    if (!offer.endDate) return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(offer.endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [offer.endDate]);

  useEffect(() => {
    setMediaError(false);
  }, [selectedMediaUrl]);

  const mediaItems = useMemo<OfferMediaItem[]>(() => {
    const rawMedia =
      (
        offer as SpecialOffer & {
          media?: Array<{
            id?: string | number;
            mediaType?: string;
            url?: string;
            sortOrder?: number | null;
            createdAt?: string | null;
          }>;
          galleryImages?: Array<{
            id?: string | number;
            url?: string;
            sortOrder?: number | null;
            createdAt?: string | null;
          }>;
        }
      ).media ?? [];

    const normalizedMedia: OfferMediaItem[] = rawMedia
      .filter(
        (item): item is OfferMediaItem =>
          !!item?.url &&
          (item.mediaType === 'image' || item.mediaType === 'video')
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const galleryAsImages: OfferMediaItem[] =
      (
        offer as SpecialOffer & {
          galleryImages?: Array<{
            id?: string | number;
            url?: string;
            sortOrder?: number | null;
            createdAt?: string | null;
          }>;
        }
      ).galleryImages
        ?.filter((item) => !!item?.url)
        .map((item, index) => ({
          id: item.id ?? `gallery-${index}`,
          mediaType: 'image' as const,
          url: item.url!,
          sortOrder: item.sortOrder ?? index,
          createdAt: item.createdAt ?? null,
        }))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) ?? [];

    const merged = [...normalizedMedia];

    for (const galleryItem of galleryAsImages) {
      if (!merged.some((item) => item.url === galleryItem.url)) {
        merged.push(galleryItem);
      }
    }

    if (offer.imageUrl && !merged.some((item) => item.url === offer.imageUrl)) {
      merged.unshift({
        id: 'special-offer-main-image',
        mediaType: 'image',
        url: offer.imageUrl,
        sortOrder: -1,
      });
    }

    return merged.sort((a, b) => {
      if (a.mediaType !== b.mediaType) {
        return a.mediaType === 'image' ? -1 : 1;
      }
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }, [offer]);

  const selectedMedia = useMemo(() => {
    if (selectedMediaUrl) {
      return mediaItems.find((item) => item.url === selectedMediaUrl);
    }

    const firstImage = mediaItems.find((item) => item.mediaType === 'image');
    if (firstImage) return firstImage;

    return mediaItems[0];
  }, [mediaItems, selectedMediaUrl]);

  const fallbackImage =
    IMAGES.placeholders.product || '/images/placeholders/product.png';

  const price = Number(offer.price ?? 0);
  const originTotal = Number(offer.originTotal ?? 0);
  const hasDiscount = originTotal > price;
  const isExpired = timeLeft.total <= 0 && !!offer.endDate;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i += 1) {
      dispatch(
        addSpecialOfferToCart({
          specialOffer: offer,
          price: Number(offer.price ?? 0),
        })
      );
    }
    toast.success(`${offer.name} added to cart`);
  };

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 md:px-8 xl:px-12 2xl:max-w-[1700px] 2xl:px-16">
      {/* Increased grid gap to prevent overlap */}
      <div className="grid items-start gap-8 lg:gap-12 xl:gap-14 2xl:gap-20 lg:grid-cols-[1.08fr_0.92fr]">
        
        {/* LEFT SIDE – added overflow-hidden */}
        <div className="min-w-0 w-full overflow-hidden">
          <div className="relative aspect-square w-full rounded-[22px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] xl:rounded-[28px] 2xl:rounded-[34px]">
            <div className="relative h-full w-full overflow-hidden rounded-[22px] xl:rounded-[28px] 2xl:rounded-[34px]">
              {mediaError || !selectedMedia?.url ? (
                <MediaFallback label="Special offer media unavailable" />
              ) : selectedMedia.mediaType === 'video' ? (
                <video
                  key={selectedMedia.url}
                  src={selectedMedia.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  controls
                  onError={() => setMediaError(true)}
                />
              ) : (
                <Image
                  src={selectedMedia.url}
                  alt={offer.name}
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                  onError={() => setMediaError(true)}
                />
              )}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/70 via-white/25 to-transparent sm:h-24 xl:h-36 2xl:h-44" />
          </div>

          {/* THUMBNAILS SLIDER – fixed overflow and border cutting */}
          {!!mediaItems.length && (
            <div className="special-offer-thumbs-slider mt-3 w-full max-w-full px-[3px] xl:mt-5">
              <Swiper
                modules={[Pagination]}
                spaceBetween={12}
                slidesPerView={3}
                pagination={{
                  clickable: true,
                  el: '.special-offer-thumbs-pagination',
                }}
                breakpoints={{
                  640: {
                    slidesPerView: 3,
                  },
                  1024: {
                    slidesPerView: 3,
                  },
                }}
                className="w-full"
              >
                {mediaItems.map((item, i) => {
                  const isActive = selectedMedia?.url === item.url;
                  return (
                    <SwiperSlide key={`${item.url}-${i}`} className="min-w-0 py-[3px]">
                      <button
                        type="button"
                        onClick={() => setSelectedMediaUrl(item.url)}
                        className={`relative block w-full aspect-square rounded-[16px] transition-all xl:rounded-[20px] 2xl:rounded-[24px] ${
                          isActive
                            ? 'border-2 border-black'
                            : 'border-2 border-transparent'
                        }`}
                      >
                        <div className="relative h-full w-full overflow-hidden rounded-[16px] xl:rounded-[20px] 2xl:rounded-[24px]">
                          {item.mediaType === 'video' ? (
                            <>
                              <video
                                src={item.url}
                                className="h-full w-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white">
                                  ▶
                                </span>
                              </div>
                            </>
                          ) : (
                            <Image
                              src={item.url}
                              alt={offer.name}
                              fill
                              loading="lazy"
                              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                              className="object-cover"
                            />
                          )}
                        </div>
                      </button>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              <div className="special-offer-thumbs-pagination mt-3 flex justify-center xl:mt-4" />

              {/* FIXED GLOBAL STYLES: overflow hidden on Swiper */}
              <style jsx global>{`
                .special-offer-thumbs-slider .swiper {
                  width: 100%;
                  overflow: hidden;
                }

                .special-offer-thumbs-slider .swiper-wrapper {
                  align-items: stretch;
                  overflow: visible;
                }

                .special-offer-thumbs-slider .swiper-slide {
                  width: 100%;
                  min-width: 0;
                  overflow: visible;
                }

                .special-offer-thumbs-slider .swiper-pagination-bullet {
                  width: 8px;
                  height: 8px;
                  background: rgba(0, 0, 0, 0.25);
                  opacity: 1;
                  transition: all 0.3s ease;
                }

                .special-offer-thumbs-slider .swiper-pagination-bullet-active {
                  width: 22px;
                  border-radius: 9999px;
                  background: #000;
                }

                @media (min-width: 1280px) {
                  .special-offer-thumbs-slider .swiper-pagination-bullet {
                    width: 10px;
                    height: 10px;
                  }

                  .special-offer-thumbs-slider .swiper-pagination-bullet-active {
                    width: 28px;
                  }
                }
              `}</style>
            </div>
          )}
        </div>

        {/* RIGHT SIDE – unchanged */}
        <div className="min-w-0 pt-1 xl:pt-3">
          <h1 className="text-[20px] font-bold uppercase leading-[1] tracking-[-0.02em] text-black md:text-[28px] xl:text-[36px] 2xl:text-[42px]">
            {offer.name}
          </h1>

          <div className="mt-3 space-y-[6px] text-[12px] leading-4 text-[#6d6d6d] xl:mt-5 xl:space-y-2 xl:text-[14px] xl:leading-5 2xl:text-[15px] 2xl:leading-6">
            <div className='font-bold'>
              Status:{' '}
              <span className="font-black text-black">
                {offer.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className='font-bold'>
              Start Date:{' '}
              <span className="font-black text-black">
                {formatDate(offer.startDate)}
              </span>
            </div>

            <div className='font-bold'>
              End Date:{' '}
              <span className="font-black text-black">
                {formatDate(offer.endDate)}
              </span>
            </div>

            <div className='font-bold'>
              Included Products:{' '}
              <span className="font-black text-black">{offer.products.length}</span>
            </div>
          </div>

          <div className="mt-8 flex items-end justify-end gap-2 text-right text-bold xl:mt-10 xl:gap-3 2xl:mt-12">
            <div className="flex flex-col items-end">
              <span className="mb-1 text-[14px] font-bold text-gray-400 line-through xl:text-[18px] 2xl:text-[20px]">
                {formatPrice(originTotal)}
              </span>
              <span className="text-[20px] font-bold leading-none xl:text-[56px] 2xl:text-[40px]">
                {formatPrice(price)}
              </span>
            </div>
          </div>

          <div className="mt-2 h-px w-full bg-black/40 xl:mt-3" />

          <div className="mt-5 xl:mt-7">
            <h2 className="text-[20px] font-bold leading-none text-black xl:text-[26px] 2xl:text-[30px]">
              Details
            </h2>

            {offer.description && stringLooksLikeSimpleHtml(offer.description) ? (
              <div className={detailsHtmlClassName} dangerouslySetInnerHTML={{ __html: offer.description }} />
            ) : (
              <p className={detailsBodyClassName}>
                {offer.description ||
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet justo dolor. Duis eu augue laoreet, suscipit tellus id, euismod est. Maecenas egestas quis ante ut laoreet.'}
              </p>
            )}
          </div>

          <div className="mt-5 xl:mt-7">
            <h3 className="text-[18px] font-bold uppercase text-black xl:text-[22px]">
              Included Products
            </h3>

            <div className="mt-4 space-y-3">
              {offer.products.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[14px] border border-black/10 bg-black/[0.03] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold uppercase text-black">
                      {item.product.name}
                    </p>
                    <p className="text-[12px] text-[#666]">
                      /products/{item.product.slug}
                    </p>
                  </div>

                  <span className="shrink-0 text-[13px] font-bold text-black">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 w-full max-w-full sm:ml-auto sm:max-w-[210px] xl:mt-8 xl:max-w-[210px] 2xl:max-w-[250px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[16px] font-bold text-[#555] xl:text-[18px] 2xl:text-[20px]">
                Quantity
              </span>

              <div className="flex h-[32px] items-center rounded-full bg-black px-3 text-white shadow-sm sm:h-[34px] xl:h-[34px] xl:px-3 2xl:h-[40px] 2xl:px-4">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="flex h-6 w-6 items-center justify-center text-[14px] leading-none xl:h-7 xl:w-7 xl:text-[16px] 2xl:h-8 2xl:w-8 2xl:text-[18px]"
                >
                  -
                </button>

                <span className="min-w-[24px] px-2 text-center text-[13px] font-bold xl:min-w-[24px] xl:px-2 xl:text-[15px] 2xl:min-w-[28px] 2xl:text-[17px]">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="flex h-6 w-6 items-center justify-center text-[14px] leading-none xl:h-7 xl:w-7 xl:text-[16px] 2xl:h-8 2xl:w-8 2xl:text-[18px]"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-10 inline-flex h-[46px] min-w-[145px] items-center justify-center rounded-full bg-black px-8 text-[16px] font-bold text-white transition hover:opacity-90 xl:mt-12 xl:h-[58px] xl:min-w-[190px] xl:px-10 xl:text-[18px] 2xl:mt-14 2xl:h-[70px] 2xl:min-w-[220px] 2xl:px-12 2xl:text-[20px]"
            onClick={handleAddToCart}
          >
            Add to cart
          </button>
        </div>
      </div>
    </section>
  );
}