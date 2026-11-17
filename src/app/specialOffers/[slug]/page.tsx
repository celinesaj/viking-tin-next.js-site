import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SpecialOfferDetailsPage from '@/components/specialOffer/SpecialOffersDetails/SpecialOfferDetailsPage';
import { generateOfferMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return generateOfferMetadata(slug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  return (
    <>
      <TopMarquee />
      <Header />
      <SpecialOfferDetailsPage slug={slug} />
      <Footer />
    </>
  );
}