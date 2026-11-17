'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  useGetDashboardContactInfoQuery,
  useDeleteDashboardContactInfoMutation,
  useUpdateDashboardContactInfoMutation,
} from '@/app/dashboard/redux/reducers/ContactInfoSlice/ContactInfoApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import {
  CONTACT_INFO_TITLE_MAX,
  CONTACT_INFO_TYPE_MAX,
  CONTACT_INFO_VALUE_MAX,
  fieldErrorsFromZod,
  updateContactInfoFormSchema,
} from '@/app/dashboard/_validation/dashboardForms';
import type { ContactInfoApiRow } from '@/types/contact';

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

export default function ContactInfoTable() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    setPage(1);
  }, [typeFilter]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: loadError,
  } = useGetDashboardContactInfoQuery({
    page,
    limit: PAGE_SIZE,
    type: typeFilter.trim() || undefined,
  });

  const [deleteRow, { isLoading: isDeleting }] = useDeleteDashboardContactInfoMutation();
  const [updateRow, { isLoading: isUpdating }] = useUpdateDashboardContactInfoMutation();

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [editTarget, setEditTarget] = useState<ContactInfoApiRow | null>(null);
  const [editForm, setEditForm] = useState({
    type: '',
    title: '',
    value: '',
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
      if (target.closest('[data-contact-actions-root]')) return;
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

  const handleDelete = (id: string, title: string) => {
    setActionsMenuId(null);
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRow(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.title}" deleted successfully.`);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete contact info', error);
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

  const handleEdit = (row: ContactInfoApiRow) => {
    setActionsMenuId(null);
    setEditTarget(row);
    setEditFieldErrors({});
    setEditForm({
      type: row.type ?? '',
      title: row.title ?? '',
      value: row.value ?? '',
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

    const parsed = updateContactInfoFormSchema.safeParse({
      type: editForm.type,
      title: editForm.title,
      value: editForm.value,
      sortOrder: editForm.sortOrder,
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
        type: d.type,
        title: d.title,
        value: d.value,
        sortOrder: d.sortOrder,
      }).unwrap();
      toast.success(`"${d.title}" updated successfully.`);
      handleCloseEditDrawer();
    } catch (error) {
      console.error('Failed to update contact info', error);
      toast.error(extractServerMessage(error, 'Update failed. Please try again.'));
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Contact info</h2>
            <p className="mt-0.5 text-xs text-[#9ca3af]">GET /contact-info</p>
          </div>
          <label className="flex w-full max-w-xs flex-col gap-1 sm:items-end">
            <span className="text-xs font-medium text-[#6b7280]">Filter by type (exact)</span>
            <input
              type="text"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="e.g. phone"
              className="h-9 w-full rounded-lg border border-[#dbe1ea] bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] sm:max-w-[220px]"
            />
          </label>
        </div>

        {showLoader ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {extractServerMessage(loadError, 'Failed to load contact info.')}
          </p>
        ) : null}

        {!showLoader && !isError && total === 0 ? (
          <p className="text-sm text-[#6b7280]">No contact info rows found.</p>
        ) : null}

        {!showLoader && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Title</th>
                    <th className="px-3 py-3 font-medium">Value</th>
                    <th className="px-3 py-3 font-medium">Sort</th>
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
                      <td className="px-3 py-4 font-medium text-[#111111]">{row.type}</td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.title}</td>
                      <td className="max-w-[280px] px-3 py-4 text-[#6b7280]">
                        <span className="line-clamp-3 whitespace-pre-wrap wrap-break-word">
                          {row.value}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.sortOrder}</td>
                      <td className="px-3 py-4 text-[#6b7280]">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-contact-actions-root>
                          <button
                            ref={actionsMenuId === row.id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuId === row.id}
                            aria-haspopup="menu"
                            aria-label={`Actions for ${row.title}`}
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
                  onClick={() => handleDelete(activeRowForMenu.id, activeRowForMenu.title)}
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
                  aria-label="Contact info pagination"
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
            <h3 className="text-lg font-semibold text-[#111111]">Delete contact info</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#111111]">&quot;{deleteTarget.title}&quot;</span>?
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
                <h3 className="text-base font-semibold text-[#111111]">Edit contact info</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Types such as phone, email, or address (shown on the public contact page).
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
                    Type <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={editForm.type}
                    maxLength={CONTACT_INFO_TYPE_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.type)}
                    aria-describedby={editFieldErrors.type ? 'contact-edit-type-err' : undefined}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, type: event.target.value }));
                      clearEditError('type');
                    }}
                    placeholder="e.g. phone"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.type))}`}
                  />
                  <FieldError id="contact-edit-type-err" message={editFieldErrors.type} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.type.trim().length}/{CONTACT_INFO_TYPE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Title <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={editForm.title}
                    maxLength={CONTACT_INFO_TITLE_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.title)}
                    aria-describedby={editFieldErrors.title ? 'contact-edit-title-err' : undefined}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, title: event.target.value }));
                      clearEditError('title');
                    }}
                    placeholder="e.g. Customer support"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.title))}`}
                  />
                  <FieldError id="contact-edit-title-err" message={editFieldErrors.title} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.title.trim().length}/{CONTACT_INFO_TITLE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Value <span className="text-red-600">*</span>
                  </span>
                  <textarea
                    value={editForm.value}
                    maxLength={CONTACT_INFO_VALUE_MAX}
                    rows={3}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.value)}
                    aria-describedby={editFieldErrors.value ? 'contact-edit-value-err' : undefined}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, value: event.target.value }));
                      clearEditError('value');
                    }}
                    placeholder="Phone number, email, or multi-line text"
                    className={`min-h-[88px] w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.value))}`}
                  />
                  <FieldError id="contact-edit-value-err" message={editFieldErrors.value} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.value.trim().length}/{CONTACT_INFO_VALUE_MAX}
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
                      editFieldErrors.sortOrder ? 'contact-edit-sort-err' : undefined
                    }
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, sortOrder: event.target.value }));
                      clearEditError('sortOrder');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.sortOrder))}`}
                  />
                  <FieldError id="contact-edit-sort-err" message={editFieldErrors.sortOrder} />
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
