'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  useGetDashboardHeroBannersQuery,
  useDeleteDashboardHeroBannerMutation,
  useSoftDeleteDashboardHeroBannerMutation,
  useUpdateDashboardHeroBannerMutation,
} from '@/app/dashboard/redux/reducers/HeroBannersSlice/HeroBannersApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import {
  fieldErrorsFromZod,
  HERO_HEADLINE_MAX,
  HERO_POSITION_MAX,
  HERO_SUBHEADLINE_MAX,
  updateHeroBannerFormSchema,
} from '@/app/dashboard/_validation/dashboardForms';
import type { HeroBanner } from '@/types/hero';
import { IMAGES } from '@/constants/images';

function extractServerMessage(error: unknown, fallbackMessage: string) {
  if (!error || typeof error !== 'object') return fallbackMessage;

  if ('data' in error) {
    const data = (error as { data?: unknown }).data;

    if (typeof data === 'string' && data.trim()) return data;

    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
  }

  return fallbackMessage;
}

function inputBorderClass(hasError: boolean) {
  return hasError ? 'border-red-500' : 'border-[#dbe1ea]';
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PAGE_SIZE = 10;

type HeroBannerActiveSwitchProps = {
  banner: HeroBanner;
  disabled: boolean;
  busy: boolean;
  onToggle: (banner: HeroBanner) => void;
};

function HeroBannerActiveSwitch({ banner, disabled, busy, onToggle }: HeroBannerActiveSwitchProps) {
  const on = banner.is_active;
  const label = (banner.headline ?? 'Banner').replace(/\n/g, ' ').slice(0, 48);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-busy={busy}
      aria-label={on ? `Deactivate ${label}` : `Activate ${label}`}
      disabled={disabled || busy}
      onClick={() => onToggle(banner)}
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

function getVisiblePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page >= 1 && page <= total) set.add(page);
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

export default function HeroBannersTable() {
  const {
    data: banners = [],
    isLoading,
    isError,
    error: loadError,
  } = useGetDashboardHeroBannersQuery();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteDashboardHeroBannerMutation();
  const [softDeleteBanner, { isLoading: isSoftDeleting }] =
    useSoftDeleteDashboardHeroBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateDashboardHeroBannerMutation();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [editTarget, setEditTarget] = useState<HeroBanner | null>(null);
  const [editForm, setEditForm] = useState({
    headline: '',
    subheadline: '',
    position: 0,
    start_date: '',
    end_date: '',
    is_active: true,
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  /** PATCH /hero-banners/:id in flight (toggle or save) — per row */
  const [heroPatchPending, setHeroPatchPending] = useState<Record<number, boolean>>({});
  const [actionsMenuId, setActionsMenuId] = useState<number | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [page, setPage] = useState(1);

  const filePreviewUrl = useMemo(() => {
    if (!editImageFile) return null;
    return URL.createObjectURL(editImageFile);
  }, [editImageFile]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  useEffect(() => {
    if (actionsMenuId === null) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-hero-actions-root]')) return;
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

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => a.position - b.position),
    [banners],
  );

  const total = sortedBanners.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginated = useMemo(
    () => sortedBanners.slice(pageStart, pageStart + PAGE_SIZE),
    [sortedBanners, pageStart],
  );
  const activeBannerForMenu = useMemo(
    () =>
      actionsMenuId ? paginated.find((b) => b.id === actionsMenuId) ?? null : null,
    [paginated, actionsMenuId],
  );
  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBanner(String(deleteTarget.id)).unwrap();
      toast.success(`Removed "${deleteTarget.label}".`);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete hero banner', error);
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

  const handleEdit = (banner: HeroBanner) => {
    setActionsMenuId(null);
    setEditTarget(banner);
    setEditFieldErrors({});
    setEditForm({
      headline: banner.headline ?? '',
      subheadline: banner.subheadline ?? '',
      position: banner.position,
      start_date: toDatetimeLocalValue(banner.start_date),
      end_date: toDatetimeLocalValue(banner.end_date),
      is_active: banner.is_active,
    });
    setEditImageFile(null);
  };

  const handleCloseEdit = () => {
    setEditTarget(null);
    setEditImageFile(null);
    setEditFieldErrors({});
  };

  function setHeroRowPatchPending(id: number, pending: boolean) {
    setHeroPatchPending((prev) => {
      if (pending) return { ...prev, [id]: true };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const handleToggleActive = async (banner: HeroBanner) => {
    if (editTarget?.id === banner.id) return;
    const next = !banner.is_active;
    setHeroRowPatchPending(banner.id, true);
    try {
      await updateBanner({ id: String(banner.id), is_active: next }).unwrap();
      toast.success(next ? 'Banner is now active.' : 'Banner is now inactive.');
    } catch (error) {
      console.error('Failed to update hero banner status', error);
      toast.error(extractServerMessage(error, 'Could not update status. Try again.'));
    } finally {
      setHeroRowPatchPending(banner.id, false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = updateHeroBannerFormSchema.safeParse({
      headline: editForm.headline,
      subheadline: editForm.subheadline,
      position: editForm.position,
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      is_active: editForm.is_active,
      image: editImageFile,
      existing_image_url: editTarget.image_url ?? '',
    });
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setEditFieldErrors({});
    const d = parsed.data;

    setHeroRowPatchPending(editTarget.id, true);
    try {
      await updateBanner({
        id: String(editTarget.id),
        headline: d.headline,
        subheadline: d.subheadline,
        position: d.position,
        start_date: d.start_date.trim() ? new Date(d.start_date).toISOString() : null,
        end_date: d.end_date.trim() ? new Date(d.end_date).toISOString() : null,
        is_active: d.is_active,
        ...(d.image ? { image: d.image } : {}),
      }).unwrap();
      toast.success('Hero banner updated.');
      handleCloseEdit();
    } catch (error) {
      console.error('Failed to update hero banner', error);
      toast.error(extractServerMessage(error, 'Update failed. Please try again.'));
    } finally {
      setHeroRowPatchPending(editTarget.id, false);
    }
  };

  const handleDelete = (banner: HeroBanner) => {
    setActionsMenuId(null);
    const label = (banner.headline ?? 'Banner').replace(/\n/g, ' ').slice(0, 48);
    setDeleteTarget({ id: banner.id, label });
  };

  const handleSoftDelete = async (banner: HeroBanner) => {
    setActionsMenuId(null);
    const label = (banner.headline ?? 'Banner').replace(/\n/g, ' ').slice(0, 40);
    const ok = window.confirm(`Deactivate "${label}"? It will be hidden from the site (soft delete).`);
    if (!ok) return;
    try {
      await softDeleteBanner(String(banner.id)).unwrap();
      toast.success('Banner deactivated.');
    } catch (error) {
      console.error('Failed to soft-delete hero banner', error);
      toast.error(extractServerMessage(error, 'Deactivation failed. Please try again.'));
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Hero banners</h2>
          <span className="text-xs text-[#9ca3af]">GET /hero-banners</span>
        </div>

        {isLoading ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {extractServerMessage(loadError, 'Failed to load hero banners.')}
          </p>
        ) : null}

        {!isLoading && !isError && sortedBanners.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No hero banners yet. Add one above.</p>
        ) : null}

        {!isLoading && !isError && sortedBanners.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Preview</th>
                    <th className="px-3 py-3 font-medium">Headline</th>
                    <th className="px-3 py-3 font-medium">Position</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Schedule</th>
                    <th className="px-3 py-3 font-medium">Updated</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((banner) => {
                    const src = banner.image_url || IMAGES.hero.main;
                    const headlinePreview = (banner.headline ?? '').replace(/\n/g, ' · ');

                    return (
                      <tr
                        key={banner.id}
                        className="border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc]"
                      >
                        <td className="px-3 py-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            className="h-12 w-20 rounded-lg border border-[#e5e7eb] object-cover"
                          />
                        </td>
                        <td className="max-w-[200px] px-3 py-3 font-medium text-[#111111]">
                          <span className="line-clamp-2">{headlinePreview || '—'}</span>
                        </td>
                        <td className="px-3 py-3 text-[#6b7280]">{banner.position}</td>
                        <td className="px-3 py-3">
                          <HeroBannerActiveSwitch
                            banner={banner}
                            busy={Boolean(heroPatchPending[banner.id])}
                            disabled={
                              isDeleting ||
                              isSoftDeleting ||
                              Boolean(editTarget && editTarget.id === banner.id)
                            }
                            onToggle={(b) => {
                              void handleToggleActive(b);
                            }}
                          />
                        </td>
                        <td className="px-3 py-3 text-xs text-[#6b7280]">
                          {banner.start_date || banner.end_date ? (
                            <span className="block">
                              {banner.start_date
                                ? new Date(banner.start_date).toLocaleString()
                                : '—'}{' '}
                              →{' '}
                              {banner.end_date
                                ? new Date(banner.end_date).toLocaleString()
                                : '—'}
                            </span>
                          ) : (
                            'Always'
                          )}
                        </td>
                        <td className="px-3 py-3 text-[#6b7280]">
                          {banner.updated_at
                            ? new Date(banner.updated_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="inline-block text-left" data-hero-actions-root>
                            <button
                              ref={actionsMenuId === banner.id ? actionsBtnRef : undefined}
                              type="button"
                              aria-expanded={actionsMenuId === banner.id}
                              aria-haspopup="menu"
                              aria-label={`Actions for banner ${banner.id}`}
                              onClick={() =>
                                setActionsMenuId((current) =>
                                  current === banner.id ? null : banner.id,
                                )
                              }
                              disabled={
                                isDeleting ||
                                isSoftDeleting ||
                                Boolean(heroPatchPending[banner.id])
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

            {activeBannerForMenu ? (
              <RowActionsFloatingMenu open triggerRef={actionsBtnRef}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleEdit(activeBannerForMenu)}
                  disabled={
                    isDeleting ||
                    isSoftDeleting ||
                    Boolean(heroPatchPending[activeBannerForMenu.id])
                  }
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                {activeBannerForMenu.is_active ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSoftDelete(activeBannerForMenu)}
                    disabled={
                      isDeleting ||
                      isSoftDeleting ||
                      Boolean(heroPatchPending[activeBannerForMenu.id])
                    }
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                  >
                    Deactivate
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleDelete(activeBannerForMenu)}
                  disabled={
                    isDeleting ||
                    isSoftDeleting ||
                    Boolean(heroPatchPending[activeBannerForMenu.id])
                  }
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete permanently
                </button>
              </RowActionsFloatingMenu>
            ) : null}

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-[#e5e5e5] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#6b7280]">
                  Showing{' '}
                  <span className="font-medium text-[#111111]">
                    {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, total)}
                  </span>{' '}
                  of <span className="font-medium text-[#111111]">{total}</span>
                </p>
                <nav
                  className="flex flex-wrap items-center justify-end gap-1"
                  aria-label="Hero banners pagination"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => {
                        const current = Math.min(Math.max(1, p), totalPages);
                        return Math.max(1, current - 1);
                      })
                    }
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
                    onClick={() =>
                      setPage((p) => {
                        const current = Math.min(Math.max(1, p), totalPages);
                        return Math.min(totalPages, current + 1);
                      })
                    }
                    disabled={safePage >= totalPages}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-sm text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} aria-hidden />
                  </button>
                </nav>
              </div>
            ) : (
              <p className="border-t border-[#e5e5e5] pt-4 text-xs text-[#6b7280]">
                {total} banner{total === 1 ? '' : 's'} total
              </p>
            )}
          </div>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete hero banner</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Remove this banner from the site carousel?{' '}
              <span className="font-semibold text-[#111111]">&quot;{deleteTarget.label}&quot;</span>
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
            onClick={handleCloseEdit}
            className="h-full flex-1 bg-black/40"
          />

          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Edit hero banner</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Headline and subheadline are optional (max {HERO_HEADLINE_MAX} /{' '}
                  {HERO_SUBHEADLINE_MAX}). Position 0–{HERO_POSITION_MAX}. Upload a new image only to
                  replace the current one (max 5 MB). End ≥ start when both dates are set.
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
                    Headline <span className="font-normal text-[#6b7280]">(optional)</span>
                  </span>
                  <textarea
                    value={editForm.headline}
                    maxLength={HERO_HEADLINE_MAX}
                    aria-invalid={Boolean(editFieldErrors.headline)}
                    aria-describedby={editFieldErrors.headline ? 'hero-edit-headline-err' : undefined}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, headline: e.target.value }));
                      clearEditError('headline');
                    }}
                    rows={3}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.headline))}`}
                  />
                  <FieldError id="hero-edit-headline-err" message={editFieldErrors.headline} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.headline.length}/{HERO_HEADLINE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Subheadline <span className="font-normal text-[#6b7280]">(optional)</span>
                  </span>
                  <textarea
                    value={editForm.subheadline}
                    maxLength={HERO_SUBHEADLINE_MAX}
                    aria-invalid={Boolean(editFieldErrors.subheadline)}
                    aria-describedby={
                      editFieldErrors.subheadline ? 'hero-edit-sub-err' : undefined
                    }
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, subheadline: e.target.value }));
                      clearEditError('subheadline');
                    }}
                    rows={2}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.subheadline))}`}
                  />
                  <FieldError id="hero-edit-sub-err" message={editFieldErrors.subheadline} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.subheadline.length}/{HERO_SUBHEADLINE_MAX}
                  </p>
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-[#111111]">
                    Image
                    {editTarget.image_url?.trim() ? null : (
                      <span className="text-red-600"> *</span>
                    )}
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {filePreviewUrl || editTarget.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={filePreviewUrl ?? editTarget.image_url ?? ''}
                          alt=""
                          className="h-20 w-32 rounded-lg border border-[#e5e7eb] object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-[#d1d5db] bg-[#f9fafb] text-xs text-[#6b7280]">
                          No image
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    aria-required={!editTarget.image_url?.trim()}
                    aria-invalid={Boolean(editFieldErrors.image)}
                    aria-describedby={editFieldErrors.image ? 'hero-edit-image-err' : undefined}
                    onChange={(e) => {
                      setEditImageFile(e.target.files?.[0] ?? null);
                      clearEditError('image');
                    }}
                    className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
                  />
                  <FieldError id="hero-edit-image-err" message={editFieldErrors.image} />
                  <p className="text-xs text-[#6b7280]">
                    Optional if the banner already has an image; upload to replace. Max 5 MB. Preview
                    shows the current image until you choose a new file.
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Sort position</span>
                  <input
                    type="number"
                    min={0}
                    max={HERO_POSITION_MAX}
                    value={editForm.position}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.position)}
                    aria-describedby={editFieldErrors.position ? 'hero-edit-pos-err' : undefined}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      const next = Number.isFinite(n)
                        ? Math.min(HERO_POSITION_MAX, Math.max(0, Math.floor(n)))
                        : 0;
                      setEditForm((p) => ({ ...p, position: next }));
                      clearEditError('position');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.position))}`}
                  />
                  <FieldError id="hero-edit-pos-err" message={editFieldErrors.position} />
                  <p className="text-xs text-[#9ca3af]">0–{HERO_POSITION_MAX}</p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Start date</span>
                  <input
                    type="datetime-local"
                    value={editForm.start_date}
                    aria-invalid={Boolean(editFieldErrors.start_date)}
                    aria-describedby={
                      editFieldErrors.start_date ? 'hero-edit-start-err' : undefined
                    }
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, start_date: e.target.value }));
                      clearEditError('start_date');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.start_date))}`}
                  />
                  <FieldError id="hero-edit-start-err" message={editFieldErrors.start_date} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">End date</span>
                  <input
                    type="datetime-local"
                    value={editForm.end_date}
                    aria-invalid={Boolean(editFieldErrors.end_date)}
                    aria-describedby={editFieldErrors.end_date ? 'hero-edit-end-err' : undefined}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, end_date: e.target.value }));
                      clearEditError('end_date');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.end_date))}`}
                  />
                  <FieldError id="hero-edit-end-err" message={editFieldErrors.end_date} />
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))}
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
