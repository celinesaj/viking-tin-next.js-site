export type ProductReviewAdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
};

export type ProductReviewAdmin = {
  id: string;
  userId: string;
  user: ProductReviewAdminUser | null;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  itemType: string;
  itemId: string;
  itemName: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProductReviewsAdminResponse = {
  data: ProductReviewAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
