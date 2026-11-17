import type { Metadata } from 'next';
import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PointOfSalePageContent from '@/components/poin-of-sale/PointOfSalePageContent';
import { pointOfSalePageData } from '@/mock/pointOfSale';

export const metadata: Metadata = {
  title: 'Point Of Store | Viking Tin',
  description:
    'Find the closest Viking Tin retail location and open directions instantly.',
};

export default function PointOfSalePage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <PointOfSalePageContent  />
      <Footer />
    </>
  );
}