'use client';

import { useMemo, useState } from 'react';
import { useSubmitContactFormMutation } from '@/features/contact-form/contactFormApi';
import {
  hasContactFormErrors,
  validateContactForm,
  validateEmail,
  validateFullName,
  validateMessage,
  validatePhone,
  validateSubject,
} from '@/lib/contactFormValidation';
import type {
  ContactFormErrors,
  ContactFormValues,
} from '@/types/contact-form';

const INITIAL_VALUES: ContactFormValues = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const INITIAL_ERRORS: ContactFormErrors = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Something went wrong. Please try again.';
  }

  const err = error as {
    status?: number | string;
    data?: {
      message?: string | string[];
      error?: string;
    };
    error?: string;
  };

  if (Array.isArray(err.data?.message)) {
    return err.data.message.join(', ');
  }

  if (typeof err.data?.message === 'string' && err.data.message.trim()) {
    return err.data.message;
  }

  if (typeof err.data?.error === 'string' && err.data.error.trim()) {
    return err.data.error;
  }

  if (typeof err.error === 'string') {
    if (err.error.toLowerCase().includes('failed to fetch')) {
      return 'Network error. Check your connection or backend CORS settings.';
    }

    return err.error;
  }

  if (err.status === 'FETCH_ERROR') {
    return 'Unable to reach the server. Check your connection or backend CORS settings.';
  }

  if (err.status === 400) {
    return 'Invalid form data. Please review your inputs.';
  }

  if (err.status === 401) {
    return 'You are not authorized to perform this action.';
  }

  if (err.status === 403) {
    return 'Access denied.';
  }

  if (err.status === 404) {
    return 'The endpoint was not found.';
  }

  if (err.status === 409) {
    return 'A conflict occurred while submitting the form.';
  }

  if (err.status === 413) {
    return 'The submitted content is too large.';
  }

  if (err.status === 422) {
    return 'Validation failed. Please check your entries.';
  }

  if (err.status === 429) {
    return 'Too many requests. Please wait a bit and try again.';
  }

  if (err.status === 500) {
    return 'Server error. Please try again later.';
  }

  return 'Something went wrong. Please try again.';
}

export default function ContactForm() {
  const [form, setForm] = useState<ContactFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ContactFormErrors>(INITIAL_ERRORS);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [submitContactForm, { isLoading }] = useSubmitContactFormMutation();

  const updateField = <K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setSubmitSuccess('');
    setSubmitError('');

    setErrors((prev) => ({
      ...prev,
      [key]: '',
    }));
  };

  const validateSingleField = (
    key: keyof ContactFormValues,
    value: string
  ): string => {
    switch (key) {
      case 'fullName':
        return validateFullName(value);
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'subject':
        return validateSubject(value);
      case 'message':
        return validateMessage(value);
      default:
        return '';
    }
  };

  const handleBlur = (key: keyof ContactFormValues) => {
    const error = validateSingleField(key, form[key]);
    setErrors((prev) => ({
      ...prev,
      [key]: error,
    }));
  };

  const handleCancel = () => {
    setForm(INITIAL_VALUES);
    setErrors(INITIAL_ERRORS);
    setSubmitSuccess('');
    setSubmitError('');
  };

  const isFormValid = useMemo(() => {
    const nextErrors = validateContactForm(form);
    return !hasContactFormErrors(nextErrors);
  }, [form]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors = validateContactForm(form);
    setErrors(nextErrors);
    setSubmitSuccess('');
    setSubmitError('');

    if (hasContactFormErrors(nextErrors)) return;

    try {
      const response = await submitContactForm({
        name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      }).unwrap();

      setSubmitSuccess(response.message || 'Your message has been sent.');
      setForm(INITIAL_VALUES);
      setErrors(INITIAL_ERRORS);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      console.error('Contact form submit failed:', error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto w-full max-w-[860px] px-4 sm:px-5 md:px-0"
    >
      <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <label className="mb-2 block text-[14px] sm:text-[15px] font-semibold text-black">
            Full Name
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder="Enter your full name"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            className={`h-[52px] sm:h-[56px] w-full rounded-[12px] bg-white px-4 sm:px-5 text-[14px] sm:text-[15px] outline-none placeholder:text-black/25 ${errors.fullName ? 'border border-red-500' : 'border border-black/45'
              }`}
          />
          {errors.fullName && (
            <p id="fullName-error" className="mt-2 text-[13px] sm:text-sm text-red-600">
              {errors.fullName}
            </p>
          )}
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-[14px] sm:text-[15px] font-semibold text-black">
            Email Address
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="Enter your email address"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`h-[52px] sm:h-[56px] w-full rounded-[12px] bg-white px-4 sm:px-5 text-[14px] sm:text-[15px] outline-none placeholder:text-black/25 ${errors.email ? 'border border-red-500' : 'border border-black/45'
              }`}
          />
          {errors.email && (
            <p id="email-error" className="mt-2 text-[13px] sm:text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 min-w-0">
        <label className="mb-2 block text-[14px] sm:text-[15px] font-semibold text-black">
          Phone Number
        </label>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          placeholder="Enter your phone number"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          className={`h-[52px] sm:h-[56px] w-full rounded-[12px] bg-white px-4 sm:px-5 text-[14px] sm:text-[15px] outline-none placeholder:text-black/25 ${errors.phone ? 'border border-red-500' : 'border border-black/45'
            }`}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-2 text-[13px] sm:text-sm text-red-600">
            {errors.phone}
          </p>
        )}
      </div>

      <div className="mt-5 min-w-0">
        <label className="mb-2 block text-[14px] sm:text-[15px] font-semibold text-black">
          Subject
        </label>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => updateField('subject', e.target.value)}
          onBlur={() => handleBlur('subject')}
          placeholder="Enter subject"
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
          className={`h-[52px] sm:h-[56px] w-full rounded-[12px] bg-white px-4 sm:px-5 text-[14px] sm:text-[15px] outline-none placeholder:text-black/25 ${errors.subject ? 'border border-red-500' : 'border border-black/45'
            }`}
        />
        {errors.subject && (
          <p id="subject-error" className="mt-2 text-[13px] sm:text-sm text-red-600">
            {errors.subject}
          </p>
        )}
      </div>

      <div className="mt-5 min-w-0">
        <label className="mb-2 block text-[14px] sm:text-[15px] font-semibold text-black">
          Messages
        </label>
        <textarea
          value={form.message}
          onChange={(e) => updateField('message', e.target.value)}
          onBlur={() => handleBlur('message')}
          placeholder="Enter your message"
          rows={6}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className={`min-h-[140px] sm:min-h-[160px] w-full resize-y rounded-[12px] bg-white px-4 sm:px-5 py-4 text-[14px] sm:text-[15px] outline-none placeholder:text-black/25 ${errors.message ? 'border border-red-500' : 'border border-black/45'
            }`}
        />
        {errors.message && (
          <p id="message-error" className="mt-2 text-[13px] sm:text-sm text-red-600">
            {errors.message}
          </p>
        )}
      </div>

      <div className="mt-4 min-h-[24px]">
        {submitSuccess && (
          <p className="text-[13px] sm:text-sm text-green-600">{submitSuccess}</p>
        )}
        {submitError && (
          <p className="text-[13px] sm:text-sm text-red-600">{submitError}</p>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`inline-flex h-[52px] sm:h-auto w-full sm:min-w-[150px] sm:w-auto items-center justify-center rounded-full px-6 sm:px-8 py-3 sm:py-4 text-[15px] sm:text-[18px] font-medium uppercase text-white transition ${isFormValid && !isLoading
              ? 'bg-black hover:opacity-90'
              : 'cursor-not-allowed bg-black/30'
            }`}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="inline-flex h-[52px] sm:h-auto w-full sm:min-w-[150px] sm:w-auto items-center justify-center rounded-full border border-black/35 bg-transparent px-6 sm:px-8 py-3 sm:py-4 text-[15px] sm:text-[18px] font-medium uppercase text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}