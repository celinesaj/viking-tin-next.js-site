'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useGetDashboardBlogCategoriesQuery } from '@/app/dashboard/redux/reducers/BlogCategoriesSlice/BlogCategoriesApiSlice';
import {
  useDeleteDashboardBlogPostMutation,
  useGetDashboardBlogPostsQuery,
  useUpdateDashboardBlogPostMutation,
} from '@/app/dashboard/redux/reducers/BlogPostsSlice/BlogPostsApiSlice';
import ProductDescriptionField from '@/app/dashboard/_components/ProductDescriptionField';
import DashboardSelect from '@/app/dashboard/_components/DashboardSelect';
import FieldError from '@/app/dashboard/_components/FieldError';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
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
  normalizeBrandSlugInput,
  resolveOptionalSlug,
} from '@/app/dashboard/_validation/dashboardForms';
import type { BlogPost } from '@/types/blog';

function getVisiblePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    if (index > 0 && sorted[index] - sorted[index - 1] > 1) {
      out.push('ellipsis');
    }
    out.push(sorted[index]);
  }
  return out;
}

function displayText(value: string | null | undefined, empty = '—') {
  if (value == null || String(value).trim() === '') return empty;
  return value;
}

function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

const PAGE_SIZE = 20;

export default function BlogPostsTable() {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [actionsMenuPostId, setActionsMenuPostId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [editTarget, setEditTarget] = useState<BlogPost | null>(null);
  const [editForm, setEditForm] = useState({
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
  const [editFeaturedFile, setEditFeaturedFile] = useState<File | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useGetDashboardBlogCategoriesQuery();
  const [updatePost, { isLoading: isUpdating }] = useUpdateDashboardBlogPostMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeleteDashboardBlogPostMutation();

  const queryArgs = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(categoryFilter ? { category_id: categoryFilter } : {}),
    }),
    [page, categoryFilter],
  );

  const { data, isLoading, isFetching, isError, error } = useGetDashboardBlogPostsQuery(queryArgs);

  const pagination = data?.pagination;

  useEffect(() => {
    if (!pagination) return;
    if (pagination.totalPages >= 1 && page > pagination.totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync local page index when server reports fewer pages than selected
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  const rows = data?.data ?? [];
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);

  const categorySelectOptions = useMemo(
    () => [
      { value: '', label: 'All categories' },
      ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [categories],
  );

  const editCategoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories],
  );

  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  const activePostForMenu =
    actionsMenuPostId && rows.length > 0
      ? rows.find((r) => r.id === actionsMenuPostId) ?? null
      : null;

  useEffect(() => {
    if (!actionsMenuPostId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-blog-post-actions-root]')) return;
      if (target.closest(ROW_ACTIONS_PORTAL_SELECTOR)) return;
      setActionsMenuPostId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActionsMenuPostId(null);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsMenuPostId]);

  function clearEditError(key: string) {
    setEditFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const handleEdit = (post: BlogPost) => {
    setActionsMenuPostId(null);
    setEditTarget(post);
    setEditFieldErrors({});
    setEditFeaturedFile(null);
    setEditForm({
      categoryId: post.categoryId != null && post.categoryId !== '' ? String(post.categoryId) : '',
      title: post.title ?? '',
      slug: normalizeBrandSlugInput(post.slug ?? ''),
      content: post.content ?? '',
      author: post.author ?? '',
      publishedAt: isoToDatetimeLocalValue(post.publishedAt),
      isPublished: post.isPublished,
      metaTitle: post.metaTitle ?? '',
      metaDescription: post.metaDescription ?? '',
      featuredImageUrl: post.featuredImage?.trim() ?? '',
      featuredImageAlt: post.featuredImageAlt?.trim() ?? '',
    });
  };

  const handleCloseEditDrawer = () => {
    setEditTarget(null);
    setEditFeaturedFile(null);
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = createBlogPostFormSchema.safeParse({
      categoryId: editForm.categoryId,
      title: editForm.title,
      slug: resolveOptionalSlug(editForm.slug, editForm.title),
      content: editForm.content,
      author: editForm.author,
      publishedAt: editForm.publishedAt,
      isPublished: editForm.isPublished,
      metaTitle: editForm.metaTitle,
      metaDescription: editForm.metaDescription,
      featuredImageAlt: editForm.featuredImageAlt,
      featured_image: editFeaturedFile ?? undefined,
      featuredImageUrl: editForm.featuredImageUrl,
    });
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setEditFieldErrors({});
    const d = parsed.data;
    let publishedAtIso: string | undefined;
    if (d.publishedAt.trim() !== '') {
      const ms = new Date(d.publishedAt).getTime();
      if (!Number.isNaN(ms)) publishedAtIso = new Date(d.publishedAt).toISOString();
    }

    try {
      await updatePost({
        id: editTarget.id,
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
        featuredImage: d.featured_image
          ? undefined
          : d.featuredImageUrl.trim() !== ''
            ? d.featuredImageUrl.trim()
            : undefined,
        featuredImageAlt: d.featuredImageAlt.trim() || undefined,
      }).unwrap();
      toast.success('Post updated.');
      handleCloseEditDrawer();
    } catch (err) {
      console.error('Failed to update blog post', err);
      toast.error(extractServerMessage(err, 'Update failed. Please try again.'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePost(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete blog post', err);
      toast.error(extractServerMessage(err, 'Delete failed. Please try again.'));
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 sm:block">
              <h2 className="text-base font-semibold">Blog posts</h2>
            </div>
            <p className="mt-1 text-xs text-[#6b7280]">
              This list shows published posts only. Drafts stay hidden until published.
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-1 sm:max-w-xs sm:items-end">
            <span className="text-xs text-[#9ca3af] sm:text-right">GET /blog/posts</span>
            <DashboardSelect
              value={categoryFilter}
              onChange={(next) => {
                setCategoryFilter(next);
                setPage(1);
              }}
              options={categorySelectOptions}
              placeholder="All categories"
              aria-label="Filter posts by category"
            />
          </div>
        </div>

        {isLoading ? <TableDotsLoader /> : null}
        {isError ? (
          <p className="text-sm text-red-600">{extractServerMessage(error, 'Failed to load posts.')}</p>
        ) : null}
        {!isLoading && !isError && total === 0 ? (
          <p className="text-sm text-[#6b7280]">No published posts match this filter.</p>
        ) : null}

        {!isLoading && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Title</th>
                    <th className="px-3 py-3 font-medium">Slug</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Content preview</th>
                    <th className="px-3 py-3 font-medium">Updated</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc]"
                    >
                      <td className="px-3 py-4 font-medium text-[#111111]">{displayText(row.title)}</td>
                      <td className="px-3 py-4 text-[#6b7280]">{displayText(row.slug)}</td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.category?.name ?? '—'}</td>
                      <td className="max-w-[280px] px-3 py-4 text-[#6b7280]">
                        <span className="line-clamp-2 whitespace-pre-wrap">
                          {(row.content ?? '').replace(/<[^>]+>/g, '').trim() || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-[#6b7280]">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-blog-post-actions-root>
                          <button
                            ref={actionsMenuPostId === row.id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuPostId === row.id}
                            aria-haspopup="menu"
                            aria-label={`Actions for ${row.title || 'post'}`}
                            onClick={() =>
                              setActionsMenuPostId((current) => (current === row.id ? null : row.id))
                            }
                            disabled={isDeleting || isUpdating}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8fafc] disabled:opacity-50"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {activePostForMenu ? (
              <RowActionsFloatingMenu open triggerRef={actionsBtnRef}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleEdit(activePostForMenu)}
                  disabled={isDeleting || isUpdating}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsMenuPostId(null);
                    setDeleteTarget({
                      id: activePostForMenu.id,
                      title: activePostForMenu.title || 'Post',
                    });
                  }}
                  disabled={isDeleting || isUpdating}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </RowActionsFloatingMenu>
            ) : null}

            {isFetching && !isLoading ? (
              <p className="border-t border-[#e5e5e5] pt-3 text-xs text-[#6b7280]">Updating...</p>
            ) : null}

            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e5e5] pt-4">
                <p className="text-xs text-[#6b7280]">
                  Page {safePage} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#374151] transition hover:bg-[#f9fafb] disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {visiblePages.map((item, i) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${i}`} className="px-2 text-[#9ca3af]">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`min-w-9 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
                          item === safePage
                            ? 'bg-[#111111] text-white'
                            : 'text-[#374151] hover:bg-[#f3f4f6]'
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#374151] transition hover:bg-[#f9fafb] disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete post</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Delete{' '}
              <span className="font-semibold text-[#111111]">&quot;{deleteTarget.title}&quot;</span>? This
              cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close edit drawer overlay"
            onClick={handleCloseEditDrawer}
            className="h-full flex-1 bg-black/40"
          />
          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-xl flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Edit Blog Post</h3>
                <p className="mt-1 text-xs text-[#6b7280]">PATCH /blog/posts/{editTarget.id}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditDrawer}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
              >
                <X size={16} />
              </button>
            </header>

            <form
              noValidate
              onSubmit={handleEditSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
                <div className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Category <span className="text-red-600">*</span>
                  </span>
                  <DashboardSelect
                    value={editForm.categoryId}
                    onChange={(next) => {
                      clearEditError('categoryId');
                      setEditForm((f) => ({ ...f, categoryId: next }));
                    }}
                    options={editCategoryOptions}
                    placeholder={categoriesLoading ? 'Loading...' : 'Select category'}
                    disabled={categoriesLoading}
                    hasError={!!editFieldErrors.categoryId}
                    aria-invalid={!!editFieldErrors.categoryId}
                    aria-describedby={editFieldErrors.categoryId ? 'blog-edit-cat-err' : undefined}
                    aria-required
                  />
                  <FieldError id="blog-edit-cat-err" message={editFieldErrors.categoryId} />
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Title <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    maxLength={BLOG_POST_TITLE_MAX + 20}
                    value={editForm.title}
                    onChange={(e) => {
                      clearEditError('title');
                      setEditForm((f) => ({ ...f, title: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!editFieldErrors.title)}`}
                    aria-invalid={!!editFieldErrors.title}
                    aria-describedby={editFieldErrors.title ? 'blog-edit-title-err' : undefined}
                  />
                  <FieldError id="blog-edit-title-err" message={editFieldErrors.title} />
                  <p className="text-xs text-[#9ca3af]">
                    {BLOG_POST_TITLE_MIN} - {BLOG_POST_TITLE_MAX} characters
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Slug</span>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => {
                      clearEditError('slug');
                      setEditForm((f) => ({ ...f, slug: normalizeBrandSlugInput(e.target.value) }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!editFieldErrors.slug)}`}
                    aria-invalid={!!editFieldErrors.slug}
                    aria-describedby={editFieldErrors.slug ? 'blog-edit-slug-err' : undefined}
                  />
                  <FieldError id="blog-edit-slug-err" message={editFieldErrors.slug} />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">New featured image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        clearEditError('featured_image');
                        clearEditError('featuredImageUrl');
                        const f = e.target.files?.[0] ?? null;
                        setEditFeaturedFile(f);
                        if (f) setEditForm((prev) => ({ ...prev, featuredImageUrl: '' }));
                      }}
                      className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
                    />
                    <FieldError message={editFieldErrors.featured_image} />
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Or image URL</span>
                    <input
                      type="url"
                      value={editForm.featuredImageUrl}
                      onChange={(e) => {
                        clearEditError('featuredImageUrl');
                        clearEditError('featured_image');
                        setEditForm((f) => ({ ...f, featuredImageUrl: e.target.value }));
                        if (e.target.value.trim()) setEditFeaturedFile(null);
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!editFieldErrors.featuredImageUrl)}`}
                      placeholder="https://…"
                      aria-invalid={!!editFieldErrors.featuredImageUrl}
                      aria-describedby={editFieldErrors.featuredImageUrl ? 'blog-edit-feat-url-err' : undefined}
                    />
                    <FieldError id="blog-edit-feat-url-err" message={editFieldErrors.featuredImageUrl} />
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Featured image alt text</span>
                  <input
                    type="text"
                    maxLength={BLOG_POST_FEATURED_IMAGE_ALT_MAX + 20}
                    value={editForm.featuredImageAlt}
                    onChange={(e) => {
                      clearEditError('featuredImageAlt');
                      setEditForm((f) => ({ ...f, featuredImageAlt: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!editFieldErrors.featuredImageAlt)}`}
                    placeholder="Describe the featured image for accessibility"
                    aria-invalid={!!editFieldErrors.featuredImageAlt}
                    aria-describedby={
                      editFieldErrors.featuredImageAlt ? 'blog-edit-featured-alt-err' : undefined
                    }
                  />
                  <FieldError id="blog-edit-featured-alt-err" message={editFieldErrors.featuredImageAlt} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.featuredImageAlt.trim().length}/{BLOG_POST_FEATURED_IMAGE_ALT_MAX}
                  </p>
                </label>
                {editTarget.featuredImage?.trim() && !editFeaturedFile ? (
                  <p className="text-xs text-[#6b7280]">Current image kept unless you replace it.</p>
                ) : null}

                <ProductDescriptionField
                  label="Content"
                  value={editForm.content}
                  maxLength={BLOG_POST_CONTENT_MAX}
                  error={editFieldErrors.content}
                  linkSource="products-and-blogs"
                  placeholder="Post body (plain text; use + Link to add product, blog, or website links)"
                  onChange={(html) => {
                    clearEditError('content');
                    setEditForm((f) => ({ ...f, content: html }));
                  }}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Author</span>
                    <input
                      type="text"
                      maxLength={BLOG_POST_AUTHOR_MAX + 10}
                      value={editForm.author}
                      onChange={(e) => {
                        clearEditError('author');
                        setEditForm((f) => ({ ...f, author: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!editFieldErrors.author)}`}
                      aria-invalid={!!editFieldErrors.author}
                      aria-describedby={editFieldErrors.author ? 'blog-edit-author-err' : undefined}
                    />
                    <FieldError id="blog-edit-author-err" message={editFieldErrors.author} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Publish at</span>
                    <input
                      type="datetime-local"
                      value={editForm.publishedAt}
                      onChange={(e) => {
                        clearEditError('publishedAt');
                        setEditForm((f) => ({ ...f, publishedAt: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!editFieldErrors.publishedAt)}`}
                    />
                    <FieldError message={editFieldErrors.publishedAt} />
                  </label>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                  <input
                    id="blog-edit-published"
                    type="checkbox"
                    checked={editForm.isPublished}
                    onChange={(e) => setEditForm((f) => ({ ...f, isPublished: e.target.checked }))}
                    className="h-4 w-4 rounded border-[#d1d5db] text-[#111111] focus:ring-[#111111]"
                  />
                  <label htmlFor="blog-edit-published" className="text-sm text-[#374151]">
                    Published
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta title</span>
                  <input
                    type="text"
                    maxLength={BLOG_POST_META_TITLE_MAX + 10}
                    value={editForm.metaTitle}
                    onChange={(e) => {
                      clearEditError('metaTitle');
                      setEditForm((f) => ({ ...f, metaTitle: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!editFieldErrors.metaTitle)}`}
                    placeholder="SEO meta title"
                    aria-invalid={!!editFieldErrors.metaTitle}
                    aria-describedby={editFieldErrors.metaTitle ? 'blog-edit-meta-title-err' : undefined}
                  />
                  <FieldError id="blog-edit-meta-title-err" message={editFieldErrors.metaTitle} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.metaTitle.trim().length}/{BLOG_POST_META_TITLE_MAX}
                  </p>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta description</span>
                  <textarea
                    maxLength={BLOG_POST_META_DESC_MAX + 20}
                    rows={3}
                    value={editForm.metaDescription}
                    onChange={(e) => {
                      clearEditError('metaDescription');
                      setEditForm((f) => ({ ...f, metaDescription: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!editFieldErrors.metaDescription)}`}
                    placeholder="SEO meta description"
                    aria-invalid={!!editFieldErrors.metaDescription}
                    aria-describedby={
                      editFieldErrors.metaDescription ? 'blog-edit-meta-desc-err' : undefined
                    }
                  />
                  <FieldError id="blog-edit-meta-desc-err" message={editFieldErrors.metaDescription} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.metaDescription.trim().length}/{BLOG_POST_META_DESC_MAX}
                  </p>
                </label>
              </div>

              <div className="shrink-0 flex items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)]">
                <button
                  type="button"
                  onClick={handleCloseEditDrawer}
                  disabled={isUpdating}
                  className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || categoriesLoading}
                  className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
                >
                  {isUpdating ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
