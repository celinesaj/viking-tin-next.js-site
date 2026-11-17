'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  DashboardPointOfSale,
  useDeleteDashboardPointOfSaleMutation,
  useGetDashboardPointsOfSaleQuery,
  useUpdateDashboardPointOfSaleMutation,
} from '@/app/dashboard/redux/reducers/PointOfSaleSlice/PointOfSaleApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import DashboardToggleSwitch from '@/app/dashboard/_components/DashboardToggleSwitch';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import { useDashboardTableHighlight } from '@/app/dashboard/_hooks/useDashboardTableHighlight';
import {
  fieldErrorsFromZod,
  normalizeBrandSlugInput,
  POINT_OF_SALE_DESCRIPTION_MAX,
  POINT_OF_SALE_META_DESCRIPTION_MAX,
  POINT_OF_SALE_TEXT_MAX,
  resolveOptionalSlug,
  updatePointOfSaleFormSchema,
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

export default function PointOfSaleTable() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [page, setPage] = useState(1);
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [editTarget, setEditTarget] = useState<DashboardPointOfSale | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    slug: '',
    lat: '',
    lng: '',
    phone: '',
    email: '',
    map_embedded_url: '',
    is_active: true,
    meta_title: '',
    meta_description: '',
    zone_id: '',
    short_description: '',
    full_address: '',
    phone_secondary: '',
  });
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

  const editImagePreviewUrl = useMemo(() => (editImage ? URL.createObjectURL(editImage) : null), [editImage]);
  const queryArgs = useMemo(() => ({ page, limit: PAGE_SIZE }), [page]);
  const { data, isLoading, isFetching, isError, error } = useGetDashboardPointsOfSaleQuery(queryArgs);
  const [deletePointOfSale, { isLoading: isDeleting }] = useDeleteDashboardPointOfSaleMutation();
  const [updatePointOfSale, { isLoading: isUpdating }] = useUpdateDashboardPointOfSaleMutation();

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
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  useEffect(() => {
    return () => {
      if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl);
    };
  }, [editImagePreviewUrl]);

  const rowOnPage = Boolean(highlightId && rows.some((r) => r.id === highlightId));
  const { highlightRef, rowHighlightClass } = useDashboardTableHighlight(rowOnPage);

  const activeRowForMenu = useMemo(
    () => (actionsMenuId ? rows.find((r) => r.id === actionsMenuId) ?? null : null),
    [rows, actionsMenuId],
  );

  useEffect(() => {
    if (!actionsMenuId) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-point-of-sale-actions-root]')) return;
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

  function clearEditError(key: string) {
    setEditFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const handleEdit = (row: DashboardPointOfSale) => {
    setActionsMenuId(null);
    setEditTarget(row);
    setEditImage(null);
    setEditFieldErrors({});
    setEditForm({
      title: row.title ?? '',
      slug: normalizeBrandSlugInput(row.slug ?? ''),
      lat: row.lat ?? '',
      lng: row.lng ?? '',
      phone: row.phone ?? '',
      email: row.email ?? '',
      map_embedded_url: row.mapEmbeddedUrl ?? '',
      is_active: Boolean(row.isActive),
      meta_title: row.metaTitle ?? '',
      meta_description: row.metaDescription ?? '',
      zone_id: row.zoneId ?? '',
      short_description: row.shortDescription ?? '',
      full_address: row.fullAddress ?? '',
      phone_secondary: row.phoneSecondary ?? '',
    });
  };

  const handleCloseEditDrawer = () => {
    setEditTarget(null);
    setEditImage(null);
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = updatePointOfSaleFormSchema.safeParse({
      ...editForm,
      slug: resolveOptionalSlug(editForm.slug, editForm.title),
      image: editImage ?? undefined,
    });
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setEditFieldErrors({});
    const d = parsed.data;
    try {
      await updatePointOfSale({
        id: editTarget.id,
        title: d.title,
        slug: d.slug || undefined,
        lat: String(d.lat),
        lng: String(d.lng),
        phone: d.phone,
        email: d.email,
        map_embedded_url: d.map_embedded_url,
        is_active: d.is_active,
        meta_title: d.meta_title,
        meta_description: d.meta_description,
        zone_id: d.zone_id,
        short_description: d.short_description,
        full_address: d.full_address,
        phone_secondary: d.phone_secondary,
        image: d.image,
      }).unwrap();
      toast.success(`"${d.title}" updated successfully.`);
      handleCloseEditDrawer();
    } catch (err) {
      console.error('Failed to update point of sale', err);
      toast.error(extractServerMessage(err, 'Update failed. Please try again.'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePointOfSale(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete point of sale', err);
      toast.error(extractServerMessage(err, 'Delete failed. Please try again.'));
    }
  };

  const handleToggleRowActive = async (row: DashboardPointOfSale, next: boolean) => {
    if (row.isActive === next) return;
    try {
      await updatePointOfSale({ id: row.id, is_active: next }).unwrap();
      toast.success(next ? 'Marked as active.' : 'Marked as inactive.');
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error(extractServerMessage(err, 'Could not update status.'));
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Point of Sale</h2>
          <span className="text-xs text-[#9ca3af]">GET /point-of-sale</span>
        </div>

        {isLoading ? <TableDotsLoader /> : null}
        {isError ? (
          <p className="text-sm text-red-600">{extractServerMessage(error, 'Failed to load points of sale.')}</p>
        ) : null}
        {!isLoading && !isError && total === 0 ? (
          <p className="text-sm text-[#6b7280]">No points of sale found.</p>
        ) : null}

        {!isLoading && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Title</th>
                    <th className="px-3 py-3 font-medium">Slug</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">Zone</th>
                    <th className="px-3 py-3 font-medium">Status</th>
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
                      <td className="px-3 py-4 text-[#6b7280]">{row.phone}</td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.zoneId}</td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <DashboardToggleSwitch
                            checked={row.isActive}
                            onChange={(next) => void handleToggleRowActive(row, next)}
                            disabled={isDeleting || isUpdating}
                            aria-label={`${row.title} active status`}
                          />
                          <span className="text-xs text-[#6b7280]">{row.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-[#6b7280]">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-point-of-sale-actions-root>
                          <button
                            ref={actionsMenuId === row.id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuId === row.id}
                            aria-haspopup="menu"
                            onClick={() => setActionsMenuId((current) => (current === row.id ? null : row.id))}
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
                  onClick={() => {
                    setActionsMenuId(null);
                    setDeleteTarget({ id: activeRowForMenu.id, title: activeRowForMenu.title });
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
                          item === safePage ? 'bg-[#111111] text-white' : 'text-[#374151] hover:bg-[#f3f4f6]'
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
            <h3 className="text-lg font-semibold text-[#111111]">Delete point of sale</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Delete <span className="font-semibold text-[#111111]">&quot;{deleteTarget.title}&quot;</span>? This cannot be undone.
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
                <h3 className="text-base font-semibold text-[#111111]">Edit Point of Sale</h3>
                <p className="mt-1 text-xs text-[#6b7280]">PATCH /point-of-sale/{editTarget.id}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditDrawer}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
              >
                <X size={16} />
              </button>
            </header>

            <form noValidate onSubmit={handleEditSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Title *</span>
                    <input
                      type="text"
                      value={editForm.title}
                      maxLength={POINT_OF_SALE_TEXT_MAX}
                      onChange={(e) => {
                        clearEditError('title');
                        setEditForm((prev) => ({ ...prev, title: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(editFieldErrors.title))}`}
                    />
                    <FieldError message={editFieldErrors.title} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Slug</span>
                    <input
                      type="text"
                      value={editForm.slug}
                      maxLength={POINT_OF_SALE_TEXT_MAX}
                      onChange={(e) => {
                        clearEditError('slug');
                        setEditForm((prev) => ({ ...prev, slug: normalizeBrandSlugInput(e.target.value) }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(editFieldErrors.slug))}`}
                    />
                    <FieldError message={editFieldErrors.slug} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Latitude *</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={editForm.lat}
                      onChange={(e) => {
                        clearEditError('lat');
                        setEditForm((prev) => ({ ...prev, lat: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(editFieldErrors.lat))}`}
                    />
                    <FieldError message={editFieldErrors.lat} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Longitude *</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={editForm.lng}
                      onChange={(e) => {
                        clearEditError('lng');
                        setEditForm((prev) => ({ ...prev, lng: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(editFieldErrors.lng))}`}
                    />
                    <FieldError message={editFieldErrors.lng} />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Phone *</span>
                  <input
                    type="text"
                    value={editForm.phone}
                    maxLength={POINT_OF_SALE_TEXT_MAX}
                    onChange={(e) => {
                      clearEditError('phone');
                      setEditForm((prev) => ({ ...prev, phone: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(editFieldErrors.phone))}`}
                  />
                  <FieldError message={editFieldErrors.phone} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Secondary Phone *</span>
                  <input
                    type="text"
                    value={editForm.phone_secondary}
                    maxLength={POINT_OF_SALE_TEXT_MAX}
                    onChange={(e) => {
                      clearEditError('phone_secondary');
                      setEditForm((prev) => ({ ...prev, phone_secondary: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(editFieldErrors.phone_secondary))}`}
                  />
                  <FieldError message={editFieldErrors.phone_secondary} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Email *</span>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => {
                      clearEditError('email');
                      setEditForm((prev) => ({ ...prev, email: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(editFieldErrors.email))}`}
                  />
                  <FieldError message={editFieldErrors.email} />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Zone ID *</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={editForm.zone_id}
                      onChange={(e) => {
                        clearEditError('zone_id');
                        setEditForm((prev) => ({ ...prev, zone_id: e.target.value }));
                      }}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(editFieldErrors.zone_id))}`}
                    />
                    <FieldError message={editFieldErrors.zone_id} />
                  </label>
                  <div className="flex flex-col justify-end gap-2 rounded-xl border border-[#dbe1ea] bg-white px-4 py-3">
                    <span className="text-sm font-medium text-[#111111]">Status</span>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-[#6b7280]">
                          {editForm.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <DashboardToggleSwitch
                        checked={editForm.is_active}
                        onChange={(next) => setEditForm((prev) => ({ ...prev, is_active: next }))}
                        disabled={isUpdating}
                        aria-label="Edit point of sale active status"
                      />
                    </div>
                  </div>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Map Embed URL *</span>
                  <input
                    type="url"
                    value={editForm.map_embedded_url}
                    onChange={(e) => {
                      clearEditError('map_embedded_url');
                      setEditForm((prev) => ({ ...prev, map_embedded_url: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(editFieldErrors.map_embedded_url))}`}
                  />
                  <FieldError message={editFieldErrors.map_embedded_url} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta Title *</span>
                  <input
                    type="text"
                    value={editForm.meta_title}
                    maxLength={POINT_OF_SALE_TEXT_MAX}
                    onChange={(e) => {
                      clearEditError('meta_title');
                      setEditForm((prev) => ({ ...prev, meta_title: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm ${inputBorderClass(Boolean(editFieldErrors.meta_title))}`}
                  />
                  <FieldError message={editFieldErrors.meta_title} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta Description *</span>
                  <textarea
                    value={editForm.meta_description}
                    maxLength={POINT_OF_SALE_META_DESCRIPTION_MAX}
                    rows={3}
                    onChange={(e) => {
                      clearEditError('meta_description');
                      setEditForm((prev) => ({ ...prev, meta_description: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm ${inputBorderClass(Boolean(editFieldErrors.meta_description))}`}
                  />
                  <FieldError message={editFieldErrors.meta_description} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Short Description *</span>
                  <textarea
                    value={editForm.short_description}
                    maxLength={POINT_OF_SALE_DESCRIPTION_MAX}
                    rows={3}
                    onChange={(e) => {
                      clearEditError('short_description');
                      setEditForm((prev) => ({ ...prev, short_description: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm ${inputBorderClass(Boolean(editFieldErrors.short_description))}`}
                  />
                  <FieldError message={editFieldErrors.short_description} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Full Address *</span>
                  <textarea
                    value={editForm.full_address}
                    maxLength={POINT_OF_SALE_DESCRIPTION_MAX}
                    rows={3}
                    onChange={(e) => {
                      clearEditError('full_address');
                      setEditForm((prev) => ({ ...prev, full_address: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm ${inputBorderClass(Boolean(editFieldErrors.full_address))}`}
                  />
                  <FieldError message={editFieldErrors.full_address} />
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-[#111111]">Replace Image (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      clearEditError('image');
                      setEditImage(e.target.files?.[0] ?? null);
                    }}
                    className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111]"
                  />
                  <FieldError message={editFieldErrors.image} />
                  {editImagePreviewUrl || editTarget.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editImagePreviewUrl ?? editTarget.imageUrl ?? ''}
                      alt="Point of sale preview"
                      className="h-28 w-full rounded-lg border border-[#e5e7eb] object-cover"
                    />
                  ) : null}
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
