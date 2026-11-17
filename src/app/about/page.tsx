import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AboutPageContent from '@/components/about/AboutPageContent';

export const metadata = {
  title: 'About Viking Tin | Curated Nicotine Pouches in the UAE',
  description: 'Discover Viking Tin\'s mission to provide a cleaner, modern nicotine experience. We curate the highest quality, smoke-free nicotine pouches for our customers in the UAE.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <AboutPageContent />
      <Footer />
    </>
  );
}