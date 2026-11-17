'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthTextField from '../AuthTextField';
import CountryCodeSelect from '../CountryCodeSelect';
import { useCreateAccountMutation } from '@/features/auth/authApi';
import { useGetDeliveryZonesQuery } from '@/features/delivery-zones/deliveryZonesApi';
import type { CreateAccountPayload } from '@/types/user';
import {
  hasCreateAccountErrors,
  validateCreateAccountForm,
} from '@/services/validations/authValidations';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_VALUES: CreateAccountPayload = {
  first_name: '',
  last_name: '',
  email: '',
  countryCode: '+971',
  phone: '',
  password: '',
  address: '',
  city: '',
  deliveryZoneId: '',
  street: '',
};

export default function CreateAccountForm() {
  const router = useRouter();

  const [form, setForm] = useState<CreateAccountPayload>(INITIAL_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [createAccount, { isLoading }] = useCreateAccountMutation();

  const { data: deliveryZones = [], isLoading: isZonesLoading } =
    useGetDeliveryZonesQuery();

  const errors = useMemo(() => validateCreateAccountForm(form), [form]);

  const updateField = <K extends keyof CreateAccountPayload>(
    key: K,
    value: CreateAccountPayload[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCityChange = (zoneId: string) => {
    const selectedZone = deliveryZones.find(
      (zone) => String(zone.id) === zoneId
    );

    setForm((prev) => ({
      ...prev,
      deliveryZoneId: zoneId,
      city: selectedZone?.name ?? '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (hasCreateAccountErrors(errors)) {
      const shown = new Set<string>();

      Object.values(errors).forEach((err) => {
        if (err && !shown.has(err)) {
          shown.add(err);
          toast.error(err);
        }
      });

      return;
    }

    try {
      const email = form.email.trim();

      const response = await createAccount({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email,
        password: form.password,
        phone: `${form.countryCode}${form.phone.trim()}`,
        address: form.address.trim(),
        city: form.city.trim(),
        deliveryZoneId: form.deliveryZoneId,
        street: form.street.trim(),
      }).unwrap();

      toast.success(response.message || 'Account created successfully.');
      setForm(INITIAL_VALUES);
      setSubmitAttempted(false);
      setShowPassword(false);

      setTimeout(() => {
        router.replace(`/verify-signup?email=${encodeURIComponent(email)}`);
        router.refresh();
      }, 800);
    } catch (err: any) {
      toast.error(
        err?.data?.message || 'Failed to create account. Please try again.'
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-[920px] px-4 sm:px-5 md:px-0"
    >
      <div className="space-y-6 md:space-y-8">
        <AuthTextField
          label="E-mail"
          type="email"
          value={form.email}
          placeholder="Enter Your E-mail........"
          error={submitAttempted ? errors.email : undefined}
          onChange={(value) => updateField('email', value)}
        />

        <div className="grid gap-5 md:grid-cols-2 md:gap-8">
          <AuthTextField
            label="First Name"
            value={form.first_name}
            placeholder="Enter Your First Name........"
            error={submitAttempted ? errors.first_name : undefined}
            onChange={(value) => updateField('first_name', value)}
          />

          <AuthTextField
            label="Last Name"
            value={form.last_name}
            placeholder="Enter Your Last Name........"
            error={submitAttempted ? errors.last_name : undefined}
            onChange={(value) => updateField('last_name', value)}
          />
        </div>

        <AuthTextField
          label="Phone Number"
          type="tel"
          value={form.phone}
          placeholder="Enter Your Phone Number........"
          error={submitAttempted ? errors.phone : undefined}
          onChange={(value) =>
            updateField('phone', value.replace(/\D/g, ''))
          }
          leftElement={
            <CountryCodeSelect
              value={form.countryCode}
              onChange={(value) => updateField('countryCode', value)}
              error={submitAttempted ? errors.countryCode : undefined}
            />
          }
        />

        <div className="grid gap-5 md:grid-cols-2 md:gap-8">
          <div>
            <label className="mb-3 block text-[18px] font-medium text-black">
              City
            </label>

            <div className="relative">
              <select
                value={form.deliveryZoneId}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={isZonesLoading}
                className="h-[58px] w-full appearance-none rounded-[18px] border border-black  px-4 pr-10 text-[15px] outline-none md:h-[64px]"
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
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/60"
              />
            </div>

            {submitAttempted && (errors as any).deliveryZoneId ? (
              <p className="mt-2 text-sm text-red-500">
                {(errors as any).deliveryZoneId}
              </p>
            ) : null}
          </div>

          <AuthTextField
            label="Street"
            value={form.street}
            placeholder="Enter Your Street........"
            error={submitAttempted ? (errors as any).street : undefined}
            onChange={(value) => updateField('street', value)}
          />
        </div>

        <AuthTextField
          label="Address"
          value={form.address}
          placeholder="Enter Your Address........"
          error={submitAttempted ? errors.address : undefined}
          onChange={(value) => updateField('address', value)}
        />

        <AuthTextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          placeholder="Enter Your Password........"
          error={submitAttempted ? errors.password : undefined}
          onChange={(value) => updateField('password', value)}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-black/60 transition hover:bg-black/5 hover:text-black"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={18} strokeWidth={2.2} />
              ) : (
                <Eye size={18} strokeWidth={2.2} />
              )}
            </button>
          }
        />
      </div>

      <div className="mt-10 flex flex-col items-center md:mt-12">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full max-w-[320px] items-center justify-center rounded-full border border-black bg-black px-6 py-4 text-[16px] font-semibold uppercase text-white transition-all duration-300 ease-in-out hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:px-10 md:py-5 md:text-[18px]"
        >
          {isLoading ? 'Creating...' : 'Create'}
        </button>

        <p className="mt-5 text-[14px] text-[#9c97b2] md:mt-6 md:text-[16px]">
          Already Have an Account?{' '}
          <Link href="/login" className="font-semibold text-black">
            Login
          </Link>
        </p>
      </div>
    </form>
  );
}