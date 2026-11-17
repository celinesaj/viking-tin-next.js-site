'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateDashboardFaqCategoryMutation } from '@/app/dashboard/redux/reducers/FaqCategoriesSlice/FaqCategoriesApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import {
  FAQ_CATEGORY_DESCRIPTION_MAX,
  FAQ_CATEGORY_NAME_MAX,
  FAQ_CATEGORY_NAME_MIN,
  FAQ_CATEGORY_SLUG_MAX,
  FAQ_CATEGORY_SLUG_MIN,
  createFaqCategoryFormSchema,
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

export default function AddFaqCategoryDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createCategory, { isLoading }] = useCreateDashboardFaqCategoryMutation();

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleOpen() {
    setForm({ name: '', slug: '', description: '' });
    setFieldErrors({});
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createFaqCategoryFormSchema.safeParse({
      name: form.name,
      slug: resolveOptionalSlug(form.slug, form.name),
      description: form.description,
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    const { name, slug, description } = parsed.data;

    try {
      await createCategory({
        name,
        slug: slug || undefined,
        description: description || undefined,
      }).unwrap();
      toast.success('FAQ category created.');
      handleClose();
    } catch (error) {
      console.error('Failed to create FAQ category', error);
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
          <Plus size={16} aria-hidden />
          Add FAQ category
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add FAQ category overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />
          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add FAQ Category</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Name ({FAQ_CATEGORY_NAME_MIN}-{FAQ_CATEGORY_NAME_MAX} chars) is required. Slug is
                  optional ({FAQ_CATEGORY_SLUG_MIN}-{FAQ_CATEGORY_SLUG_MAX} chars, lowercase a-z, 0-9,
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
                <label htmlFor="faq-cat-name" className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Name <span className="text-red-600">*</span>
                  </span>
                  <input
                    id="faq-cat-name"
                    type="text"
                    maxLength={FAQ_CATEGORY_NAME_MAX + 20}
                    value={form.name}
                    onChange={(e) => {
                      clearError('name');
                      setForm((f) => ({ ...f, name: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!fieldErrors.name)}`}
                    placeholder="e.g. Ordering"
                    aria-required
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? 'faq-cat-name-err' : undefined}
                  />
                  <FieldError id="faq-cat-name-err" message={fieldErrors.name} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.name.trim().length}/{FAQ_CATEGORY_NAME_MAX}
                  </p>
                </label>

                <label htmlFor="faq-cat-slug" className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Slug</span>
                  <input
                    id="faq-cat-slug"
                    type="text"
                    maxLength={FAQ_CATEGORY_SLUG_MAX + 20}
                    value={form.slug}
                    onChange={(e) => {
                      clearError('slug');
                      setForm((f) => ({ ...f, slug: normalizeBrandSlugInput(e.target.value) }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 font-mono text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!fieldErrors.slug)}`}
                    placeholder="e.g. ordering"
                    aria-invalid={!!fieldErrors.slug}
                    aria-describedby={fieldErrors.slug ? 'faq-cat-slug-err' : undefined}
                  />
                  <FieldError id="faq-cat-slug-err" message={fieldErrors.slug} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.slug.length}/{FAQ_CATEGORY_SLUG_MAX} (leave empty or use at least{' '}
                    {FAQ_CATEGORY_SLUG_MIN} characters)
                  </p>
                </label>

                <label htmlFor="faq-cat-desc" className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Description</span>
                  <textarea
                    id="faq-cat-desc"
                    rows={3}
                    maxLength={FAQ_CATEGORY_DESCRIPTION_MAX + 50}
                    value={form.description}
                    onChange={(e) => {
                      clearError('description');
                      setForm((f) => ({ ...f, description: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!fieldErrors.description)}`}
                    placeholder="Questions about placing orders."
                    aria-invalid={!!fieldErrors.description}
                    aria-describedby={fieldErrors.description ? 'faq-cat-desc-err' : undefined}
                  />
                  <FieldError id="faq-cat-desc-err" message={fieldErrors.description} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.description.length}/{FAQ_CATEGORY_DESCRIPTION_MAX}
                  </p>
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
                  {isLoading ? 'Creating...' : 'Create FAQ Category'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
