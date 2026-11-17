'use client';

import { useGetBundleBySlugQuery } from '@/features/bundles/bundlesApi';
import BundleDetailsSection from './BundleDetailsSection';
import ProductReviewsSection from '@/components/common/ProductReviewsSection';
import RelatedItemsSection from '@/components/common/relatedItemsSection';
import Skeleton from '@/components/common/Skeleton';

type Props = {
  slug: string;
};

export default function BundleDetailsPage({ slug }: Props) {
  const { data: bundle, isLoading, isError } = useGetBundleBySlugQuery(slug);

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1050px] space-y-8">
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

  if (isError || !bundle) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-16 md:px-8 xl:px-12">
        <div className="rounded-[28px]  p-10 text-center text-black/60">
          Bundle not found.
        </div>
      </div>
    );
  }

 return (
 <main className="min-h-screen  px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1050px]">
        <BundleDetailsSection bundle={bundle} />
         <ProductReviewsSection itemId={bundle.id} itemType="bundle" />
         <RelatedItemsSection sourceId={bundle.id} sourceType="bundle" />
        
      </div>
    </main>
 );
}