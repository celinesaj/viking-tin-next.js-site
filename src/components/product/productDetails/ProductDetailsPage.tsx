'use client';

import { useGetProductBySlugQuery } from '@/features/products/productsApi';
import ProductDetailsSection from './ProductDetailsSection';
import ProductReviewsSection from '../../common/ProductReviewsSection';

import RelatedItemsSection from '@/components/common/relatedItemsSection';

type Props = {
  slug: string;
};

export default function ProductDetailsPage({ slug }: Props) {
  const { data: product, isLoading, isError } = useGetProductBySlugQuery(slug);

  if (isLoading) {
    return (
      <main className="min-h-screen  px-4 py-10">
        <div className="mx-auto max-w-[1050px] animate-pulse">
          <div className="grid gap-8 lg:grid-cols-[420px_minmax(0,360px)] lg:justify-center">
            <div>
              <div className="aspect-square rounded-[24px] bg-[#f3f3f3]" />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="aspect-square rounded-[18px] bg-[#f3f3f3]" />
                <div className="aspect-square rounded-[18px] bg-[#f3f3f3]" />
                <div className="aspect-square rounded-[18px] bg-[#f3f3f3]" />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="h-12 w-64 rounded bg-[#f3f3f3]" />
              <div className="h-5 w-40 rounded bg-[#f3f3f3]" />
              <div className="h-24 w-full rounded bg-[#f3f3f3]" />
              <div className="h-10 w-32 rounded bg-[#f3f3f3]" />
              <div className="h-12 w-40 rounded-full bg-[#f3f3f3]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="min-h-screen  px-4 py-10">
        <div className="mx-auto max-w-[1050px]">
          <p className="text-lg font-medium text-red-600">
            Failed to load product details.
          </p>
        </div>
      </main>
    );
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || 'Premium nicotine pouch from Viking Tin',
    image: product.coverImageUrl || product.media?.[0]?.url,
    brand: { '@type': 'Brand', name: 'Viking Tin' },
    offers: {
      '@type': 'Offer',
      price: product.offer_price || product.price || '0',
      priceCurrency: 'AED',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      condition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <main className="min-h-screen  px-4 py-8 md:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-[1050px]">
        <ProductDetailsSection product={product} />
        <ProductReviewsSection
          itemId={product.id}
          itemType="product"
        />
        <RelatedItemsSection sourceId={product.id} sourceType="product" />
      </div>
    </main>
  );
}