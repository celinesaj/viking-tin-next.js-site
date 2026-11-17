import Container from '@/components/common/Container';
import ResetPasswordHeader from './ResetPasswordHeader';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPageContent() {
  return (
    <main className="min-h-screen  pb-24 pt-12 md:pt-16">
      <Container>
        <div className="mx-auto max-w-[1220px]">
          <ResetPasswordHeader />
          <ResetPasswordForm />
        </div>
      </Container>
    </main>
  );
}