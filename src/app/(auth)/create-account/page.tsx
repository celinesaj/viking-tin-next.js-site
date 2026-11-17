import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CreateAccountPageContent from '@/components/auth/create-account/CreateAccountPageContent';

export default function CreateAccountPage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <CreateAccountPageContent />
      <Footer />
    </>
  );
}