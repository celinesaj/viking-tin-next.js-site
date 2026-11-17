import type { Metadata } from 'next';
import ResetPasswordPageContent from '@/components/auth/forgot-password/reset/ResetPasswordPageContent';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Create your new password',
};

export default function ResetPasswordPage() {
  return <ResetPasswordPageContent />;
}