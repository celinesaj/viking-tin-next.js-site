'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateDashboardStrengthLevelMutation } from '@/app/dashboard/redux/reducers/StrengthLevelsSlice/StrengthLevelsApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import {
  STRENGTH_LEVEL_NAME_MAX,
  STRENGTH_LEVEL_SLUG_MAX,
  STRENGTH_LEVEL_SLUG_MIN,
  STRENGTH_LEVEL_SORT_MAX,
  STRENGTH_LEVEL_NAME_MIN,
  createStrengthLevelFormSchema,
  fieldErrorsFromZod,
  normalizeBrandSlugInput,
  resolveOptionalSlug,
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

export default function AddStrengthLevelDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    sortOrder: '0',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createStrengthLevel, { isLoading }] = useCreateDashboardStrengthLevelMutation();

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleOpen() {
    setForm({ name: '', slug: '', sortOrder: '0' });
    setFieldErrors({});
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createStrengthLevelFormSchema.safeParse({
      name: form.name,
      slug: resolveOptionalSlug(form.slug, form.name),
      sortOrder: form.sortOrder,
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    const { name, slug, sortOrder } = parsed.data;

    try {
      await createStrengthLevel({
        name,
        slug: slug || undefined,
        sortOrder,
      }).unwrap();
      toast.success(`"${name}" created successfully.`);
      handleClose();
    } catch (error) {
      console.error('Failed to create strength level', error);
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
          <span>Add Strength Level</span>
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add strength level overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />

          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add Strength Level</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Name ({STRENGTH_LEVEL_NAME_MIN}–{STRENGTH_LEVEL_NAME_MAX} chars) is required. Slug
                  optional ({STRENGTH_LEVEL_SLUG_MIN}–{STRENGTH_LEVEL_SLUG_MAX}, lowercase a–z, 0–9,
                  hyphens).
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
                    maxLength={STRENGTH_LEVEL_NAME_MAX}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'strength-add-name-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, name: e.target.value }));
                      clearError('name');
                    }}
                    placeholder="e.g. Medium"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.name))}`}
                  />
                  <FieldError id="strength-add-name-err" message={fieldErrors.name} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.name.trim().length}/{STRENGTH_LEVEL_NAME_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Slug</span>
                  <input
                    type="text"
                    value={form.slug}
                    maxLength={STRENGTH_LEVEL_SLUG_MAX}
                    aria-invalid={Boolean(fieldErrors.slug)}
                    aria-describedby={fieldErrors.slug ? 'strength-add-slug-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, slug: normalizeBrandSlugInput(e.target.value) }));
                      clearError('slug');
                    }}
                    placeholder="e.g. medium"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.slug))}`}
                  />
                  <FieldError id="strength-add-slug-err" message={fieldErrors.slug} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.slug.length}/{STRENGTH_LEVEL_SLUG_MAX} (leave empty or at least{' '}
                    {STRENGTH_LEVEL_SLUG_MIN} chars)
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Sort order <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={STRENGTH_LEVEL_SORT_MAX}
                    value={form.sortOrder}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.sortOrder)}
                    aria-describedby={fieldErrors.sortOrder ? 'strength-add-sort-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, sortOrder: e.target.value }));
                      clearError('sortOrder');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.sortOrder))}`}
                  />
                  <FieldError id="strength-add-sort-err" message={fieldErrors.sortOrder} />
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
