'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  DashboardPage,
  useDeleteDashboardPageMutation,
  useGetDashboardPagesQuery,
  useUpdateDashboardPageMutation,
} from '@/app/dashboard/redux/reducers/PagesSlice/PagesApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import DashboardRichTextEditor from '@/app/dashboard/_components/DashboardRichTextEditor';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import { useDashboardTableHighlight } from '@/app/dashboard/_hooks/useDashboardTableHighlight';
import {
  BLOG_POST_META_DESC_MAX,
  BLOG_POST_META_TITLE_MAX,
  fieldErrorsFromZod,
  normalizeBrandSlugInput,
  PAGE_CONTENT_MAX,
  PAGE_SLUG_MAX,
  PAGE_SLUG_MIN,
  PAGE_TITLE_MAX,
  PAGE_TITLE_MIN,
  resolveOptionalSlug,
  updatePageFormSchema,
} from '@/app/dashboard/_validation/dashboardForms';

const PAGE_SIZE = 20;

function getVisiblePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const set = new Set<number>([1, total]);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    if (index > 0 && sorted[index] - sorted[index - 1] > 1) out.push('ellipsis');
    out.push(sorted[index]);
  }
  return out;
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
  return fallbackMessage;
}

function inputBorderClass(hasError: boolean) {
  return hasError ? 'border-red-500' : 'border-[#dbe1ea]';
}

export default function PagesTable() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [page, setPage] = useState(1);
  const [actionsMenuPageId, setActionsMenuPageId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [editTarget, setEditTarget] = useState<DashboardPage | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    image_url_1: '',
  });
  const [editImage1, setEditImage1] = useState<File | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const editImage1FilePreviewUrl = useMemo(
    () => (editImage1 ? URL.createObjectURL(editImage1) : null),
    [editImage1],
  );
  const editImage1PreviewUrl = editImage1FilePreviewUrl || editForm.image_url_1.trim() || null;

  const queryArgs = useMemo(() => ({ page, limit: PAGE_SIZE }), [page]);
  const { data, isLoading, isFetching, isError, error } = useGetDashboardPagesQuery(queryArgs);
  const [deletePage, { isLoading: isDeleting }] = useDeleteDashboardPageMutation();
  const [updatePage, { isLoading: isUpdating }] = useUpdateDashboardPageMutation();

  const rows = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);
  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  useEffect(() => {
    if (!pagination) return;
    if (pagination.totalPages >= 1 && page > pagination.totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- keep local pagination in sync with backend
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  useEffect(() => {
    if (!highlightId || rows.length === 0) return;
    if (rows.some((r) => r.id === highlightId)) return;
  }, [highlightId, rows]);

  const rowOnPage = Boolean(highlightId && rows.some((r) => r.id === highlightId));
  const { highlightRef, rowHighlightClass } = useDashboardTableHighlight(rowOnPage);

  const activePageForMenu = useMemo(
    () => (actionsMenuPageId ? rows.find((r) => r.id === actionsMenuPageId) ?? null : null),
    [rows, actionsMenuPageId],
  );

  useEffect(() => {
    if (!actionsMenuPageId) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-page-actions-root]')) return;
      if (target.closest(ROW_ACTIONS_PORTAL_SELECTOR)) return;
      setActionsMenuPageId(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActionsMenuPageId(null);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsMenuPageId]);

  useEffect(() => {
    return () => {
      if (editImage1FilePreviewUrl) URL.revokeObjectURL(editImage1FilePreviewUrl);
    };
  }, [editImage1FilePreviewUrl]);

  function clearEditError(key: string) {
    setEditFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const handleEdit = (row: DashboardPage) => {
    setActionsMenuPageId(null);
    setEditTarget(row);
    setEditImage1(null);
    setEditFieldErrors({});
    setEditForm({
      title: row.title ?? '',
      slug: normalizeBrandSlugInput(row.slug ?? ''),
      content: row.content ?? '',
      metaTitle: row.metaTitle ?? '',
      metaDescription: row.metaDescription ?? '',
      image_url_1: row.imageUrl1 ?? '',
    });
  };

  const handleCloseEditDrawer = () => {
    setEditTarget(null);
    setEditImage1(null);
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = updatePageFormSchema.safeParse({
      title: editForm.title,
      slug: resolveOptionalSlug(editForm.slug, editForm.title),
      content: editForm.content,
      meta_title: editForm.metaTitle,
      meta_description: editForm.metaDescription,
      image_url_1: editForm.image_url_1,
      image_1: editImage1 ?? undefined,
    });
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setEditFieldErrors({});
    const d = parsed.data;

    try {
      await updatePage({
        id: editTarget.id,
        title: d.title,
        slug: d.slug || undefined,
        content: d.content || undefined,
        meta_title: d.meta_title,
        meta_description: d.meta_description,
        image_1: d.image_1,
        image_url_1: d.image_1 ? undefined : d.image_url_1,
      }).unwrap();
      toast.success(`"${d.title}" updated successfully.`);
      handleCloseEditDrawer();
    } catch (err) {
      console.error('Failed to update page', err);
      toast.error(extractServerMessage(err, 'Update failed. Please try again.'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePage(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete page', err);
      toast.error(extractServerMessage(err, 'Delete failed. Please try again.'));
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Pages</h2>
          <span className="text-xs text-[#9ca3af]">GET /pages</span>
        </div>

        {isLoading ? <TableDotsLoader /> : null}
        {isError ? (
          <p className="text-sm text-red-600">{extractServerMessage(error, 'Failed to load pages.')}</p>
        ) : null}
        {!isLoading && !isError && total === 0 ? (
          <p className="text-sm text-[#6b7280]">No pages found.</p>
        ) : null}

        {!isLoading && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Title</th>
                    <th className="px-3 py-3 font-medium">Slug</th>
                    <th className="px-3 py-3 font-medium">Content Preview</th>
                    <th className="px-3 py-3 font-medium">Updated At</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      ref={highlightId === row.id ? highlightRef : undefined}
                      className={`border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc] ${rowHighlightClass(row.id)}`}
                    >
                      <td className="px-3 py-4 font-medium text-[#111111]">{row.title}</td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.slug}</td>
                      <td className="max-w-[280px] px-3 py-4 text-[#6b7280]">
                        <span className="line-clamp-2 whitespace-pre-wrap">
                          {(row.content ?? '').replace(/<[^>]+>/g, '').trim() || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-[#6b7280]">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-page-actions-root>
                          <button
                            ref={actionsMenuPageId === row.id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuPageId === row.id}
                            aria-haspopup="menu"
                            onClick={() =>
                              setActionsMenuPageId((current) => (current === row.id ? null : row.id))
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

            {activePageForMenu ? (
              <RowActionsFloatingMenu open triggerRef={actionsBtnRef}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleEdit(activePageForMenu)}
                  disabled={isDeleting || isUpdating}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsMenuPageId(null);
                    setDeleteTarget({ id: activePageForMenu.id, title: activePageForMenu.title });
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
                  {visiblePages.map((item, index) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${index}`} className="px-2 text-[#9ca3af]">
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
            <h3 className="text-lg font-semibold text-[#111111]">Delete page</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Delete <span className="font-semibold text-[#111111]">&quot;{deleteTarget.title}&quot;</span>?
              This cannot be undone.
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
                <h3 className="text-base font-semibold text-[#111111]">Edit Page</h3>
                <p className="mt-1 text-xs text-[#6b7280]">PATCH /pages/{editTarget.id}</p>
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
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Title <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={editForm.title}
                    maxLength={PAGE_TITLE_MAX}
                    onChange={(e) => {
                      clearEditError('title');
                      setEditForm((prev) => ({ ...prev, title: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.title))}`}
                  />
                  <FieldError message={editFieldErrors.title} />
                  <p className="text-xs text-[#9ca3af]">
                    {PAGE_TITLE_MIN} - {PAGE_TITLE_MAX} characters
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Slug</span>
                  <input
                    type="text"
                    value={editForm.slug}
                    maxLength={PAGE_SLUG_MAX}
                    onChange={(e) => {
                      clearEditError('slug');
                      setEditForm((prev) => ({ ...prev, slug: normalizeBrandSlugInput(e.target.value) }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.slug))}`}
                  />
                  <FieldError message={editFieldErrors.slug} />
                  <p className="text-xs text-[#9ca3af]">
                    Optional, {PAGE_SLUG_MIN} - {PAGE_SLUG_MAX} chars, lowercase
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta title</span>
                  <input
                    type="text"
                    value={editForm.metaTitle}
                    maxLength={BLOG_POST_META_TITLE_MAX}
                    onChange={(e) => {
                      clearEditError('meta_title');
                      setEditForm((prev) => ({ ...prev, metaTitle: e.target.value }));
                    }}
                    placeholder="SEO meta title"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.meta_title))}`}
                  />
                  <FieldError message={editFieldErrors.meta_title} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.metaTitle.trim().length}/{BLOG_POST_META_TITLE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta description</span>
                  <textarea
                    value={editForm.metaDescription}
                    maxLength={BLOG_POST_META_DESC_MAX}
                    rows={3}
                    onChange={(e) => {
                      clearEditError('meta_description');
                      setEditForm((prev) => ({ ...prev, metaDescription: e.target.value }));
                    }}
                    placeholder="SEO meta description"
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.meta_description))}`}
                  />
                  <FieldError message={editFieldErrors.meta_description} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.metaDescription.trim().length}/{BLOG_POST_META_DESC_MAX}
                  </p>
                </label>

                <DashboardRichTextEditor
                  label="Content"
                  value={editForm.content}
                  maxLength={PAGE_CONTENT_MAX}
                  error={editFieldErrors.content}
                  placeholder="Select text, then + Link → product, blog, or Website URL"
                  onChange={(html) => {
                    clearEditError('content');
                    setEditForm((prev) => ({ ...prev, content: html }));
                  }}
                />

                <div className="space-y-1.5">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Image 1</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        clearEditError('image_1');
                        clearEditError('image_url_1');
                        const file = e.target.files?.[0] ?? null;
                        setEditImage1(file);
                        if (file) setEditForm((prev) => ({ ...prev, image_url_1: '' }));
                      }}
                      className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111]"
                    />
                    <FieldError message={editFieldErrors.image_1} />
                    <input
                      type="url"
                      value={editForm.image_url_1}
                      onChange={(e) => {
                        clearEditError('image_url_1');
                        clearEditError('image_1');
                        setEditForm((prev) => ({ ...prev, image_url_1: e.target.value }));
                        if (e.target.value.trim()) setEditImage1(null);
                      }}
                      placeholder="Image URL 1 (set empty to clear)"
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.image_url_1))}`}
                    />
                    <FieldError message={editFieldErrors.image_url_1} />
                    {editImage1PreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editImage1PreviewUrl}
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
                  onClick={handleCloseEditDrawer}
                  disabled={isUpdating}
                  className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
