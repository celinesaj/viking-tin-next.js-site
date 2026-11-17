// types/freebie.ts

export interface FreebieProduct {
  id: string;
  name: string;
  slug: string;
  price: number;        // original price (display only – free in cart)
  imageUrl: string;
  description?: string;
}

export interface FreebieConfig {
  maxFreeItems: number;  // 1 or 2
  isActive: boolean;
}

export interface FreebieEligibility {
  eligible: boolean;
  maxFreeItems: number;
  products: FreebieProduct[];
}

export interface ClaimFreebieRequest {
  productIds: string[];
}

export interface ClaimFreebieResponse {
  success: boolean;
  claimedProducts: FreebieProduct[];
  message?: string;
}