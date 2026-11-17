'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import ProductFormSwitch from '@/app/dashboard/_components/ProductFormSwitch';
import { useUpdateOfferMutation } from '@/features/offers/offersApi';
import { useGetProductsQuery } from '@/features/products/productsApi';
import type { Offer } from '@/types/offers';

type Props = {
  offer: Offer | null;
  onClose: () => void;
};

const LIST_LIMIT = 200;

function extractServerMessage(error: unknown, fallbackMessage: string) {
  if (!error || typeof error !== 'object') return fallbackMessage;
  if ('data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
  }
  return fallbackMessage;
}

function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso || String(iso).trim() === '') return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditOfferDrawer({ offer, onClose }: Props) {
  const isOpen = offer !== null;
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('product');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [updateOffer, { isLoading }] = useUpdateOfferMutation();

  const { data: productsRes } = useGetProductsQuery({
    page: 1,
    limit: LIST_LIMIT,
  });

  const products = useMemo(() => {
    const list = productsRes?.data ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [productsRes?.data]);

  const filteredProducts = useMemo(() => {
    const key = productSearch.trim().toLowerCase();
    if (!key) return products;
    return products.filter((p) => {
      const nameValue = p.name?.toLowerCase() ?? '';
      const slugValue = p.slug?.toLowerCase() ?? '';
      return nameValue.includes(key) || slugValue.includes(key);
    });
  }, [products, productSearch]);

  useEffect(() => {
    if (!offer) return;
    setName(offer.name ?? '');
    setSlug(offer.slug ?? '');
    setDescription(offer.description ?? '');
    setScope(offer.scope ?? 'product');
    setDiscountType(offer.discountType ?? 'percentage');
    setDiscountValue(offer.discountValue ?? '');
    setStartDate(isoToDatetimeLocalValue(offer.startDate));
    setEndDate(isoToDatetimeLocalValue(offer.endDate));
    setIsActive(Boolean(offer.isActive));
    setSelectedProducts(
      (offer.products ?? [])
        .map((line) => line.product?.id)
        .filter((id) => id != null)
        .map((id) => String(id)),
    );
    setProductSearch('');
  }, [offer]);

  function toggleProduct(id: string) {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offer) return;

    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!discountValue.trim() || Number.isNaN(Number(discountValue))) {
      toast.error('Discount value must be a valid number.');
      return;
    }
    if (selectedProducts.length === 0) {
      toast.error('Select at least one product.');
      return;
    }

    try {
      await updateOffer({
        id: offer.id,
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        scope,
        discount_type: discountType,
        discount_value: Number(discountValue),
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        is_active: isActive,
        products: selectedProducts.map((id) => ({ product_id: Number(id) })),
      }).unwrap();
      toast.success('Offer updated successfully.');
      onClose();
    } catch (error) {
      toast.error(extractServerMessage(error, 'Failed to update offer.'));
    }
  }

  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close edit offer overlay"
        onClick={onClose}
        className="h-full flex-1 bg-black/40"
      />
      <aside className="flex h-full max-h-screen min-h-0 w-full max-w-lg flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
        <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111111]">Edit offer</h3>
            <p className="mt-1 text-xs text-[#6b7280]">PATCH /offers/{'{id}'} (multipart/form-data)</p>
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
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm" />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">Slug</span>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm" />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">Description</span>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-[#dbe1ea] bg-white px-3 py-2.5 text-sm" />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[#111111]">Scope</span>
                <select value={scope} onChange={(e) => setScope(e.target.value)} className="h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm">
                  <option value="product">Product</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[#111111]">Discount type</span>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm">
                  <option value="percentage">Percentage</option>
                  <option value="price">Price</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">Discount value *</span>
              <input type="text" inputMode="decimal" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm" />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[#111111]">Start date</span>
                <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[#111111]">End date</span>
                <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm" />
              </label>
            </div>

            <ProductFormSwitch label="Active" variant="emerald" checked={isActive} disabled={isLoading} onCheckedChange={setIsActive} />

            <div className="space-y-2 border-t border-[#eef2f7] pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#111111]">Products *</p>
                <p className="text-xs text-[#6b7280]">Selected: {selectedProducts.length}</p>
              </div>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product by name or slug"
                className="h-10 w-full rounded-xl border border-[#dbe1ea] bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af]"
              />
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-3">
                {filteredProducts.map((product) => (
                  <label key={product.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent bg-white p-2 text-sm text-[#111111] hover:border-[#e5e7eb]">
                    <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleProduct(product.id)} />
                    <span className="truncate">{product.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151]">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70">
              {isLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
