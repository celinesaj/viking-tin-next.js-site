import type { ContactFormErrors, ContactFormValues } from '@/types/contact-form';

const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// Accepts formats like:
// +971501234567
// +971 50 123 4567
// 0501234567
// 00971501234567
const PHONE_REGEX =
    /^[+]?[0-9\s\-()]{7,20}$/;

export function validateFullName(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) return 'Full name is required.';
    if (trimmed.length < 2) return 'Full name must be at least 2 characters.';
    if (trimmed.length > 100) return 'Full name must be under 100 characters.';

    return '';
}

export function validateEmail(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) return 'Email is required.';
    if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address.';

    return '';
}

export function validatePhone(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) return 'Phone number is required.';
    if (!PHONE_REGEX.test(trimmed)) return 'Enter a valid phone number.';
    if (trimmed.replace(/[^\d]/g, '').length < 7) {
        return 'Phone number is too short.';
    }

    return '';
}

export function validateSubject(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) return 'Subject is required.';
    if (trimmed.length < 3) return 'Subject must be at least 3 characters.';
    if (trimmed.length > 150) return 'Subject must be under 150 characters.';

    return '';
}

export function validateMessage(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) return 'Message is required.';
    if (trimmed.length < 10) return 'Message must be at least 10 characters.';
    if (trimmed.length > 2000) return 'Message must be under 2000 characters.';

    return '';
}

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
    return {
        fullName: validateFullName(values.fullName),
        email: validateEmail(values.email),
        phone: validatePhone(values.phone),
        subject: validateSubject(values.subject),
        message: validateMessage(values.message),
    };
}

export function hasContactFormErrors(errors: ContactFormErrors): boolean {
    return Object.values(errors).some(Boolean);
}