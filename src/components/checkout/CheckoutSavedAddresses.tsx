'use client';

import type { SavedAddress } from '@/types/order';

type Props = {
  addresses: SavedAddress[];
  selectedAddressId: string | null;
  onSelect: (address: SavedAddress) => void;
};

export default function CheckoutSavedAddresses({
  addresses,
  selectedAddressId,
  onSelect,
}: Props) {
  if (!addresses.length) return null;

  return (
    <div>
      <h3 className="mb-4 text-[20px] font-medium text-black">
        Saved Addresses
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((address) => {
          const isActive = selectedAddressId === address.id;

          return (
            <button
              key={address.id}
              type="button"
              onClick={() => onSelect(address)}
              className={`rounded-[22px] border px-5 py-5 text-left transition ${
                isActive
                  ? 'border-black bg-white'
                  : 'border-black/10 bg-white/70 hover:border-black/30'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-[18px] font-semibold uppercase text-black">
                  {address.title}
                </h4>

                {address.isDefault ? (
                  <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase text-white">
                    Default
                  </span>
                ) : null}
              </div>

              <div className="mt-4 space-y-1 text-[14px] leading-[1.55] text-black/60">
                <p>
                  {address.firstName} {address.lastName}
                </p>
                <p>{address.address}</p>
                <p>
                  {address.city}, {address.street}
                </p>
                <p>{address.phone}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}