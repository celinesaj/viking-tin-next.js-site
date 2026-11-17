'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useGetDashboardBlogCategoriesQuery } from '@/app/dashboard/redux/reducers/BlogCategoriesSlice/BlogCategoriesApiSlice';
import { useCreateDashboardBlogPostMutation } from '@/app/dashboard/redux/reducers/BlogPostsSlice/BlogPostsApiSlice';
import ProductDescriptionField from '@/app/dashboard/_components/ProductDescriptionField';
import DashboardSelect from '@/app/dashboard/_components/DashboardSelect';
import FieldError from '@/app/dashboard/_components/FieldError';
import {
  BLOG_POST_AUTHOR_MAX,
  BLOG_POST_CONTENT_MAX,
  BLOG_POST_FEATURED_IMAGE_ALT_MAX,
  BLOG_POST_META_DESC_MAX,
  BLOG_POST_META_TITLE_MAX,
  BLOG_POST_TITLE_MAX,
  BLOG_POST_TITLE_MIN,
  createBlogPostFormSchema,
  fieldErrorsFromZod,
  generateSlugFromName,
  normalizeBrandSlugInput,
  resolveOptionalSlug,
} from '@/app/dashboard/_validation/dashboardForms';

function extractServerMessage(error: unknown, fallbackMessage: string) {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (!error || typeof error !== 'object') return fallbackMessage;

  const err = error as Record<string, unknown>;

  /** RTK Query `unwrap()` rejects with `FetchBaseQueryError` (`status` + `data` or `error`). */
  if ('status' in err) {
    const status = err.status;
    if (status === 'FETCH_ERROR' || status === 'PARSING_ERROR' || status === 'TIMEOUT_ERROR') {
      const net = typeof err.error === 'string' ? err.error.trim() : '';
      if (net) return `${net} [${String(status)}]`;
    }

    const data = err.data;
    if (typeof data === 'string' && data.trim()) {
      const t = data.trim();
      return t.length > 500 ? `${t.slice(0, 500)}…` : t;
    }

    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      const message = o.message;
      if (typeof message === 'string' && message.trim()) return message.trim();
      if (Array.isArray(message)) {
        const list = message.filter(
          (item): item is string => typeof item === 'string' && item.trim() !== '',
        );
        if (list.length > 0) return list.join('; ');
      }
      const errorText = o.error;
      if (typeof errorText === 'string' && errorText.trim()) return errorText.trim();
      if (typeof status === 'number' && Object.keys(o).length === 0) {
        return `Request failed (HTTP ${status}).`;
      }
    }

    if (typeof status === 'number') {
      return `Request failed (HTTP ${status}).`;
    }
  }

  if ('data' in err) {
    const data = err.data;
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message)) {
        const list = message.filter((item): item is string => typeof item === 'string');
        if (list.length > 0) return list.join('; ');
      }
      const errorText = (data as { error?: unknown }).error;
      if (typeof errorText === 'string' && errorText.trim()) return errorText;
    }
  }

  if (typeof err.error === 'string' && err.error.trim()) return err.error.trim();

  return fallbackMessage;
}

function inputBorderClass(hasError: boolean) {
  return hasError ? 'border-red-500' : 'border-[#dbe1ea]';
}

export default function AddBlogPostDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    slug: '',
    content: '',
    author: '',
    publishedAt: '',
    isPublished: true,
    metaTitle: '',
    metaDescription: '',
    featuredImageUrl: '',
    featuredImageAlt: '',
  });
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { data: categories = [], isLoading: categoriesLoading } = useGetDashboardBlogCategoriesQuery();
  const [createPost, { isLoading }] = useCreateDashboardBlogPostMutation();

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories],
  );

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
      categoryId: '',
      title: '',
      slug: '',
      content: '',
      author: '',
      publishedAt: '',
      isPublished: true,
      metaTitle: '',
      metaDescription: '',
      featuredImageUrl: '',
      featuredImageAlt: '',
    });
    setFeaturedFile(null);
    setFieldErrors({});
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setFeaturedFile(null);
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createBlogPostFormSchema.safeParse({
      categoryId: form.categoryId,
      title: form.title,
      slug: resolveOptionalSlug(form.slug, form.title),
      content: form.content,
      author: form.author,
      publishedAt: form.publishedAt,
      isPublished: form.isPublished,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      featuredImageAlt: form.featuredImageAlt,
      featured_image: featuredFile ?? undefined,
      featuredImageUrl: form.featuredImageUrl,
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    const d = parsed.data;
    let publishedAtIso: string | undefined;
    if (d.publishedAt.trim() !== '') {
      const ms = new Date(d.publishedAt).getTime();
      if (!Number.isNaN(ms)) publishedAtIso = new Date(d.publishedAt).toISOString();
    }

    try {
      await createPost({
        categoryId: d.categoryId,
        title: d.title,
        slug: d.slug || undefined,
        content: d.content || undefined,
        author: d.author || undefined,
        publishedAt: publishedAtIso,
        isPublished: d.isPublished,
        metaTitle: d.metaTitle || undefined,
        metaDescription: d.metaDescription || undefined,
        featured_image: d.featured_image,
        featuredImage: d.featuredImageUrl.trim() || undefined,
        featuredImageAlt: d.featuredImageAlt.trim() || undefined,
      }).unwrap();
      toast.success(d.isPublished ? 'Blog post published.' : 'Draft saved (not listed in public feed until published).');
      handleClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(
          'Failed to create blog post:',
          extractServerMessage(error, 'Unknown error'),
        );
      }
      toast.error(extractServerMessage(error, 'Create failed. Please try again.'));
    }
  }

  const noCategories = !categoriesLoading && categories.length === 0;

  const fieldClass = (err: boolean) =>
    `h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(err)}`;
  const textareaClass = (err: boolean) =>
    `w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(err)}`;

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleOpen}
          disabled={categoriesLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] shadow-[0_16px_32px_-18px_rgba(0,0,0,0.95)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} aria-hidden />
          <span>Add post</span>
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add blog post overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-blog-post-title"
            className="flex h-full max-h-screen min-h-0 w-full max-w-xl flex-col border-l border-[#e5e7eb] bg-white shadow-2xl"
          >
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 id="add-blog-post-title" className="text-base font-semibold text-[#111111]">
                  Add blog post
                </h3>
                <p className="mt-1 text-xs text-[#6b7280]">POST /blog/posts (multipart)</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </header>

            {noCategories ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Add at least one blog category before creating a post.
                </p>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
                  <div className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">
                      Category <span className="text-red-600">*</span>
                    </span>
                    <DashboardSelect
                      value={form.categoryId}
                      onChange={(next) => {
                        clearError('categoryId');
                        setForm((f) => ({ ...f, categoryId: next }));
                      }}
                      options={categoryOptions}
                      placeholder={categoriesLoading ? 'Loading…' : 'Select category'}
                      disabled={categoriesLoading}
                      hasError={!!fieldErrors.categoryId}
                      aria-invalid={!!fieldErrors.categoryId}
                      aria-describedby={fieldErrors.categoryId ? 'blog-post-cat-err' : undefined}
                      aria-required
                    />
                    <FieldError id="blog-post-cat-err" message={fieldErrors.categoryId} />
                  </div>

                  <label className="block space-y-1.5" htmlFor="blog-post-title">
                    <span className="text-sm font-medium text-[#111111]">
                      Title <span className="text-red-600">*</span>
                    </span>
                    <input
                      id="blog-post-title"
                      type="text"
                      maxLength={BLOG_POST_TITLE_MAX + 20}
                      value={form.title}
                      onChange={(e) => {
                        clearError('title');
                        setForm((f) => ({ ...f, title: e.target.value }));
                      }}
                      className={fieldClass(!!fieldErrors.title)}
                      aria-invalid={!!fieldErrors.title}
                      aria-describedby={fieldErrors.title ? 'blog-post-title-err' : undefined}
                    />
                    <FieldError id="blog-post-title-err" message={fieldErrors.title} />
                    <p className="text-xs text-[#9ca3af]">
                      {BLOG_POST_TITLE_MIN} - {BLOG_POST_TITLE_MAX} characters
                    </p>
                  </label>

                  <label className="block space-y-1.5" htmlFor="blog-post-slug">
                    <span className="text-sm font-medium text-[#111111]">Slug</span>
                    <input
                      id="blog-post-slug"
                      type="text"
                      value={form.slug}
                      onChange={(e) => {
                        clearError('slug');
                        setForm((f) => ({ ...f, slug: normalizeBrandSlugInput(e.target.value) }));
                      }}
                      className={fieldClass(!!fieldErrors.slug)}
                      placeholder={
                        form.slug.trim()
                          ? 'my_post_slug'
                          : form.title.trim()
                            ? `Auto: ${generateSlugFromName(form.title)}`
                            : 'Leave empty to auto-generate from title'
                      }
                      aria-invalid={!!fieldErrors.slug}
                      aria-describedby={fieldErrors.slug ? 'blog-post-slug-err' : undefined}
                    />
                    <FieldError id="blog-post-slug-err" message={fieldErrors.slug} />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium text-[#111111]">Featured image (file)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          clearError('featured_image');
                          clearError('featuredImageUrl');
                          const f = e.target.files?.[0] ?? null;
                          setFeaturedFile(f);
                          if (f) setForm((prev) => ({ ...prev, featuredImageUrl: '' }));
                        }}
                        className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
                      />
                      <FieldError message={fieldErrors.featured_image} />
                    </div>
                    <label className="block space-y-1.5" htmlFor="blog-post-featured-url">
                      <span className="text-sm font-medium text-[#111111]">Or image URL</span>
                      <input
                        id="blog-post-featured-url"
                        type="url"
                        value={form.featuredImageUrl}
                        onChange={(e) => {
                          clearError('featuredImageUrl');
                          clearError('featured_image');
                          setForm((f) => ({ ...f, featuredImageUrl: e.target.value }));
                          if (e.target.value.trim()) setFeaturedFile(null);
                        }}
                        className={fieldClass(!!fieldErrors.featuredImageUrl)}
                        placeholder="https://…"
                        aria-invalid={!!fieldErrors.featuredImageUrl}
                        aria-describedby={fieldErrors.featuredImageUrl ? 'blog-post-feat-url-err' : undefined}
                      />
                      <FieldError id="blog-post-feat-url-err" message={fieldErrors.featuredImageUrl} />
                    </label>
                  </div>

                  <label className="block space-y-1.5" htmlFor="blog-post-featured-alt">
                    <span className="text-sm font-medium text-[#111111]">Featured image alt text</span>
                    <input
                      id="blog-post-featured-alt"
                      type="text"
                      maxLength={BLOG_POST_FEATURED_IMAGE_ALT_MAX + 20}
                      value={form.featuredImageAlt}
                      onChange={(e) => {
                        clearError('featuredImageAlt');
                        setForm((f) => ({ ...f, featuredImageAlt: e.target.value }));
                      }}
                      className={fieldClass(!!fieldErrors.featuredImageAlt)}
                      placeholder="Describe the featured image for accessibility"
                      aria-invalid={!!fieldErrors.featuredImageAlt}
                      aria-describedby={
                        fieldErrors.featuredImageAlt ? 'blog-post-featured-alt-err' : undefined
                      }
                    />
                    <FieldError id="blog-post-featured-alt-err" message={fieldErrors.featuredImageAlt} />
                    <p className="text-xs text-[#9ca3af]">
                      {form.featuredImageAlt.trim().length}/{BLOG_POST_FEATURED_IMAGE_ALT_MAX}
                    </p>
                  </label>

                  <ProductDescriptionField
                    label="Content"
                    value={form.content}
                    maxLength={BLOG_POST_CONTENT_MAX}
                    error={fieldErrors.content}
                    linkSource="products-and-blogs"
                    placeholder="Post body (plain text; use + Link to add product, blog, or website links)"
                    onChange={(html) => {
                      clearError('content');
                      setForm((f) => ({ ...f, content: html }));
                    }}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5" htmlFor="blog-post-author">
                      <span className="text-sm font-medium text-[#111111]">Author</span>
                      <input
                        id="blog-post-author"
                        type="text"
                        maxLength={BLOG_POST_AUTHOR_MAX + 10}
                        value={form.author}
                        onChange={(e) => {
                          clearError('author');
                          setForm((f) => ({ ...f, author: e.target.value }));
                        }}
                        className={fieldClass(!!fieldErrors.author)}
                        aria-invalid={!!fieldErrors.author}
                        aria-describedby={fieldErrors.author ? 'blog-post-author-err' : undefined}
                      />
                      <FieldError id="blog-post-author-err" message={fieldErrors.author} />
                    </label>
                    <label className="block space-y-1.5" htmlFor="blog-post-published">
                      <span className="text-sm font-medium text-[#111111]">Publish at</span>
                      <input
                        id="blog-post-published"
                        type="datetime-local"
                        value={form.publishedAt}
                        onChange={(e) => {
                          clearError('publishedAt');
                          setForm((f) => ({ ...f, publishedAt: e.target.value }));
                        }}
                        className={fieldClass(!!fieldErrors.publishedAt)}
                      />
                      <FieldError message={fieldErrors.publishedAt} />
                    </label>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                    <input
                      id="blog-post-is-published"
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                      className="h-4 w-4 rounded border-[#d1d5db] text-[#111111] focus:ring-[#111111]"
                    />
                    <label htmlFor="blog-post-is-published" className="text-sm text-[#374151]">
                      Published (drafts stay off the public list)
                    </label>
                  </div>

                  <label className="block space-y-1.5" htmlFor="blog-post-meta-title">
                    <span className="text-sm font-medium text-[#111111]">Meta title</span>
                    <input
                      id="blog-post-meta-title"
                      type="text"
                      maxLength={BLOG_POST_META_TITLE_MAX + 10}
                      value={form.metaTitle}
                      onChange={(e) => {
                        clearError('metaTitle');
                        setForm((f) => ({ ...f, metaTitle: e.target.value }));
                      }}
                      className={fieldClass(!!fieldErrors.metaTitle)}
                      placeholder="SEO meta title"
                      aria-invalid={!!fieldErrors.metaTitle}
                      aria-describedby={fieldErrors.metaTitle ? 'blog-post-meta-title-err' : undefined}
                    />
                    <FieldError id="blog-post-meta-title-err" message={fieldErrors.metaTitle} />
                    <p className="text-xs text-[#9ca3af]">
                      {form.metaTitle.trim().length}/{BLOG_POST_META_TITLE_MAX}
                    </p>
                  </label>

                  <label className="block space-y-1.5" htmlFor="blog-post-meta-desc">
                    <span className="text-sm font-medium text-[#111111]">Meta description</span>
                    <textarea
                      id="blog-post-meta-desc"
                      maxLength={BLOG_POST_META_DESC_MAX + 20}
                      rows={3}
                      value={form.metaDescription}
                      onChange={(e) => {
                        clearError('metaDescription');
                        setForm((f) => ({ ...f, metaDescription: e.target.value }));
                      }}
                      className={textareaClass(!!fieldErrors.metaDescription)}
                      placeholder="SEO meta description"
                      aria-invalid={!!fieldErrors.metaDescription}
                      aria-describedby={fieldErrors.metaDescription ? 'blog-post-meta-desc-err' : undefined}
                    />
                    <FieldError id="blog-post-meta-desc-err" message={fieldErrors.metaDescription} />
                    <p className="text-xs text-[#9ca3af]">
                      {form.metaDescription.trim().length}/{BLOG_POST_META_DESC_MAX}
                    </p>
                  </label>
                </div>

                <div className="shrink-0 flex items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)]">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc] disabled:opacity-70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || categoriesLoading}
                    className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
                  >
                    {isLoading ? 'Creating...' : 'Create post'}
                  </button>
                </div>
              </form>
            )}
          </aside>
        </div>
      ) : null}
    </>
  );
}
