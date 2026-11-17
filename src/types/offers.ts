export type OfferProductRef = {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type Offer = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  scope: string;
  discountType: string;
  discountValue: string;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  products: OfferProductRef[];
};

export type OffersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OffersResponse = {
  data: Offer[];
  pagination: OffersPagination;
};
