'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateDashboardContactInfoMutation } from '@/app/dashboard/redux/reducers/ContactInfoSlice/ContactInfoApiSlice';
import FieldError from '@/app/dashboard/_components/FieldError';
import {
  CONTACT_INFO_TITLE_MAX,
  CONTACT_INFO_TYPE_MAX,
  CONTACT_INFO_VALUE_MAX,
  createContactInfoFormSchema,
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

export default function AddContactInfoDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    type: '',
    title: '',
    value: '',
    sortOrder: '0',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createRow, { isLoading }] = useCreateDashboardContactInfoMutation();

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleOpen() {
    setForm({ type: '', title: '', value: '', sortOrder: '0' });
    setFieldErrors({});
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createContactInfoFormSchema.safeParse({
      type: form.type,
      title: form.title,
      value: form.value,
      sortOrder: form.sortOrder,
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    const { type, title, value, sortOrder } = parsed.data;

    try {
      await createRow({ type, title, value, sortOrder }).unwrap();
      toast.success(`"${title}" added successfully.`);
      handleClose();
    } catch (error) {
      console.error('Failed to create contact info', error);
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
          <span>Add contact info</span>
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add contact info overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />

          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add contact info</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Types such as phone, email, or address (shown on the public contact page).
                </p>
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
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Type <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.type}
                    maxLength={CONTACT_INFO_TYPE_MAX}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.type)}
                    aria-describedby={fieldErrors.type ? 'contact-add-type-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, type: e.target.value }));
                      clearError('type');
                    }}
                    placeholder="e.g. phone"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.type))}`}
                  />
                  <FieldError id="contact-add-type-err" message={fieldErrors.type} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.type.trim().length}/{CONTACT_INFO_TYPE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Title <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.title}
                    maxLength={CONTACT_INFO_TITLE_MAX}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.title)}
                    aria-describedby={fieldErrors.title ? 'contact-add-title-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, title: e.target.value }));
                      clearError('title');
                    }}
                    placeholder="e.g. Customer support"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.title))}`}
                  />
                  <FieldError id="contact-add-title-err" message={fieldErrors.title} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.title.trim().length}/{CONTACT_INFO_TITLE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Value <span className="text-red-600">*</span>
                  </span>
                  <textarea
                    value={form.value}
                    maxLength={CONTACT_INFO_VALUE_MAX}
                    rows={3}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.value)}
                    aria-describedby={fieldErrors.value ? 'contact-add-value-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, value: e.target.value }));
                      clearError('value');
                    }}
                    placeholder="Phone number, email, or multi-line text"
                    className={`min-h-[88px] w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.value))}`}
                  />
                  <FieldError id="contact-add-value-err" message={fieldErrors.value} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.value.trim().length}/{CONTACT_INFO_VALUE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Sort order <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.sortOrder)}
                    aria-describedby={
                      fieldErrors.sortOrder ? 'contact-add-sort-err' : undefined
                    }
                    onChange={(e) => {
                      setForm((p) => ({ ...p, sortOrder: e.target.value }));
                      clearError('sortOrder');
                    }}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.sortOrder))}`}
                  />
                  <FieldError id="contact-add-sort-err" message={fieldErrors.sortOrder} />
                </label>
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
                  disabled={isLoading}
                  className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
