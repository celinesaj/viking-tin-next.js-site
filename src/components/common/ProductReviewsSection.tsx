'use client';

import { useState } from 'react';
import { IMAGES } from '@/constants/images';
import ReviewForm from './reviewForm';
import ReviewsList from './reviewList';
import { useGetReviewsByItemQuery } from '@/features/reviews/reviewsApi';
import Skeleton from '@/components/common/Skeleton';

type Props = {
  itemId: string;
  itemType: 'product' | 'bundle' | 'special_offer';
};

export default function ProductReviewsSection({
  itemId,
  itemType,
}: Props) {
  const [activeTab, setActiveTab] = useState<'comment' | 'review'>('comment');

  const { data, isLoading } = useGetReviewsByItemQuery({
    itemId,
    itemType,
  });

  const reviews = data?.reviews ?? [];

  return (
    <section
      className="relative left-1/2 right-1/2 mt-24 w-screen -translate-x-1/2 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${IMAGES.flavour.bg})`,
      }}
    >
      <div className="absolute left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-1/2 gap-3">
        {/* Write Comment Button */}
        <button
          onClick={() => setActiveTab('comment')}
          className={`h-[48px] min-w-[180px] rounded-full px-8 transition-all duration-200 ${
            activeTab === 'comment'
              ? 'bg-black text-white'
              : 'border border-black bg-[#efefef] text-black hover:bg-black hover:text-white'
          }`}
        >
          Write comment
        </button>

        {/* Review Button */}
        <button
          onClick={() => setActiveTab('review')}
          className={`h-[48px] min-w-[140px] rounded-full px-8 transition-all duration-200 ${
            activeTab === 'review'
              ? 'bg-black text-white'
              : 'border border-black bg-[#efefef] text-black hover:bg-black hover:text-white'
          }`}
        >
          Review
        </button>
      </div>

      <div className="relative z-10 pb-16 pt-16">
        {activeTab === 'comment' ? (
          <ReviewForm itemId={itemId} itemType={itemType} />
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <div className="space-y-3">
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-80" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        ) : (
          <ReviewsList reviews={reviews} />
        )}
      </div>
    </section>
  );
}