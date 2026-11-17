export type SpecialOfferProduct = {
  id: string;
  name: string;
  slug: string;
};

export type SpecialOfferProductItem = {
  id: string;
  quantity: number;
  product: SpecialOfferProduct;
};

export type SpecialOfferGalleryImage = {
  id: string;
  url: string;
  sortOrder: number;
  createdAt: string | null;
};
export type SpecialOffer = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  products: SpecialOfferProductItem[];
  galleryImages: SpecialOfferGalleryImage[];
  originTotal: string;
};

export type SpecialOffersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SpecialOffersResponse = {
  data: SpecialOffer[];
  pagination: SpecialOffersPagination;
};