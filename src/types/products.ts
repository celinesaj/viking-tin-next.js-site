export type ProductMedia = {
  id: string;
  mediaType: 'image' | 'video';
  url: string;
  sortOrder: number;
  createdAt: string | null;
};

/** GET/POST/PATCH /products/:id/why-choose */
export type ProductWhyChooseRow = {
  id: string;
  productId: string;
  reason: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export type Product = {
  id: string;
  brandId: string;
  flavorId: string;
  strengthId: string;

  /** Populated by list/detail API when joined */
  brandName?: string | null;
  flavorName?: string | null;
  strengthName?: string | null;
  strengthNicotineMg?: number | null;

  name: string;
  slug: string;
  nicotineMg: string;

  /** SEO / marketing fields */
  metaTitle?: string | null;
  metaDescription?: string | null;
  hook?: string | null;

  /** Base/default selling price */
  price: string;

  /** Optional old/reference price for display */
  comparePrice: string | null;

  /** Active offer final selling price */
  offer_price?: string | null;

  /** Informational only, not used to calculate final price on frontend */
  offer_percentage?: number | null;

  /** Informational only, not used to calculate final price on frontend */
  offer_discount_amount?: string | null;

  stock: number;
  description: string;
  pouchCount: number;
  weightGrams: number;
  manufacturer: string;
  isActive: boolean;
  isBestSelling?: boolean;
  /** Resolved public URL when API returns a path or URL */
  coverImageUrl?: string | null;
  coverGifUrl?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  media: ProductMedia[];
};

export type ProductWhyChoose = {
  id: string;
  productId: string;
  reason: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export type ProductsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductsResponse = {
  data: Product[];
  pagination: ProductsPagination;
};