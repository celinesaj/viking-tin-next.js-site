'use client';

import { Plus, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import FieldError from '@/app/dashboard/_components/FieldError';
import DashboardSelect from '@/app/dashboard/_components/DashboardSelect';
import { useCreateAdminCouponMutation } from '@/app/dashboard/redux/reducers/CouponsSlice/CouponsApiSlice';
import type { CreateAdminCouponRequest } from '@/app/dashboard/redux/reducers/CouponsSlice/CouponsApiSlice';

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

type FormState = {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  startLocal: string;
  endLocal: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  isActive: boolean;
};

const initialForm = (): FormState => ({
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '10',
  startLocal: '2026-01-01T00:00',
  endLocal: '2026-12-31T23:59',
  minOrderAmount: '50',
  maxDiscountAmount: '25',
  usageLimit: '100',
  isActive: true,
});

function parsePositiveNumber(s: string): number | null {
  const n = Number(String(s).replace(/,/g, ''));
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function AddCouponDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createCoupon, { isLoading }] = useCreateAdminCouponMutation();

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleOpen() {
    setForm(initialForm());
    setFieldErrors({});
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: Record<string, string> = {};

    if (!form.code.trim()) errors.code = 'Code is required.';
    const discountValue = parsePositiveNumber(form.discountValue);
    if (discountValue === null || discountValue < 0) {
      errors.discountValue = 'Enter a valid discount value.';
    }
    if (form.discountType === 'percentage' && discountValue != null && discountValue > 100) {
      errors.discountValue = 'Percentage cannot exceed 100.';
    }

    const start = new Date(form.startLocal);
    const end = new Date(form.endLocal);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      errors.startLocal = 'Invalid start or end date.';
    } else if (end <= start) {
      errors.endLocal = 'End must be after start.';
    }

    const minOrder = parsePositiveNumber(form.minOrderAmount);
    const maxDisc = parsePositiveNumber(form.maxDiscountAmount);
    if (minOrder === null || minOrder < 0) errors.minOrderAmount = 'Invalid min order amount.';
    if (maxDisc === null || maxDisc < 0) errors.maxDiscountAmount = 'Invalid max discount.';

    const usage = Number.parseInt(form.usageLimit, 10);
    if (!Number.isFinite(usage) || usage < 1) errors.usageLimit = 'Usage limit must be at least 1.';

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const body: CreateAdminCouponRequest = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || '—',
      discount_type: form.discountType,
      discount_value: discountValue!,
      start_date: new Date(form.startLocal).toISOString(),
      end_date: new Date(form.endLocal).toISOString(),
      min_order_amount: minOrder!,
      max_discount_amount: maxDisc!,
      usage_limit: usage,
      is_active: form.isActive,
    };

    try {
      await createCoupon(body).unwrap();
      toast.success('Coupon created.');
      handleClose();
    } catch (error) {
      console.error('Failed to create coupon', error);
      toast.error(extractServerMessage(error, 'Create failed. Please try again.'));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#111111] px-3 text-xs font-medium text-white hover:bg-[#1f1f1f]"
      >
        <Plus size={16} aria-hidden />
        Add coupon
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add coupon overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />
          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-lg flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add coupon</h3>
                <p className="mt-1 text-xs text-[#6b7280]">POST /coupons/admin</p>
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
                <label className="block space-y-1.5" htmlFor="cp-code">
                  <span className="text-sm font-medium text-[#111111]">
                    Code <span className="text-red-600">*</span>
                  </span>
                  <input
                    id="cp-code"
                    value={form.code}
                    onChange={(e) => {
                      clearError('code');
                      setForm((f) => ({ ...f, code: e.target.value }));
                    }}
                    className={`h-10 w-full rounded-lg border bg-white px-3 font-mono text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!fieldErrors.code)}`}
                    placeholder="SAVE10"
                    autoComplete="off"
                    aria-invalid={!!fieldErrors.code}
                  />
                  <FieldError message={fieldErrors.code} />
                </label>

                <label className="block space-y-1.5" htmlFor="cp-desc">
                  <span className="text-sm font-medium text-[#111111]">Description</span>
                  <textarea
                    id="cp-desc"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-[#dbe1ea] bg-white px-3 py-2 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
                    placeholder="Spring promotion"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Discount type</span>
                    <DashboardSelect
                      value={form.discountType}
                      onChange={(v) => setForm((f) => ({ ...f, discountType: v as 'percentage' | 'fixed' }))}
                      placeholder="Type"
                      options={[
                        { value: 'percentage', label: 'Percentage' },
                        { value: 'fixed', label: 'Fixed amount' },
                      ]}
                    />
                  </div>
                  <label className="block space-y-1.5" htmlFor="cp-dv">
                    <span className="text-sm font-medium text-[#111111]">Discount value</span>
                    <input
                      id="cp-dv"
                      type="text"
                      inputMode="decimal"
                      value={form.discountValue}
                      onChange={(e) => {
                        clearError('discountValue');
                        setForm((f) => ({ ...f, discountValue: e.target.value }));
                      }}
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!fieldErrors.discountValue)}`}
                    />
                    <FieldError message={fieldErrors.discountValue} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5" htmlFor="cp-start">
                    <span className="text-sm font-medium text-[#111111]">Start</span>
                    <input
                      id="cp-start"
                      type="datetime-local"
                      value={form.startLocal}
                      onChange={(e) => {
                        clearError('startLocal');
                        setForm((f) => ({ ...f, startLocal: e.target.value }));
                      }}
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!fieldErrors.startLocal)}`}
                    />
                    <FieldError message={fieldErrors.startLocal} />
                  </label>
                  <label className="block space-y-1.5" htmlFor="cp-end">
                    <span className="text-sm font-medium text-[#111111]">End</span>
                    <input
                      id="cp-end"
                      type="datetime-local"
                      value={form.endLocal}
                      onChange={(e) => {
                        clearError('endLocal');
                        setForm((f) => ({ ...f, endLocal: e.target.value }));
                      }}
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!fieldErrors.endLocal)}`}
                    />
                    <FieldError message={fieldErrors.endLocal} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5" htmlFor="cp-min">
                    <span className="text-sm font-medium text-[#111111]">Min order amount</span>
                    <input
                      id="cp-min"
                      type="text"
                      inputMode="decimal"
                      value={form.minOrderAmount}
                      onChange={(e) => {
                        clearError('minOrderAmount');
                        setForm((f) => ({ ...f, minOrderAmount: e.target.value }));
                      }}
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!fieldErrors.minOrderAmount)}`}
                    />
                    <FieldError message={fieldErrors.minOrderAmount} />
                  </label>
                  <label className="block space-y-1.5" htmlFor="cp-maxd">
                    <span className="text-sm font-medium text-[#111111]">Max discount amount</span>
                    <input
                      id="cp-maxd"
                      type="text"
                      inputMode="decimal"
                      value={form.maxDiscountAmount}
                      onChange={(e) => {
                        clearError('maxDiscountAmount');
                        setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }));
                      }}
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!fieldErrors.maxDiscountAmount)}`}
                    />
                    <FieldError message={fieldErrors.maxDiscountAmount} />
                  </label>
                </div>

                <label className="block space-y-1.5" htmlFor="cp-usage">
                  <span className="text-sm font-medium text-[#111111]">Usage limit</span>
                  <input
                    id="cp-usage"
                    type="number"
                    min={1}
                    value={form.usageLimit}
                    onChange={(e) => {
                      clearError('usageLimit');
                      setForm((f) => ({ ...f, usageLimit: e.target.value }));
                    }}
                    className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(!!fieldErrors.usageLimit)}`}
                  />
                  <FieldError message={fieldErrors.usageLimit} />
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#d1d5db] text-[#111111] focus:ring-[#111111]"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <span className="text-sm text-[#111111]">Active</span>
                </label>
              </div>

              <div className="shrink-0 border-t border-[#eef2f7] bg-[#fafafa] px-5 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-lg bg-[#111111] px-4 py-2 text-sm font-medium text-white hover:bg-[#1f1f1f] disabled:opacity-60"
                  >
                    {isLoading ? 'Creating…' : 'Create coupon'}
                  </button>
                </div>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
