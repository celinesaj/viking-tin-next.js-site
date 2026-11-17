

import dynamic from 'next/dynamic';
import { COLORS } from '@/constants/colors';
import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import HeroBanner from '@/components/hero/HeroBanner';
import Footer from '@/components/layout/Footer';
import { IMAGES } from '@/constants/images';
import LazyLoadSection from '@/components/common/LazyLoadSection';

const BrandsSection = dynamic(() => import('@/components/brands/brands'));
const BestSellingProductsSection = dynamic(
  () => import('@/components/product/bestSellingSection'),
);
const FlavorCategoriesSection = dynamic(
  () => import('@/components/flavours/FlavourCategoriesSection'),
);
const OffersSection = dynamic(() => import('@/components/bundles/bundleSection'));
const SpecialOffersSection = dynamic(
  () => import('@/components/specialOffer/offerSection'),
);
const WhyChooseUsBanner = dynamic(
  () => import('@/components/whoChooseUs/whyChooseUsBanner'),
);
const NewProductsSection = dynamic(
  () => import('@/components/product/NewProductsSection'),
);
const StrengthSection = dynamic(
  () => import('@/components/strength-lvl/StrengthSection'),
);
const HomePageStory = dynamic(() => import('@/components/homePageStory'));
const TestimonialsSection = dynamic(
  () => import('@/components/testimonials/testimonialSection'),
);
const HomePageBlogs = dynamic(() => import('@/components/blogs/HomePageBlogs'));
const SeoFooterSection = dynamic(() => import('@/components/seoFooterSection'));

export const metadata = {
  title: 'Home',
  description: 'Welcome to Viking Tin - Your premium destination for high-quality nicotine pouches. Explore our wide range of flavors, strengths, and special offers.',
  keywords: ['nicotine pouches', 'premium nicotine', 'snus alternatives', 'tobacco free', 'discreet nicotine', 'viking tin'],
  openGraph: {
    title: 'Viking Tin - Premium Nicotine Pouches',
    description: 'Welcome to Viking Tin - Your premium destination for high-quality nicotine pouches. Explore our wide range of flavors, strengths, and special offers.',
  },
};

export default function Page() {
  return (
    <main style={{ backgroundColor: COLORS.pageBg }}>
      <TopMarquee />
      <Header />
      <HeroBanner />
      <div>
        <LazyLoadSection>
          <BrandsSection />
        </LazyLoadSection>

        <LazyLoadSection>
          <BestSellingProductsSection />
        </LazyLoadSection>

        <LazyLoadSection>
          <FlavorCategoriesSection />
        </LazyLoadSection>

        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${IMAGES.imgwrapper.bgimgwrapper})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
              opacity: 0.15,
            }}
          />

          <div className="relative z-10">
            <LazyLoadSection>
              <OffersSection />
            </LazyLoadSection>
            <LazyLoadSection>
              <SpecialOffersSection />
            </LazyLoadSection>
            <LazyLoadSection>
              <WhyChooseUsBanner />
            </LazyLoadSection>
          </div>
        </div>

        <LazyLoadSection>
          <NewProductsSection />
        </LazyLoadSection>

        <LazyLoadSection>
          <StrengthSection />
        </LazyLoadSection>

        <LazyLoadSection>
          <HomePageStory />
        </LazyLoadSection>

        <LazyLoadSection>
          <TestimonialsSection />
        </LazyLoadSection>

        <LazyLoadSection>
          <HomePageBlogs />
        </LazyLoadSection>
      </div>
      <LazyLoadSection>
        <SeoFooterSection />
      </LazyLoadSection>
      <Footer />
    </main>
  );
}
