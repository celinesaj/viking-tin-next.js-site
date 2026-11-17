import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ContactPageContent from '@/components/contact//ContactpageContent';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Viking Tin. Find our contact information, location, and reach out with any questions about our premium nicotine pouches.',
  keywords: ['contact viking tin', 'customer support', 'nicotine pouch inquiries', 'contact information'],
  openGraph: {
    title: 'Contact Viking Tin - Get In Touch',
    description: 'Get in touch with Viking Tin. Find our contact information and location.',

  },
};

export default function ContactPage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <ContactPageContent />
      <Footer />
    </>
  );
}