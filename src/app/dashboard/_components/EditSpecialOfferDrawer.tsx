'use client';

import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import ProductDescriptionField from '@/app/dashboard/_components/ProductDescriptionField';
import DashboardSelect from '@/app/dashboard/_components/DashboardSelect';
import FieldError from '@/app/dashboard/_components/FieldError';
import ProductFormSwitch from '@/app/dashboard/_components/ProductFormSwitch';
import {
  BRAND_SLUG_MAX,
  BRAND_SLUG_MIN,
  BUNDLE_GALLERY_MAX_FILES,
  DASHBOARD_IMAGE_MAX_BYTES,
  PRODUCT_DESCRIPTION_MAX,
  PRODUCT_NAME_MAX,
  fieldErrorsFromZodPaths,
  normalizeBrandSlugInput,
  resolveOptionalSlug,
  updateSpecialOfferFormSchema,
} from '@/app/dashboard/_validation/dashboardForms';
import {
  specialOfferSuccessToastText,
  useUpdateSpecialOfferMutation,
} from '@/features/specialOffers/specialOffersApi';
import { useGetProductsQuery } from '@/features/products/productsApi';
import type { SpecialOffer } from '@/types/specialOffers';

function extractServerMessage(error: unknown, fallbackMessage: string) {
  if (!error || typeof error !== 'object') return fallbackMessage;

  if ('data' in error) {
    const data = (error as { data?: unknown }).data;

    if (typeof data === 'string' && data.trim()) return data;

    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message)) {
        const list = message.filter((item): item is string => typeof item === 'string');
        if (list.length > 0) return list.join(', ');
      }

      const errorText = (data as { error?: unknown }).error;
      if (typeof errorText === 'string' && errorText.trim()) return errorText;
    }
  }

  if ('error' in error) {
    const errorText = (error as { error?: unknown }).error;
    if (typeof errorText === 'string' && errorText.trim()) return errorText;
  }

  return fallbackMessage;
}

function inputBorderClass(hasError: boolean) {
  return hasError ? 'border-red-500' : 'border-[#dbe1ea]';
}

function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso || String(iso).trim() === '') return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(local: string | undefined): string | undefined {
  if (local == null || String(local).trim() === '') return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

type LineRow = { id: string; productId: string; quantity: string };

function newLineRow(): LineRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    productId: '',
    quantity: '1',
  };
}

const LIST_LIMIT = 200;
const mediaMb = DASHBOARD_IMAGE_MAX_BYTES / (1024 * 1024);

type Props = {
  offer: SpecialOffer | null;
  onClose: () => void;
};

type InnerProps = {
  offer: SpecialOffer;
  onClose: () => void;
};

function EditSpecialOfferDrawerInner({ offer, onClose }: InnerProps) {
  const [form, setForm] = useState(() => ({
    name: offer.name,
    slug: offer.slug ?? '',
    description: offer.description ?? '',
    price: offer.price,
    startDate: isoToDatetimeLocalValue(offer.startDate),
    endDate: isoToDatetimeLocalValue(offer.endDate),
    isActive: offer.isActive,
  }));
  const [lines, setLines] = useState<LineRow[]>(() =>
    offer.products.length > 0
      ? offer.products.map((p, idx) => ({
          id: `edit-${offer.id}-${p.id}-${idx}`,
          productId: p.product.id,
          quantity: String(p.quantity),
        }))
      : [newLineRow()],
  );
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverInputKey, setCoverInputKey] = useState(0);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryInputKey, setGalleryInputKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [updateSpecialOffer, { isLoading }] = useUpdateSpecialOfferMutation();

  const { data: productsRes, isLoading: productsLoading } = useGetProductsQuery({
    page: 1,
    limit: LIST_LIMIT,
    is_active: true,
  });

  /** Prefer active products; keep existing offer lines that point at inactive SKUs. */
  const productRows = useMemo(() => {
    const list = productsRes?.data ?? [];
    const active = list.filter((p) => p.isActive);
    const byId = new Map(active.map((p) => [p.id, { id: p.id, name: p.name }]));

    if (offer) {
      for (const line of offer.products) {
        const pid = line.product.id;
        if (!byId.has(pid)) {
          byId.set(pid, {
            id: line.product.id,
            name: `${line.product.name} (inactive)`,
          });
        }
      }
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [productsRes?.data, offer]);

  const productSelectOptions = useMemo(
    () => [
      { value: '', label: 'Select product' },
      ...productRows.map((p) => ({ value: p.id, label: p.name })),
    ],
    [productRows],
  );

  const coverPreviewUrl = useMemo(() => {
    if (!coverImage) return null;
    return URL.createObjectURL(coverImage);
  }, [coverImage]);

  const galleryPreviewUrls = useMemo(
    () =>
      galleryFiles.map((f) =>
        typeof window !== 'undefined' && f.type.startsWith('image/')
          ? URL.createObjectURL(f)
          : null,
      ),
    [galleryFiles],
  );

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  useEffect(() => {
    return () => {
      galleryPreviewUrls.forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, [galleryPreviewUrls]);

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function clearLineErrors(index: number) {
    setFieldErrors((prev) => {
      const prefix = `product_lines.${index}.`;
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k.startsWith(prefix)) delete next[k];
      }
      return next;
    });
  }

  function handleClose() {
    setCoverImage(null);
    setCoverInputKey((k) => k + 1);
    setGalleryFiles([]);
    setGalleryInputKey((k) => k + 1);
    setFieldErrors({});
    onClose();
  }

  function addLine() {
    setLines((prev) => [...prev, newLineRow()]);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
    setFieldErrors({});
  }

  function removeGalleryAt(index: number) {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    clearError('gallery_images');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = updateSpecialOfferFormSchema.safeParse({
      name: form.name,
      slug: resolveOptionalSlug(form.slug, form.name),
      description: form.description,
      price: form.price,
      start_date: form.startDate,
      end_date: form.endDate,
      is_active: form.isActive,
      image: coverImage ?? undefined,
      gallery_images: galleryFiles,
      product_lines: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      })),
    });

    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZodPaths(parsed.error));
      return;
    }

    setFieldErrors({});
    const d = parsed.data;
    const catalogProducts = productsRes?.data ?? [];

    try {
      const startIso = datetimeLocalToIso(d.start_date);
      const endIso = datetimeLocalToIso(d.end_date);
      const updated = await updateSpecialOffer({
        id: offer.id,
        name: d.name,
        slug: d.slug.trim() !== '' ? d.slug.trim() : undefined,
        description: d.description,
        price: d.price,
        is_active: d.is_active,
        start_date: startIso,
        end_date: endIso,
        products: d.product_lines.map((line) => {
          const fromCatalog = catalogProducts.find((p) => Number(p.id) === line.productId);
          const fromOffer = offer.products.find(
            (row) => Number(row.product.id) === line.productId,
          );
          const unit = fromCatalog
            ? Number(fromCatalog.price)
            : fromOffer?.product.price != null && String(fromOffer.product.price).trim() !== ''
              ? Number(fromOffer.product.price)
              : 0;
          return {
            product_id: line.productId,
            quantity: line.quantity,
            origin_price: Number.isFinite(unit) ? unit : 0,
          };
        }),
        image: d.image,
        gallery_images: d.gallery_images.length > 0 ? d.gallery_images : undefined,
      }).unwrap();
      toast.success(specialOfferSuccessToastText(updated, `"${d.name}" updated.`));
      handleClose();
    } catch (error) {
      console.error('Failed to update special offer', error);
      toast.error(extractServerMessage(error, 'Update failed. Please try again.'));
    }
  }

  const currentCoverSrc = coverPreviewUrl ?? (offer.imageUrl?.trim() || null);

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close edit special offer overlay"
        onClick={handleClose}
        className="h-full flex-1 bg-black/40"
      />

      <aside className="flex h-full max-h-screen min-h-0 w-full max-w-lg flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
        <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-[#111111]">
              <Pencil size={18} className="text-[#6b7280]" aria-hidden />
              Edit special offer
            </h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              PATCH /special-offers/:id (multipart). New cover replaces the current image; gallery
              uploads append; adjust schedule and product lines below.
            </p>
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
          <div
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 pb-28"
            data-dashboard-drawer-scroll
          >
            {productsLoading ? (
              <p className="text-xs text-[#6b7280]">Loading products…</p>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">
                Name <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                value={form.name}
                maxLength={PRODUCT_NAME_MAX}
                aria-required
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'so-edit-name-err' : undefined}
                onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value }));
                  clearError('name');
                }}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.name))}`}
              />
              <FieldError id="so-edit-name-err" message={fieldErrors.name} />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">Slug</span>
              <input
                type="text"
                value={form.slug}
                maxLength={BRAND_SLUG_MAX}
                aria-invalid={Boolean(fieldErrors.slug)}
                aria-describedby={fieldErrors.slug ? 'so-edit-slug-err' : undefined}
                onChange={(e) => {
                  setForm((p) => ({ ...p, slug: normalizeBrandSlugInput(e.target.value) }));
                  clearError('slug');
                }}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.slug))}`}
              />
              <FieldError id="so-edit-slug-err" message={fieldErrors.slug} />
              <p className="text-xs text-[#9ca3af]">
                {form.slug.length}/{BRAND_SLUG_MAX} (optional; min {BRAND_SLUG_MIN} chars if set)
              </p>
            </label>

            <ProductDescriptionField
              label="Description"
              value={form.description}
              maxLength={PRODUCT_DESCRIPTION_MAX}
              error={fieldErrors.description}
              linkSource="products-and-blogs"
              placeholder="Short offer description — + Link supports product, blog, and website URL"
              onChange={(html) => {
                setForm((p) => ({ ...p, description: html }));
                clearError('description');
              }}
            />

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">
                Price <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={form.price}
                aria-required
                aria-invalid={Boolean(fieldErrors.price)}
                aria-describedby={fieldErrors.price ? 'so-edit-price-err' : undefined}
                onChange={(e) => {
                  setForm((p) => ({ ...p, price: e.target.value }));
                  clearError('price');
                }}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.price))}`}
              />
              <FieldError id="so-edit-price-err" message={fieldErrors.price} />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">Start date</span>
              <input
                type="datetime-local"
                value={form.startDate}
                aria-invalid={Boolean(fieldErrors.start_date)}
                aria-describedby={fieldErrors.start_date ? 'so-edit-start-err' : undefined}
                onChange={(e) => {
                  setForm((p) => ({ ...p, startDate: e.target.value }));
                  clearError('start_date');
                }}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.start_date))}`}
              />
              <FieldError id="so-edit-start-err" message={fieldErrors.start_date} />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">End date</span>
              <input
                type="datetime-local"
                value={form.endDate}
                aria-invalid={Boolean(fieldErrors.end_date)}
                aria-describedby={fieldErrors.end_date ? 'so-edit-end-err' : undefined}
                onChange={(e) => {
                  setForm((p) => ({ ...p, endDate: e.target.value }));
                  clearError('end_date');
                }}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.end_date))}`}
              />
              <FieldError id="so-edit-end-err" message={fieldErrors.end_date} />
            </label>

            <ProductFormSwitch
              label="Active"
              variant="emerald"
              checked={form.isActive}
              disabled={isLoading}
              onCheckedChange={(next) => {
                setForm((p) => ({ ...p, isActive: next }));
                clearError('is_active');
              }}
            />

            <div className="space-y-2">
              <span className="text-sm font-medium text-[#111111]">
                Cover image <span className="font-normal text-[#6b7280]">(optional)</span>
              </span>
              <input
                key={coverInputKey}
                type="file"
                accept="image/*"
                aria-invalid={Boolean(fieldErrors.image)}
                aria-describedby={
                  fieldErrors.image ? 'so-edit-cover-err so-edit-cover-hint' : 'so-edit-cover-hint'
                }
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setCoverImage(f);
                  clearError('image');
                  e.target.value = '';
                }}
                className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
              />
              <FieldError id="so-edit-cover-err" message={fieldErrors.image} />
              <p id="so-edit-cover-hint" className="text-xs text-[#6b7280]">
                Max {mediaMb} MB. Choose a file to replace the cover; leave unchanged to keep the
                current image.
              </p>
              {currentCoverSrc ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentCoverSrc}
                    alt={coverPreviewUrl ? 'New cover preview' : 'Current cover'}
                    className="h-28 w-28 rounded-xl border border-[#e5e7eb] object-cover"
                  />
                  {coverPreviewUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null);
                        setCoverInputKey((k) => k + 1);
                        clearError('image');
                      }}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white"
                      aria-label="Discard new cover image"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {offer.galleryImages.length > 0 ? (
              <div className="space-y-2">
                <span className="text-sm font-medium text-[#111111]">Current gallery</span>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Existing gallery">
                  {offer.galleryImages.map((img) => (
                    <li
                      key={img.id}
                      className="aspect-square overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9fafb]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-3">
              <span className="text-sm font-medium text-[#111111]">
                Add gallery images <span className="font-normal text-[#6b7280]">(optional)</span>
              </span>
              <input
                key={galleryInputKey}
                type="file"
                accept="image/*"
                multiple
                aria-invalid={Boolean(fieldErrors.gallery_images)}
                aria-describedby={
                  fieldErrors.gallery_images
                    ? 'so-edit-gallery-err so-edit-gallery-hint'
                    : 'so-edit-gallery-hint'
                }
                onChange={(e) => {
                  const picked = e.target.files ? Array.from(e.target.files) : [];
                  setGalleryFiles((prev) => {
                    const merged = [...prev, ...picked];
                    return merged.slice(0, BUNDLE_GALLERY_MAX_FILES);
                  });
                  clearError('gallery_images');
                  e.target.value = '';
                }}
                className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
              />
              <FieldError id="so-edit-gallery-err" message={fieldErrors.gallery_images} />
              <p id="so-edit-gallery-hint" className="text-xs text-[#6b7280]">
                Each file is sent as <code className="text-[11px]">gallery_images</code> and appends
                to the offer gallery (up to {BUNDLE_GALLERY_MAX_FILES} new files per request,{' '}
                {mediaMb} MB each).
              </p>
              {galleryFiles.length > 0 ? (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="New gallery previews">
                  {galleryFiles.map((file, index) => {
                    const previewUrl = galleryPreviewUrls[index];
                    return (
                      <li
                        key={`${file.name}-${file.size}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9fafb]"
                      >
                        {previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt={file.name ? `Preview ${file.name}` : `Preview ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeGalleryAt(index)}
                          aria-label={`Remove ${file.name || 'image'}`}
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white"
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>

            <div className="space-y-3 border-t border-[#eef2f7] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-[#111111]">
                  Products in offer <span className="text-red-600">*</span>
                </span>
                <button
                  type="button"
                  onClick={addLine}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1 text-xs font-medium text-[#374151] hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  <Plus size={14} />
                  Add line
                </button>
              </div>
              <p className="text-xs text-[#6b7280]">
                New lines use active products only. Existing lines may show inactive SKUs until you
                change them.
              </p>
              {fieldErrors.product_lines ? (
                <p className="text-xs text-red-600" role="alert">
                  {fieldErrors.product_lines}
                </p>
              ) : null}

              <div className="space-y-3">
                {lines.map((row, index) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4 sm:grid-cols-[minmax(0,1fr)_6.5rem_2.75rem] sm:items-end sm:gap-x-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <label
                        htmlFor={`so-edit-line-product-${row.id}`}
                        className="block text-xs font-medium text-[#374151]"
                      >
                        Product
                      </label>
                      <DashboardSelect
                        id={`so-edit-line-product-${row.id}`}
                        value={row.productId}
                        onChange={(v) => {
                          setLines((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, productId: v } : r)),
                          );
                          clearLineErrors(index);
                        }}
                        options={productSelectOptions}
                        placeholder="Select product"
                        disabled={isLoading}
                        hasError={Boolean(fieldErrors[`product_lines.${index}.productId`])}
                        size="compact"
                        aria-label={`Offer line ${index + 1} product`}
                      />
                      <FieldError message={fieldErrors[`product_lines.${index}.productId`]} />
                    </div>
                    <div className="min-w-0 space-y-1 sm:max-w-[6.5rem]">
                      <label
                        htmlFor={`so-edit-line-qty-${row.id}`}
                        className="block text-xs font-medium text-[#374151]"
                      >
                        Qty
                      </label>
                      <input
                        id={`so-edit-line-qty-${row.id}`}
                        type="text"
                        inputMode="numeric"
                        value={row.quantity}
                        aria-invalid={Boolean(fieldErrors[`product_lines.${index}.quantity`])}
                        onChange={(e) => {
                          setLines((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, quantity: e.target.value } : r,
                            ),
                          );
                          clearLineErrors(index);
                        }}
                        className={`h-9 w-full min-w-0 rounded-lg border bg-white px-2.5 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors[`product_lines.${index}.quantity`]))}`}
                      />
                      <FieldError message={fieldErrors[`product_lines.${index}.quantity`]} />
                    </div>
                    <div className="flex justify-end sm:justify-center sm:pb-0.5">
                      {lines.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeLine(row.id)}
                          disabled={isLoading}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label={`Remove line ${index + 1}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span className="inline-flex h-9 w-9 shrink-0" aria-hidden />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || productsLoading}
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

export default function EditSpecialOfferDrawer({ offer, onClose }: Props) {
  if (!offer) return null;
  return <EditSpecialOfferDrawerInner key={offer.id} offer={offer} onClose={onClose} />;
}
