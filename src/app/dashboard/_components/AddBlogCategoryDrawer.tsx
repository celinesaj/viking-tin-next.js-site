'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateDashboardBlogCategoryMutation } from '@/app/dashboard/redux/reducers/BlogCategoriesSlice/BlogCategoriesApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import {
  BLOG_CATEGORY_DESCRIPTION_MAX,
  BLOG_CATEGORY_NAME_MAX,
  BLOG_CATEGORY_NAME_MIN,
  BLOG_CATEGORY_SLUG_MAX,
  BLOG_CATEGORY_SLUG_MIN,
  createBlogCategoryFormSchema,
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

export default function AddBlogCategoryDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createCategory, { isLoading }] = useCreateDashboardBlogCategoryMutation();

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

    const parsed = createBlogCategoryFormSchema.safeParse({
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
      toast.success('Blog category created.');
      handleClose();
    } catch (error) {
      console.error('Failed to create blog category', error);
      toast.error(extractServerMessage(error, 'Create failed. Please try again.'));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#111111]">Blog categories</h2>
          <p className="text-sm text-[#6b7280]">Create categories for organizing posts.</p>
        </div>
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a2a31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2"
        >
          <Plus size={18} aria-hidden />
          Add category
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-blog-category-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 id="add-blog-category-title" className="text-lg font-semibold text-[#111111]">
                  New blog category
                </h3>
                <p className="mt-1 text-sm text-[#6b7280]">POST /blog/categories</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#111111]"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="blog-cat-name" className="mb-1 block text-sm font-medium text-[#374151]">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="blog-cat-name"
                  type="text"
                  maxLength={BLOG_CATEGORY_NAME_MAX + 20}
                  value={form.name}
                  onChange={(e) => {
                    clearError('name');
                    setForm((f) => ({ ...f, name: e.target.value }));
                  }}
                  className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:border-[#9ca3af] focus:outline-none ${inputBorderClass(!!fieldErrors.name)}`}
                  placeholder="News"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'blog-cat-name-err' : undefined}
                />
                <FieldError id="blog-cat-name-err" message={fieldErrors.name} />
                <p className="mt-1 text-xs text-[#9ca3af]">
                  {BLOG_CATEGORY_NAME_MIN}–{BLOG_CATEGORY_NAME_MAX} characters
                </p>
              </div>

              <div>
                <label htmlFor="blog-cat-slug" className="mb-1 block text-sm font-medium text-[#374151]">
                  Slug
                </label>
                <input
                  id="blog-cat-slug"
                  type="text"
                  maxLength={BLOG_CATEGORY_SLUG_MAX + 20}
                  value={form.slug}
                  onChange={(e) => {
                    clearError('slug');
                    setForm((f) => ({ ...f, slug: normalizeBrandSlugInput(e.target.value) }));
                  }}
                  className={`h-11 w-full rounded-xl border bg-white px-3 font-mono text-sm text-[#111111] focus:border-[#9ca3af] focus:outline-none ${inputBorderClass(!!fieldErrors.slug)}`}
                  placeholder="news"
                  aria-invalid={!!fieldErrors.slug}
                  aria-describedby={fieldErrors.slug ? 'blog-cat-slug-err' : undefined}
                />
                <FieldError id="blog-cat-slug-err" message={fieldErrors.slug} />
                <p className="mt-1 text-xs text-[#9ca3af]">
                  Optional. {BLOG_CATEGORY_SLUG_MIN}–{BLOG_CATEGORY_SLUG_MAX} chars, lowercase and hyphens.
                </p>
              </div>

              <div>
                <label htmlFor="blog-cat-desc" className="mb-1 block text-sm font-medium text-[#374151]">
                  Description
                </label>
                <textarea
                  id="blog-cat-desc"
                  rows={3}
                  maxLength={BLOG_CATEGORY_DESCRIPTION_MAX + 50}
                  value={form.description}
                  onChange={(e) => {
                    clearError('description');
                    setForm((f) => ({ ...f, description: e.target.value }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#9ca3af] focus:outline-none ${inputBorderClass(!!fieldErrors.description)}`}
                  placeholder="Company news and updates."
                  aria-invalid={!!fieldErrors.description}
                  aria-describedby={fieldErrors.description ? 'blog-cat-desc-err' : undefined}
                />
                <FieldError id="blog-cat-desc-err" message={fieldErrors.description} />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a2a31] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? 'Creating…' : 'Create category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
