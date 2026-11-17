import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FaqPageContent from '@/components/faq/FaqPageContent';

export const metadata = {
  title: 'FAQ - Frequently Asked Questions',
  description: 'Find answers to common questions about Viking Tin nicotine pouches, usage, safety, shipping, and more.',
  keywords: ['nicotine pouch FAQ', 'frequently asked questions', 'nicotine usage', 'shipping info', 'product safety'],
  openGraph: {
    title: 'Viking Tin FAQ - Frequently Asked Questions',
    description: 'Find answers to common questions about our premium nicotine pouches.',
 
  },
};

export default function FaqPage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <FaqPageContent />
      <Footer />
    </>
  );
}