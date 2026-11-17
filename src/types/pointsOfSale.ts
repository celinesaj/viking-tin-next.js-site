// src/types/pointsOfSale.ts
export type PointOfSaleLocationApi = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  lat: string;
  lng: string;
  phone?: string | null;
  email?: string | null;
  mapEmbeddedUrl?: string | null;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  zoneId?: string | null;
  shortDescription?: string | null;
  fullAddress?: string | null;
  phoneSecondary?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PointOfSaleLocation = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  shortDescription: string;
  fullAddress: string;
  city: string;
  phone?: string;
  phoneSecondary?: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
    mapEmbeddedUrl?: string | null;
};

export type UserCoordinates = {
  latitude: number;
  longitude: number;
};

export type PointOfSaleSection = {
  title: string;
  description: string;
  bannerImage: string;
};

export type PointOfSalePageData = {
  hero: PointOfSaleSection;
  locations: PointOfSaleLocation[];
};

export type PointOfSalePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PointOfSaleListResponseApi = {
  data: PointOfSaleLocationApi[];
  pagination: PointOfSalePagination;
};

export type PointOfSaleListResponse = {
  data: PointOfSaleLocation[];
  pagination: PointOfSalePagination;
};