import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CheckoutPageContent from '@/components/checkout/CheckoutPageContent';

export default function CheckoutPage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <CheckoutPageContent />
      <Footer />
    </>
  );
}