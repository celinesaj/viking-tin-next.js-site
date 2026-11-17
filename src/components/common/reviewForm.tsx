'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCreateReviewMutation } from '@/features/reviews/reviewsApi';
import type { ReviewItemType } from '@/types/reviews';

type Props = {
  itemId: string;
  itemType: Exclude<ReviewItemType, null>;
};

export default function ReviewForm({ itemId, itemType }: Props) {
  const router = useRouter();
  const [createReview, { isLoading }] = useCreateReviewMutation();

  const [rating, setRating] = useState(0);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');

  const isDisabled = useMemo(() => {
    return rating === 0 || subject.trim() === '' || text.trim() === '';
  }, [rating, subject, text]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating.');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject.');
      return;
    }

    if (!text.trim()) {
      toast.error('Please write your review.');
      return;
    }

try {
  const response = await createReview({
    item_type: itemType,
    item_id: Number(itemId),
    rating,
    title: subject.trim(),
    comment: text.trim(),
  }).unwrap();

  toast.success(response?.message || 'Review submitted successfully.');
  setRating(0);
  setSubject('');
  setText('');
} catch (err: any) {
  if (err?.status === 401 || err?.data?.statusCode === 401) {
    toast.error('You need to log in to submit a review.');
    // router.push('/login');
    return;
  }

  toast.error(err?.data?.message || 'Failed to submit review.');
}
  };

  return (
    <div className="mx-auto w-full max-w-[640px] px-10 pt-6 md:px-0 md:pt-10">
      <h3 className="text-[22px] font-extrabold uppercase leading-tight text-black sm:text-[24px] md:text-[36px]">
        Write Your Reviews
      </h3>

      <p className="mt-2 text-[12px] leading-5 text-[#7b7b7b] md:text-[13px]">
        Share your thoughts about this item.
      </p>

      <div className="mt-5">
        <p className="mb-2 text-[13px] font-bold text-[#7b7b7b]">Rate....</p>

        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i + 1)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95 ${
                i < rating ? 'text-[#DDA600]' : 'text-[#b6b6a8]'
              } text-[28px] md:h-11 md:w-11 md:text-[32px]`}
              aria-label={`Rate ${i + 1} star${i === 0 ? '' : 's'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="h-[50px] w-full rounded-[14px] border border-black/15 bg-white px-4 text-[14px] text-black placeholder:text-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-black/10 md:h-[52px]"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write Your Reviews......"
          className="mt-3 min-h-[130px] w-full resize-none rounded-[16px] border border-black/15 bg-white px-4 py-3.5 text-[14px] text-black placeholder:text-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-black/10 md:min-h-[150px]"
        />

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || isDisabled}
            className={`h-[46px] min-w-[110px] rounded-full border px-6 text-[14px] font-bold transition-all duration-300 active:scale-[0.98] ${
              isLoading || isDisabled
                ? 'cursor-not-allowed border-black/20 bg-black/35 text-white'
                : 'border-black bg-black text-white hover:bg-white hover:text-black'
            }`}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}