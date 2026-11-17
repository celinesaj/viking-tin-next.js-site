'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import MediaFallback from '@/components/common/MediaFallback';
import { useAppDispatch } from '@/store/hook';
import { addProductToCart } from '@/features/cart/cartSlice';
import { IMAGES } from '@/constants/images';
import type { Product } from '@/types/products';
import { stringLooksLikeSimpleHtml } from '@/lib/adminRichText';
import { formatPrice } from '@/lib/PriceFormat';
import { resolveProductPricing } from '@/lib/productPricing';
import 'swiper/css';
import 'swiper/css/pagination';
import toast from 'react-hot-toast';
import WhyChooseSection from './WhyChoose';

const detailsBodyClassName =
  'mt-2 max-w-[320px] text-[12px] leading-[1.5] text-[#666] xl:mt-3 xl:max-w-[460px] xl:text-[14px] xl:leading-[1.65] 2xl:max-w-[540px] 2xl:text-[15px]';

type Props = {
  product: Product;
};

type ProductMediaItem = {
  id: string | number;
  mediaType: 'image' | 'video';
  url: string;
  sortOrder?: number | null;
  createdAt?: string | null;
};

function getSortedMediaItems(product: Props['product']): ProductMediaItem[] {
  return (
    product.media
      ?.filter(
        (item) =>
          item?.url &&
          (item.mediaType === 'image' || item.mediaType === 'video')
      )
      ?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) ?? []
  );
}

function getInitialMediaUrl(product: Props['product']): string | null {
  const items = getSortedMediaItems(product);
  const firstImage = items.find((item) => item.mediaType === 'image');
  return (firstImage ?? items[0])?.url ?? null;
}

export default function ProductDetailsSection({ product }: Props) {
  const dispatch = useAppDispatch();

  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(
    () => getInitialMediaUrl(product),
  );
  const [quantity, setQuantity] = useState(1);
  const [mediaError, setMediaError] = useState(false);
  const isOutOfStock = product.stock === 0;

  useEffect(() => {
    setMediaError(false);
  }, [selectedMediaUrl]);

  const mediaItems = useMemo<ProductMediaItem[]>(
    () => getSortedMediaItems(product),
    [product],
  );

  const selectedMedia = useMemo(
    () => mediaItems.find((item) => item.url === selectedMediaUrl) ?? mediaItems[0],
    [mediaItems, selectedMediaUrl],
  );

  const fallbackImage =
    IMAGES.placeholders.product || '/images/placeholders/product.png';

  const pricing = resolveProductPricing({
    price: product.price,
    comparePrice: product.comparePrice,
    offer_price: product.offer_price,
    offer_percentage: product.offer_percentage,
    offer_discount_amount: product.offer_discount_amount,
  });

  const nicotineMg = Math.round(Number(product.nicotineMg || 0));

  let nicotineDots = 1;
  if (nicotineMg >= 20) nicotineDots = 5;
  else if (nicotineMg >= 15) nicotineDots = 4;
  else if (nicotineMg >= 10) nicotineDots = 3;
  else if (nicotineMg >= 5) nicotineDots = 2;
  else nicotineDots = 1;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} items available in stock`);
      return;
    }
    for (let i = 0; i < quantity; i += 1) {
      dispatch(
        addProductToCart({
          product,
          price: pricing.finalPrice,
        }),
      );
    }
    toast.success(`${product.name} added to cart`);
  };

  const canIncrease = !isOutOfStock && quantity < product.stock;

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 md:px-8 xl:px-12 2xl:max-w-[1700px]">
      <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_0.92fr] xl:gap-14 2xl:gap-20">
        {/* LEFT COLUMN – same as before */}
        <div className="min-w-0 w-full overflow-x-hidden">
          {/* ... unchanged media section ... */}
          <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] xl:rounded-[28px] 2xl:rounded-[34px]">
            {pricing.offerBadge && (
              <div className="absolute right-3 top-3 z-10 rounded-full bg-[#d32f2f] px-3 py-1 text-[10px] font-bold uppercase text-white sm:right-5 sm:top-5 sm:px-4 sm:py-2 sm:text-[12px]">
                {pricing.offerBadge}
              </div>
            )}

            {mediaError || !selectedMedia?.url ? (
              <MediaFallback label="Product media unavailable" />
            ) : selectedMedia.mediaType === 'video' ? (
              <video
                key={selectedMedia.url}
                src={selectedMedia.url}
                className="h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
                onError={() => setMediaError(true)}
              />
            ) : (
              <Image
                src={selectedMedia.url}
                alt={`Image of ${product.name} nicotine pouch`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                onError={() => setMediaError(true)}
              />
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/70 via-white/25 to-transparent sm:h-24 xl:h-36 2xl:h-44" />
          </div>

          {/* Thumbnails – unchanged */}
          {mediaItems.length > 0 && (
            <div className="product-thumbs-slider mt-3 w-full max-w-full overflow-hidden px-[3px] xl:mt-5">
              <Swiper
                modules={[Pagination]}
                spaceBetween={12}
                slidesPerView={3}
                pagination={{ clickable: true, el: '.product-thumbs-pagination' }}
                breakpoints={{ 640: { slidesPerView: 3 }, 1024: { slidesPerView: 3 } }}
                className="w-full"
              >
                {mediaItems.map((item) => {
                  const isActive = selectedMedia?.url === item.url;
                  return (
                    <SwiperSlide key={item.id} className="min-w-0 py-[3px]">
                      <button
                        type="button"
                        onClick={() => setSelectedMediaUrl(item.url)}
                        className={`relative block aspect-square w-full rounded-[16px] xl:rounded-[20px] 2xl:rounded-[24px] ${
                          isActive ? 'ring-1 ring-black' : 'ring-1 ring-black/10'
                        }`}
                      >
                        <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-white xl:rounded-[20px] 2xl:rounded-[24px]">
                          {item.mediaType === 'video' ? (
                            <>
                              <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white">▶</span>
                              </div>
                            </>
                          ) : (
                            <Image src={item.url} alt={`Thumbnail of ${product.name}`} fill loading="lazy" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover" />
                          )}
                        </div>
                      </button>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              <div className="product-thumbs-pagination mt-3 flex justify-center xl:mt-4" />
              <style jsx global>{`
                .product-thumbs-slider .swiper { width: 100%; overflow: visible; }
                .product-thumbs-slider .swiper-wrapper { align-items: stretch; }
                .product-thumbs-slider .swiper-slide { width: 100%; min-width: 0; overflow: visible; }
                .product-thumbs-slider .swiper-pagination-bullet { width: 8px; height: 8px; background: rgba(0,0,0,0.25); opacity: 1; transition: all 0.3s ease; }
                .product-thumbs-slider .swiper-pagination-bullet-active { width: 22px; border-radius: 9999px; background: #000; }
                @media (min-width: 1280px) {
                  .product-thumbs-slider .swiper-pagination-bullet { width: 10px; height: 10px; }
                  .product-thumbs-slider .swiper-pagination-bullet-active { width: 28px; }
                }
              `}</style>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN – updated with stock info and quantity controls */}
        <div className="min-w-0 pt-1 xl:pt-3">
          <h1 className="text-[20px] font-bold uppercase leading-[1] tracking-[-0.02em] text-bold md:text-[28px] xl:text-[36px] 2xl:text-[42px]">
            {product.name}
          </h1>

          <p className="mt-3 text-[14px] font-bold tracking-[-0.02em] text-[#6d6d6d] xl:text-[16px] 2xl:text-[18px]">
            {product.hook || product.metaTitle || product.name}
          </p>

          <div className="mt-5 xl:mt-7">
            <h2 className="text-[20px] font-bold leading-none text-bold xl:text-[26px] 2xl:text-[30px]">
              Product Specifications
            </h2>

            <div className="mt-1 space-y-[6px] text-[12px] leading-4 text-[#6d6d6d] xl:mt-5 xl:space-y-2 xl:text-[14px] xl:leading-5 2xl:text-[15px] 2xl:leading-6">
              <div className="font-bold">
                Brand: <span className="font-black text-bold">{product.brandName}</span>
              </div>
              <div className="font-bold">
                Flavor: <span className="font-black text-bold">{product.flavorName}</span>
              </div>
              <div className="flex items-center gap-2 xl:gap-3">
                <span className="font-bold">Strength: </span>
                <div className="flex gap-1 xl:gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="h-[8px] w-[8px] rounded-full xl:h-[10px] xl:w-[10px] 2xl:h-[12px] 2xl:w-[12px]" style={{ backgroundColor: i < nicotineDots ? '#ff2b2b' : '#d1d1d1' }} />
                  ))}
                </div>
                <span className="font-black text-bold">({product.strengthName})</span>
              </div>
              <div className="font-bold">
                Pouches per can: <span className="font-black text-bold">{product.pouchCount}</span>
              </div>
              <div className="font-bold">
                Nicotine Content: <span className="font-black text-bold">{product.nicotineMg || 'Lorem Ipsum'} Mg/Pouch</span>
              </div>
              {!isOutOfStock && product.stock > 0 && (
                <div className="font-bold text-green-600">
                  In stock: {product.stock} available
                </div>
              )}
              {isOutOfStock && (
                <div className="font-bold text-red-600">Out of stock</div>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-end justify-end gap-2 text-right text-bold xl:mt-10 xl:gap-3 2xl:mt-12">
            <div className="flex flex-col items-end">
              {pricing.oldPrice !== null && pricing.oldPrice !== pricing.finalPrice && (
                <span className="mb-1 text-[14px] font-bold text-gray-400 line-through xl:text-[16px] 2xl:text-[18px]">
                  {formatPrice(pricing.oldPrice)}
                </span>
              )}
              <span className="text-[20px] font-bold leading-none xl:text-[46px] 2xl:text-[30px]">
                {formatPrice(pricing.finalPrice)}
              </span>
            </div>
          </div>

          <div className="mt-2 h-px w-full bg-black/40 xl:mt-3" />

          <div className="mt-5 xl:mt-7">
            <h2 className="text-[20px] font-bold leading-none text-bold xl:text-[26px] 2xl:text-[30px]">Details</h2>
            {product.description && stringLooksLikeSimpleHtml(product.description) ? (
              <div className={`${detailsBodyClassName} [&_a]:font-inherit [&_a]:text-[#2563eb] [&_a]:underline [&_a]:hover:text-[#1d4ed8]`} dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p className={detailsBodyClassName}>
                {product.description ||
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet justo dolor. Duis eu augue laoreet, suscipit tellus id, euismod est. Maecenas egestas quis ante ut laoreet.'}
              </p>
            )}
            <WhyChooseSection productId={product.id} />
          </div>

          <div className="mt-5 w-full max-w-full sm:ml-auto sm:max-w-[210px] xl:mt-8 xl:max-w-[210px] 2xl:max-w-[250px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[16px] font-bold text-[#555] xl:text-[18px] 2xl:text-[20px]">Quantity</span>
              <div className="flex h-[32px] items-center rounded-full bg-black px-3 text-white shadow-sm sm:h-[34px] xl:h-[34px] xl:px-3 2xl:h-[40px] 2xl:px-4">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="flex h-6 w-6 items-center justify-center text-[14px] leading-none xl:h-7 xl:w-7 xl:text-[16px] 2xl:h-8 2xl:w-8 2xl:text-[18px]"
                  disabled={isOutOfStock}
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
                  disabled={!canIncrease}
                >
                  +
                </button>
              </div>
            </div>
            {!isOutOfStock && product.stock > 0 && quantity > product.stock && (
              <p className="mt-1 text-xs text-red-500">Cannot exceed available stock ({product.stock})</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`mt-10 inline-flex h-[46px] min-w-[145px] items-center justify-center rounded-full px-8 text-[16px] font-bold transition xl:mt-12 xl:h-[58px] xl:min-w-[190px] xl:px-10 xl:text-[18px] 2xl:mt-14 2xl:h-[70px] 2xl:min-w-[220px] 2xl:px-12 2xl:text-[20px] ${
              isOutOfStock
                ? 'cursor-not-allowed bg-gray-400 text-white'
                : 'bg-black text-white hover:opacity-90'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </section>
  );
}