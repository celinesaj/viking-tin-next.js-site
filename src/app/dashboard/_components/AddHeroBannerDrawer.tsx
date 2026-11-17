'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateDashboardHeroBannerMutation } from '@/app/dashboard/redux/reducers/HeroBannersSlice/HeroBannersApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import {
  createHeroBannerFormSchema,
  fieldErrorsFromZod,
  HERO_HEADLINE_MAX,
  HERO_POSITION_MAX,
  HERO_SUBHEADLINE_MAX,
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

export default function AddHeroBannerDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    headline: '',
    subheadline: '',
    position: 1,
    start_date: '',
    end_date: '',
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createBanner, { isLoading }] = useCreateDashboardHeroBannerMutation();

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
      headline: '',
      subheadline: '',
      position: 1,
      start_date: '',
      end_date: '',
      is_active: true,
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

    const parsed = createHeroBannerFormSchema.safeParse({
      headline: form.headline,
      subheadline: form.subheadline,
      position: form.position,
      start_date: form.start_date,
      end_date: form.end_date,
      is_active: form.is_active,
      image: imageFile,
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    const d = parsed.data;

    try {
      await createBanner({
        headline: d.headline,
        subheadline: d.subheadline,
        image: d.image,
        position: d.position,
        start_date: d.start_date.trim() ? new Date(d.start_date).toISOString() : null,
        end_date: d.end_date.trim() ? new Date(d.end_date).toISOString() : null,
        is_active: d.is_active,
      }).unwrap();
      toast.success('Hero banner created.');
      handleClose();
    } catch (error) {
      console.error('Failed to create hero banner', error);
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
          <span>Add Hero Banner</span>
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add hero banner overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />

          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add Hero Banner</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Headline and subheadline are optional (max {HERO_HEADLINE_MAX} /{' '}
                  {HERO_SUBHEADLINE_MAX} characters). Position 0–{HERO_POSITION_MAX}. Image max 5 MB.
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
                    Headline <span className="font-normal text-[#6b7280]">(optional)</span>
                  </span>
                  <textarea
                    value={form.headline}
                    maxLength={HERO_HEADLINE_MAX}
                    aria-invalid={Boolean(fieldErrors.headline)}
                    aria-describedby={fieldErrors.headline ? 'hero-add-headline-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, headline: e.target.value }));
                      clearError('headline');
                    }}
                    placeholder="Multi-line headline (Enter for a new line)"
                    rows={3}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.headline))}`}
                  />
                  <FieldError id="hero-add-headline-err" message={fieldErrors.headline} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.headline.length}/{HERO_HEADLINE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Subheadline <span className="font-normal text-[#6b7280]">(optional)</span>
                  </span>
                  <textarea
                    value={form.subheadline}
                    maxLength={HERO_SUBHEADLINE_MAX}
                    aria-invalid={Boolean(fieldErrors.subheadline)}
                    aria-describedby={fieldErrors.subheadline ? 'hero-add-sub-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, subheadline: e.target.value }));
                      clearError('subheadline');
                    }}
                    placeholder="Supporting text under the headline"
                    rows={2}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.subheadline))}`}
                  />
                  <FieldError id="hero-add-sub-err" message={fieldErrors.subheadline} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.subheadline.length}/{HERO_SUBHEADLINE_MAX}
                  </p>
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-[#111111]">
                    Image <span className="text-red-600">*</span>
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {filePreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={filePreviewUrl}
                          alt="Preview"
                          className="h-20 w-32 rounded-lg border border-[#e5e7eb] object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-[#d1d5db] bg-[#f9fafb] text-xs text-[#6b7280]">
                          No file
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    aria-required
                    aria-invalid={Boolean(fieldErrors.image)}
                    aria-describedby={fieldErrors.image ? 'hero-add-image-err' : undefined}
                    onChange={(e) => {
                      setImageFile(e.target.files?.[0] ?? null);
                      clearError('image');
                    }}
                    className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
                  />
                  <FieldError id="hero-add-image-err" message={fieldErrors.image} />
                  <p className="text-xs text-[#6b7280]">
                    Multipart field &quot;image&quot;, max 5 MB.
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Sort position <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={HERO_POSITION_MAX}
                    value={form.position}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.position)}
                    aria-describedby={fieldErrors.position ? 'hero-add-pos-err' : undefined}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      const next = Number.isFinite(n)
                        ? Math.min(HERO_POSITION_MAX, Math.max(0, Math.floor(n)))
                        : 0;
                      setForm((p) => ({ ...p, position: next }));
                      clearError('position');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.position))}`}
                  />
                  <FieldError id="hero-add-pos-err" message={fieldErrors.position} />
                  <p className="text-xs text-[#9ca3af]">0–{HERO_POSITION_MAX}</p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Start date</span>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    aria-invalid={Boolean(fieldErrors.start_date)}
                    aria-describedby={fieldErrors.start_date ? 'hero-add-start-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, start_date: e.target.value }));
                      clearError('start_date');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.start_date))}`}
                  />
                  <FieldError id="hero-add-start-err" message={fieldErrors.start_date} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">End date</span>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    aria-invalid={Boolean(fieldErrors.end_date)}
                    aria-describedby={fieldErrors.end_date ? 'hero-add-end-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, end_date: e.target.value }));
                      clearError('end_date');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.end_date))}`}
                  />
                  <FieldError id="hero-add-end-err" message={fieldErrors.end_date} />
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
                  {isLoading ? 'Creating...' : 'Create Banner'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
