import type { Metadata } from 'next';
import VerifyResetCodePageContent from '@/components/auth/forgot-password/verify/VerifyResetCodePageContent';

export const metadata: Metadata = {
  title: 'Verify Reset Code',
  description: 'Verify your password reset code',
};

export default function VerifyResetCodePage() {
  return <VerifyResetCodePageContent />;
}