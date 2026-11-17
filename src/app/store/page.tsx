
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

import TopMarquee from '@/components/layout/topMarquee';
import ProductsPageContent from '@/components/product/AllProducts/ProductsPageContent';

export const metadata = {
  title: 'Store - All Products',
  description: 'Browse our complete collection of premium nicotine pouches at Viking Tin. Find your perfect flavor and strength level from our extensive product range.',
  keywords: ['nicotine pouches store', 'all products', 'nicotine pouch collection', 'premium nicotine', 'flavors and strengths'],
  openGraph: {
    title: 'Viking Tin Store - All Premium Nicotine Pouches',
    description: 'Browse our complete collection of premium nicotine pouches. Find your perfect flavor and strength.',
    
  },
};

export default function ProductsPage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <ProductsPageContent />
      <Footer />
    </>
  );
}