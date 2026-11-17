'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useGetDashboardFaqCategoriesQuery } from '@/app/dashboard/redux/reducers/FaqCategoriesSlice/FaqCategoriesApiSlice';
import {
  useDeleteDashboardFaqMutation,
  useGetDashboardFaqQuery,
  useUpdateDashboardFaqMutation,
} from '@/app/dashboard/redux/reducers/FaqSlice/FaqApiSlice';
import DashboardSelect from '@/app/dashboard/_components/DashboardSelect';
import FieldError from '@/app/dashboard/_components/FieldError';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import {
  FAQ_ENTRY_ANSWER_MAX,
  FAQ_ENTRY_QUESTION_MAX,
  createFaqEntryFormSchema,
  fieldErrorsFromZod,
} from '@/app/dashboard/_validation/dashboardForms';
import type { FaqItem } from '@/types/faq';

const PAGE_SIZE = 10;

function getVisiblePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total]);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('ellipsis');
    out.push(sorted[i]);
  }
  return out;
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

export default function FaqTable() {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [actionsMenuFaqId, setActionsMenuFaqId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [editTarget, setEditTarget] = useState<FaqItem | null>(null);
  const [editForm, setEditForm] = useState({
    question: '',
    answer: '',
    categoryId: '',
    displayOrder: '0',
    isPublished: true,
  });
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; question: string } | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useGetDashboardFaqCategoriesQuery();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateDashboardFaqMutation();
  const [deleteFaq, { isLoading: isDeleting }] = useDeleteDashboardFaqMutation();

  const queryArgs = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(categoryFilter ? { category_id: categoryFilter } : {}),
    }),
    [page, categoryFilter],
  );

  const { data, isLoading, isFetching, isError, error } = useGetDashboardFaqQuery(queryArgs);
  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (!pagination) return;
    if (pagination.totalPages >= 1 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  const categoryFilterOptions = useMemo(
    () => [
      { value: '', label: 'All categories' },
      ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [categories],
  );
  const editCategoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories],
  );
  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );
  const activeFaqForMenu = useMemo(
    () => (actionsMenuFaqId ? rows.find((r) => String(r.id) === actionsMenuFaqId) ?? null : null),
    [actionsMenuFaqId, rows],
  );

  useEffect(() => {
    if (!actionsMenuFaqId) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-faq-actions-root]')) return;
      if (target.closest(ROW_ACTIONS_PORTAL_SELECTOR)) return;
      setActionsMenuFaqId(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActionsMenuFaqId(null);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsMenuFaqId]);

  function clearEditError(key: string) {
    setEditFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const handleEdit = (row: FaqItem) => {
    setActionsMenuFaqId(null);
    setEditTarget(row);
    setEditFieldErrors({});
    setEditForm({
      question: row.question ?? '',
      answer: row.answer ?? '',
      categoryId: row.categoryId != null && row.categoryId !== '' ? String(row.categoryId) : '',
      displayOrder: String(row.displayOrder ?? 0),
      isPublished: row.isPublished,
    });
  };

  const handleCloseEditDrawer = () => {
    setEditTarget(null);
    setEditFieldErrors({});
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const parsed = createFaqEntryFormSchema.safeParse({
      question: editForm.question,
      answer: editForm.answer,
      categoryId: editForm.categoryId,
      displayOrder: editForm.displayOrder,
      isPublished: editForm.isPublished,
    });
    if (!parsed.success) {
      setEditFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setEditFieldErrors({});
    const d = parsed.data;
    try {
      await updateFaq({
        id: String(editTarget.id),
        question: d.question,
        answer: d.answer,
        category_id: Number(d.categoryId),
        display_order: d.displayOrder,
        is_published: d.isPublished,
      }).unwrap();
      toast.success('FAQ updated.');
      handleCloseEditDrawer();
    } catch (err) {
      toast.error(extractServerMessage(err, 'Update failed. Please try again.'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFaq(deleteTarget.id).unwrap();
      toast.success('FAQ deleted.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractServerMessage(err, 'Delete failed. Please try again.'));
    }
  };

  const togglePublished = async (row: FaqItem, nextPublished: boolean) => {
    try {
      await updateFaq({
        id: String(row.id),
        question: row.question,
        answer: row.answer,
        category_id: Number(row.categoryId),
        display_order: row.displayOrder,
        is_published: nextPublished,
      }).unwrap();
      toast.success(nextPublished ? 'Published.' : 'Unpublished.');
    } catch (err) {
      toast.error(extractServerMessage(err, 'Failed to update publish state.'));
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">FAQ</h2>
          <span className="text-xs text-[#9ca3af]">GET /faq</span>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px]">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#6b7280]">
              Category
            </label>
            <DashboardSelect
              value={categoryFilter}
              onChange={(next) => {
                setCategoryFilter(next);
                setPage(1);
              }}
              options={categoryFilterOptions}
              placeholder={categoriesLoading ? 'Loading…' : 'All categories'}
              size="compact"
              aria-label="Filter by category"
            />
          </div>
          <div>
            <p className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#6b7280]">
              Visibility
            </p>
            <p className="h-9 rounded-lg border border-[#dbe1ea] bg-white px-3 text-sm leading-9 text-[#111111]">
              Published toggle only
            </p>
          </div>
        </div>

        {isLoading ? <TableDotsLoader /> : null}
        {isError ? (
          <p className="text-sm text-red-600">{extractServerMessage(error, 'Failed to load FAQ entries.')}</p>
        ) : null}
        {!isLoading && !isError && total === 0 ? (
          <p className="text-sm text-[#6b7280]">No FAQ entries found.</p>
        ) : null}

        {!isLoading && !isError && total > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                    <th className="px-3 py-3 font-medium">Question</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Answer</th>
                    <th className="px-3 py-3 font-medium">Published</th>
                    <th className="px-3 py-3 font-medium">Order</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc]">
                      <td className="max-w-xs px-3 py-4 font-medium text-[#111111]">{truncate(row.question, 90)}</td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.category?.name ?? '-'}</td>
                      <td className="max-w-sm px-3 py-4 text-[#6b7280]">{truncate(row.answer, 120)}</td>
                      <td className="px-3 py-4">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.isPublished}
                          onClick={() => togglePublished(row, !row.isPublished)}
                          disabled={isUpdating}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-60 ${
                            row.isPublished ? 'bg-emerald-500' : 'bg-[#d1d5db]'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                              row.isPublished ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-[#6b7280]">{row.displayOrder}</td>
                      <td className="px-3 py-4 text-right">
                        <div className="inline-block text-left" data-faq-actions-root>
                          <button
                            ref={actionsMenuFaqId === String(row.id) ? actionsBtnRef : undefined}
                            type="button"
                            aria-expanded={actionsMenuFaqId === String(row.id)}
                            aria-haspopup="menu"
                            onClick={() =>
                              setActionsMenuFaqId((current) =>
                                current === String(row.id) ? null : String(row.id),
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

            {activeFaqForMenu ? (
              <RowActionsFloatingMenu open triggerRef={actionsBtnRef}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleEdit(activeFaqForMenu)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsMenuFaqId(null);
                    setDeleteTarget({
                      id: String(activeFaqForMenu.id),
                      question: activeFaqForMenu.question || 'FAQ',
                    });
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </RowActionsFloatingMenu>
            ) : null}

            {isFetching && !isLoading ? (
              <div className="border-t border-[#e5e7eb] px-4 py-2 text-center text-xs text-[#6b7280]">
                Updating...
              </div>
            ) : null}

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-[#e5e5e5] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#6b7280]">
                  Page {safePage} of {totalPages}
                </p>
                <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="FAQ pagination">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-sm text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} aria-hidden />
                    Prev
                  </button>
                  <div className="flex flex-wrap items-center gap-1">
                    {visiblePages.map((item, index) =>
                      item === 'ellipsis' ? (
                        <span key={`e-${index}`} className="px-2 text-sm text-[#9ca3af]" aria-hidden>
                          ...
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
                        >
                          {item}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-sm text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} aria-hidden />
                  </button>
                </nav>
              </div>
            ) : (
              <p className="border-t border-[#e5e5e5] pt-4 text-xs text-[#6b7280]">{total} FAQ total</p>
            )}
          </div>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete FAQ</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Delete <span className="font-semibold text-[#111111]">&quot;{deleteTarget.question}&quot;</span>?
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
                <h3 className="text-base font-semibold text-[#111111]">Edit FAQ</h3>
                <p className="mt-1 text-xs text-[#6b7280]">PATCH /faq/{editTarget.id}</p>
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
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#374151]">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <DashboardSelect
                    value={editForm.categoryId}
                    onChange={(next) => {
                      clearEditError('categoryId');
                      setEditForm((f) => ({ ...f, categoryId: next }));
                    }}
                    options={editCategoryOptions}
                    placeholder={categoriesLoading ? 'Loading…' : 'Select category'}
                    disabled={categoriesLoading}
                    hasError={!!editFieldErrors.categoryId}
                    aria-invalid={!!editFieldErrors.categoryId}
                    aria-describedby={editFieldErrors.categoryId ? 'faq-edit-category-err' : undefined}
                    aria-required
                  />
                  <FieldError id="faq-edit-category-err" message={editFieldErrors.categoryId} />
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Question</span>
                  <input
                    type="text"
                    maxLength={FAQ_ENTRY_QUESTION_MAX + 20}
                    value={editForm.question}
                    onChange={(e) => {
                      clearEditError('question');
                      setEditForm((f) => ({ ...f, question: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] ${inputBorderClass(!!editFieldErrors.question)}`}
                  />
                  <FieldError message={editFieldErrors.question} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Answer</span>
                  <textarea
                    rows={5}
                    maxLength={FAQ_ENTRY_ANSWER_MAX + 50}
                    value={editForm.answer}
                    onChange={(e) => {
                      clearEditError('answer');
                      setEditForm((f) => ({ ...f, answer: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-[#111111] ${inputBorderClass(!!editFieldErrors.answer)}`}
                  />
                  <FieldError message={editFieldErrors.answer} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Display order</span>
                  <input
                    type="number"
                    min={0}
                    value={editForm.displayOrder}
                    onChange={(e) => {
                      clearEditError('displayOrder');
                      setEditForm((f) => ({ ...f, displayOrder: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] ${inputBorderClass(!!editFieldErrors.displayOrder)}`}
                  />
                  <FieldError message={editFieldErrors.displayOrder} />
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                  <label htmlFor="faq-edit-published" className="text-sm font-medium text-[#374151]">
                    Publish
                  </label>
                  <button
                    id="faq-edit-published"
                    type="button"
                    role="switch"
                    aria-checked={editForm.isPublished}
                    onClick={() => setEditForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      editForm.isPublished ? 'bg-emerald-500' : 'bg-[#d1d5db]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        editForm.isPublished ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-[#6b7280]">
                    {editForm.isPublished ? 'Published' : 'Not published'}
                  </span>
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
                  disabled={isUpdating || categoriesLoading}
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
