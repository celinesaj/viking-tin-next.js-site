'use client';

import { Pencil, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardSelect from '@/app/dashboard/_components/DashboardSelect';
import FieldError from '@/app/dashboard/_components/FieldError';
import ProductFormSwitch from '@/app/dashboard/_components/ProductFormSwitch';
import {
  TAX_RATE_NAME_MAX,
  fieldErrorsFromZodPaths,
  updateTaxRateFormSchema,
} from '@/app/dashboard/_validation/dashboardForms';
import { useGetDeliveryZonesQuery } from '@/features/delivery-zones/deliveryZonesApi';
import type { CreateTaxRateRequest } from '@/features/tax-rates/taxRatesApi';
import { taxRateSuccessToastText, useUpdateTaxRateMutation } from '@/features/tax-rates/taxRatesApi';
import type { TaxRate } from '@/types/tax-rates';

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

type Props = {
  taxRate: TaxRate | null;
  onClose: () => void;
};

export default function EditTaxRateDrawer({ taxRate, onClose }: Props) {
  const isOpen = taxRate !== null;
  const hydratedForId = useRef<string | null>(null);

  const [form, setForm] = useState({
    zoneId: '',
    name: '',
    rate: '',
    isActive: true,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [updateTaxRate, { isLoading }] = useUpdateTaxRateMutation();

  const { data: zones = [], isLoading: zonesLoading } = useGetDeliveryZonesQuery();

  const zoneOptions = useMemo(
    () => [
      { value: '', label: 'No zone' },
      ...[...zones].sort((a, b) => a.name.localeCompare(b.name)).map((z) => ({
        value: z.id,
        label: z.name,
      })),
    ],
    [zones],
  );

  useEffect(() => {
    if (!taxRate) {
      hydratedForId.current = null;
      return;
    }
    if (hydratedForId.current === taxRate.id) return;
    hydratedForId.current = taxRate.id;

    setForm({
      zoneId: taxRate.zoneId,
      name: taxRate.name,
      rate: String(taxRate.rate),
      isActive: taxRate.isActive,
    });
    setFieldErrors({});
  }, [taxRate]);

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleClose() {
    setFieldErrors({});
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taxRate) return;

    const parsed = updateTaxRateFormSchema.safeParse({
      zoneId: form.zoneId,
      name: form.name,
      rate: form.rate,
      isActive: form.isActive,
    });

    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZodPaths(parsed.error));
      return;
    }

    setFieldErrors({});
    const d = parsed.data;

    const body: CreateTaxRateRequest = {
      name: d.name.trim(),
      rate: d.rate,
      is_active: d.isActive,
    };
    if (d.zoneId.trim() !== '') {
      const zn = Number(d.zoneId);
      if (Number.isFinite(zn)) {
        body.zone_id = zn;
      }
    }

    try {
      const updated = await updateTaxRate({
        id: taxRate.id,
        ...body,
      }).unwrap();
      toast.success(taxRateSuccessToastText(updated, `"${d.name.trim()}" updated.`));
      handleClose();
    } catch (error) {
      console.error('Failed to update tax rate', error);
      toast.error(extractServerMessage(error, 'Update failed. Please try again.'));
    }
  }

  if (!isOpen || !taxRate) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close edit tax rate overlay"
        onClick={handleClose}
        className="h-full flex-1 bg-black/40"
      />

      <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
        <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-[#111111]">
              <Pencil size={18} className="text-[#6b7280]" aria-hidden />
              Edit tax rate
            </h3>
            <p className="mt-1 text-xs text-[#6b7280]">PATCH /tax-rates/:id (JSON).</p>
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
          <div
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 pb-28"
            data-dashboard-drawer-scroll
          >
            {zonesLoading ? (
              <p className="text-xs text-[#6b7280]">Loading delivery zones…</p>
            ) : null}

            <div className="space-y-1">
              <span className="text-sm font-medium text-[#111111]">
                Delivery zone{' '}
                <span className="font-normal text-[#6b7280]">(optional)</span>
              </span>
              <DashboardSelect
                value={form.zoneId}
                onChange={(v) => {
                  setForm((p) => ({ ...p, zoneId: v }));
                  clearError('zoneId');
                }}
                options={zoneOptions}
                placeholder="No zone"
                disabled={isLoading || zonesLoading}
                hasError={Boolean(fieldErrors.zoneId)}
                aria-label="Delivery zone"
              />
              <FieldError message={fieldErrors.zoneId} />
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">
                Name <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                value={form.name}
                maxLength={TAX_RATE_NAME_MAX}
                aria-required
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'tax-edit-name-err' : undefined}
                onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value }));
                  clearError('name');
                }}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.name))}`}
              />
              <FieldError id="tax-edit-name-err" message={fieldErrors.name} />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">
                Rate (%) <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={form.rate}
                aria-required
                aria-invalid={Boolean(fieldErrors.rate)}
                aria-describedby={fieldErrors.rate ? 'tax-edit-rate-err' : undefined}
                onChange={(e) => {
                  setForm((p) => ({ ...p, rate: e.target.value }));
                  clearError('rate');
                }}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.rate))}`}
              />
              <FieldError id="tax-edit-rate-err" message={fieldErrors.rate} />
            </label>

            <ProductFormSwitch
              label="Active"
              variant="emerald"
              checked={form.isActive}
              disabled={isLoading}
              onCheckedChange={(next) => {
                setForm((p) => ({ ...p, isActive: next }));
                clearError('isActive');
              }}
            />
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
              disabled={isLoading || zonesLoading}
              className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
            >
              {isLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
