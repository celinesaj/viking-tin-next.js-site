export type ReviewItemType = 'product' | 'bundle' | 'special_offer' | null;

export type ProductReviewApi = {
  id: string;
  productId: string | null;
  userId: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  itemType: ReviewItemType;
  itemId: string | null;
  userName?: string | null;
  name?: string | null;
};

export type ReviewsApiResponse = {
  itemName: string;
  itemType: Exclude<ReviewItemType, null>;
  itemId: string;
  reviews: ProductReviewApi[];
};

export type Review = {
  id: string;
  reviewerName: string;
  rating: number;
  subject: string;
  comment: string;
  createdAt: string | null;
  itemType: Exclude<ReviewItemType, null> | 'product';
  itemId: string | null;
};

export type GetReviewsParams = {
  itemType: Exclude<ReviewItemType, null>;
  itemId: string;
};

export type CreateReviewPayload = {
  item_type: Exclude<ReviewItemType, null>;
  item_id: number;
  rating: number;
  title: string;
  comment: string;
};

export type CreateReviewResponse = {
  message?: string;
  review?: ProductReviewApi;
};