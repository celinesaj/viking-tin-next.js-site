'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateDashboardPageMutation } from '@/app/dashboard/redux/reducers/PagesSlice/PagesApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import DashboardRichTextEditor from '@/app/dashboard/_components/DashboardRichTextEditor';
import {
  BLOG_POST_META_DESC_MAX,
  BLOG_POST_META_TITLE_MAX,
  createPageFormSchema,
  fieldErrorsFromZod,
  normalizeBrandSlugInput,
  resolveOptionalSlug,
  PAGE_CONTENT_MAX,
  PAGE_SLUG_MAX,
  PAGE_SLUG_MIN,
  PAGE_TITLE_MAX,
  PAGE_TITLE_MIN,
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

export default function AddPageDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    image_url_1: '',
  });
  const [image1, setImage1] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createPage, { isLoading }] = useCreateDashboardPageMutation();
  const image1FilePreviewUrl = useMemo(() => (image1 ? URL.createObjectURL(image1) : null), [image1]);
  const image1PreviewUrl = image1FilePreviewUrl || form.image_url_1.trim() || null;

  useEffect(() => {
    return () => {
      if (image1FilePreviewUrl) URL.revokeObjectURL(image1FilePreviewUrl);
    };
  }, [image1FilePreviewUrl]);

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
      content: '',
      metaTitle: '',
      metaDescription: '',
      image_url_1: '',
    });
    setImage1(null);
    setFieldErrors({});
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setFieldErrors({});
    setImage1(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createPageFormSchema.safeParse({
      title: form.title,
      slug: resolveOptionalSlug(form.slug, form.title),
      content: form.content,
      meta_title: form.metaTitle,
      meta_description: form.metaDescription,
      image_url_1: form.image_url_1,
      image_1: image1 ?? undefined,
    });

    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    const d = parsed.data;

    try {
      await createPage({
        title: d.title,
        slug: d.slug || undefined,
        content: d.content || undefined,
        meta_title: d.meta_title,
        meta_description: d.meta_description,
        image_1: d.image_1,
        image_url_1: d.image_1 ? undefined : d.image_url_1,
      }).unwrap();
      toast.success(`"${d.title}" created successfully.`);
      handleClose();
    } catch (error) {
      console.error('Failed to create page', error);
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
          <span>Add Page</span>
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add page overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />

          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-xl flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add Page</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Admin content with HTML support and optional images.
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
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Title <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.title}
                    maxLength={PAGE_TITLE_MAX}
                    onChange={(e) => {
                      clearError('title');
                      setForm((prev) => ({ ...prev, title: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.title))}`}
                  />
                  <FieldError message={fieldErrors.title} />
                  <p className="text-xs text-[#9ca3af]">
                    {PAGE_TITLE_MIN} - {PAGE_TITLE_MAX} characters
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Slug</span>
                  <input
                    type="text"
                    value={form.slug}
                    maxLength={PAGE_SLUG_MAX}
                    onChange={(e) => {
                      clearError('slug');
                      setForm((prev) => ({ ...prev, slug: normalizeBrandSlugInput(e.target.value) }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.slug))}`}
                  />
                  <FieldError message={fieldErrors.slug} />
                  <p className="text-xs text-[#9ca3af]">
                    Optional, {PAGE_SLUG_MIN} - {PAGE_SLUG_MAX} chars, lowercase
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta title</span>
                  <input
                    type="text"
                    value={form.metaTitle}
                    maxLength={BLOG_POST_META_TITLE_MAX}
                    onChange={(e) => {
                      clearError('meta_title');
                      setForm((prev) => ({ ...prev, metaTitle: e.target.value }));
                    }}
                    placeholder="SEO meta title"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.meta_title))}`}
                  />
                  <FieldError message={fieldErrors.meta_title} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.metaTitle.trim().length}/{BLOG_POST_META_TITLE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta description</span>
                  <textarea
                    value={form.metaDescription}
                    maxLength={BLOG_POST_META_DESC_MAX}
                    rows={3}
                    onChange={(e) => {
                      clearError('meta_description');
                      setForm((prev) => ({ ...prev, metaDescription: e.target.value }));
                    }}
                    placeholder="SEO meta description"
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.meta_description))}`}
                  />
                  <FieldError message={fieldErrors.meta_description} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.metaDescription.trim().length}/{BLOG_POST_META_DESC_MAX}
                  </p>
                </label>

                <DashboardRichTextEditor
                  label="Content"
                  value={form.content}
                  maxLength={PAGE_CONTENT_MAX}
                  error={fieldErrors.content}
                  placeholder="Select text, then + Link → product, blog, or Website URL"
                  onChange={(html) => {
                    clearError('content');
                    setForm((prev) => ({ ...prev, content: html }));
                  }}
                />

                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Image 1</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        clearError('image_1');
                        clearError('image_url_1');
                        const file = e.target.files?.[0] ?? null;
                        setImage1(file);
                        if (file) setForm((prev) => ({ ...prev, image_url_1: '' }));
                      }}
                      className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111]"
                    />
                    <FieldError message={fieldErrors.image_1} />
                    <input
                      type="url"
                      value={form.image_url_1}
                      onChange={(e) => {
                        clearError('image_url_1');
                        clearError('image_1');
                        setForm((prev) => ({ ...prev, image_url_1: e.target.value }));
                        if (e.target.value.trim()) setImage1(null);
                      }}
                      placeholder="Or image URL 1"
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.image_url_1))}`}
                    />
                    <FieldError message={fieldErrors.image_url_1} />
                    {image1PreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image1PreviewUrl}
                        alt="Image 1 preview"
                        className="mt-2 h-28 w-full rounded-lg border border-[#e5e7eb] object-cover"
                      />
                    ) : (
                      <div className="mt-2 flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-[#d1d5db] bg-[#f9fafb] text-xs text-[#9ca3af]">
                        No image selected
                      </div>
                    )}
                  </div>
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
                  {isLoading ? 'Creating...' : 'Create Page'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
