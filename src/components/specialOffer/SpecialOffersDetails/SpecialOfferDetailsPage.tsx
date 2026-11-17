'use client';

import { useGetSpecialOfferBySlugQuery } from '@/features/special-offers/specialOffersApi';
import SpecialOfferDetailsSection from './SpecialOfferDetailsSection';
import ProductReviewsSection from '@/components/common/ProductReviewsSection';
import RelatedItemsSection from '@/components/common/relatedItemsSection';
import Skeleton from '@/components/common/Skeleton';

type Props = {
  slug: string;
};

export default function SpecialOfferDetailsPage({ slug }: Props) {
  const { data, isLoading, isError } =
    useGetSpecialOfferBySlugQuery(slug);

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1050px] space-y-10">
          <div className="grid gap-8 lg:grid-cols-[420px_minmax(0,360px)] lg:justify-center">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-[24px]" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="aspect-square rounded-[18px]" />
                <Skeleton className="aspect-square rounded-[18px]" />
                <Skeleton className="aspect-square rounded-[18px]" />
              </div>
            </div>
            <div className="space-y-4 pt-2">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-12 w-40 rounded-full" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40 w-full rounded-[22px]" />
          </div>
        </div>
      </main>
    );
  }
  if (isError || !data) return <div className="p-20 text-center">Not found</div>;

  return (
    <main className="min-h-screen  px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1050px]">
        <SpecialOfferDetailsSection offer={data} />;
        <ProductReviewsSection itemId={data.id} itemType="special_offer" />
        <RelatedItemsSection sourceId={data.id} sourceType="special_offer" />
      </div>
    </main>

  );







}
