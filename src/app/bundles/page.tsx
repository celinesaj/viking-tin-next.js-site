
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

import TopMarquee from '@/components/layout/topMarquee';

import BundlesPageContent from '@/components/bundles/AllBundles/BundlesPageCotent';

export const metadata = {
  title: 'Bundles - Value Packs & Collections',
  description: 'Explore our curated bundles and value packs of premium nicotine pouches. Save more when you buy in bulk with our specially designed collections.',
  keywords: ['nicotine pouch bundles', 'value packs', 'bulk nicotine', 'product collections', 'save on nicotine'],
  openGraph: {
    title: 'Viking Tin Bundles - Value Packs & Collections',
    description: 'Explore our curated bundles and save on premium nicotine pouches.',

  },
};

export default function BundlesPage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <BundlesPageContent />
      <Footer />
    </>
  );
}