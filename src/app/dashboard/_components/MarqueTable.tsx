'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { z } from 'zod';
import {
  useDeleteDashboardMarqueMutation,
  useGetDashboardMarquesQuery,
  useUpdateDashboardMarqueMutation,
} from '@/app/dashboard/redux/reducers/MarqueeSlice/MarqueeApiSlice';
import { BrandStatusSwitch } from '@/app/dashboard/_components/BrandStatusSwitch';
import FieldError from '@/app/dashboard/_components/FieldError';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import { fieldErrorsFromZod } from '@/app/dashboard/_validation/dashboardForms';
import type { MarqueeItem } from '@/types/marquee';

const MARQUE_PAGE_SIZE = 10;
const MARQUE_TEXT_MAX = 500;

type ActiveFilter = 'all' | 'active' | 'inactive';

const editMarqueSchema = z.object({
  text: z.string().trim().min(1, 'Text is required').max(MARQUE_TEXT_MAX, `Max ${MARQUE_TEXT_MAX} characters`),
  status: z.enum(['active', 'inactive']),
});

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

type MarqueActiveSwitchProps = {
  row: MarqueeItem;
  disabled: boolean;
  busy: boolean;
  onToggle: (row: MarqueeItem) => void;
};

/** Table row toggle — same control styling as `BrandActiveSwitch` on the brands page. */
function MarqueActiveSwitch({ row, disabled, busy, onToggle }: MarqueActiveSwitchProps) {
  const on = row.isActive;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-busy={busy}
      aria-label={on ? `Deactivate ${row.text.replace(/\n/g, ' ').slice(0, 48) || 'line'}` : `Activate ${row.text.replace(/\n/g, ' ').slice(0, 48) || 'line'}`}
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

export default function MarqueTable() {
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [editTarget, setEditTarget] = useState<MarqueeItem | null>(null);
  const [editForm, setEditForm] = useState({
    text: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [patchPending, setPatchPending] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; preview: string } | null>(null);

  const queryArgs = useMemo(
    () =>
      activeFilter === 'all'
        ? {}
        : { active: activeFilter === 'active' ? ('true' as const) : ('false' as const) },
    [activeFilter],
  );

  const { data: marques = [], isLoading, isError, error: loadError } =
    useGetDashboardMarquesQuery(queryArgs);
  const [updateMarque, { isLoading: isUpdating }] = useUpdateDashboardMarqueMutation();
  const [deleteMarque, { isLoading: isDeleting }] = useDeleteDashboardMarqueMutation();

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const totalMarques = marques.length;
  const totalPages = Math.max(1, Math.ceil(totalMarques / MARQUE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * MARQUE_PAGE_SIZE;
  const paginatedMarques = useMemo(
    () => marques.slice(pageStart, pageStart + MARQUE_PAGE_SIZE),
    [marques, pageStart],
  );

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  const activeRowForMenu = useMemo(
    () =>
      actionsMenuId ? paginatedMarques.find((m) => m.id === actionsMenuId) ?? null : null,
    [paginatedMarques, actionsMenuId],
  );

  useEffect(() => {
    if (!actionsMenuId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-marque-actions-root]')) return;
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

  const handleToggleActive = async (row: MarqueeItem) => {
    if (editTarget?.id === row.id) return;
    setActionsMenuId(null);
    const nextActive = !row.isActive;
    setRowPatchPending(row.id, true);
    try {
      await updateMarque({ id: row.id, is_active: nextActive }).unwrap();
      toast.success(
        nextActive ? 'Marquee line is now active.' : 'Marquee line is now inactive.',
      );
    } catch (err) {
      console.error('Failed to update marque', err);
      toast.error(extractServerMessage(err, 'Could not update status. Try again.'));
    } finally {
      setRowPatchPending(row.id, false);
    }
  };

  const handleEdit = (row: MarqueeItem) => {
    setActionsMenuId(null);
    setEditTarget(row);
    setEditFieldErrors({});
    setEditForm({
      text: row.text ?? '',
      status: row.isActive ? 'active' : 'inactive',
    });
  };

  const handleCloseEdit = () => {
    setEditTarget(null);
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = editMarqueSchema.safeParse(editForm);
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setEditFieldErrors({});
    try {
      await updateMarque({
        id: editTarget.id,
        text: parsed.data.text,
        is_active: parsed.data.status === 'active',
      }).unwrap();
      toast.success('Marquee line updated successfully.');
      handleCloseEdit();
    } catch (err) {
      console.error('Failed to update marque', err);
      toast.error(extractServerMessage(err, 'Update failed. Please try again.'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMarque(deleteTarget.id).unwrap();
      toast.success('Marquee line deleted successfully.');
      setDeleteTarget(null);
      setActionsMenuId(null);
    } catch (err) {
      console.error('Failed to delete marque', err);
      toast.error(extractServerMessage(err, 'Delete failed. Please try again.'));
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Marquee</h2>
            <p className="mt-1 text-xs text-[#9ca3af]">GET /marque</p>
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
            {extractServerMessage(loadError, 'Failed to load marquee lines.')}
          </p>
        ) : null}

        {!isLoading && !isError && marques.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No marquee lines found.</p>
        ) : null}

        {!isLoading && !isError && marques.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Text</th>
                    <th className="px-3 py-3 font-medium">Updated</th>
                    <th className="px-3 py-3 font-medium">Active</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMarques.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc]"
                    >
                      <td className="max-w-[min(380px,50vw)] px-3 py-4 font-medium text-[#111111]">
                        <p className="line-clamp-2" title={row.text}>
                          {row.text || '—'}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-[#6b7280]">
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-4">
                        <MarqueActiveSwitch
                          row={row}
                          busy={Boolean(patchPending[row.id])}
                          disabled={
                            isDeleting ||
                            isUpdating ||
                            Boolean(editTarget && editTarget.id === row.id)
                          }
                          onToggle={(r) => {
                            void handleToggleActive(r);
                          }}
                        />
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-marque-actions-root>
                          <button
                            ref={actionsMenuId === row.id ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuId === row.id}
                            aria-haspopup="menu"
                            aria-label={`Actions for ${row.text.replace(/\n/g, ' ').slice(0, 48) || 'line'}`}
                            onClick={() =>
                              setActionsMenuId((current) => (current === row.id ? null : row.id))
                            }
                            disabled={
                              isDeleting ||
                              isUpdating ||
                              Boolean(patchPending[row.id])
                            }
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8fafc] disabled:opacity-50"
                          >
                            <MoreHorizontal size={15} aria-hidden />
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
                  disabled={
                    isDeleting ||
                    isUpdating ||
                    Boolean(patchPending[activeRowForMenu.id])
                  }
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsMenuId(null);
                    setDeleteTarget({
                      id: activeRowForMenu.id,
                      preview: activeRowForMenu.text.replace(/\n/g, ' ').slice(0, 120),
                    });
                  }}
                  disabled={
                    isDeleting ||
                    isUpdating ||
                    Boolean(patchPending[activeRowForMenu.id])
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
                    {pageStart + 1}–{Math.min(pageStart + MARQUE_PAGE_SIZE, totalMarques)}
                  </span>{' '}
                  of <span className="font-medium text-[#111111]">{totalMarques}</span>
                </p>
                <nav
                  className="flex flex-wrap items-center justify-end gap-1"
                  aria-label="Marquee pagination"
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
                {totalMarques} line{totalMarques === 1 ? '' : 's'} total
              </p>
            )}
          </div>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete marquee line</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Are you sure you need to delete this line
              {deleteTarget.preview ? (
                <>
                  {' '}
                  <span className="font-semibold text-[#111111]">&quot;{deleteTarget.preview}&quot;</span>
                </>
              ) : null}
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
                onClick={() => void confirmDelete()}
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
                <h3 className="text-base font-semibold text-[#111111]">Edit marquee line</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Update text and status (<span className="font-mono text-[11px]">PATCH /marque/:id</span>
                  ). Max {MARQUE_TEXT_MAX} characters.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
                aria-label="Close"
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
                    Text <span className="text-red-600">*</span>
                  </span>
                  <textarea
                    value={editForm.text}
                    maxLength={MARQUE_TEXT_MAX}
                    aria-required
                    aria-invalid={Boolean(editFieldErrors.text)}
                    aria-describedby={editFieldErrors.text ? 'marque-edit-text-err' : undefined}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, text: event.target.value }));
                      clearEditError('text');
                    }}
                    placeholder="Marquee text"
                    rows={4}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(editFieldErrors.text))}`}
                  />
                  <FieldError id="marque-edit-text-err" message={editFieldErrors.text} />
                  <p className="text-xs text-[#9ca3af]">{editForm.text.trim().length}/{MARQUE_TEXT_MAX}</p>
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-[#111111]">Status</span>
                  <BrandStatusSwitch
                    id="marque-edit-status"
                    value={editForm.status}
                    disabled={isUpdating}
                    onChange={(status) => {
                      setEditForm((prev) => ({ ...prev, status }));
                      clearEditError('status');
                    }}
                  />
                  <FieldError id="marque-edit-status-err" message={editFieldErrors.status} />
                </div>
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
