'use client';

import Container from '@/components/common/Container';
import CreateAccountHeader from './CreateAccountHeader';
import CreateAccountForm from './CreateAccountForm';

export default function CreateAccountPageContent() {
  return (
    <main className="min-h-screen  pb-24 pt-12 md:pt-16">
      <Container>
        <div className="mx-auto max-w-[1220px]">
          <CreateAccountHeader />
          <CreateAccountForm />
        </div>
      </Container>
    </main>
  );
}