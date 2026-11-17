'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  useDeleteDashboardBlogCategoryMutation,
  useGetDashboardBlogCategoriesQuery,
  useUpdateDashboardBlogCategoryMutation,
} from '@/app/dashboard/redux/reducers/BlogCategoriesSlice/BlogCategoriesApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
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
import type { BlogCategory } from '@/types/blog';

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

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
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

const PAGE_SIZE = 10;

export default function BlogCategoriesTable() {
  const { data: categories = [], isLoading, isError, error } = useGetDashboardBlogCategoriesQuery();
  const [page, setPage] = useState(1);
  const [actionsMenuCategoryId, setActionsMenuCategoryId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [editTarget, setEditTarget] = useState<BlogCategory | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '' });
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const [updateCategory, { isLoading: isUpdating }] = useUpdateDashboardBlogCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteDashboardBlogCategoryMutation();

  const total = categories.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const rows = useMemo(
    () => categories.slice(pageStart, pageStart + PAGE_SIZE),
    [categories, pageStart],
  );
  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  const activeCategoryForMenu =
    actionsMenuCategoryId && rows.length > 0
      ? rows.find((r) => r.id === actionsMenuCategoryId) ?? null
      : null;

  useEffect(() => {
    if (!actionsMenuCategoryId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-blog-category-actions-root]')) return;
      if (target.closest(ROW_ACTIONS_PORTAL_SELECTOR)) return;
      setActionsMenuCategoryId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActionsMenuCategoryId(null);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsMenuCategoryId]);

  function clearEditError(key: string) {
    setEditFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const handleEdit = (category: BlogCategory) => {
    setActionsMenuCategoryId(null);
    setEditTarget(category);
    setEditFieldErrors({});
    setEditForm({
      name: category.name ?? '',
      slug: normalizeBrandSlugInput(category.slug ?? ''),
      description: category.description ?? '',
    });
  };

  const handleCloseEditDrawer = () => {
    setEditTarget(null);
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = createBlogCategoryFormSchema.safeParse({
      name: editForm.name,
      slug: resolveOptionalSlug(editForm.slug, editForm.name),
      description: editForm.description,
    });
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setEditFieldErrors({});
    const { name, slug, description } = parsed.data;

    try {
      await updateCategory({
        id: editTarget.id,
        name,
        slug: slug || undefined,
        description: description || undefined,
      }).unwrap();
      toast.success('Category updated.');
      handleCloseEditDrawer();
    } catch (err) {
      console.error('Failed to update blog category', err);
      toast.error(extractServerMessage(err, 'Update failed. Please try again.'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete blog category', err);
      toast.error(extractServerMessage(err, 'Delete failed. Please try again.'));
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        <ToastContainer position="top-right" theme="colored" />

        <div className="border-b border-[#e5e7eb] px-4 py-3 sm:px-6">
          <p className="text-sm text-[#6b7280]">
            {isLoading ? 'Loading categories…' : `${total} categor${total === 1 ? 'y' : 'ies'}`}
          </p>
        </div>

        {isError ? (
          <div className="p-6 text-sm text-red-600">
            Failed to load categories.
            {error && typeof error === 'object' && 'status' in error
              ? ` (${String((error as { status: unknown }).status)})`
              : ''}
          </div>
        ) : isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center py-12">
            <TableDotsLoader />
          </div>
        ) : total === 0 ? (
          <div className="p-8 text-center text-sm text-[#6b7280]">
            No categories yet. Create one to assign posts.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#f9fafb] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  <tr>
                    <th className="px-4 py-3 sm:px-6">Name</th>
                    <th className="px-4 py-3 sm:px-6">Slug</th>
                    <th className="hidden px-4 py-3 md:table-cell sm:px-6">Description</th>
                    <th className="hidden px-4 py-3 lg:table-cell sm:px-6">Updated</th>
                    <th className="px-4 py-3 text-right sm:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {rows.map((row) => (
                    <tr key={row.id} className="bg-white hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-medium text-[#111111] sm:px-6">
                        {displayText(row.name)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#4b5563] sm:px-6">
                        {displayText(row.slug)}
                      </td>
                      <td className="hidden max-w-xs px-4 py-3 text-[#4b5563] md:table-cell sm:px-6">
                        {truncate(displayText(row.description, ''), 120)}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-[#6b7280] lg:table-cell sm:px-6">
                        {row.updatedAt
                          ? new Date(row.updatedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right sm:px-6">
                        <div className="inline-block text-left" data-blog-category-actions-root>
                          <button
                            ref={actionsMenuCategoryId === row.id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuCategoryId === row.id}
                            aria-haspopup="menu"
                            aria-label={`Actions for ${row.name || 'category'}`}
                            onClick={() =>
                              setActionsMenuCategoryId((current) =>
                                current === row.id ? null : row.id,
                              )
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

            {activeCategoryForMenu ? (
              <RowActionsFloatingMenu open triggerRef={actionsBtnRef}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleEdit(activeCategoryForMenu)}
                  disabled={isDeleting || isUpdating}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsMenuCategoryId(null);
                    setDeleteTarget({
                      id: activeCategoryForMenu.id,
                      name: activeCategoryForMenu.name || 'Category',
                    });
                  }}
                  disabled={isDeleting || isUpdating}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </RowActionsFloatingMenu>
            ) : null}

            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-4 py-3 sm:px-6">
                <p className="text-xs text-[#6b7280]">
                  Page {safePage} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {visiblePages.map((item, i) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${i}`} className="px-2 text-[#9ca3af]">
                        …
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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete category</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Delete{' '}
              <span className="font-semibold text-[#111111]">&quot;{deleteTarget.name}&quot;</span>? Posts
              referencing this category may be affected.
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
                {isDeleting ? 'Deleting…' : 'Delete'}
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
          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Edit category</h3>
                <p className="mt-1 text-xs text-[#6b7280]">PATCH /blog/categories/{editTarget.id}</p>
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
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Name <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    maxLength={BLOG_CATEGORY_NAME_MAX + 20}
                    value={editForm.name}
                    onChange={(e) => {
                      clearEditError('name');
                      setEditForm((f) => ({ ...f, name: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:border-[#9ca3af] focus:outline-none ${inputBorderClass(!!editFieldErrors.name)}`}
                    aria-invalid={!!editFieldErrors.name}
                    aria-describedby={editFieldErrors.name ? 'blog-cat-edit-name-err' : undefined}
                  />
                  <FieldError id="blog-cat-edit-name-err" message={editFieldErrors.name} />
                  <p className="text-xs text-[#9ca3af]">
                    {BLOG_CATEGORY_NAME_MIN}–{BLOG_CATEGORY_NAME_MAX} characters
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Slug</span>
                  <input
                    type="text"
                    maxLength={BLOG_CATEGORY_SLUG_MAX + 20}
                    value={editForm.slug}
                    onChange={(e) => {
                      clearEditError('slug');
                      setEditForm((f) => ({ ...f, slug: normalizeBrandSlugInput(e.target.value) }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 font-mono text-sm text-[#111111] focus:border-[#9ca3af] focus:outline-none ${inputBorderClass(!!editFieldErrors.slug)}`}
                    aria-invalid={!!editFieldErrors.slug}
                    aria-describedby={editFieldErrors.slug ? 'blog-cat-edit-slug-err' : undefined}
                  />
                  <FieldError id="blog-cat-edit-slug-err" message={editFieldErrors.slug} />
                  <p className="text-xs text-[#9ca3af]">
                    Optional. {BLOG_CATEGORY_SLUG_MIN}–{BLOG_CATEGORY_SLUG_MAX} chars, lowercase and hyphens.
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Description</span>
                  <textarea
                    rows={3}
                    maxLength={BLOG_CATEGORY_DESCRIPTION_MAX + 50}
                    value={editForm.description}
                    onChange={(e) => {
                      clearEditError('description');
                      setEditForm((f) => ({ ...f, description: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#9ca3af] focus:outline-none ${inputBorderClass(!!editFieldErrors.description)}`}
                    aria-invalid={!!editFieldErrors.description}
                    aria-describedby={editFieldErrors.description ? 'blog-cat-edit-desc-err' : undefined}
                  />
                  <FieldError id="blog-cat-edit-desc-err" message={editFieldErrors.description} />
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
                  disabled={isUpdating}
                  className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
                >
                  {isUpdating ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
