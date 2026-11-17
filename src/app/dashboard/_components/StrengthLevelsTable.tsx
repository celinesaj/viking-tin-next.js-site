'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  useGetDashboardStrengthLevelsQuery,
  useLazyGetDashboardStrengthLevelsQuery,
  useDeleteDashboardStrengthLevelMutation,
  useUpdateDashboardStrengthLevelMutation,
} from '@/app/dashboard/redux/reducers/StrengthLevelsSlice/StrengthLevelsApiSlice';
import { findPaginatedPageForId } from '@/app/dashboard/_lib/findPaginatedPageForId';
import { useDashboardTableHighlight } from '@/app/dashboard/_hooks/useDashboardTableHighlight';
import FieldError from '@/app/dashboard/_components/FieldError';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import {
  STRENGTH_LEVEL_NAME_MAX,
  STRENGTH_LEVEL_SLUG_MAX,
  STRENGTH_LEVEL_SLUG_MIN,
  STRENGTH_LEVEL_SORT_MAX,
  STRENGTH_LEVEL_NAME_MIN,
  fieldErrorsFromZod,
  normalizeBrandSlugInput,
  resolveOptionalSlug,
  updateStrengthLevelFormSchema,
} from '@/app/dashboard/_validation/dashboardForms';
import type { StrengthLevel } from '@/types/strength-lvl';

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

export default function StrengthLevelsTable() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [page, setPage] = useState(1);
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: loadError,
  } = useGetDashboardStrengthLevelsQuery({ page, limit: PAGE_SIZE });
  const [triggerPageLookup] = useLazyGetDashboardStrengthLevelsQuery();
  const [deleteStrengthLevel, { isLoading: isDeleting }] =
    useDeleteDashboardStrengthLevelMutation();
  const [updateStrengthLevel, { isLoading: isUpdating }] =
    useUpdateDashboardStrengthLevelMutation();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<StrengthLevel | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    sortOrder: '0',
  });
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);

  const pagination = data?.pagination;
  const rows = data?.data ?? [];
  const activeRowForMenu = useMemo(
    () => (actionsMenuId ? rows.find((r) => r.id === actionsMenuId) ?? null : null),
    [rows, actionsMenuId],
  );
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);

  const rowOnPage = Boolean(highlightId && rows.some((r) => r.id === highlightId));
  const { highlightRef, rowHighlightClass } = useDashboardTableHighlight(rowOnPage);

  useEffect(() => {
    if (!highlightId) return;
    let cancelled = false;
    void (async () => {
      const found = await findPaginatedPageForId(highlightId, async (p) => {
        const res = await triggerPageLookup({ page: p, limit: PAGE_SIZE }).unwrap();
        return {
          data: res.data,
          totalPages: Math.max(1, res.pagination?.totalPages ?? 1),
        };
      });
      if (!cancelled && found != null) setPage(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [highlightId, triggerPageLookup]);

  useEffect(() => {
    if (!pagination) return;
    if (pagination.totalPages >= 1 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  useEffect(() => {
    if (!actionsMenuId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-strength-actions-root]')) return;
      if (target.closest(ROW_ACTIONS_PORTAL_SELECTOR)) return;
      setActionsMenuId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActionsMenuId(null);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsMenuId]);

  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  const rangeLabel = useMemo(() => {
    if (!pagination || rows.length === 0) return { start: 0, end: 0 };
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = start + rows.length - 1;
    return { start, end };
  }, [pagination, rows.length]);

  const handleDelete = (id: string, name: string) => {
    setActionsMenuId(null);
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStrengthLevel(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete strength level', error);
      toast.error(extractServerMessage(error, 'Delete failed. Please try again.'));
    }
  };

  function clearEditError(key: string) {
    setEditFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const handleEdit = (row: StrengthLevel) => {
    setActionsMenuId(null);
    setEditTarget(row);
    setEditFieldErrors({});
    setEditForm({
      name: row.name ?? '',
      slug: normalizeBrandSlugInput(row.slug ?? ''),
      sortOrder: String(row.sortOrder ?? 0),
    });
  };

  const handleCloseEditDrawer = () => {
    setEditTarget(null);
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = updateStrengthLevelFormSchema.safeParse({
      name: editForm.name,
      slug: resolveOptionalSlug(editForm.slug, editForm.name),
      sortOrder: editForm.sortOrder,
    });
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setEditFieldErrors({});
    const d = parsed.data;

    try {
      await updateStrengthLevel({
        id: editTarget.id,
        name: d.name,
        slug: d.slug,
        sortOrder: d.sortOrder,
      }).unwrap();
      toast.success(`"${d.name}" updated successfully.`);
      handleCloseEditDrawer();
    } catch (error) {
      console.error('Failed to update strength level', error);
      toast.error(extractServerMessage(error, 'Update failed. Please try again.'));
    }
  };

  const showLoader = isLoading || (isFetching && !data);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Strength levels</h2>
          <span className="text-xs text-[#9ca3af]">GET /strength-levels</span>
        </div>

        {showLoader ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {extractServerMessage(loadError, 'Failed to load strength levels.')}
          </p>
        ) : null}

        {!showLoader && !isError && total === 0 ? (
          <p className="text-sm text-[#6b7280]">No strength levels found.</p>
        ) : null}

        {!showLoader && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Slug</th>
                    <th className="px-3 py-3 font-medium">Sort</th>
                    <th className="px-3 py-3 font-medium">Updated</th>
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
                      <td className="px-3 py-4 font-medium text-[#111111]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-[#eef2f7] text-xs font-semibold uppercase text-[#4b5563]">
                            {row.name?.[0] ?? 'S'}
                          </div>
                          <span>{row.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.slug}</td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.sortOrder}</td>
                      <td className="px-3 py-4 text-[#6b7280]">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-strength-actions-root>
                          <button
                            ref={actionsMenuId === row.id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuId === row.id}
                            aria-haspopup="menu"
                            aria-label={`Actions for ${row.name}`}
                            onClick={() =>
                              setActionsMenuId((current) => (current === row.id ? null : row.id))
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

            {activeRowForMenu ? (
              <RowActionsFloatingMenu open triggerRef={actionsBtnRef}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleEdit(activeRowForMenu)}
                  disabled={isDeleting || isUpdating}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleDelete(activeRowForMenu.id, activeRowForMenu.name)}
                  disabled={isDeleting || isUpdating}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </RowActionsFloatingMenu>
            ) : null}

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-[#e5e5e5] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#6b7280]">
                  Showing{' '}
                  <span className="font-medium text-[#111111]">
                    {rangeLabel.start}–{rangeLabel.end}
                  </span>{' '}
                  of <span className="font-medium text-[#111111]">{total}</span>
                </p>
                <nav
                  className="flex flex-wrap items-center justify-end gap-1"
                  aria-label="Strength levels pagination"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => {
                        const current = Math.min(Math.max(1, p), totalPages);
                        return Math.max(1, current - 1);
                      })
                    }
                    disabled={safePage <= 1 || isFetching}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-sm text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} aria-hidden />
                    Prev
                  </button>
                  <div className="flex flex-wrap items-center gap-1">
                    {visiblePages.map((item, index) =>
                      item === 'ellipsis' ? (
                        <span
                          key={`e-${index}`}
                          className="px-2 text-sm text-[#9ca3af]"
                          aria-hidden
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPage(item)}
                          disabled={isFetching}
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition-colors ${
                            item === safePage
                              ? 'border-[#111111] bg-[#111111] text-white'
                              : 'border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f8fafc]'
                          }`}
                          aria-current={item === safePage ? 'page' : undefined}
                        >
                          {item}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => {
                        const current = Math.min(Math.max(1, p), totalPages);
                        return Math.min(totalPages, current + 1);
                      })
                    }
                    disabled={safePage >= totalPages || isFetching}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-sm text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} aria-hidden />
                  </button>
                </nav>
              </div>
            ) : (
              <p className="border-t border-[#e5e5e5] pt-4 text-xs text-[#6b7280]">
                {total} strength level{total === 1 ? '' : 's'} total
              </p>
            )}
          </div>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete strength level</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#111111]">&quot;{deleteTarget.name}&quot;</span>?
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

          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Edit strength level</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Name {STRENGTH_LEVEL_NAME_MIN}–{STRENGTH_LEVEL_NAME_MAX} chars; slug{' '}
                  {STRENGTH_LEVEL_SLUG_MIN}–{STRENGTH_LEVEL_SLUG_MAX} (a–z, 0–9, hyphens).
                </p>
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
                  <span className="text-sm font-medium text-[#111111]">Name</span>
                  <input
                    type="text"
                    value={editForm.name}
                    maxLength={STRENGTH_LEVEL_NAME_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.name)}
                    aria-describedby={editFieldErrors.name ? 'strength-edit-name-err' : undefined}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, name: event.target.value }));
                      clearEditError('name');
                    }}
                    placeholder="Level name"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.name))}`}
                  />
                  <FieldError id="strength-edit-name-err" message={editFieldErrors.name} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.name.trim().length}/{STRENGTH_LEVEL_NAME_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Slug</span>
                  <input
                    type="text"
                    value={editForm.slug}
                    maxLength={STRENGTH_LEVEL_SLUG_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.slug)}
                    aria-describedby={editFieldErrors.slug ? 'strength-edit-slug-err' : undefined}
                    onChange={(event) => {
                      setEditForm((prev) => ({
                        ...prev,
                        slug: normalizeBrandSlugInput(event.target.value),
                      }));
                      clearEditError('slug');
                    }}
                    placeholder="slug"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.slug))}`}
                  />
                  <FieldError id="strength-edit-slug-err" message={editFieldErrors.slug} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.slug.length}/{STRENGTH_LEVEL_SLUG_MAX} (min {STRENGTH_LEVEL_SLUG_MIN})
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Sort order</span>
                  <input
                    type="number"
                    min={0}
                    max={STRENGTH_LEVEL_SORT_MAX}
                    value={editForm.sortOrder}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.sortOrder)}
                    aria-describedby={
                      editFieldErrors.sortOrder ? 'strength-edit-sort-err' : undefined
                    }
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, sortOrder: event.target.value }));
                      clearEditError('sortOrder');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.sortOrder))}`}
                  />
                  <FieldError id="strength-edit-sort-err" message={editFieldErrors.sortOrder} />
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
