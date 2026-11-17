'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { Product } from '@/types/products';
import MediaFallback from '@/components/common/MediaFallback';
import { useAppDispatch } from '@/store/hook';
import { addProductToCart } from '@/features/cart/cartSlice';
import { productsApi } from '@/features/products/productsApi';
import { COLORS } from '@/constants/colors';
import {
  cloudinaryAnimatedFirstFrameUrl,
  cloudinaryVideoFirstFrameUrl,
} from '@/lib/cloudinaryFirstFrame';
import { tryPlayVideo } from '@/lib/tryPlayVideo';
import { formatPrice } from '@/lib/PriceFormat';
import { resolveProductPricing } from '@/lib/productPricing';
import { isMotionCoverVideoUrl } from '@/lib/motionCoverMedia';
import toast from 'react-hot-toast';

/** Short delay before hiding the GIF so tiny pointer moves do not restart the animation */
const GIF_HOVER_LEAVE_MS = 140;

/** Video-only cards: play only after the pointer rests on the card this long */
const VIDEO_CARD_DWELL_MS = 2000;

/** Motion-cover MP4/WebM: pause at this time (seconds) while pointer stays on card */
const MOTION_COVER_PAUSE_AT_SEC = 1.7;

const MOTION_CAP_USE_RVFC =
  typeof HTMLVideoElement !== 'undefined' &&
  typeof HTMLVideoElement.prototype.requestVideoFrameCallback === 'function';

type ProductCardProps = {
  product: Product;
};

type ProductMediaItem = {
  id?: string | number;
  mediaType: 'image' | 'video';
  url: string;
  sortOrder?: number | null;
};

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [mediaHover, setMediaHover] = useState(false);
  const [videoDwellActive, setVideoDwellActive] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoDwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const motionCoverVideoRef = useRef<HTMLVideoElement | null>(null);
  const motionCoverHoverPrevRef = useRef(false);
  const mediaHoverRef = useRef(false);
  const videoDwellActiveRef = useRef(false);
  const motionHoldingAtCapRef = useRef(false);
  const motionPlayingTailRef = useRef(false);
  const motionHadPlaybackRef = useRef(false);
  const motionRvfcHandleRef = useRef<number | null>(null);

  const cancelMotionCoverRvfc = (v: HTMLVideoElement | null) => {
    if (!v || motionRvfcHandleRef.current == null) return;
    try {
      v.cancelVideoFrameCallback(motionRvfcHandleRef.current);
    } catch {
      /* invalid handle */
    }
    motionRvfcHandleRef.current = null;
  };

  const clearHoverLeaveTimer = () => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
  };

  const clearVideoDwellTimer = () => {
    if (videoDwellTimerRef.current) {
      clearTimeout(videoDwellTimerRef.current);
      videoDwellTimerRef.current = null;
    }
  };

  const stopCardVideo = () => {
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  };

  useEffect(
    () => () => {
      clearHoverLeaveTimer();
      clearVideoDwellTimer();
    },
    [],
  );

  useEffect(() => {
    mediaHoverRef.current = mediaHover;
  }, [mediaHover]);

  useEffect(() => {
    videoDwellActiveRef.current = videoDwellActive;
  }, [videoDwellActive]);

  useEffect(() => {
    if (!videoDwellActive) return;
    tryPlayVideo(videoRef.current);
  }, [videoDwellActive]);

  const mediaItems: ProductMediaItem[] =
    product.media
      ?.filter(
        (item) =>
          item?.url &&
          (item.mediaType === 'image' || item.mediaType === 'video')
      )
      ?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) ?? [];

  const firstImage = mediaItems.find((item) => item.mediaType === 'image');
  const firstVideo = mediaItems.find((item) => item.mediaType === 'video');

  const normalizeUrl = (url?: string | null) => url?.trim() ?? '';
  const coverGifUrl = normalizeUrl(product.coverGifUrl);
  const coverImageUrl = normalizeUrl(product.coverImageUrl);
  const mediaImageUrl = normalizeUrl(firstImage?.url);
  const staticImageUrl = coverImageUrl || mediaImageUrl;
  const motionCoverIsVideo = useMemo(
    () => isMotionCoverVideoUrl(coverGifUrl),
    [coverGifUrl],
  );
  const gifPosterUrl = useMemo(
    () =>
      coverGifUrl && !motionCoverIsVideo
        ? cloudinaryAnimatedFirstFrameUrl(coverGifUrl) ?? ''
        : '',
    [coverGifUrl, motionCoverIsVideo],
  );
  const motionVideoPosterUrl = useMemo(() => {
    if (!coverGifUrl || !motionCoverIsVideo) return '';
    return (
      cloudinaryVideoFirstFrameUrl(coverGifUrl) ||
      coverImageUrl ||
      mediaImageUrl ||
      ''
    );
  }, [coverGifUrl, motionCoverIsVideo, coverImageUrl, mediaImageUrl]);

  const videoUrl =
    !coverGifUrl && !staticImageUrl ? (firstVideo?.url ?? '') : '';

  useEffect(() => {
    if (!coverGifUrl || !motionCoverIsVideo) return;
    const v = motionCoverVideoRef.current;
    if (!v) return;

    if (mediaHover) {
      const hoverEntered = mediaHover && !motionCoverHoverPrevRef.current;
      motionCoverHoverPrevRef.current = mediaHover;

      if (hoverEntered) {
        motionPlayingTailRef.current = false;
        motionHoldingAtCapRef.current = false;
        motionHadPlaybackRef.current = true;
        v.currentTime = 0;
        tryPlayVideo(v);
      }
      return;
    }

    motionCoverHoverPrevRef.current = false;

    if (!motionHadPlaybackRef.current) return;

    motionPlayingTailRef.current = true;
    motionHoldingAtCapRef.current = false;
    tryPlayVideo(v);
  }, [coverGifUrl, motionCoverIsVideo, mediaHover]);

  const warmVideoOnHover = (el: HTMLVideoElement | null) => {
    if (!el || el.readyState > HTMLMediaElement.HAVE_METADATA) return;
    el.preload = 'auto';
  };

  const showFallback = mediaError || (!coverGifUrl && !staticImageUrl && !videoUrl);

  useEffect(() => {
    clearVideoDwellTimer();
    stopCardVideo();
    setMediaError(false);
    motionHadPlaybackRef.current = false;
    motionHoldingAtCapRef.current = false;
    motionPlayingTailRef.current = false;
    motionCoverHoverPrevRef.current = false;
    const mv = motionCoverVideoRef.current;
    if (mv) {
      cancelMotionCoverRvfc(mv);
      mv.pause();
      mv.currentTime = 0;
    }
    const t = window.setTimeout(() => setVideoDwellActive(false), 0);
    return () => window.clearTimeout(t);
  }, [product.id, videoUrl, coverGifUrl]);

  const pricing = resolveProductPricing({
    price: product.price,
    comparePrice: product.comparePrice,
    offer_price: product.offer_price,
    offer_percentage: product.offer_percentage,
    offer_discount_amount: product.offer_discount_amount,
  });

  const isOutOfStock = product.stock === 0;

  const nicotineMg = Math.round(Number(product.nicotineMg || 0));

  let nicotineDots = 1;
  if (nicotineMg >= 20) nicotineDots = 5;
  else if (nicotineMg >= 15) nicotineDots = 4;
  else if (nicotineMg >= 10) nicotineDots = 3;
  else if (nicotineMg >= 5) nicotineDots = 2;

  const brandName = product.brandName || product.manufacturer?.trim() || 'VOX';
  const flavorName = product.flavorName || '';

  const addItemToCart = () => {
    if (isOutOfStock) return;
    dispatch(addProductToCart({ product, price: pricing.finalPrice }));
    toast.success(`${product.name} added to cart`);
  };

  const handleAddToCart = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addItemToCart();
  };

  const handleBuyNow = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItemToCart();
    router.push('/cart');
  };

  return (
    <div
      className="w-full"
      onMouseEnter={() => {
        dispatch(
          productsApi.endpoints.getProductBySlug.initiate(product.slug, {
            subscribe: false,
            forceRefetch: false,
          }),
        );
        if (coverGifUrl) {
          clearHoverLeaveTimer();
          setMediaHover(true);
          if (motionCoverIsVideo) {
            const v = motionCoverVideoRef.current;
            if (v) {
              motionPlayingTailRef.current = false;
              motionHoldingAtCapRef.current = false;
              motionHadPlaybackRef.current = true;
              warmVideoOnHover(v);
              v.currentTime = 0;
              tryPlayVideo(v);
            }
          }
          return;
        }
        if (videoUrl) {
          clearVideoDwellTimer();
          videoDwellTimerRef.current = setTimeout(() => {
            setVideoDwellActive(true);
            tryPlayVideo(videoRef.current);
            videoDwellTimerRef.current = null;
          }, VIDEO_CARD_DWELL_MS);
        }
      }}
      onMouseLeave={() => {
        if (coverGifUrl) {
          clearHoverLeaveTimer();
          hoverLeaveTimerRef.current = setTimeout(() => {
            setMediaHover(false);
            hoverLeaveTimerRef.current = null;
          }, GIF_HOVER_LEAVE_MS);
        }
        if (videoUrl) {
          clearVideoDwellTimer();
          setVideoDwellActive(false);
          stopCardVideo();
        }
      }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="block"
        aria-label={`View details for ${product.name}`}
      >
        <article className="w-full">
          <div className="relative overflow-hidden rounded-[10px]">
            {flavorName && (
              <div className="absolute left-3 top-3 z-10 rounded-full bg-black px-3 py-1 text-[10px] font-medium uppercase text-white sm:left-5 sm:top-5 sm:px-4 sm:py-2 sm:text-[12px]">
                {flavorName}
              </div>
            )}

            <div className="relative flex h-[250px] items-center justify-center sm:h-[290px] md:h-[300px]">
              {/* media rendering unchanged – omitted for brevity */}
              {showFallback ? (
                <MediaFallback label="Product media unavailable" />
              ) : coverGifUrl ? (
                motionCoverIsVideo ? (
                  <div className="absolute inset-0 z-0 isolate overflow-hidden bg-[#d9d9dd]">
                    <video
                      ref={motionCoverVideoRef}
                      src={coverGifUrl}
                      poster={motionVideoPosterUrl || undefined}
                      className="pointer-events-none absolute left-0 top-0 h-full w-full object-cover object-top"
                      muted
                      playsInline
                      preload="metadata"
                      aria-hidden
                      onError={() => setMediaError(true)}
                      onCanPlay={() => {
                        if (mediaHoverRef.current) tryPlayVideo(motionCoverVideoRef.current);
                      }}
                      onPause={() => {
                        cancelMotionCoverRvfc(motionCoverVideoRef.current);
                      }}
                      onPlaying={(e) => {
                        const v = e.currentTarget;
                        if (
                          !MOTION_CAP_USE_RVFC ||
                          motionPlayingTailRef.current ||
                          motionHoldingAtCapRef.current ||
                          !mediaHoverRef.current
                        ) {
                          return;
                        }
                        cancelMotionCoverRvfc(v);

                        const step: VideoFrameRequestCallback = (_now, meta) => {
                          const el = motionCoverVideoRef.current;
                          if (!el) {
                            motionRvfcHandleRef.current = null;
                            return;
                          }
                          if (
                            !mediaHoverRef.current ||
                            motionPlayingTailRef.current ||
                            motionHoldingAtCapRef.current
                          ) {
                            cancelMotionCoverRvfc(el);
                            return;
                          }
                          const dur = el.duration;
                          const cap =
                            Number.isFinite(dur) && dur > 0
                              ? Math.min(MOTION_COVER_PAUSE_AT_SEC, dur)
                              : MOTION_COVER_PAUSE_AT_SEC;
                          const mediaTime =
                            typeof meta.mediaTime === 'number' && !Number.isNaN(meta.mediaTime)
                              ? meta.mediaTime
                              : el.currentTime;
                          if (mediaTime >= cap) {
                            motionHoldingAtCapRef.current = true;
                            cancelMotionCoverRvfc(el);
                            el.pause();
                            return;
                          }
                          motionRvfcHandleRef.current = el.requestVideoFrameCallback(step);
                        };

                        motionRvfcHandleRef.current = v.requestVideoFrameCallback(step);
                      }}
                      onTimeUpdate={
                        MOTION_CAP_USE_RVFC
                          ? undefined
                          : (e) => {
                              const v = e.currentTarget;
                              if (!mediaHoverRef.current || motionPlayingTailRef.current) return;
                              if (motionHoldingAtCapRef.current) return;
                              const cap =
                                Number.isFinite(v.duration) && v.duration > 0
                                  ? Math.min(MOTION_COVER_PAUSE_AT_SEC, v.duration)
                                  : MOTION_COVER_PAUSE_AT_SEC;
                              if (v.currentTime >= cap) {
                                motionHoldingAtCapRef.current = true;
                                v.pause();
                              }
                            }
                      }
                      onEnded={() => {
                        if (!motionPlayingTailRef.current || mediaHoverRef.current) return;
                        motionPlayingTailRef.current = false;
                        motionHadPlaybackRef.current = false;
                        const el = motionCoverVideoRef.current;
                        if (el) {
                          el.pause();
                          el.currentTime = 0;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {gifPosterUrl ? (
                      <img
                        src={gifPosterUrl}
                        alt={`Image of ${product.name} nicotine pouch`}
                        className="absolute inset-0 z-0 h-full w-full object-cover object-top"
                        loading="lazy"
                        onError={() => setMediaError(true)}
                      />
                    ) : (
                      <div className="absolute inset-0 z-0 bg-[#d9d9dd]" aria-hidden />
                    )}
                    {mediaHover ? (
                      <img
                        src={coverGifUrl}
                        alt=""
                        className="absolute inset-0 z-1 h-full w-full object-cover object-top"
                        aria-hidden
                        onError={() => setMediaError(true)}
                      />
                    ) : null}
                  </>
                )
              ) : staticImageUrl ? (
                <Image
                  src={staticImageUrl}
                  alt={`Image of ${product.name} nicotine pouch`}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  onError={() => setMediaError(true)}
                />
              ) : videoUrl ? (
                <div className="relative h-full w-full">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="h-full w-full object-cover object-top"
                    muted
                    playsInline
                    loop
                    preload="metadata"
                    onError={() => setMediaError(true)}
                    onCanPlay={() => {
                      if (videoDwellActiveRef.current) tryPlayVideo(videoRef.current);
                    }}
                  />
                  {!videoDwellActive ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-[20px] text-white">
                        ▶
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <MediaFallback label="Product media unavailable" />
              )}
            </div>
          </div>
        </article>
      </Link>

      <div className="mt-2 rounded-[16px] bg-white p-3 sm:mt-2 sm:p-4 md:p-5"   onClick={() => router.push(`/products/${product.slug}`)}>
        {/* Modified grid to give title more space and allow wrapping */}
        <div className="grid gap-3 sm:grid-cols-[minmax(160px,1fr)_auto] sm:gap-4">
          <div className="min-w-0">
            {/* Title: now allows up to 2 lines, with word breaking */}
            <h3 className="line-clamp-2 text-[16px] font-semibold uppercase text-black sm:text-[18px] md:text-[20px] lg:text-[22px] break-words">
              {product.name}
            </h3>

            <p className="mt-1 flex items-center gap-1 text-[11px] uppercase text-[#9b9b9b] sm:text-[12px] md:text-[13px]">
              <span className="shrink-0">BRAND:</span>
              <span className="min-w-0 flex-1 truncate font-semibold text-black">
                {brandName}
              </span>
            </p>

            <p className="mt-1 text-[11px] uppercase text-[#9b9b9b] sm:text-[12px] md:text-[13px]">
              NICOTINE STRENGTH:
            </p>

            <div className="mt-2 flex items-center gap-1.5 sm:gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="h-[8px] w-[8px] rounded-full sm:h-[10px] sm:w-[10px] md:h-[12px] md:w-[12px]"
                  style={{
                    backgroundColor:
                      i < nicotineDots ? COLORS.black : '#d3d3d3',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="pt-1 sm:text-right">
            <div className="flex flex-col items-start sm:items-end">
              {isOutOfStock ? (
                <span className="text-[14px] font-medium text-red-600 sm:text-[15px] md:text-[16px]">
                  Out of Stock
                </span>
              ) : (
                <>
                  {pricing.oldPrice !== null &&
                    pricing.oldPrice !== pricing.finalPrice && (
                      <span className="text-[12px] text-black/40 line-through sm:text-[13px]">
                        {formatPrice(pricing.oldPrice)}
                      </span>
                    )}
                  <span className="text-[16px] font-bold text-black sm:text-[18px] md:text-[20px] lg:text-[22px]">
                    {formatPrice(pricing.finalPrice)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:mt-5 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full rounded-full border px-4 py-2 text-[11px] font-medium uppercase transition sm:w-auto sm:px-5 sm:py-2.5 sm:text-[12px] ${
              isOutOfStock
                ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400'
                : 'border-black bg-transparent text-black hover:bg-black hover:text-white'
            }`}
          >
            Add To Cart
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className={`w-full rounded-full border px-4 py-2 text-[11px] font-medium uppercase transition sm:w-auto sm:px-5 sm:py-2.5 sm:text-[12px] ${
              isOutOfStock
                ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400'
                : 'border-black bg-black text-white hover:bg-white hover:text-black'
            }`}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}