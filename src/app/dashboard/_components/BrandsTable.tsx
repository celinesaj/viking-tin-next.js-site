'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  useGetDashboardBrandsQuery,
  useDeleteDashboardBrandMutation,
  useUpdateDashboardBrandMutation,
} from '@/app/dashboard/redux/reducers/BrandsSlice/BrandsApiSlice';
import { BrandStatusSwitch } from '@/app/dashboard/_components/BrandStatusSwitch';
import FieldError from '@/app/dashboard/_components/FieldError';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import { useDashboardTableHighlight } from '@/app/dashboard/_hooks/useDashboardTableHighlight';
import {
  BRAND_DESCRIPTION_MAX,
  BRAND_NAME_MAX,
  BRAND_NAME_MIN,
  BRAND_SLUG_MAX,
  BRAND_SLUG_MIN,
  BRAND_STORY_MAX,
  fieldErrorsFromZod,
  normalizeBrandSlugInput,
  resolveOptionalSlug,
  updateBrandFormSchema,
} from '@/app/dashboard/_validation/dashboardForms';

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

type BrandRow = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  story: string | null;
  status?: 'active' | 'inactive';
  createdAt: string | null;
  updatedAt: string | null;
};

type ActiveFilter = 'all' | 'active' | 'inactive';

function normalizeBrandStatus(raw: string | null | undefined): 'active' | 'inactive' {
  if (String(raw ?? '').toLowerCase() === 'inactive') return 'inactive';
  return 'active';
}

function isBrandActive(row: BrandRow): boolean {
  return normalizeBrandStatus(row.status) === 'active';
}

type BrandActiveSwitchProps = {
  row: BrandRow;
  disabled: boolean;
  busy: boolean;
  onToggle: (row: BrandRow) => void;
};

function BrandActiveSwitch({ row, disabled, busy, onToggle }: BrandActiveSwitchProps) {
  const on = isBrandActive(row);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-busy={busy}
      aria-label={on ? `Deactivate ${row.name}` : `Activate ${row.name}`}
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

const BRANDS_PAGE_SIZE = 10;

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

export default function BrandsTable() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const {
    data: brands = [],
    isLoading,
    isError,
    error: getBrandsError,
  } = useGetDashboardBrandsQuery();
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteDashboardBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateDashboardBrandMutation();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<BrandRow | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [brandPatchPending, setBrandPatchPending] = useState<Record<string, boolean>>({});
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    description: '',
    story: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [editLogo, setEditLogo] = useState<File | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [actionsMenuBrandId, setActionsMenuBrandId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [page, setPage] = useState(1);

  const logoFilePreviewUrl = useMemo(() => {
    if (!editLogo) return null;
    return URL.createObjectURL(editLogo);
  }, [editLogo]);

  useEffect(() => {
    return () => {
      if (logoFilePreviewUrl) URL.revokeObjectURL(logoFilePreviewUrl);
    };
  }, [logoFilePreviewUrl]);

  useEffect(() => {
    if (!actionsMenuBrandId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-brand-actions-root]')) return;
      if (target.closest(ROW_ACTIONS_PORTAL_SELECTOR)) return;
      setActionsMenuBrandId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActionsMenuBrandId(null);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsMenuBrandId]);

  const filteredBrands = useMemo(() => {
    if (activeFilter === 'all') return brands;
    const wantActive = activeFilter === 'active';
    return brands.filter((b) => isBrandActive(b) === wantActive);
  }, [brands, activeFilter]);

  const totalBrands = filteredBrands.length;
  const totalPages = Math.max(1, Math.ceil(totalBrands / BRANDS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * BRANDS_PAGE_SIZE;
  const paginatedBrands = useMemo(
    () => filteredBrands.slice(pageStart, pageStart + BRANDS_PAGE_SIZE),
    [filteredBrands, pageStart],
  );

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!highlightId) return;
    setActiveFilter('all');
  }, [highlightId]);

  useEffect(() => {
    if (!highlightId || brands.length === 0) return;
    const idx = brands.findIndex((b) => b.id === highlightId);
    if (idx < 0) return;
    setPage(Math.floor(idx / BRANDS_PAGE_SIZE) + 1);
  }, [highlightId, brands]);

  const rowOnPage = Boolean(highlightId && paginatedBrands.some((b) => b.id === highlightId));
  const { highlightRef, rowHighlightClass } = useDashboardTableHighlight(rowOnPage);

  const activeBrandForMenu = useMemo(
    () =>
      actionsMenuBrandId
        ? paginatedBrands.find((b) => b.id === actionsMenuBrandId) ?? null
        : null,
    [paginatedBrands, actionsMenuBrandId],
  );
  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  function setBrandRowPatchPending(id: string, pending: boolean) {
    setBrandPatchPending((prev) => {
      if (pending) return { ...prev, [id]: true };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const handleToggleBrandActive = async (row: BrandRow) => {
    if (editTarget?.id === row.id) return;
    const nextStatus = isBrandActive(row) ? 'inactive' : 'active';
    setBrandRowPatchPending(row.id, true);
    try {
      await updateBrand({
        id: row.id,
        status: nextStatus,
      }).unwrap();
      toast.success(
        nextStatus === 'active'
          ? `"${row.name}" is now active.`
          : `"${row.name}" is now inactive.`,
      );
    } catch (error) {
      console.error('Failed to update brand status', error);
      toast.error(extractServerMessage(error, 'Could not update status. Try again.'));
    } finally {
      setBrandRowPatchPending(row.id, false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setActionsMenuBrandId(null);
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBrand(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete brand', error);
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

  const handleEdit = (brand: BrandRow) => {
    setActionsMenuBrandId(null);
    setEditTarget(brand);
    setEditFieldErrors({});
    setEditForm({
      name: brand.name ?? '',
      slug: normalizeBrandSlugInput(brand.slug ?? ''),
      description: brand.description ?? '',
      story: brand.story ?? '',
      status: normalizeBrandStatus(brand.status),
    });
    setEditLogo(null);
  };

  const handleCloseEditDrawer = () => {
    setEditTarget(null);
    setEditLogo(null);
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = updateBrandFormSchema.safeParse({
      name: editForm.name,
      slug: resolveOptionalSlug(editForm.slug, editForm.name),
      description: editForm.description,
      story: editForm.story,
      logo: editLogo ?? undefined,
      status: editForm.status,
      existingLogoUrl: editTarget.logoUrl,
    });
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setEditFieldErrors({});
    const d = parsed.data;

    try {
      await updateBrand({
        id: editTarget.id,
        name: d.name,
        slug: d.slug,
        description: d.description,
        story: d.story,
        ...(d.logo ? { logo: d.logo } : {}),
        status: d.status,
      }).unwrap();
      toast.success(`"${d.name}" updated successfully.`);
      handleCloseEditDrawer();
    } catch (error) {
      console.error('Failed to update brand', error);
      toast.error(extractServerMessage(error, 'Update failed. Please try again.'));
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Brands</h2>
            <p className="mt-1 text-xs text-[#9ca3af]">GET /brands</p>
          </div>
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
                disabled={isLoading}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeFilter === key
                    ? 'border-[#111111] bg-[#111111] text-white'
                    : 'border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f8fafc]'
                } disabled:opacity-50`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {extractServerMessage(getBrandsError, 'Failed to load brands.')}
          </p>
        ) : null}

        {!isLoading && !isError && brands.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No brands found.</p>
        ) : null}

        {!isLoading && !isError && brands.length > 0 && filteredBrands.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No brands match this filter.</p>
        ) : null}

        {!isLoading && !isError && filteredBrands.length > 0 ? (
          <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Slug</th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">Created At</th>
                  <th className="px-3 py-3 font-medium">Active</th>
                  <th className="px-3 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBrands.map((brand) => (
                  <tr
                    key={brand.id}
                    ref={highlightId === brand.id ? highlightRef : undefined}
                    className={`border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc] ${rowHighlightClass(brand.id)}`}
                  >
                    <td className="px-3 py-4 font-medium text-[#111111]">
                      <div className="flex items-center gap-2.5">
                        {brand.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={brand.logoUrl}
                            alt={`${brand.name} logo`}
                            className="h-8 w-8 rounded-full border border-[#e5e7eb] object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-[#eef2f7] text-xs font-semibold uppercase text-[#4b5563]">
                            {brand.name?.[0] ?? 'B'}
                          </div>
                        )}
                        <span>{brand.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-[#6b7280]">{brand.slug}</td>
                    <td className="px-3 py-4 text-[#6b7280]">{brand.description ?? '-'}</td>
                    <td className="px-3 py-4 text-[#6b7280]">
                      {brand.createdAt ? new Date(brand.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 py-4">
                      <BrandActiveSwitch
                        row={brand}
                        busy={Boolean(brandPatchPending[brand.id])}
                        disabled={
                          isDeleting ||
                          isUpdating ||
                          Boolean(editTarget && editTarget.id === brand.id)
                        }
                        onToggle={(r) => {
                          void handleToggleBrandActive(r);
                        }}
                      />
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="inline-block text-left" data-brand-actions-root>
                        <button
                          ref={actionsMenuBrandId === brand.id ? actionsBtnRef : undefined}
                          type="button"
                          aria-expanded={actionsMenuBrandId === brand.id}
                          aria-haspopup="menu"
                          aria-label={`Actions for ${brand.name}`}
                          onClick={() =>
                            setActionsMenuBrandId((current) =>
                              current === brand.id ? null : brand.id,
                            )
                          }
                          disabled={
                            isDeleting ||
                            isUpdating ||
                            Boolean(brandPatchPending[brand.id])
                          }
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

          {activeBrandForMenu ? (
            <RowActionsFloatingMenu open triggerRef={actionsBtnRef}>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleEdit(activeBrandForMenu)}
                disabled={
                  isDeleting ||
                  isUpdating ||
                  Boolean(brandPatchPending[activeBrandForMenu.id])
                }
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleDelete(activeBrandForMenu.id, activeBrandForMenu.name)}
                disabled={
                  isDeleting ||
                  isUpdating ||
                  Boolean(brandPatchPending[activeBrandForMenu.id])
                }
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
                  {pageStart + 1}–{Math.min(pageStart + BRANDS_PAGE_SIZE, totalBrands)}
                </span>{' '}
                of <span className="font-medium text-[#111111]">{totalBrands}</span>
              </p>
              <nav
                className="flex flex-wrap items-center justify-end gap-1"
                aria-label="Brands pagination"
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
              {totalBrands} brand{totalBrands === 1 ? '' : 's'} total
            </p>
          )}
          </div>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete Brand</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Are you sure you need to delete this brand{' '}
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
                <h3 className="text-base font-semibold text-[#111111]">Edit Brand</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Name {BRAND_NAME_MIN}–{BRAND_NAME_MAX} chars; slug {BRAND_SLUG_MIN}–{BRAND_SLUG_MAX}{' '}
                  (a–z, 0–9, hyphens). New logo file optional if one already exists; max 5 MB.
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
                    maxLength={BRAND_NAME_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.name)}
                    aria-describedby={editFieldErrors.name ? 'brand-edit-name-err' : undefined}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, name: event.target.value }));
                      clearEditError('name');
                    }}
                    placeholder="Enter brand name"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.name))}`}
                  />
                  <FieldError id="brand-edit-name-err" message={editFieldErrors.name} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.name.trim().length}/{BRAND_NAME_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Slug</span>
                  <input
                    type="text"
                    value={editForm.slug}
                    maxLength={BRAND_SLUG_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.slug)}
                    aria-describedby={editFieldErrors.slug ? 'brand-edit-slug-err' : undefined}
                    onChange={(event) => {
                      setEditForm((prev) => ({
                        ...prev,
                        slug: normalizeBrandSlugInput(event.target.value),
                      }));
                      clearEditError('slug');
                    }}
                    placeholder="Enter brand slug"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.slug))}`}
                  />
                  <FieldError id="brand-edit-slug-err" message={editFieldErrors.slug} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.slug.length}/{BRAND_SLUG_MAX} (min {BRAND_SLUG_MIN})
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Description</span>
                  <textarea
                    value={editForm.description}
                    maxLength={BRAND_DESCRIPTION_MAX}
                    aria-invalid={Boolean(editFieldErrors.description)}
                    aria-describedby={
                      editFieldErrors.description ? 'brand-edit-desc-err' : undefined
                    }
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, description: event.target.value }));
                      clearEditError('description');
                    }}
                    placeholder="Short brand description"
                    rows={3}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.description))}`}
                  />
                  <FieldError id="brand-edit-desc-err" message={editFieldErrors.description} />
                  <p className="text-xs text-[#9ca3af]">
                    {editForm.description.length}/{BRAND_DESCRIPTION_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Story</span>
                  <textarea
                    value={editForm.story}
                    maxLength={BRAND_STORY_MAX}
                    aria-invalid={Boolean(editFieldErrors.story)}
                    aria-describedby={editFieldErrors.story ? 'brand-edit-story-err' : undefined}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, story: event.target.value }));
                      clearEditError('story');
                    }}
                    placeholder="Brand story"
                    rows={4}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.story))}`}
                  />
                  <FieldError id="brand-edit-story-err" message={editFieldErrors.story} />
                  <p className="text-xs text-[#9ca3af]">{editForm.story.length}/{BRAND_STORY_MAX}</p>
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-[#111111]">Status</span>
                  <BrandStatusSwitch
                    id="brand-edit-status"
                    value={editForm.status}
                    disabled={isUpdating}
                    onChange={(status) => {
                      setEditForm((prev) => ({ ...prev, status }));
                      clearEditError('status');
                    }}
                  />
                  <FieldError id="brand-edit-status-err" message={editFieldErrors.status} />
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-medium text-[#111111]">
                    Logo{' '}
                    {!editTarget.logoUrl?.trim() ? (
                      <span className="text-red-600">*</span>
                    ) : (
                      <span className="text-xs font-normal text-[#6b7280]">(optional new file)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {logoFilePreviewUrl || editTarget.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoFilePreviewUrl ?? editTarget.logoUrl ?? ''}
                          alt={editForm.name ? `${editForm.name} logo` : 'Brand logo'}
                          className="h-20 w-20 rounded-full border border-[#e5e7eb] object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#e5e7eb] bg-[#eef2f7] text-lg font-semibold uppercase text-[#4b5563]">
                          {editForm.name?.[0] ?? 'B'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs text-[#6b7280]">
                        {logoFilePreviewUrl
                          ? 'New file preview. Save to apply.'
                          : editTarget.logoUrl?.trim()
                            ? 'Keep the current logo, or choose a new image below (max 5 MB).'
                            : 'Choose a logo image (required, max 5 MB).'}
                      </p>
                    </div>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="sr-only">Upload logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      aria-required={!editTarget.logoUrl?.trim()}
                      aria-invalid={Boolean(editFieldErrors.logo)}
                      aria-describedby={editFieldErrors.logo ? 'brand-edit-logo-err' : undefined}
                      onChange={(event) => {
                        setEditLogo(event.target.files?.[0] ?? null);
                        clearEditError('logo');
                      }}
                      className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
                    />
                    <FieldError id="brand-edit-logo-err" message={editFieldErrors.logo} />
                  </label>
                </div>
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
