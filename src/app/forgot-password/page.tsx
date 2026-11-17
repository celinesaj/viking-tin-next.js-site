import type { Metadata } from 'next';
import ForgotPasswordPageContent from '@/components/auth/forgot-password/ForgotPasswordContent';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your account password',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageContent />;
}