'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  type UpdateDashboardTestimonialPayload,
  useDeleteDashboardTestimonialMutation,
  useGetDashboardTestimonialsQuery,
  useSoftDeleteDashboardTestimonialMutation,
  useUpdateDashboardTestimonialMutation,
} from '@/app/dashboard/redux/reducers/TestimonialsSlice/TestimonialsApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import {
  fieldErrorsFromZod,
  TESTIMONIAL_NAME_MAX,
  TESTIMONIAL_QUOTE_MAX,
  TESTIMONIAL_ROLE_MAX,
  TESTIMONIAL_SORT_ORDER_MAX,
  updateTestimonialFormSchema,
} from '@/app/dashboard/_validation/dashboardForms';
import type { Testimonial } from '@/types/testimonial';

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

type TestimonialActiveSwitchProps = {
  row: Testimonial;
  disabled: boolean;
  busy: boolean;
  onToggle: (row: Testimonial) => void;
};

function TestimonialActiveSwitch({ row, disabled, busy, onToggle }: TestimonialActiveSwitchProps) {
  const on = row.isActive;
  const label = (row.name ?? 'Testimonial').replace(/\n/g, ' ').slice(0, 48);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-busy={busy}
      aria-label={on ? `Deactivate ${label}` : `Activate ${label}`}
      disabled={disabled || busy}
      onClick={() => onToggle(row)}
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
        on ? 'bg-emerald-500' : 'bg-[#d1d5db]'
      } ${disabled || busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
        aria-hidden
      />
    </button>
  );
}

export default function TestimonialsTable() {
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [editTarget, setEditTarget] = useState<Testimonial | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    quote: '',
    rating: 5,
    sort_order: 0,
    is_active: true,
    image_url: '',
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [patchPending, setPatchPending] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const queryArgs = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(activeFilter === 'active' ? { is_active: 'true' as const } : {}),
      ...(activeFilter === 'inactive' ? { is_active: 'false' as const } : {}),
    }),
    [page, activeFilter],
  );

  const { data, isLoading, isFetching, isError, error: loadError } =
    useGetDashboardTestimonialsQuery(queryArgs);
  const [updateTestimonial, { isLoading: isUpdating }] = useUpdateDashboardTestimonialMutation();
  const [softDeleteTestimonial, { isLoading: isSoftDeleting }] =
    useSoftDeleteDashboardTestimonialMutation();
  const [deleteTestimonial, { isLoading: isDeleting }] = useDeleteDashboardTestimonialMutation();

  const pagination = data?.pagination;
  const rows = data?.data ?? [];

  useEffect(() => {
    if (!pagination) return;
    if (pagination.totalPages >= 1 && page > pagination.totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync page when filter or deletes shrink total pages
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const safePage = Math.min(page, totalPages);
  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  const editPreviewUrl = useMemo(() => {
    if (!editImageFile) return null;
    return URL.createObjectURL(editImageFile);
  }, [editImageFile]);

  useEffect(() => {
    return () => {
      if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    };
  }, [editPreviewUrl]);

  useEffect(() => {
    if (!actionsMenuId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-testimonial-actions-root]')) return;
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

  const activeRowForMenu =
    actionsMenuId && rows.length > 0
      ? rows.find((r) => r.id === actionsMenuId) ?? null
      : null;

  function setRowPatchPending(id: string, pending: boolean) {
    setPatchPending((prev) => {
      if (pending) return { ...prev, [id]: true };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function clearEditError(key: string) {
    setEditFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTestimonial(deleteTarget.id).unwrap();
      toast.success(`Removed "${deleteTarget.label}".`);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete testimonial', err);
      toast.error(extractServerMessage(err, 'Delete failed. Please try again.'));
    }
  };

  const handleEdit = (row: Testimonial) => {
    setActionsMenuId(null);
    setEditTarget(row);
    setEditFieldErrors({});
    setEditForm({
      name: row.name ?? '',
      role: row.role ?? '',
      quote: row.quote ?? '',
      rating: row.rating ?? 5,
      sort_order: row.sortOrder ?? 0,
      is_active: row.isActive,
      image_url: row.imageUrl ?? '',
    });
    setEditImageFile(null);
  };

  const handleCloseEdit = () => {
    setEditTarget(null);
    setEditImageFile(null);
    setEditFieldErrors({});
  };

  const handleToggleActive = async (row: Testimonial) => {
    if (editTarget?.id === row.id) return;
    const next = !row.isActive;
    setRowPatchPending(row.id, true);
    try {
      await updateTestimonial({ id: row.id, is_active: next }).unwrap();
      toast.success(next ? 'Testimonial is now active.' : 'Testimonial is now inactive.');
    } catch (err) {
      console.error('Failed to update testimonial status', err);
      toast.error(extractServerMessage(err, 'Could not update status. Try again.'));
    } finally {
      setRowPatchPending(row.id, false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = updateTestimonialFormSchema.safeParse({
      name: editForm.name,
      role: editForm.role,
      quote: editForm.quote,
      rating: editForm.rating,
      sort_order: editForm.sort_order,
      is_active: editForm.is_active,
      image: editImageFile ?? undefined,
      image_url: editForm.image_url,
    });
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setEditFieldErrors({});
    const d = parsed.data;

    setRowPatchPending(editTarget.id, true);
    try {
      const body: UpdateDashboardTestimonialPayload = {
        id: editTarget.id,
        name: d.name,
        role: d.role,
        quote: d.quote,
        rating: d.rating,
        sort_order: d.sort_order,
        is_active: d.is_active,
      };
      if (d.image) {
        body.image = d.image;
      } else if (d.image_url.trim() !== '') {
        body.image_url = d.image_url.trim();
      }
      await updateTestimonial(body).unwrap();
      toast.success('Testimonial updated.');
      handleCloseEdit();
    } catch (err) {
      console.error('Failed to update testimonial', err);
      toast.error(extractServerMessage(err, 'Update failed. Please try again.'));
    } finally {
      setRowPatchPending(editTarget.id, false);
    }
  };

  const handleSoftDelete = async (row: Testimonial) => {
    setActionsMenuId(null);
    const label = (row.name ?? 'Testimonial').replace(/\n/g, ' ').slice(0, 40);
    const ok = window.confirm(
      `Deactivate "${label}"? It will be hidden from the site (soft delete).`,
    );
    if (!ok) return;
    try {
      await softDeleteTestimonial(row.id).unwrap();
      toast.success('Testimonial deactivated.');
    } catch (err) {
      console.error('Failed to soft-delete testimonial', err);
      toast.error(extractServerMessage(err, 'Deactivation failed. Please try again.'));
    }
  };

  const handleDeleteClick = (row: Testimonial) => {
    setActionsMenuId(null);
    const label = (row.name ?? 'Testimonial').replace(/\n/g, ' ').slice(0, 48);
    setDeleteTarget({ id: row.id, label });
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Testimonials</h2>
            <p className="text-xs text-[#9ca3af]">GET /testimonials</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#374151]">
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
              Status
            </span>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
              className="h-9 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#111111]"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </label>
        </div>

        {isLoading ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {extractServerMessage(loadError, 'Failed to load testimonials.')}
          </p>
        ) : null}

        {!isLoading && !isError && rows.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No testimonials match this filter.</p>
        ) : null}

        {!isLoading && !isError && rows.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Photo</th>
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Role</th>
                    <th className="px-3 py-3 font-medium">Quote</th>
                    <th className="px-3 py-3 font-medium">Rating</th>
                    <th className="px-3 py-3 font-medium">Sort</th>
                    <th className="px-3 py-3 font-medium">Active</th>
                    <th className="px-3 py-3 font-medium">Updated</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const img = row.imageUrl;
                    const quotePreview = (row.quote ?? '').replace(/\s+/g, ' ').slice(0, 80);
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc]"
                      >
                        <td className="px-3 py-3">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img}
                              alt=""
                              className="h-11 w-11 rounded-full border border-[#e5e7eb] object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-[#d1d5db] bg-[#f9fafb] text-[10px] text-[#9ca3af]">
                              —
                            </div>
                          )}
                        </td>
                        <td className="max-w-[140px] px-3 py-3 font-medium text-[#111111]">
                          <span className="line-clamp-2">{row.name || '—'}</span>
                        </td>
                        <td className="max-w-[120px] px-3 py-3 text-[#6b7280]">
                          <span className="line-clamp-2">{row.role || '—'}</span>
                        </td>
                        <td className="max-w-[220px] px-3 py-3 text-[#6b7280]">
                          <span className="line-clamp-2" title={row.quote}>
                            {quotePreview}
                            {(row.quote ?? '').length > 80 ? '…' : ''}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[#6b7280]">{row.rating}</td>
                        <td className="px-3 py-3 text-[#6b7280]">{row.sortOrder}</td>
                        <td className="px-3 py-3">
                          <TestimonialActiveSwitch
                            row={row}
                            busy={Boolean(patchPending[row.id])}
                            disabled={
                              isDeleting ||
                              isSoftDeleting ||
                              Boolean(editTarget && editTarget.id === row.id)
                            }
                            onToggle={(r) => {
                              void handleToggleActive(r);
                            }}
                          />
                        </td>
                        <td className="px-3 py-3 text-[#6b7280]">
                          {row.updatedAt
                            ? new Date(row.updatedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="inline-block text-left" data-testimonial-actions-root>
                            <button
                              ref={actionsMenuId === row.id ? actionsBtnRef : undefined}
                              type="button"
                              aria-expanded={actionsMenuId === row.id}
                              aria-haspopup="menu"
                              aria-label={`Actions for ${row.name || 'testimonial'}`}
                              onClick={() =>
                                setActionsMenuId((current) =>
                                  current === row.id ? null : row.id,
                                )
                              }
                              disabled={
                                isDeleting ||
                                isSoftDeleting ||
                                Boolean(patchPending[row.id])
                              }
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8fafc] disabled:opacity-50"
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {activeRowForMenu ? (
              <RowActionsFloatingMenu open triggerRef={actionsBtnRef}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleEdit(activeRowForMenu)}
                  disabled={
                    isDeleting ||
                    isSoftDeleting ||
                    Boolean(patchPending[activeRowForMenu.id])
                  }
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                {activeRowForMenu.isActive ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSoftDelete(activeRowForMenu)}
                    disabled={
                      isDeleting ||
                      isSoftDeleting ||
                      Boolean(patchPending[activeRowForMenu.id])
                    }
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                  >
                    Deactivate
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleDeleteClick(activeRowForMenu)}
                  disabled={
                    isDeleting ||
                    isSoftDeleting ||
                    Boolean(patchPending[activeRowForMenu.id])
                  }
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete permanently
                </button>
              </RowActionsFloatingMenu>
            ) : null}

            {isFetching && !isLoading ? (
              <div className="mt-2 text-center text-xs text-[#6b7280]">Updating…</div>
            ) : null}

            {totalPages > 1 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e5e5] pt-4">
                <p className="text-xs text-[#6b7280]">
                  Page {safePage} of {totalPages}
                  {pagination?.total != null ? (
                    <>
                      {' '}
                      (<span className="font-medium text-[#111111]">{pagination.total}</span> total)
                    </>
                  ) : null}
                </p>
                <nav
                  className="flex flex-wrap items-center gap-1"
                  aria-label="Testimonials pagination"
                >
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage <= 1}
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
                    onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                    disabled={safePage >= totalPages}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-sm text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} aria-hidden />
                  </button>
                </nav>
              </div>
            ) : (
              <p className="mt-4 border-t border-[#e5e5e5] pt-4 text-xs text-[#6b7280]">
                {pagination?.total ?? rows.length} testimonial
                {(pagination?.total ?? rows.length) === 1 ? '' : 's'} on this page
              </p>
            )}
          </>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete testimonial</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Remove{' '}
              <span className="font-semibold text-[#111111]">&quot;{deleteTarget.label}&quot;</span>{' '}
              permanently? This cannot be undone.
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
            onClick={handleCloseEdit}
            className="h-full flex-1 bg-black/40"
          />

          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Edit testimonial</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  PATCH /testimonials/{editTarget.id}. Leave image empty to keep the current photo;
                  set a new file or URL to replace it (not both).
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
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
                    Name <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={editForm.name}
                    maxLength={TESTIMONIAL_NAME_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.name)}
                    aria-describedby={editFieldErrors.name ? 't-edit-name-err' : undefined}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, name: e.target.value }));
                      clearEditError('name');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.name))}`}
                  />
                  <FieldError id="t-edit-name-err" message={editFieldErrors.name} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Role <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={editForm.role}
                    maxLength={TESTIMONIAL_ROLE_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.role)}
                    aria-describedby={editFieldErrors.role ? 't-edit-role-err' : undefined}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, role: e.target.value }));
                      clearEditError('role');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.role))}`}
                  />
                  <FieldError id="t-edit-role-err" message={editFieldErrors.role} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Quote <span className="text-red-600">*</span>
                  </span>
                  <textarea
                    value={editForm.quote}
                    maxLength={TESTIMONIAL_QUOTE_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.quote)}
                    aria-describedby={editFieldErrors.quote ? 't-edit-quote-err' : undefined}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, quote: e.target.value }));
                      clearEditError('quote');
                    }}
                    rows={4}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.quote))}`}
                  />
                  <FieldError id="t-edit-quote-err" message={editFieldErrors.quote} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.quote.length}/{TESTIMONIAL_QUOTE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Rating</span>
                  <select
                    value={editForm.rating}
                    aria-invalid={Boolean(editFieldErrors.rating)}
                    aria-describedby={editFieldErrors.rating ? 't-edit-rating-err' : undefined}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, rating: Number(e.target.value) }));
                      clearEditError('rating');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.rating))}`}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} star{n === 1 ? '' : 's'}
                      </option>
                    ))}
                  </select>
                  <FieldError id="t-edit-rating-err" message={editFieldErrors.rating} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Sort order</span>
                  <input
                    type="number"
                    min={0}
                    max={TESTIMONIAL_SORT_ORDER_MAX}
                    value={editForm.sort_order}
                    aria-invalid={Boolean(editFieldErrors.sort_order)}
                    aria-describedby={editFieldErrors.sort_order ? 't-edit-sort-err' : undefined}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      const next = Number.isFinite(n)
                        ? Math.min(
                            TESTIMONIAL_SORT_ORDER_MAX,
                            Math.max(0, Math.floor(n)),
                          )
                        : 0;
                      setEditForm((p) => ({ ...p, sort_order: next }));
                      clearEditError('sort_order');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.sort_order))}`}
                  />
                  <FieldError id="t-edit-sort-err" message={editFieldErrors.sort_order} />
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-[#111111]">Photo</span>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {editPreviewUrl || editTarget.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editPreviewUrl ?? editTarget.imageUrl ?? ''}
                          alt=""
                          className="h-20 w-20 rounded-full border border-[#e5e7eb] object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-[#d1d5db] bg-[#f9fafb] text-xs text-[#6b7280]">
                          No image
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    aria-invalid={Boolean(editFieldErrors.image)}
                    aria-describedby={editFieldErrors.image ? 't-edit-img-err' : undefined}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setEditImageFile(f);
                      if (f) setEditForm((p) => ({ ...p, image_url: '' }));
                      clearEditError('image');
                      clearEditError('image_url');
                    }}
                    className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
                  />
                  <FieldError id="t-edit-img-err" message={editFieldErrors.image} />
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Or image URL</span>
                  <input
                    type="url"
                    value={editForm.image_url}
                    aria-invalid={Boolean(editFieldErrors.image_url)}
                    aria-describedby={editFieldErrors.image_url ? 't-edit-url-err' : undefined}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditForm((p) => ({ ...p, image_url: v }));
                      if (v.trim() !== '') setEditImageFile(null);
                      clearEditError('image_url');
                      clearEditError('image');
                    }}
                    placeholder="https://..."
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.image_url))}`}
                  />
                  <FieldError id="t-edit-url-err" message={editFieldErrors.image_url} />
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, is_active: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-[#d1d5db] text-[#111111] focus:ring-[#111111]"
                  />
                  <span className="text-sm font-medium text-[#111111]">Active</span>
                </label>
              </div>

              <div className="shrink-0 flex items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)]">
                <button
                  type="button"
                  onClick={handleCloseEdit}
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
