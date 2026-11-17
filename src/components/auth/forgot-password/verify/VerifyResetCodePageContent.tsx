import Container from '@/components/common/Container';
import VerifyResetCodeHeader from './VerifyResetCodeHeader';
import VerifyResetCodeForm from './verifyResetCodeForm';

export default function VerifyResetCodePageContent() {
  return (
    <main className="min-h-screen  pb-24 pt-12 md:pt-16">
      <Container>
        <div className="mx-auto max-w-[1220px]">
          <VerifyResetCodeHeader />
          <VerifyResetCodeForm />
        </div>
      </Container>
    </main>
  );
}