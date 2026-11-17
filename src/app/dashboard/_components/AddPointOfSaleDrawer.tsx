'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateDashboardPointOfSaleMutation } from '@/app/dashboard/redux/reducers/PointOfSaleSlice/PointOfSaleApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import DashboardToggleSwitch from '@/app/dashboard/_components/DashboardToggleSwitch';
import {
  createPointOfSaleFormSchema,
  fieldErrorsFromZod,
  normalizeBrandSlugInput,
  resolveOptionalSlug,
  POINT_OF_SALE_DESCRIPTION_MAX,
  POINT_OF_SALE_META_DESCRIPTION_MAX,
  POINT_OF_SALE_TEXT_MAX,
} from '@/app/dashboard/_validation/dashboardForms';

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
    }
  }
  return fallbackMessage;
}

function inputBorderClass(hasError: boolean) {
  return hasError ? 'border-red-500' : 'border-[#dbe1ea]';
}

export default function AddPointOfSaleDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    lat: '',
    lng: '',
    phone: '',
    email: '',
    map_embedded_url: '',
    is_active: true,
    meta_title: '',
    meta_description: '',
    zone_id: '',
    short_description: '',
    full_address: '',
    phone_secondary: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createPointOfSale, { isLoading }] = useCreateDashboardPointOfSaleMutation();

  const imagePreviewUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleOpen() {
    setForm({
      title: '',
      slug: '',
      lat: '',
      lng: '',
      phone: '',
      email: '',
      map_embedded_url: '',
      is_active: true,
      meta_title: '',
      meta_description: '',
      zone_id: '',
      short_description: '',
      full_address: '',
      phone_secondary: '',
    });
    setImage(null);
    setFieldErrors({});
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setImage(null);
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createPointOfSaleFormSchema.safeParse({
      ...form,
      slug: resolveOptionalSlug(form.slug, form.title),
      image: image ?? undefined,
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    const d = parsed.data;
    try {
      await createPointOfSale({
        title: d.title,
        slug: d.slug.trim() ? d.slug : normalizeBrandSlugInput(d.title) || 'point-of-sale',
        lat: String(d.lat),
        lng: String(d.lng),
        phone: d.phone,
        email: d.email,
        map_embedded_url: d.map_embedded_url,
        is_active: d.is_active,
        meta_title: d.meta_title,
        meta_description: d.meta_description,
        zone_id: d.zone_id,
        short_description: d.short_description,
        full_address: d.full_address,
        phone_secondary: d.phone_secondary,
        image: d.image,
      }).unwrap();
      toast.success(`"${d.title}" created successfully.`);
      handleClose();
    } catch (error) {
      console.error('Failed to create point of sale', error);
      toast.error(extractServerMessage(error, 'Create failed. Please try again.'));
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] shadow-[0_16px_32px_-18px_rgba(0,0,0,0.95)] transition-opacity hover:opacity-95"
        >
          <Plus size={16} />
          <span>Add Point of Sale</span>
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add point of sale overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />

          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-xl flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add Point of Sale</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Create a new location entry with coordinates and image.
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

            <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Title *</span>
                    <input
                      type="text"
                      value={form.title}
                      maxLength={POINT_OF_SALE_TEXT_MAX}
                      onChange={(e) => {
                        clearError('title');
                        setForm((prev) => ({ ...prev, title: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(fieldErrors.title))}`}
                    />
                    <FieldError message={fieldErrors.title} />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Slug</span>
                    <input
                      type="text"
                      value={form.slug}
                      maxLength={POINT_OF_SALE_TEXT_MAX}
                      onChange={(e) => {
                        clearError('slug');
                        setForm((prev) => ({ ...prev, slug: normalizeBrandSlugInput(e.target.value) }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(fieldErrors.slug))}`}
                    />
                    <FieldError message={fieldErrors.slug} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Latitude *</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={form.lat}
                      onChange={(e) => {
                        clearError('lat');
                        setForm((prev) => ({ ...prev, lat: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(fieldErrors.lat))}`}
                    />
                    <FieldError message={fieldErrors.lat} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Longitude *</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={form.lng}
                      onChange={(e) => {
                        clearError('lng');
                        setForm((prev) => ({ ...prev, lng: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(fieldErrors.lng))}`}
                    />
                    <FieldError message={fieldErrors.lng} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Phone *</span>
                    <input
                      type="text"
                      value={form.phone}
                      maxLength={POINT_OF_SALE_TEXT_MAX}
                      onChange={(e) => {
                        clearError('phone');
                        setForm((prev) => ({ ...prev, phone: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(fieldErrors.phone))}`}
                    />
                    <FieldError message={fieldErrors.phone} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Secondary Phone *</span>
                    <input
                      type="text"
                      value={form.phone_secondary}
                      maxLength={POINT_OF_SALE_TEXT_MAX}
                      onChange={(e) => {
                        clearError('phone_secondary');
                        setForm((prev) => ({ ...prev, phone_secondary: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(fieldErrors.phone_secondary))}`}
                    />
                    <FieldError message={fieldErrors.phone_secondary} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Email *</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        clearError('email');
                        setForm((prev) => ({ ...prev, email: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(fieldErrors.email))}`}
                    />
                    <FieldError message={fieldErrors.email} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Zone ID *</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={form.zone_id}
                      onChange={(e) => {
                        clearError('zone_id');
                        setForm((prev) => ({ ...prev, zone_id: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(fieldErrors.zone_id))}`}
                    />
                    <FieldError message={fieldErrors.zone_id} />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Map Embed URL *</span>
                  <input
                    type="url"
                    value={form.map_embedded_url}
                    onChange={(e) => {
                      clearError('map_embedded_url');
                      setForm((prev) => ({ ...prev, map_embedded_url: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(fieldErrors.map_embedded_url))}`}
                  />
                  <FieldError message={fieldErrors.map_embedded_url} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta Title *</span>
                  <input
                    type="text"
                    value={form.meta_title}
                    maxLength={POINT_OF_SALE_TEXT_MAX}
                    onChange={(e) => {
                      clearError('meta_title');
                      setForm((prev) => ({ ...prev, meta_title: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(fieldErrors.meta_title))}`}
                  />
                  <FieldError message={fieldErrors.meta_title} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta Description *</span>
                  <textarea
                    value={form.meta_description}
                    maxLength={POINT_OF_SALE_META_DESCRIPTION_MAX}
                    rows={3}
                    onChange={(e) => {
                      clearError('meta_description');
                      setForm((prev) => ({ ...prev, meta_description: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm ${inputBorderClass(Boolean(fieldErrors.meta_description))}`}
                  />
                  <FieldError message={fieldErrors.meta_description} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Short Description *</span>
                  <textarea
                    value={form.short_description}
                    maxLength={POINT_OF_SALE_DESCRIPTION_MAX}
                    rows={3}
                    onChange={(e) => {
                      clearError('short_description');
                      setForm((prev) => ({ ...prev, short_description: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm ${inputBorderClass(Boolean(fieldErrors.short_description))}`}
                  />
                  <FieldError message={fieldErrors.short_description} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Full Address *</span>
                  <textarea
                    value={form.full_address}
                    maxLength={POINT_OF_SALE_DESCRIPTION_MAX}
                    rows={3}
                    onChange={(e) => {
                      clearError('full_address');
                      setForm((prev) => ({ ...prev, full_address: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm ${inputBorderClass(Boolean(fieldErrors.full_address))}`}
                  />
                  <FieldError message={fieldErrors.full_address} />
                </label>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#dbe1ea] bg-white px-4 py-3">
                  <div>
                    <span className="text-sm font-medium text-[#111111]">Status</span>
                    <p className="text-xs text-[#6b7280]">
                      {form.is_active ? 'Visible as active on the storefront' : 'Hidden / inactive'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#6b7280]">
                      {form.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <DashboardToggleSwitch
                      checked={form.is_active}
                      onChange={(next) => setForm((prev) => ({ ...prev, is_active: next }))}
                      aria-label="Point of sale active status"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-[#111111]">Image *</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      clearError('image');
                      setImage(e.target.files?.[0] ?? null);
                    }}
                    className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111]"
                  />
                  <FieldError message={fieldErrors.image} />
                  {imagePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreviewUrl}
                      alt="Point of sale preview"
                      className="h-28 w-full rounded-lg border border-[#e5e7eb] object-cover"
                    />
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4">
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
                  disabled={isLoading}
                  className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
                >
                  {isLoading ? 'Creating...' : 'Create Point of Sale'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
