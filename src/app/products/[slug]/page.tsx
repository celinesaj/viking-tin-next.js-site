

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import TopMarquee from '@/components/layout/topMarquee';
import ProductDetailsPage from '@/components/product/productDetails/ProductDetailsPage';
import { getLocalProductBySlug, localProducts } from '@/data/localCatalog';

export const revalidate = 3600;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProduct(slug: string) {
  return getLocalProductBySlug(slug);
}

export async function generateStaticParams() {
  return localProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  const title =
    product?.metaTitle ||
    product?.name ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const description =
    product?.metaDescription ||
    product?.description?.replace(/<[^>]*>/g, '').slice(0, 155) ||
    'Premium nicotine pouches from Viking Tin. Fast delivery across UAE.';

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${slug}`,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return (
    <>
      <TopMarquee />
      <Header />
      <ProductDetailsPage slug={slug} />
      <Footer />
    </>
  );
}

