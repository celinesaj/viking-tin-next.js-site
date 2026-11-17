import Container from '@/components/common/Container';
import ForgotPasswordHeader from './ForgotPasswordHeader';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function ForgotPasswordPageContent() {
  return (
    <main className="min-h-screen  pb-24 pt-12 md:pt-16">
      <Container>
        <div className="mx-auto max-w-[1220px]">
          <ForgotPasswordHeader />
          <ForgotPasswordForm />
        </div>
      </Container>
    </main>
  );
}