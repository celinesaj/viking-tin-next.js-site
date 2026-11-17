'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import type { Bundle } from '@/types/bundles';
import MediaFallback from '@/components/common/MediaFallback';
import { useAppDispatch } from '@/store/hook';
import { addBundleToCart } from '@/features/cart/cartSlice';
import { plainTextFromHtml, stringLooksLikeSimpleHtml } from '@/lib/adminRichText';
import { formatPrice } from '@/lib/PriceFormat';
import toast from 'react-hot-toast';

type Props = {
  bundle: Bundle;
};

type BundleMediaItem = {
  id?: string | number;
  mediaType: 'image' | 'video';
  url: string;
  sortOrder?: number | null;
};

export default function OfferCard({ bundle }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [mediaError, setMediaError] = useState(false);

  const normalizeUrl = (url?: string | null) => url?.trim() ?? '';

  const mediaItems: BundleMediaItem[] = (
      (bundle as Bundle & {
        media?: Array<{
          id?: string | number;
          mediaType?: string;
          url?: string;
          sortOrder?: number | null;
        }>;
      }).media ?? []
    )
    .filter(
      (item): item is BundleMediaItem =>
        !!item?.url &&
        (item.mediaType === 'image' || item.mediaType === 'video')
    )
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const firstImage = mediaItems.find((item) => item.mediaType === 'image');
  const firstVideo = mediaItems.find((item) => item.mediaType === 'video');

  const imageSrc =
    normalizeUrl(firstImage?.url) ||
    (!firstVideo ? normalizeUrl(bundle.imageUrl) : '');

  const videoSrc = !imageSrc ? normalizeUrl(firstVideo?.url) : '';
  const showFallback = mediaError || (!imageSrc && !videoSrc);

  const oldPrice = Number(bundle.originTotal || 0);
  const newPrice = Number(bundle.price || 0);

  const addItem = () => {
    dispatch(
      addBundleToCart({
        bundle,
        price: newPrice,
      })
    );
    toast.success(`${bundle.name} added to cart`);
  };

  const handleAddToCart = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addItem();
  };

  const handleBuyNow = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addItem();
    router.push('/cart');
  };

  const handleCardClick = () => {
    router.push(`/bundles/${bundle.slug}`);
  };

  return (
    <div className="w-full">
      {/* Image section remains wrapped in Link for SEO and semantic navigation */}
      <Link href={`/bundles/${bundle.slug}`} className="block">
        <div className="relative overflow-hidden rounded-[10px]">
          {/* SQUARE CONTAINER: aspect-square w-full replaces fixed heights */}
          <div className="relative aspect-square w-full">
            {showFallback ? (
              <MediaFallback label="Bundle media unavailable" />
            ) : imageSrc ? (
              <Image
                src={imageSrc}
                alt={bundle.name}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 33vw"
                onError={() => setMediaError(true)}
              />
            ) : (
              <video
                src={videoSrc}
                className="h-full w-full object-cover object-top"
                muted
                playsInline
                preload="metadata"
                onError={() => setMediaError(true)}
              />
            )}
          </div>
        </div>
      </Link>

      {/* Bottom content area – now clickable */}
      <div
        className="mt-2 cursor-pointer rounded-[16px] bg-white p-3 sm:mt-2 sm:p-4 md:p-5"
        onClick={handleCardClick}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
          <div className="min-w-0">
            <h3
              className="line-clamp-1 text-[22px] font-semibold uppercase text-black"
              title={bundle.name}
            >
              {bundle.name}
            </h3>

            {bundle.description ? (
              stringLooksLikeSimpleHtml(bundle.description) ? (
                <div
                  className="mt-2 line-clamp-2 text-[13px] text-[#9b9b9b] [&_a]:text-[#2563eb] [&_a]:underline"
                  title={plainTextFromHtml(bundle.description)}
                  // eslint-disable-next-line react/no-danger -- admin-authored bundle copy
                  dangerouslySetInnerHTML={{ __html: bundle.description }}
                />
              ) : (
                <p
                  className="mt-2 line-clamp-2 text-[13px] text-[#9b9b9b]"
                  title={bundle.description}
                >
                  {bundle.description}
                </p>
              )
            ) : (
              <div className="mt-1 h-[34px] sm:h-[38px] md:h-[40px]" />
            )}
          </div>

          <div className="pt-1 sm:text-right">
            {oldPrice > newPrice && (
              <div className="text-[11px] font-medium leading-none line-through text-black sm:text-[12px] md:text-[13px]">
                {formatPrice(oldPrice)}
              </div>
            )}

            <div className="mt-1 text-[16px] font-bold leading-none text-[#ff1e1e] sm:text-[18px] md:text-[20px] lg:text-[22px]">
              {formatPrice(newPrice)}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:gap-3 items-center justify-center">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full rounded-full border border-black px-4 py-2 text-[11px] font-medium uppercase text-black transition hover:bg-black hover:text-white sm:w-auto sm:px-5 sm:py-2.5 sm:text-[12px]"
          >
            Add To Cart
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="w-full rounded-full border border-black bg-black px-4 py-2 text-[11px] font-medium uppercase text-white transition hover:bg-white hover:text-black sm:w-auto sm:px-5 sm:py-2.5 sm:text-[12px]"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}