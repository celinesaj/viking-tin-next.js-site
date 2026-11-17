'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import ProductFormSwitch from '@/app/dashboard/_components/ProductFormSwitch';
import { useCreateDeliveryZoneMutation } from '@/features/delivery-zones/deliveryZonesApi';

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

export default function AddDeliveryZoneDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [createDeliveryZone, { isLoading }] = useCreateDeliveryZoneMutation();

  function handleOpen() {
    setName('');
    setDescription('');
    setPrice('');
    setIsActive(true);
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!price.trim() || Number.isNaN(Number(price))) {
      toast.error('Price must be a valid number.');
      return;
    }
    try {
      await createDeliveryZone({
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        is_active: isActive,
      }).unwrap();
      toast.success(`"${name}" created successfully.`);
      handleClose();
    } catch (error) {
      toast.error(extractServerMessage(error, 'Failed to create delivery zone.'));
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa]"
        >
          <Plus size={16} />
          <span>Add delivery zone</span>
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add delivery zone overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />
          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-lg flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add delivery zone</h3>
                <p className="mt-1 text-xs text-[#6b7280]">POST /delivery-zones</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
              >
                <X size={16} />
              </button>
            </header>

            <form
              noValidate
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 pb-28">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Name *</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm"
                    placeholder="Bergen"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Description</span>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-[#dbe1ea] bg-white px-3 py-2.5 text-sm"
                    placeholder="Covers city center"
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
                    placeholder="59"
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
                  onClick={handleClose}
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
                  {isLoading ? 'Creating...' : 'Create delivery zone'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
