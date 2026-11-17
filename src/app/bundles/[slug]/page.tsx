import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BundleDetailsPage from '@/components/bundles/bundleDetails/BundleDetailsPage';
import { generateBundleMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return generateBundleMetadata(slug);
}

export default async function BundleSlugPage({ params }: Props) {
  const { slug } = await params;

  return (
    <>
      <TopMarquee />
      <Header />
      <BundleDetailsPage slug={slug} />
      <Footer />
    </>
  );
}