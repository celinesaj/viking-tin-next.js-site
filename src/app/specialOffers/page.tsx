
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

import TopMarquee from '@/components/layout/topMarquee';


import SpecialOfferPageContent from '@/components/specialOffer/SpecialOffersAll/SpecialOfferPageContent';

export const metadata = {
  title: 'Special Offers - Limited Time Deals',
  description: 'Take advantage of our limited-time special offers and deals on premium nicotine pouches. Save on your favorite flavors and bundles.',
  keywords: ['special offers', 'nicotine pouch deals', 'limited time offers', 'discounts', 'promotions'],
  openGraph: {
    title: 'Viking Tin Special Offers - Limited Time Deals',
    description: 'Take advantage of our limited-time special offers on premium nicotine pouches.',

  },
};

export default function BundlesPage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <SpecialOfferPageContent />
      <Footer />
    </>
  );
}  