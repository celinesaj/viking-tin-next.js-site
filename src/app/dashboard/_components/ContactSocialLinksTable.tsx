'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  useGetDashboardContactSocialLinksQuery,
  useDeleteDashboardContactSocialLinkMutation,
  useUpdateDashboardContactSocialLinkMutation,
} from '@/app/dashboard/redux/reducers/ContactSocialLinksSlice/ContactSocialLinksApiSlice';
import DashboardActiveToggle from '@/app/dashboard/_components/DashboardActiveToggle';
import FieldError from '@/app/dashboard/_components/FieldError';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import {
  CONTACT_SOCIAL_PLATFORM_MAX,
  CONTACT_SOCIAL_URL_MAX,
  fieldErrorsFromZod,
  updateContactSocialLinkFormSchema,
} from '@/app/dashboard/_validation/dashboardForms';
import type { ContactSocialLinkApiRow } from '@/types/contact';

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

type ActiveFilter = 'all' | 'active' | 'inactive';

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

export default function ContactSocialLinksTable() {
  const [page, setPage] = useState(1);
  const [platformFilter, setPlatformFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  useEffect(() => {
    setPage(1);
  }, [platformFilter, activeFilter]);

  const isActiveQuery =
    activeFilter === 'all' ? undefined : activeFilter === 'active';

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: loadError,
  } = useGetDashboardContactSocialLinksQuery({
    page,
    limit: PAGE_SIZE,
    ...(isActiveQuery !== undefined ? { isActive: isActiveQuery } : {}),
    platform: platformFilter.trim() || undefined,
  });

  const [deleteRow, { isLoading: isDeleting }] = useDeleteDashboardContactSocialLinkMutation();
  const [updateRow, { isLoading: isUpdating }] = useUpdateDashboardContactSocialLinkMutation();

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; platform: string } | null>(
    null,
  );
  const [editTarget, setEditTarget] = useState<ContactSocialLinkApiRow | null>(null);
  const [editForm, setEditForm] = useState({
    platform: '',
    url: '',
    sortOrder: '0',
    isActive: true,
  });
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [patchPending, setPatchPending] = useState<Record<string, boolean>>({});
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);

  function setRowPatchPending(id: string, pending: boolean) {
    setPatchPending((prev) => ({ ...prev, [id]: pending }));
  }

  const pagination = data?.pagination;
  const rows = data?.data ?? [];
  const activeRowForMenu = useMemo(
    () => (actionsMenuId ? rows.find((r) => r.id === actionsMenuId) ?? null : null),
    [rows, actionsMenuId],
  );
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);

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
      if (target.closest('[data-social-links-actions-root]')) return;
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

  const showLoader = isLoading || (isFetching && !data);

  const handleDelete = (id: string, platform: string) => {
    setActionsMenuId(null);
    setDeleteTarget({ id, platform });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRow(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.platform}" deleted successfully.`);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete contact social link', error);
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

  const handleEdit = (row: ContactSocialLinkApiRow) => {
    setActionsMenuId(null);
    setEditTarget(row);
    setEditFieldErrors({});
    setEditForm({
      platform: row.platform ?? '',
      url: row.url ?? '',
      sortOrder: String(row.sortOrder ?? 0),
      isActive: Boolean(row.isActive),
    });
  };

  const handleCloseEditDrawer = () => {
    setEditTarget(null);
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = updateContactSocialLinkFormSchema.safeParse({
      platform: editForm.platform,
      url: editForm.url,
      sortOrder: editForm.sortOrder,
      isActive: editForm.isActive,
    });
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setEditFieldErrors({});
    const d = parsed.data;

    try {
      await updateRow({
        id: editTarget.id,
        platform: d.platform,
        url: d.url,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
      }).unwrap();
      toast.success(`"${d.platform}" updated successfully.`);
      handleCloseEditDrawer();
    } catch (error) {
      console.error('Failed to update contact social link', error);
      toast.error(extractServerMessage(error, 'Update failed. Please try again.'));
    }
  };

  const handleToggleActive = async (row: ContactSocialLinkApiRow) => {
    if (editTarget?.id === row.id) return;
    const next = !row.isActive;
    setRowPatchPending(row.id, true);
    try {
      await updateRow({
        id: row.id,
        platform: row.platform,
        url: row.url,
        sortOrder: row.sortOrder,
        isActive: next,
      }).unwrap();
      toast.success(
        next ? `"${row.platform}" is now active.` : `"${row.platform}" is now inactive.`,
      );
    } catch (error) {
      console.error('Failed to toggle social link active state', error);
      toast.error(extractServerMessage(error, 'Could not update status. Try again.'));
    } finally {
      setRowPatchPending(row.id, false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Contact social links</h2>
            <p className="mt-0.5 text-xs text-[#9ca3af]">GET /contact-social-links</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-end lg:max-w-xl">
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <span className="text-xs font-medium text-[#6b7280]">Status</span>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter by active status"
              >
                {(
                  [
                    { key: 'all' as const, label: 'All' },
                    { key: 'active' as const, label: 'Active' },
                    { key: 'inactive' as const, label: 'Inactive' },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveFilter(key)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      activeFilter === key
                        ? 'bg-[#111111] text-white'
                        : 'border border-[#e5e7eb] bg-white text-[#1e3a8a] hover:bg-[#f8fafc]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-[#6b7280]">
                Filter by platform (exact)
              </span>
              <input
                type="text"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                placeholder="e.g. Instagram"
                className="h-9 w-full rounded-lg border border-[#dbe1ea] bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111]"
              />
            </label>
          </div>
        </div>

        {showLoader ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {extractServerMessage(loadError, 'Failed to load social links.')}
          </p>
        ) : null}

        {!showLoader && !isError && total === 0 ? (
          <p className="text-sm text-[#6b7280]">No social links found.</p>
        ) : null}

        {!showLoader && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Platform</th>
                    <th className="px-3 py-3 font-medium">URL</th>
                    <th className="px-3 py-3 font-medium">Sort</th>
                    <th className="px-3 py-3 font-medium">Active</th>
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
                      <td className="px-3 py-4 font-medium text-[#111111]">{row.platform}</td>
                      <td className="max-w-[280px] px-3 py-4 text-[#6b7280]">
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="line-clamp-2 break-all text-[#2563eb] underline-offset-2 hover:underline"
                        >
                          {row.url}
                        </a>
                      </td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.sortOrder}</td>
                      <td className="px-3 py-4">
                        <DashboardActiveToggle
                          checked={row.isActive}
                          onCheckedChange={() => void handleToggleActive(row)}
                          disabled={isDeleting || isUpdating}
                          busy={Boolean(patchPending[row.id])}
                          aria-label={
                            row.isActive
                              ? `Deactivate ${row.platform}`
                              : `Activate ${row.platform}`
                          }
                        />
                      </td>
                      <td className="px-3 py-4 text-[#6b7280]">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-social-links-actions-root>
                          <button
                            ref={actionsMenuId === row.id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuId === row.id}
                            aria-haspopup="menu"
                            aria-label={`Actions for ${row.platform}`}
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
                  onClick={() => handleDelete(activeRowForMenu.id, activeRowForMenu.platform)}
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
                  aria-label="Social links pagination"
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
                {total} row{total === 1 ? '' : 's'} total
              </p>
            )}
          </div>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete social link</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#111111]">
                &quot;{deleteTarget.platform}&quot;
              </span>
              ?
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
                <h3 className="text-base font-semibold text-[#111111]">Edit social link</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Update platform label, URL, sort order, and visibility on the contact page.
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
                  <span className="text-sm font-medium text-[#111111]">
                    Platform <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={editForm.platform}
                    maxLength={CONTACT_SOCIAL_PLATFORM_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.platform)}
                    aria-describedby={
                      editFieldErrors.platform ? 'social-edit-platform-err' : undefined
                    }
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, platform: event.target.value }));
                      clearEditError('platform');
                    }}
                    placeholder="e.g. Instagram"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.platform))}`}
                  />
                  <FieldError id="social-edit-platform-err" message={editFieldErrors.platform} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.platform.trim().length}/{CONTACT_SOCIAL_PLATFORM_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    URL <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="url"
                    value={editForm.url}
                    maxLength={CONTACT_SOCIAL_URL_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.url)}
                    aria-describedby={editFieldErrors.url ? 'social-edit-url-err' : undefined}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, url: event.target.value }));
                      clearEditError('url');
                    }}
                    placeholder="https://instagram.com/yourbrand"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.url))}`}
                  />
                  <FieldError id="social-edit-url-err" message={editFieldErrors.url} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.url.trim().length}/{CONTACT_SOCIAL_URL_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Sort order <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={editForm.sortOrder}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.sortOrder)}
                    aria-describedby={
                      editFieldErrors.sortOrder ? 'social-edit-sort-err' : undefined
                    }
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, sortOrder: event.target.value }));
                      clearEditError('sortOrder');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.sortOrder))}`}
                  />
                  <FieldError id="social-edit-sort-err" message={editFieldErrors.sortOrder} />
                </label>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-3">
                  <span className="text-sm font-medium text-[#111111]">Active (visible on site)</span>
                  <DashboardActiveToggle
                    checked={editForm.isActive}
                    onCheckedChange={(next) => {
                      setEditForm((prev) => ({ ...prev, isActive: next }));
                      clearEditError('isActive');
                    }}
                    disabled={isUpdating}
                    aria-label={
                      editForm.isActive ? 'Deactivate on public site' : 'Activate on public site'
                    }
                  />
                </div>
                <FieldError id="social-edit-active-err" message={editFieldErrors.isActive} />
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
