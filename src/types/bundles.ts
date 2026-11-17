export type BundleLineProduct = {
  id: string;
  name: string;
  slug: string;
  /** Present when the API includes per-line pricing (optional). */
  price?: string;
};

export type BundleProductLine = {
  id: string;
  product: BundleLineProduct;
  quantity: number;
};

export type BundleGalleryImage = {
  id: string;
  url: string;
  sortOrder: number;
  createdAt: string | null;
};

export type Bundle = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  price: string;
  originTotal: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  products: BundleProductLine[];
  galleryImages: BundleGalleryImage[];
  /** Set when the API includes a top-level `message` (e.g. POST/PATCH). */
  apiMessage?: string;
};

export type BundlesResponse = {
  data: Bundle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
