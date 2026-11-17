import type { ProductReviewApi, Review } from '@/types/reviews';

function normalizeString(value?: string | null, fallback = ''): string {
  if (!value) return fallback;
  const v = value.trim();
  return v.length ? v : fallback;
}

function normalizeRating(value: number | null | undefined): number {
  const r = Number(value ?? 0);
  if (Number.isNaN(r)) return 0;
  return Math.max(0, Math.min(5, r));
}

function normalizeItemType(
  type: ProductReviewApi['itemType']
): Review['itemType'] {
  if (type === 'product' || type === 'bundle' || type === 'special_offer') {
    return type;
  }

  return 'product';
}

export function mapReview(apiReview: ProductReviewApi): Review {
  return {
    id: String(apiReview.id),

    reviewerName:
      normalizeString(apiReview.userName) ||
      normalizeString(apiReview.name) ||
      'Anonymous User',

    rating: normalizeRating(apiReview.rating),

    subject: normalizeString(apiReview.title, 'Untitled Review'),

    comment: normalizeString(apiReview.comment, ''),

    createdAt: apiReview.createdAt ?? null,

    itemType: normalizeItemType(apiReview.itemType),

    itemId: apiReview.itemId ?? apiReview.productId ?? null,
  };
}

export function mapReviews(apiReviews: ProductReviewApi[]): Review[] {
  if (!Array.isArray(apiReviews)) return [];

  return apiReviews.filter((review) => review?.isApproved).map(mapReview);
}