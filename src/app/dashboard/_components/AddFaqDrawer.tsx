'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useGetDashboardFaqCategoriesQuery } from '@/app/dashboard/redux/reducers/FaqCategoriesSlice/FaqCategoriesApiSlice';
import { useCreateDashboardFaqMutation } from '@/app/dashboard/redux/reducers/FaqSlice/FaqApiSlice';
import DashboardSelect from '@/app/dashboard/_components/DashboardSelect';
import FieldError from '@/app/dashboard/_components/FieldError';
import {
  FAQ_ENTRY_ANSWER_MAX,
  FAQ_ENTRY_QUESTION_MAX,
  createFaqEntryFormSchema,
  fieldErrorsFromZod,
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

export default function AddFaqDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    question: '',
    answer: '',
    categoryId: '',
    displayOrder: '0',
    isPublished: true,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { data: categories = [], isLoading: categoriesLoading } = useGetDashboardFaqCategoriesQuery();
  const [createFaq, { isLoading }] = useCreateDashboardFaqMutation();

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories],
  );

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleOpen() {
    setForm({ question: '', answer: '', categoryId: '', displayOrder: '0', isPublished: true });
    setFieldErrors({});
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createFaqEntryFormSchema.safeParse({
      question: form.question,
      answer: form.answer,
      categoryId: form.categoryId,
      displayOrder: form.displayOrder,
      isPublished: form.isPublished,
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    const d = parsed.data;
    try {
      await createFaq({
        question: d.question,
        answer: d.answer,
        category_id: Number(d.categoryId),
        display_order: d.displayOrder,
        is_published: d.isPublished,
      }).unwrap();
      toast.success('FAQ entry created.');
      handleClose();
    } catch (error) {
      console.error('Failed to create FAQ entry', error);
      toast.error(extractServerMessage(error, 'Create failed. Please try again.'));
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] shadow-[0_16px_32px_-18px_rgba(0,0,0,0.95)] transition-opacity hover:opacity-95"
        >
          <Plus size={16} />
          Add FAQ
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add FAQ overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />
          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add FAQ</h3>
                <p className="mt-1 text-xs text-[#6b7280]">POST /faq</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
              >
                <X size={16} />
              </button>
            </header>

            <form
              noValidate
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#374151]">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <DashboardSelect
                    value={form.categoryId}
                    onChange={(next) => {
                      clearError('categoryId');
                      setForm((f) => ({ ...f, categoryId: next }));
                    }}
                    options={categoryOptions}
                    placeholder={categoriesLoading ? 'Loading…' : 'Select category'}
                    disabled={categoriesLoading}
                    hasError={!!fieldErrors.categoryId}
                    aria-invalid={!!fieldErrors.categoryId}
                    aria-describedby={fieldErrors.categoryId ? 'faq-add-category-err' : undefined}
                    aria-required
                  />
                  <FieldError id="faq-add-category-err" message={fieldErrors.categoryId} />
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Question <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    maxLength={FAQ_ENTRY_QUESTION_MAX + 20}
                    value={form.question}
                    onChange={(e) => {
                      clearError('question');
                      setForm((f) => ({ ...f, question: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] ${inputBorderClass(!!fieldErrors.question)}`}
                  />
                  <FieldError message={fieldErrors.question} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Answer <span className="text-red-500">*</span>
                  </span>
                  <textarea
                    rows={5}
                    maxLength={FAQ_ENTRY_ANSWER_MAX + 50}
                    value={form.answer}
                    onChange={(e) => {
                      clearError('answer');
                      setForm((f) => ({ ...f, answer: e.target.value }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-[#111111] ${inputBorderClass(!!fieldErrors.answer)}`}
                  />
                  <FieldError message={fieldErrors.answer} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Display order</span>
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) => {
                      clearError('displayOrder');
                      setForm((f) => ({ ...f, displayOrder: e.target.value }));
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] ${inputBorderClass(!!fieldErrors.displayOrder)}`}
                  />
                  <FieldError message={fieldErrors.displayOrder} />
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                  <label htmlFor="faq-add-published" className="text-sm font-medium text-[#374151]">
                    Publish
                  </label>
                  <button
                    id="faq-add-published"
                    type="button"
                    role="switch"
                    aria-checked={form.isPublished}
                    onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      form.isPublished ? 'bg-emerald-500' : 'bg-[#d1d5db]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        form.isPublished ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-[#6b7280]">
                    {form.isPublished ? 'Published' : 'Not published'}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)]">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || categoriesLoading}
                  className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
                >
                  {isLoading ? 'Creating...' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
