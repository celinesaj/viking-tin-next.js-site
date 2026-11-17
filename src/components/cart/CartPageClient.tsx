'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  ArrowRight,
} from 'lucide-react';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/common/Container';
import {
  clearCart,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
} from '@/features/cart/cartSlice';
import Skeleton from '@/components/common/Skeleton';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { IMAGES } from '@/constants/images';
import TopMarquee from '@/components/layout/topMarquee';
import { formatPrice } from '@/lib/PriceFormat';
import {
  calculateCartSummary,
  normaliseDiscountType,
} from '@/lib/cartPricing';
import { formatCartLineTypeLabel } from '@/lib/formatCartLineTypeLabel';
import { useGetActiveTaxRateQuery } from '@/features/tax-rates/taxRatesApi';
import { useGetMeQuery } from '@/features/auth/authApi';
import {
  useGetAvailableCouponsQuery,
  useLazyValidateCouponQuery,
} from '@/features/coupons/couponsApi';
import {
  clearAppliedCoupon,
  setAppliedCoupon,
} from '@/features/coupons/couponSlice';

// 🔸 Freebie imports
import { useGetFreebieEligibilityQuery } from '@/features/freebie/freebieApi';
import FreebieModal from '@/components/freebie/freebieModal';

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// ── Eligibility for coupons (exclude free items) ──────────────────────────

function hasRealProductOffer(product: any) {
  if (!product) return false;
  if (product.has_offer === true) return true;

  return (
    (product.offer_price !== null &&
      product.offer_price !== undefined &&
      product.offer_price !== '' &&
      Number(product.offer_price) > 0) ||
    (product.offer_percentage !== null &&
      product.offer_percentage !== undefined &&
      product.offer_percentage !== '' &&
      Number(product.offer_percentage) > 0) ||
    (product.offer_discount_amount !== null &&
      product.offer_discount_amount !== undefined &&
      product.offer_discount_amount !== '' &&
      Number(product.offer_discount_amount) > 0)
  );
}

function isCouponEligibleCartItem(item: any) {
  // 🔸 Free items are never eligible for coupons
  if (item.isFreebie) return false;
  if (item.type === 'bundle') return false;
  if (item.type === 'special_offer') return false;
  if (item.type === 'product' && hasRealProductOffer(item.product))
    return false;
  return true;
}

// ── Coupon / Free badge label ─────────────────────────────────────────────

function getItemBadge(item: any, hasAppliedCoupon: boolean) {
  // 🔸 Free gift badge
  if (item.isFreebie) {
    return { text: 'Free Gift', className: 'bg-green-600 text-white' };
  }
  if (item.type === 'bundle') {
    return { text: 'Coupon Not Applied', className: 'bg-[#f2f2f2] text-black/70' };
  }
  if (item.type === 'special_offer') {
    return { text: 'Coupon Not Applied', className: 'bg-[#f2f2f2] text-black/70' };
  }
  if (item.type === 'product' && hasRealProductOffer(item.product)) {
    return { text: 'Offer Item', className: 'bg-[#f2f2f2] text-black/70' };
  }
  if (hasAppliedCoupon && isCouponEligibleCartItem(item)) {
    return { text: 'Coupon Applied', className: 'bg-black text-white' };
  }
  return { text: 'Coupon Available', className: 'bg-[#f2f2f2] text-black/70' };
}

function formatCouponValue(
  discountType: 'percentage' | 'fixed' | string,
  discountValue: string | number
) {
  const value = toNumber(discountValue);
  const type = normaliseDiscountType(discountType);
  return type === 'percentage' ? `${value}%` : `AED ${value}`;
}

function computeDiscountAmount(
  appliedCoupon: {
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_discount_amount?: number;
  } | null,
  couponEligibleSubtotal: number
): number {
  if (!appliedCoupon) return 0;

  const { discount_type, discount_value, max_discount_amount } = appliedCoupon;

  if (toNumber(discount_value) <= 0) return 0;

  let raw = 0;

  if (discount_type === 'percentage') {
    const rate = toNumber(discount_value);
    if (rate <= 0 || rate > 100) return 0;
    raw = couponEligibleSubtotal * (rate / 100);
  } else {
    raw = Math.min(toNumber(discount_value), couponEligibleSubtotal);
  }

  if (max_discount_amount && max_discount_amount > 0) {
    raw = Math.min(raw, max_discount_amount);
  }

  if (raw <= 0) return 0;

  return Number(raw.toFixed(2));
}

export default function CartPageClient() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const appliedCoupon = useAppSelector((state) => state.coupon.appliedCoupon);
  const hasClaimedInSession = useAppSelector((state) => state.freebie.hasClaimedInSession);
  const [minOrderError, setMinOrderError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [showFreebieModal, setShowFreebieModal] = useState(false);

  const { data: activeTaxRate } = useGetActiveTaxRateQuery();
  const { data: meData, isError: isUserError, refetch: refetchMe } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [validateCoupon, { isFetching: isApplyingCoupon }] = useLazyValidateCouponQuery();

  const isLoggedIn = !!meData?.user && !isUserError;

  const { data: availableCouponsData, isFetching: isFetchingAvailableCoupons, refetch: refetchAvailableCoupons } =
    useGetAvailableCouponsQuery(undefined, {
      skip: !isLoggedIn,
      refetchOnMountOrArgChange: true,
    });

  const { data: freebieEligibility, isFetching: isFreebieLoading, refetch: refetchFreebie } =
    useGetFreebieEligibilityQuery(undefined, { skip: !isLoggedIn, refetchOnMountOrArgChange: true });

  const availableCoupons = availableCouponsData?.coupons ?? [];

  const trimmedPromoCode = useMemo(() => promoCode.trim(), [promoCode]);

  const isApplyDisabled =
    trimmedPromoCode.length === 0 || isApplyingCoupon || !isLoggedIn;

  const couponEligibleSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!isCouponEligibleCartItem(item)) return sum;
      return sum + toNumber(item.price) * toNumber(item.quantity);
    }, 0);
  }, [items]);

  const discountAmount = useMemo(
    () => computeDiscountAmount(appliedCoupon, couponEligibleSubtotal),
    [appliedCoupon, couponEligibleSubtotal]
  );

  const summary = useMemo(() => {
    const taxRatePercent = activeTaxRate?.rate ?? 0;
    return calculateCartSummary(items, taxRatePercent, discountAmount);
  }, [items, activeTaxRate, discountAmount]);

  // ── Re‑validate applied coupon whenever cart or applied coupon changes ──
  useEffect(() => {
    const revalidateAppliedCoupon = async () => {
      if (!isLoggedIn || !appliedCoupon) return;

      try {
        const result = await validateCoupon({ code: appliedCoupon.code }).unwrap();
        if (!result.valid) {
          dispatch(clearAppliedCoupon());
          toast.error(`Coupon ${appliedCoupon.code} is no longer valid.`);
          setMinOrderError(null);
          return;
        }

        const minOrderAmount = toNumber(result.min_order_amount);
        if (minOrderAmount > 0 && summary.subtotal < minOrderAmount) {
          setMinOrderError(
            `This coupon requires a minimum order of ${formatPrice(minOrderAmount)}. Your subtotal is ${formatPrice(summary.subtotal)}.`
          );
          // Optionally clear the coupon?
          // dispatch(clearAppliedCoupon());
          // toast.error(`Coupon ${appliedCoupon.code} requires a higher subtotal.`);
          return;
        }

        setMinOrderError(null);
      } catch (error) {
        dispatch(clearAppliedCoupon());
        toast.error(`Failed to validate coupon ${appliedCoupon.code}. It has been removed.`);
      }
    };

    revalidateAppliedCoupon();
  }, [isLoggedIn, appliedCoupon, summary.subtotal, dispatch, validateCoupon]);

  // ── Refresh all coupon data on mount (user may have used a coupon elsewhere) ──
  useEffect(() => {
    if (isLoggedIn) {
      refetchAvailableCoupons();
      refetchFreebie();
      refetchMe();
    }
  }, [isLoggedIn, refetchAvailableCoupons, refetchFreebie, refetchMe]);

  // ── Show freebie modal only when eligible, not claimed, and cart not empty ──
  useEffect(() => {
    if (isLoggedIn && freebieEligibility?.eligible && !hasClaimedInSession && items.length > 0 && !isFreebieLoading) {
      setShowFreebieModal(true);
    } else {
      setShowFreebieModal(false);
    }
  }, [isLoggedIn, freebieEligibility, hasClaimedInSession, items.length, isFreebieLoading]);

  // ── Apply coupon ────────────────────────────────────────────────────────
  const handleApplyCoupon = async (codeOverride?: string) => {
    if (!isLoggedIn) return;

    const codeToApply = (codeOverride ?? trimmedPromoCode).trim();
    if (!codeToApply) return;

    try {
      const result = await validateCoupon({ code: codeToApply }).unwrap();

      if (!result.valid) {
        dispatch(clearAppliedCoupon());
        toast.error(result.message || 'Coupon is invalid.');
        return;
      }

      const minOrderAmount = toNumber(result.min_order_amount);
      if (minOrderAmount > 0 && summary.subtotal < minOrderAmount) {
        setMinOrderError(
          `This coupon requires a minimum order of ${formatPrice(minOrderAmount)}. Your subtotal is ${formatPrice(summary.subtotal)}.`
        );
        return;
      }

      setMinOrderError(null);

      const normalizedCode = (result.code || codeToApply).trim().toUpperCase();
      const maxDiscountAmount = toNumber(result.max_discount_amount);
      const discountValue = toNumber(result.discount_value);

      if (discountValue <= 0) {
        toast.error('This coupon has no discount value.');
        return;
      }

      const discountType = normaliseDiscountType(result.discount_type);

      dispatch(
        setAppliedCoupon({
          code: normalizedCode,
          discount_type: discountType,
          discount_value: discountValue,
          max_discount_amount: maxDiscountAmount > 0 ? maxDiscountAmount : undefined,
        })
      );

      setPromoCode(normalizedCode);
      toast.success(`Coupon ${normalizedCode} applied.`);
    } catch (error: any) {
      dispatch(clearAppliedCoupon());
      const message = Array.isArray(error?.data?.message)
        ? error.data.message.join(', ')
        : error?.data?.message || error?.message || 'Failed to apply coupon.';
      toast.error(message);
    }
  };

  const handleClearAppliedCoupon = () => {
    dispatch(clearAppliedCoupon());
    setPromoCode('');
    setMinOrderError(null);
    toast.success('Coupon removed.');
  };

  // Helper to check if a URL is a video
  const isVideoUrl = (url: string) => {
    if (!url) return false;
    const videoExtensions = /\.(mp4|webm|mov|ogg|avi)(\?.*)?$/i;
    return videoExtensions.test(url);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <TopMarquee />
      <Header />

      <main className="min-h-screen pb-14 pt-6 sm:pb-16 sm:pt-8 md:pb-20 md:pt-10">
        <Container>
          <div className="mx-auto max-w-[1220px]">
            {/* Breadcrumb */}
            <nav className="mb-5 flex items-center gap-2 text-[12px] text-[#8c8c8c] sm:mb-6 sm:gap-2.5 sm:text-[13px] md:mb-8 md:gap-3 md:text-[15px]">
              <Link href="/" className="transition hover:text-black">Home</Link>
              <ChevronRight size={14} className="sm:hidden" />
              <ChevronRight size={15} className="hidden sm:block md:hidden" />
              <ChevronRight size={16} className="hidden md:block" />
              <Link href="/store" className="transition hover:text-black">Products</Link>
              <ChevronRight size={14} className="sm:hidden" />
              <ChevronRight size={15} className="hidden sm:block md:hidden" />
              <ChevronRight size={16} className="hidden md:block" />
              <span className="font-semibold text-black">Cart</span>
            </nav>

            <h1 className="mb-6 text-[28px] font-bold uppercase leading-none tracking-[-0.04em] text-black sm:mb-8 sm:text-[38px] md:mb-10 md:text-[64px]">
              Your Cart
            </h1>

            {items.length === 0 ? (
              <div className="rounded-[20px] border border-black/10 p-6 text-center sm:rounded-[24px] sm:p-8 md:rounded-[28px] md:p-10">
                <p className="text-[15px] text-[#666] sm:text-[16px] md:text-lg">
                  Your cart is empty.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-6">
                {/* Cart items */}
                <section className="rounded-[20px] border border-black/10 p-3 sm:rounded-[24px] sm:p-4 md:rounded-[28px] md:p-6">
                  {minOrderError && (
                    <div className="mb-4 flex items-start justify-between gap-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-[12px] font-medium leading-[1.5] text-red-700 sm:text-[13px]">
                        {minOrderError}
                      </p>
                      <button
                        type="button"
                        onClick={() => setMinOrderError(null)}
                        className="shrink-0 text-[11px] font-semibold text-red-400 transition hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="space-y-0">
                    {items.map((item, index) => {
                      const price = Number(item.price);
                      // FIX: Prefer videoUrl if it exists and is a video file, otherwise use imageUrl
                      const mediaUrl = item.videoUrl || item.imageUrl || IMAGES.placeholders.product;
                      const isVideo = !!(item.videoUrl && isVideoUrl(item.videoUrl));
                      const badge = getItemBadge(item, !!appliedCoupon);

                      return (
                        <div
                          key={item.cartKey}
                          className={`grid grid-cols-[64px_minmax(0,1fr)_74px_24px] items-center gap-2.5 py-3 sm:grid-cols-[84px_minmax(0,1fr)_104px_28px] sm:gap-3.5 sm:py-4 md:grid-cols-[110px_minmax(0,1fr)_150px_34px] md:gap-4 md:py-5 ${
                            index !== items.length - 1 ? 'border-b border-black/10' : ''
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative h-[64px] w-[64px] overflow-hidden rounded-[14px] bg-[#dfe2e8] sm:h-[84px] sm:w-[84px] sm:rounded-[18px] md:h-[110px] md:w-[110px] md:rounded-[24px]">
                            {isVideo ? (
                              <video
                                src={mediaUrl}
                                className="h-full w-full object-cover"
                                muted
                                playsInline
                                autoPlay
                                loop
                              />
                            ) : (
                              <Image
                                src={mediaUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <h2 className="line-clamp-1 text-[14px] font-bold leading-tight text-black sm:text-[17px] md:text-[22px]">
                              {item.title}
                            </h2>
                            <div className="mt-1 text-[10px] leading-[1.35] text-[#6f6f6f] sm:text-[12px] md:text-[14px]">
                              <p>Quantities: {item.quantity}</p>
                              <p className="truncate capitalize">
                                Type: {formatCartLineTypeLabel(item.type)}
                              </p>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <p className="text-[15px] font-bold leading-none text-black sm:mt-1 sm:text-[18px] md:text-[24px]">
                                {formatPrice(price)}
                              </p>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase sm:text-[11px] ${badge.className}`}
                              >
                                {badge.text}
                              </span>
                            </div>
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center justify-end gap-1 sm:gap-2 md:gap-4">
                            <button
                              type="button"
                              onClick={() => dispatch(decreaseQuantity(item.cartKey))}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-black transition-all duration-300 ease-out hover:scale-110 hover:border-black/10 hover:bg-black hover:text-white sm:h-8 sm:w-8 md:h-9 md:w-9"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} strokeWidth={2.2} className="sm:hidden" />
                              <Minus size={16} strokeWidth={2.2} className="hidden sm:block md:hidden" />
                              <Minus size={20} strokeWidth={2.2} className="hidden md:block" />
                            </button>

                            <span className="min-w-[10px] text-center text-[14px] font-medium text-black sm:text-[18px] md:text-[22px]">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => dispatch(increaseQuantity(item.cartKey))}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-black transition-all duration-300 ease-out hover:scale-110 hover:border-black/10 hover:bg-black hover:text-white sm:h-8 sm:w-8 md:h-9 md:w-9"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} strokeWidth={2.2} className="sm:hidden" />
                              <Plus size={16} strokeWidth={2.2} className="hidden sm:block md:hidden" />
                              <Plus size={20} strokeWidth={2.2} className="hidden md:block" />
                            </button>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => dispatch(removeFromCart(item.cartKey))}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-black transition-all duration-300 ease-out hover:scale-110 hover:border-[#ff3b30]/15 hover:bg-[#ff3b30] hover:text-white sm:h-8 sm:w-8 md:h-9 md:w-9"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} strokeWidth={2.2} className="sm:hidden" />
                            <Trash2 size={16} strokeWidth={2.2} className="hidden sm:block md:hidden" />
                            <Trash2 size={22} strokeWidth={2.2} className="hidden md:block" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Order Summary */}
                <aside className="h-fit rounded-[20px] border border-black/10 p-4 sm:rounded-[24px] sm:p-5 md:rounded-[28px] md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-[20px] font-bold leading-none text-black sm:text-[24px] md:text-[30px]">
                      Order Summary
                    </h2>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          dispatch(clearCart());
                        }}
                        className="text-[12px] font-medium text-[#666] transition hover:text-black sm:text-[13px] md:text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-6 space-y-4 text-[15px] sm:mt-7 sm:space-y-4.5 sm:text-[17px] md:mt-8 md:space-y-5 md:text-[20px]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#575757]">Subtotal</span>
                      <span className="font-medium text-black">{formatPrice(summary.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#575757]">Discount</span>
                      <span className="font-medium text-[#ff3b30]">
                        -{formatPrice(summary.discount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#575757]">
                        Tax {activeTaxRate ? `(${activeTaxRate.rate}%)` : ''}
                      </span>
                      <span className="font-medium text-black">{formatPrice(summary.tax)}</span>
                    </div>
                  </div>

                  <div className="my-5 h-px bg-black/10 sm:my-6" />
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[18px] font-semibold text-black sm:text-[20px] md:text-[22px]">Total</span>
                    <span className="text-[18px] font-semibold text-black sm:text-[20px] md:text-[22px]">
                      {formatPrice(summary.total)}
                    </span>
                  </div>

                  {/* Coupon section – always visible when logged in */}
                  {isLoggedIn ? (
                    <>
                      <div className="mt-6 flex items-center gap-2 sm:mt-7 sm:gap-3 md:mt-8">
                        <div className="flex h-[44px] flex-1 items-center gap-2 rounded-full bg-[#f7f7f7] px-3 text-[#8d8d8d] sm:h-[48px] sm:gap-2.5 sm:px-3.5 md:h-[54px] md:gap-3 md:px-4">
                          <Tag size={16} className="sm:hidden" />
                          <Tag size={17} className="hidden sm:block md:hidden" />
                          <Tag size={18} className="hidden md:block" />
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Add promo code"
                            className="w-full bg-transparent text-[13px] text-black placeholder:text-[#8d8d8d] outline-none sm:text-[14px] md:text-[16px]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={isApplyDisabled}
                          className="inline-flex h-[44px] min-w-[82px] items-center justify-center rounded-full border border-black bg-black px-4 text-[14px] font-medium text-white transition-all duration-300 ease-out hover:scale-[1.05] hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-black/10 disabled:bg-black/10 disabled:text-black/35 disabled:hover:scale-100 disabled:hover:bg-black/10 disabled:hover:text-black/35 sm:h-[48px] sm:min-w-[92px] sm:px-5 sm:text-[15px] md:h-[54px] md:min-w-[104px] md:px-6 md:text-[18px]"
                        >
                          {isApplyingCoupon ? 'Applying...' : 'Apply'}
                        </button>
                      </div>

                      {/* Coupon list – always visible */}
                      <div className="mt-3 rounded-[16px] border border-black/10 bg-[#f7f7f7] p-3">
                        {isFetchingAvailableCoupons ? (
                          <div className="space-y-3 py-4">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        ) : availableCoupons.length === 0 ? (
                          <p className="text-[13px] text-black/60 sm:text-[14px]">No available coupons found.</p>
                        ) : (
                          <div className="space-y-2">
                            {availableCoupons.map((coupon) => (
                              <div
  key={coupon.code}
  className="flex items-center justify-between gap-3 rounded-[12px] bg-white px-3 py-3"
>
  <div className="min-w-0">
    <p className="truncate text-[13px] font-semibold uppercase text-black sm:text-[14px]">
      {coupon.code}
    </p>
    <p className="text-[12px] text-black/60 sm:text-[13px]">
      {formatCouponValue(coupon.discount_type, coupon.discount_value)}
    </p>

    {/* ── Usage badge ── */}
    {coupon.uses_remaining != null && (
      <p className="mt-0.5 text-[11px] font-medium sm:text-[12px]">
        <span
          className={
            coupon.uses_remaining === 0
              ? 'text-red-500'
              : 'text-emerald-600'
          }
        >
          {coupon.uses_remaining === 0
            ? 'No uses left'
            : `${coupon.uses_remaining} use${coupon.uses_remaining !== 1 ? 's' : ''} remaining`}
        </span>
        {coupon.usage_limit_per_user != null && (
          <span className="text-black/40">
            {' '}/ {coupon.usage_limit_per_user} total
          </span>
        )}
      </p>
    )}
  </div>

  <button
    type="button"
    disabled={coupon.uses_remaining === 0}
    onClick={() => {
      setPromoCode(coupon.code);
      handleApplyCoupon(coupon.code);
    }}
    className="inline-flex h-[34px] items-center justify-center rounded-full border border-black px-3 text-[12px] font-medium text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-black/20 disabled:text-black/30 disabled:hover:bg-transparent disabled:hover:text-black/30 sm:h-[36px] sm:px-4 sm:text-[13px]"
  >
    Use
  </button>
</div>
                            ))}
                          </div>
                        )}
                      </div>

                      {appliedCoupon ? (
                        <div className="mt-3 flex items-center justify-between gap-4 rounded-[16px] bg-[#f7f7f7] px-4 py-3">
                          <p className="text-[13px] font-medium text-black sm:text-[14px]">
                            Applied: {appliedCoupon.code}
                          </p>
                          <button
                            type="button"
                            onClick={handleClearAppliedCoupon}
                            className="text-[12px] font-medium text-[#666] transition hover:text-black sm:text-[13px]"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {/* Checkout button */}
                  {items.length > 0 && (
                    <Link
                      href="/checkout"
                      className="group mt-6 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-full border border-black bg-black px-5 text-[15px] font-medium text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white hover:text-black sm:mt-7 sm:h-[56px] sm:gap-2.5 sm:px-6 sm:text-[17px] md:h-[64px] md:gap-3 md:px-8 md:text-[22px]"
                    >
                      <ShoppingBag size={18} className="transition-transform duration-300 group-hover:scale-110 sm:hidden" />
                      <ShoppingBag size={20} className="hidden transition-transform duration-300 group-hover:scale-110 sm:block md:hidden" />
                      <ShoppingBag size={22} className="hidden transition-transform duration-300 group-hover:scale-110 md:block" />
                      <span>Go to Checkout</span>
                      <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1 sm:hidden" />
                      <ArrowRight size={20} className="hidden transition-transform duration-300 group-hover:translate-x-1 sm:block md:hidden" />
                      <ArrowRight size={22} className="hidden transition-transform duration-300 group-hover:translate-x-1 md:block" />
                    </Link>
                  )}
                </aside>
              </div>
            )}
          </div>
        </Container>
      </main>

      <Footer />

      {/* 🔸 Freebie Modal */}
      {/* <FreebieModal isOpen={showFreebieModal} onClose={() => setShowFreebieModal(false)} /> */}
    </>
  );
}