'use client';

import Image from 'next/image';
import type { CartItem } from '@/types/cart';
import { formatPrice } from '@/lib/PriceFormat';
import { formatCartLineTypeLabel } from '@/lib/formatCartLineTypeLabel';

// Helper to check if a URL is a video file
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const videoExtensions = /\.(mp4|webm|mov|ogg|avi)(\?.*)?$/i;
  return videoExtensions.test(url);
}

// Helper to get the correct media URL and type from a cart item
function getMediaInfo(item: CartItem): { url: string; isVideo: boolean } {
  // Prefer videoUrl if it exists and is a video file
  if (item.videoUrl && isVideoUrl(item.videoUrl)) {
    return { url: item.videoUrl, isVideo: true };
  }
  // Otherwise fall back to imageUrl
  if (item.imageUrl) {
    return { url: item.imageUrl, isVideo: false };
  }
  // Final fallback: placeholder image (not a video)
  return { url: '/placeholder.png', isVideo: false };
}

type Props = {
  items?: CartItem[];
};

export default function CheckoutOrderItems({ items = [] }: Props) {
  if (!items.length) return null;

  return (
    <div className="rounded-[28px] border border-black/10 p-5 md:p-6">
      <h3 className="text-[20px] font-semibold text-black md:text-[24px]">
        Your Order
      </h3>

      <div className="mt-6 space-y-4">
        {items.map((item, index) => {
          const media = getMediaInfo(item);
          const lineTotal = Number(item.price ?? 0) * Number(item.quantity ?? 0);

          return (
            <div
              key={item.cartKey}
              className={`flex items-center gap-4 pb-4 ${
                index !== items.length - 1 ? 'border-b border-black/10' : ''
              }`}
            >
              <div className="relative h-[76px] w-[76px] overflow-hidden rounded-[20px] bg-[#f2f2f2]">
                {media.isVideo ? (
                  <video
                    src={media.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <Image
                    src={media.url}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[16px] font-medium text-black">
                  {item.title}
                </p>

                <p className="mt-1 text-[14px] capitalize text-black/45">
                  Qty: {item.quantity} · {formatCartLineTypeLabel(item.type)}
                </p>

                <p className="mt-2 text-[15px] font-semibold text-black">
                  {formatPrice(lineTotal)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}