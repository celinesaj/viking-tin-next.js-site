'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useGetDeliveryZonesQuery } from '@/features/delivery-zones/deliveryZonesApi';

export type AddressFormValues = {
  id?: string;
  title: string;
  address: string;
  city: string;
  deliveryZoneId: string;
  street: string;
  moreInfo: string;
  isDefault: boolean;
};

type Props = {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialData?: AddressFormValues | null;
  onClose: () => void;
  onSave: (values: AddressFormValues) => void;
};

const emptyForm: AddressFormValues = {
  title: '',
  address: '',
  city: '',
  deliveryZoneId: '',
  street: '',
  moreInfo: '',
  isDefault: false,
};

export default function AddressModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<AddressFormValues>(emptyForm);

  const { data: deliveryZones = [], isLoading: isZonesLoading } =
    useGetDeliveryZonesQuery();

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? emptyForm);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const isFormValid = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.address.trim().length > 0 &&
      form.deliveryZoneId.trim().length > 0 &&
      form.street.trim().length > 0
    );
  }, [form.title, form.address, form.deliveryZoneId, form.street]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof AddressFormValues>(
    key: K,
    value: AddressFormValues[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCityChange = (zoneId: string) => {
    const selectedZone = deliveryZones.find((zone) => String(zone.id) === zoneId);

    setForm((prev) => ({
      ...prev,
      deliveryZoneId: zoneId,
      city: selectedZone?.name ?? '',
    }));
  };

  const handleSubmit = () => {
    if (!isFormValid) return;

    onSave({
      ...form,
      title: form.title.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      street: form.street.trim(),
      moreInfo: form.moreInfo.trim(),
    });

    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[110] overflow-y-auto">
        <div className="flex min-h-full items-start justify-center px-3 py-4 sm:px-4 sm:py-6 md:items-center md:py-8">
          <div
            className="relative flex w-full max-w-[760px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:rounded-[26px] md:rounded-[30px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white px-4 pb-4 pt-4 sm:px-5 md:px-8 md:pb-5 md:pt-6">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.02em] text-black/45 md:text-[13px]">
                    Account / Address Book
                  </p>

                  <h2 className="mt-2 text-[22px] font-bold uppercase leading-[1.05] text-black sm:text-[28px] md:mt-3 md:text-[44px]">
                    {mode === 'add' ? 'Add New Address' : 'Edit Address'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-[22px] leading-none text-black transition hover:bg-black hover:text-white md:h-10 md:w-10 md:text-[26px]"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-4 pb-4 sm:px-5 sm:pb-5 md:px-8 md:pb-8">
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                <div>
                  <label className="block text-[14px] font-semibold text-black md:text-[16px]">
                    Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Home / Office"
                    className="mt-2 h-[52px] w-full rounded-[16px] border border-black bg-white px-4 text-[14px] outline-none md:mt-3 md:h-[60px] md:rounded-[22px] md:px-5 md:text-[16px]"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-black md:text-[16px]">
                    Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="mt-2 h-[52px] w-full rounded-[16px] border border-black bg-white px-4 text-[14px] outline-none md:mt-3 md:h-[60px] md:rounded-[22px] md:px-5 md:text-[16px]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="block text-[14px] font-semibold text-black md:text-[16px]">
                      City
                    </label>

                    <div className="relative">
                      <select
                        value={form.deliveryZoneId}
                        onChange={(e) => handleCityChange(e.target.value)}
                        disabled={isZonesLoading}
                        className="mt-2 h-[52px] w-full appearance-none rounded-[16px] border border-black bg-white px-4 pr-10 text-[14px] outline-none md:mt-3 md:h-[60px] md:rounded-[22px] md:px-5 md:pr-12 md:text-[16px]"
                      >
                        <option value="">
                          {isZonesLoading ? 'Loading cities...' : 'Select city'}
                        </option>

                        {deliveryZones.map((zone) => (
                          <option key={zone.id} value={String(zone.id)}>
                            {zone.name}
                          </option>
                        ))}
                      </select>

                      <ChevronDown
                        size={18}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/60 md:right-5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[14px] font-semibold text-black md:text-[16px]">
                      Street
                    </label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={(e) => handleChange('street', e.target.value)}
                      className="mt-2 h-[52px] w-full rounded-[16px] border border-black bg-white px-4 text-[14px] outline-none md:mt-3 md:h-[60px] md:rounded-[22px] md:px-5 md:text-[16px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-black md:text-[16px]">
                    More Info
                  </label>
                  <textarea
                    value={form.moreInfo}
                    onChange={(e) => handleChange('moreInfo', e.target.value)}
                    className="mt-2 min-h-[110px] w-full rounded-[16px] border border-black bg-white px-4 py-3 text-[14px] outline-none md:mt-3 md:min-h-[130px] md:rounded-[22px] md:px-5 md:py-4 md:text-[16px]"
                  />
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => handleChange('isDefault', e.target.checked)}
                    className="h-4 w-4 md:h-5 md:w-5"
                  />
                  <span className="text-[14px] font-medium text-black md:text-[16px]">
                    Set as default address
                  </span>
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap md:mt-10 md:gap-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className={`inline-flex h-[48px] w-full items-center justify-center rounded-full px-6 text-[14px] font-semibold uppercase text-white transition sm:min-w-[150px] sm:w-auto md:h-[52px] md:px-8 md:text-[15px] ${
                    isFormValid
                      ? 'bg-black hover:opacity-90'
                      : 'cursor-not-allowed bg-black/30'
                  }`}
                >
                  {mode === 'add' ? 'Add Address' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-[48px] w-full items-center justify-center rounded-full border border-black px-6 text-[14px] font-semibold uppercase text-black transition hover:bg-black hover:text-white sm:min-w-[150px] sm:w-auto md:h-[52px] md:px-8 md:text-[15px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}