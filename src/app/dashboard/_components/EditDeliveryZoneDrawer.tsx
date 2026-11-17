'use client';

import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import ProductFormSwitch from '@/app/dashboard/_components/ProductFormSwitch';
import { useUpdateDeliveryZoneMutation } from '@/features/delivery-zones/deliveryZonesApi';
import type { DeliveryZone } from '@/types/delivery-zones';

type Props = {
  deliveryZone: DeliveryZone | null;
  onClose: () => void;
};

function extractServerMessage(error: unknown, fallbackMessage: string) {
  if (!error || typeof error !== 'object') return fallbackMessage;
  if ('data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message)) {
        const joined = message.filter((item): item is string => typeof item === 'string').join(', ');
        if (joined) return joined;
      }
    }
  }
  return fallbackMessage;
}

export default function EditDeliveryZoneDrawer({ deliveryZone, onClose }: Props) {
  const isOpen = deliveryZone !== null;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [updateDeliveryZone, { isLoading }] = useUpdateDeliveryZoneMutation();

  useEffect(() => {
    if (!deliveryZone) return;
    setName(deliveryZone.name ?? '');
    setDescription(deliveryZone.description ?? '');
    setPrice(deliveryZone.price ?? '');
    setIsActive(Boolean(deliveryZone.isActive));
  }, [deliveryZone]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deliveryZone) return;

    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!price.trim() || Number.isNaN(Number(price))) {
      toast.error('Price must be a valid number.');
      return;
    }
    try {
      await updateDeliveryZone({
        id: deliveryZone.id,
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        is_active: isActive,
      }).unwrap();
      toast.success('Delivery zone updated successfully.');
      onClose();
    } catch (error) {
      toast.error(extractServerMessage(error, 'Failed to update delivery zone.'));
    }
  }

  if (!isOpen || !deliveryZone) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close edit delivery zone overlay"
        onClick={onClose}
        className="h-full flex-1 bg-black/40"
      />
      <aside className="flex h-full max-h-screen min-h-0 w-full max-w-lg flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
        <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111111]">Edit delivery zone</h3>
            <p className="mt-1 text-xs text-[#6b7280]">PATCH /delivery-zones/{'{id}'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
          >
            <X size={16} />
          </button>
        </header>

        <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 pb-28">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">Name *</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">Description</span>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-[#dbe1ea] bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">Price *</span>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm"
              />
            </label>

            <ProductFormSwitch
              label="Active"
              variant="emerald"
              checked={isActive}
              disabled={isLoading}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="shrink-0 flex items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
            >
              {isLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
