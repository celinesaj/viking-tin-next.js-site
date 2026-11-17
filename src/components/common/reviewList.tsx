'use client';

import { useMemo } from 'react';
import type { ProductReviewApi } from '@/types/reviews';
import { mapReviews } from '@/lib/MapReview';

type Props = {
  reviews: ProductReviewApi[];
};

export default function ReviewsList({ reviews }: Props) {
  const normalizedReviews = useMemo(() => mapReviews(reviews), [reviews]);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pt-2 sm:px-5 md:px-6 lg:px-8">
      <div className="relative py-6 sm:py-8">
        <div className="custom-review-scroll max-h-[420px] overflow-y-auto pr-1 sm:max-h-[460px] sm:pr-2 md:max-h-[510px] md:pr-4">
          <div className="space-y-4">
            {normalizedReviews.map((review) => (
              <div
                key={review.id}
                className="flex min-h-[138px] items-start gap-3 rounded-[24px] border border-[#000000] bg-white/10 px-4 py-4 backdrop-blur-[1px] sm:gap-4 sm:px-5 sm:py-5"
              >
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-black text-white sm:h-[48px] sm:w-[48px]">
                  <span className="text-sm font-bold">
                    {review.reviewerName.charAt(0)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="break-words text-[14px] font-extrabold uppercase text-black sm:text-[15px] md:text-[16px]">
                    {review.subject}
                  </h4>

                  <p className="mt-2 break-words whitespace-pre-line text-[12px] text-[#8a8a8a] sm:text-[13px] md:text-[14px]">
                    {review.comment}
                  </p>

                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-[18px] sm:text-[20px] md:text-[22px] ${
                          i < review.rating
                            ? 'text-[#DDA600]'
                            : 'text-[#909080]'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {!normalizedReviews.length && (
              <div className="text-center text-sm text-gray-500">
                No reviews yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}