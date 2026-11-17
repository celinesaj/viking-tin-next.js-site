'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import type { CheckoutFormValues, SavedAddress } from '@/types/order';
import 'swiper/css';
import 'swiper/css/pagination';

type Props = {
  values: CheckoutFormValues;
  savedAddresses: SavedAddress[];
  selectedAddressId: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  hasError: boolean;
  submitError?: string | null;
  onSelectAddress: (address: SavedAddress) => void;
  onAddAddress: () => void;
  onEditAddress: (address: SavedAddress) => void;
  onChange: <K extends keyof CheckoutFormValues>(
    key: K,
    value: CheckoutFormValues[K]
  ) => void;
  onSubmit: () => void;
};

// Helper to group addresses based on screen width
function useGroupedAddresses(addresses: SavedAddress[]) {
  const [grouped, setGrouped] = useState<SavedAddress[][]>([]);

  useEffect(() => {
    const updateGrouping = () => {
      const width = window.innerWidth;
      let groupSize = 1; // desktop default

      if (width < 768) {
        groupSize = 4; // mobile: 4 per slide (2x2)
      } else if (width < 1024) {
        groupSize = 2; // tablet: 2 per slide (stacked)
      } else {
        groupSize = 1; // desktop: 1 per slide
      }

      const groups: SavedAddress[][] = [];
      for (let i = 0; i < addresses.length; i += groupSize) {
        groups.push(addresses.slice(i, i + groupSize));
      }
      setGrouped(groups);
    };

    updateGrouping();
    window.addEventListener('resize', updateGrouping);
    return () => window.removeEventListener('resize', updateGrouping);
  }, [addresses]);

  return grouped;
}

// Individual address card component – corner badge fully visible, equal height
function AddressCard({
  address,
  isActive,
  onSelect,
  onEdit,
}: {
  address: SavedAddress;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative overflow-visible rounded-[24px] border-2 p-5 text-left transition-all duration-200 ${
        isActive
          ? 'border-[#16a34a] bg-white shadow-[0_0_0_2px_rgba(22,163,74,0.18)]'
          : 'border-black/10 bg-white hover:border-black/30'
      }`}
    >
      {/* Green corner badge – will NOT be clipped */}
      {address.isDefault && (
        <span className="absolute -top-2 -right-2 z-10 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
          Default
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold uppercase text-black">
            {address.title}
          </h3>
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }
          }}
          className="shrink-0 text-[11px] font-semibold uppercase text-black/50 transition hover:text-black"
        >
          Edit
        </span>
      </div>
      <div className="mt-4 space-y-1 text-[14px] leading-[1.5] text-black/60">
        <p>{address.address}</p>
        <p>
          {address.city}, {address.street}
        </p>
      </div>
    </button>
  );
}

export default function CheckoutForm({
  values,
  savedAddresses,
  selectedAddressId,
  isLoggedIn,
  isLoading,
  hasError,
  submitError,
  onSelectAddress,
  onAddAddress,
  onEditAddress,
  onChange,
  onSubmit,
}: Props) {
  const groupedAddresses = useGroupedAddresses(savedAddresses);
  const hasMultipleSlides = groupedAddresses.length > 1;

  if (!isLoggedIn) {
    return (
      <div className="rounded-[28px] border border-black/10 p-6">
        <p className="text-[16px] text-black">Please log in to continue checkout.</p>
      </div>
    );
  }

  return (
    <section>
      <h1 className="text-[34px] font-bold uppercase tracking-[-0.03em] text-black md:text-[54px]">
        Checkout
      </h1>

      {hasError && (
        <p className="mt-6 rounded-[18px] bg-red-50 px-4 py-3 text-[14px] text-red-700">
          Failed to load checkout data.
        </p>
      )}

      {submitError && (
        <p className="mt-6 rounded-[18px] bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {submitError}
        </p>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[22px] font-semibold text-black">Delivery Address</h2>
          <button
            type="button"
            onClick={onAddAddress}
            className="inline-flex h-[42px] items-center justify-center rounded-full border border-black px-5 text-[13px] font-semibold uppercase text-black transition hover:bg-black hover:text-white"
          >
            Add New Address
          </button>
        </div>

        {savedAddresses.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-black/10 p-6">
            <p className="text-[15px] text-black/60">
              You do not have saved addresses yet.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <Swiper
              modules={[Pagination]}
              spaceBetween={16}
              slidesPerView={1}
              pagination={{
                clickable: true,
                dynamicBullets: false,
              }}
              breakpoints={{
                768: { slidesPerView: 1.5, spaceBetween: 20 },
                1024: { slidesPerView: 2.5, spaceBetween: 24 },
              }}
              className={`address-slider ${!hasMultipleSlides ? 'single-slide' : ''}`}
              style={{ overflow: 'visible' }}
            >
              {groupedAddresses.map((group, slideIndex) => (
                <SwiperSlide key={slideIndex} style={{ overflow: 'visible' }}>
                  <div
                    className={`grid gap-4 overflow-visible ${
                      group.length === 4
                        ? 'grid-cols-2 grid-rows-2'
                        : group.length === 2
                        ? 'grid-cols-1 gap-4'
                        : 'grid-cols-1'
                    }`}
                  >
                    {group.map((address) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        isActive={selectedAddressId === address.id}
                        onSelect={() => onSelectAddress(address)}
                        onEdit={() => onEditAddress(address)}
                      />
                    ))}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-[22px] font-semibold text-black">Payment Method</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onChange('paymentMethod', 'cash_on_delivery')}
            className={`rounded-[24px] border p-5 text-left transition ${
              values.paymentMethod === 'cash_on_delivery'
                ? 'border-[#16a34a] bg-white shadow-[0_0_0_2px_rgba(22,163,74,0.18)]'
                : 'border-black/10 bg-white hover:border-black/30'
            }`}
          >
            <p className="text-[16px] font-semibold uppercase text-black">Cash on Delivery</p>
            <p className="mt-2 text-[14px] text-black/55">Pay when your order arrives.</p>
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-[24px] border border-black/10 bg-[#f5f5f5] p-5 text-left opacity-60"
          >
            <p className="text-[16px] font-semibold uppercase text-black">Online Payment</p>
            <p className="mt-2 text-[14px] text-black/55">Coming soon.</p>
          </button>
        </div>
      </div>

      <div className="mt-10">
        <label className="text-[16px] font-semibold text-black">Order Notes</label>
        <textarea
          value={values.orderNotes}
          onChange={(e) => onChange('orderNotes', e.target.value)}
          rows={4}
          placeholder="Optional notes for your order"
          className="mt-3 w-full resize-none rounded-[24px] border border-black/10 px-5 py-4 text-[15px] outline-none focus:border-black"
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading || !selectedAddressId}
        className={`mt-10 inline-flex h-[56px] w-full items-center justify-center rounded-full px-6 text-[16px] font-semibold uppercase transition lg:hidden ${
          isLoading || !selectedAddressId
            ? 'cursor-not-allowed bg-black/30 text-white'
            : 'bg-black text-white hover:border hover:border-black hover:bg-white hover:text-black'
        }`}
      >
        Place Order
      </button>

      <style jsx global>{`
        .address-slider .swiper-wrapper,
        .address-slider .swiper-slide {
          overflow: visible !important;
        }

        .address-slider .swiper-pagination {
          position: relative;
          margin-top: 1.5rem;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }
        .address-slider .swiper-pagination-bullet {
          width: 6px;
          height: 6px;
          margin: 0 !important;
          background: rgba(0, 0, 0, 0.25);
          opacity: 1;
          transition: all 0.2s ease;
        }
        .address-slider .swiper-pagination-bullet-active {
          width: 20px;
          background: #000;
        }
        /* Hide pagination when only one slide exists */
        .address-slider.single-slide .swiper-pagination {
          display: none;
        }
        @media (min-width: 768px) {
          .address-slider .swiper-pagination-bullet {
            width: 7px;
            height: 7px;
          }
          .address-slider .swiper-pagination-bullet-active {
            width: 24px;
          }
        }
      `}</style>
    </section>
  );
}