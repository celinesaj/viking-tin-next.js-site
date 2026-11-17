import { Suspense } from 'react';
import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LoginPageContent from '@/components/auth/login/LoginPageContent';

export default function LoginPage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <LoginPageContent />
      </Suspense>
      <Footer />
    </>
  );
}