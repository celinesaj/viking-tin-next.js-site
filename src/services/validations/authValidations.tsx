import type { CreateAccountPayload } from '@/types/user';

export type CreateAccountErrors = Partial<
  Record<keyof CreateAccountPayload, string>
>;

export function validateEmail(email: string): string {
  const normalized = email.trim();

  if (!normalized) return 'Email is required.';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) return 'Enter a valid email address.';

  return '';
}

export function validateFirstName(firstName: string): string {
  const value = firstName.trim();

  if (!value) return 'First name is required.';
  if (value.length < 2) return 'First name must be at least 2 characters.';

  return '';
}

export function validateLastName(lastName: string): string {
  const value = lastName.trim();

  if (!value) return 'Last name is required.';
  if (value.length < 2) return 'Last name must be at least 2 characters.';

  return '';
}

export function validateCountryCode(countryCode: string): string {
  if (!countryCode.trim()) return 'Country code is required.';
  return '';
}

export function validatePhoneNumber(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  if (!digitsOnly) return 'Phone number is required.';
  if (digitsOnly.length < 7) return 'Enter a valid phone number.';

  return '';
}

export function validatePassword(password: string): string {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';

  return '';
}

export function validateCreateAccountForm(
  values: CreateAccountPayload
): CreateAccountErrors {
  const errors: CreateAccountErrors = {};

  const firstNameError = validateFirstName(values.first_name);
  const lastNameError = validateLastName(values.last_name);
  const emailError = validateEmail(values.email);
  const countryCodeError = validateCountryCode(values.countryCode);
  const phoneError = validatePhoneNumber(values.phone);
  const passwordError = validatePassword(values.password);

  if (firstNameError) errors.first_name = firstNameError;
  if (lastNameError) errors.last_name = lastNameError;
  if (emailError) errors.email = emailError;
  if (countryCodeError) errors.countryCode = countryCodeError;
  if (phoneError) errors.phone = phoneError;
  if (passwordError) errors.password = passwordError;

  return errors;
}

export function hasCreateAccountErrors(errors: CreateAccountErrors): boolean {
  return Object.values(errors).some(Boolean);
}
export type LoginErrors = {
  email?: string;
  password?: string;
};
////login
export function validateLoginForm(values: {
  email: string;
  password: string;
}): LoginErrors {
  const errors: LoginErrors = {};

  const email = values.email.trim();

  if (!email) {
    errors.email = 'Email is required.';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Enter a valid email address.';
    }
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

export function hasLoginErrors(errors: LoginErrors): boolean {
  return Object.values(errors).some(Boolean);
}