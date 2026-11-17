export type BundleProduct = {
  id: string;
  name: string;
  slug: string;
};

export type BundleProductItem = {
  id: string;
  product: BundleProduct;
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
  description: string | null;
  imageUrl: string | null;
  price: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  products: BundleProductItem[];
  galleryImages: BundleGalleryImage[];
  originTotal: string;
};

export type BundlesPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BundlesResponse = {
  data: Bundle[];
  pagination: BundlesPagination;
};