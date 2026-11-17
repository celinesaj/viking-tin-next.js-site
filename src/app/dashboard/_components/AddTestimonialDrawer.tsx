'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateDashboardTestimonialMutation } from '@/app/dashboard/redux/reducers/TestimonialsSlice/TestimonialsApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import {
  createTestimonialFormSchema,
  fieldErrorsFromZod,
  TESTIMONIAL_NAME_MAX,
  TESTIMONIAL_QUOTE_MAX,
  TESTIMONIAL_ROLE_MAX,
  TESTIMONIAL_SORT_ORDER_MAX,
} from '@/app/dashboard/_validation/dashboardForms';

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

function inputBorderClass(hasError: boolean) {
  return hasError ? 'border-red-500' : 'border-[#dbe1ea]';
}

export default function AddTestimonialDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: '',
    quote: '',
    rating: 5,
    sort_order: 0,
    is_active: true,
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createTestimonial, { isLoading }] = useCreateDashboardTestimonialMutation();

  const filePreviewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

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
      name: '',
      role: '',
      quote: '',
      rating: 5,
      sort_order: 0,
      is_active: true,
      image_url: '',
    });
    setImageFile(null);
    setFieldErrors({});
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setImageFile(null);
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createTestimonialFormSchema.safeParse({
      name: form.name,
      role: form.role,
      quote: form.quote,
      rating: form.rating,
      sort_order: form.sort_order,
      is_active: form.is_active,
      image: imageFile ?? undefined,
      image_url: form.image_url,
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    const d = parsed.data;

    try {
      await createTestimonial({
        name: d.name,
        role: d.role,
        quote: d.quote,
        rating: d.rating,
        sort_order: d.sort_order,
        is_active: d.is_active,
        ...(d.image ? { image: d.image } : {}),
        ...(!d.image && d.image_url.trim() !== '' ? { image_url: d.image_url.trim() } : {}),
      }).unwrap();
      toast.success('Testimonial created.');
      handleClose();
    } catch (error) {
      console.error('Failed to create testimonial', error);
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
          <span>Add testimonial</span>
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add testimonial overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />

          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add testimonial</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Name, role, and quote are required. Optional image file or image URL (not both).
                  Rating 1–5, sort order 0–{TESTIMONIAL_SORT_ORDER_MAX}.
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
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Name <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    maxLength={TESTIMONIAL_NAME_MAX}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 't-add-name-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, name: e.target.value }));
                      clearError('name');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.name))}`}
                    placeholder="Customer name"
                  />
                  <FieldError id="t-add-name-err" message={fieldErrors.name} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Role <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.role}
                    maxLength={TESTIMONIAL_ROLE_MAX}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.role)}
                    aria-describedby={fieldErrors.role ? 't-add-role-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, role: e.target.value }));
                      clearError('role');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.role))}`}
                    placeholder="e.g. Verified buyer"
                  />
                  <FieldError id="t-add-role-err" message={fieldErrors.role} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Quote <span className="text-red-600">*</span>
                  </span>
                  <textarea
                    value={form.quote}
                    maxLength={TESTIMONIAL_QUOTE_MAX}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.quote)}
                    aria-describedby={fieldErrors.quote ? 't-add-quote-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, quote: e.target.value }));
                      clearError('quote');
                    }}
                    rows={4}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.quote))}`}
                    placeholder="What they said about your product"
                  />
                  <FieldError id="t-add-quote-err" message={fieldErrors.quote} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.quote.length}/{TESTIMONIAL_QUOTE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Rating</span>
                  <select
                    value={form.rating}
                    aria-invalid={Boolean(fieldErrors.rating)}
                    aria-describedby={fieldErrors.rating ? 't-add-rating-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, rating: Number(e.target.value) }));
                      clearError('rating');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.rating))}`}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} star{n === 1 ? '' : 's'}
                      </option>
                    ))}
                  </select>
                  <FieldError id="t-add-rating-err" message={fieldErrors.rating} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Sort order</span>
                  <input
                    type="number"
                    min={0}
                    max={TESTIMONIAL_SORT_ORDER_MAX}
                    value={form.sort_order}
                    aria-invalid={Boolean(fieldErrors.sort_order)}
                    aria-describedby={fieldErrors.sort_order ? 't-add-sort-err' : undefined}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      const next = Number.isFinite(n)
                        ? Math.min(
                            TESTIMONIAL_SORT_ORDER_MAX,
                            Math.max(0, Math.floor(n)),
                          )
                        : 0;
                      setForm((p) => ({ ...p, sort_order: next }));
                      clearError('sort_order');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.sort_order))}`}
                  />
                  <FieldError id="t-add-sort-err" message={fieldErrors.sort_order} />
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-[#111111]">Image file (optional)</span>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {filePreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={filePreviewUrl}
                          alt=""
                          className="h-20 w-20 rounded-full border border-[#e5e7eb] object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-[#d1d5db] bg-[#f9fafb] text-xs text-[#6b7280]">
                          No file
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    aria-invalid={Boolean(fieldErrors.image)}
                    aria-describedby={fieldErrors.image ? 't-add-img-err' : undefined}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setImageFile(f);
                      if (f) setForm((p) => ({ ...p, image_url: '' }));
                      clearError('image');
                      clearError('image_url');
                    }}
                    className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
                  />
                  <FieldError id="t-add-img-err" message={fieldErrors.image} />
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Or image URL</span>
                  <input
                    type="url"
                    value={form.image_url}
                    aria-invalid={Boolean(fieldErrors.image_url)}
                    aria-describedby={fieldErrors.image_url ? 't-add-url-err' : undefined}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((p) => ({ ...p, image_url: v }));
                      if (v.trim() !== '') setImageFile(null);
                      clearError('image_url');
                      clearError('image');
                    }}
                    placeholder="https://..."
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.image_url))}`}
                  />
                  <FieldError id="t-add-url-err" message={fieldErrors.image_url} />
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-[#d1d5db] text-[#111111] focus:ring-[#111111]"
                  />
                  <span className="text-sm font-medium text-[#111111]">Active</span>
                </label>
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
                  disabled={isLoading}
                  className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
