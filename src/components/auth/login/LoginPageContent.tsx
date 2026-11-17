'use client';

import Container from '@/components/common/Container';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';

export default function LoginPageContent() {
  return (
    <main className="min-h-screen  pb-24 pt-12 md:pt-16">
      <Container>
        <div className="mx-auto max-w-[1220px]">
          <LoginHeader />
          <LoginForm />
        </div>
      </Container>
    </main>
  );
}