export type SearchProductItem = {
    id: string;
    name: string;
    slug: string;
    price: string;
    image_url: string | null;
  };
  
  export type SearchBundleItem = {
    id: string;
    name: string;
    slug: string;
    price: string;
    image_url: string | null;
  };
  
  export type SearchSpecialOfferItem = {
    id: string;
    name: string;
    slug: string;
    price: string;
    image_url: string | null;
  };
  
  export type SearchApiResponse = {
    products: SearchProductItem[];
    bundles: SearchBundleItem[];
    special_offers: SearchSpecialOfferItem[];
  };
  
  export type SearchItemType = 'product' | 'bundle' | 'special_offer';
  
  export type UnifiedSearchItem = {
    id: string;
    name: string;
    slug: string;
    price: string;
    image_url: string | null;
    type: SearchItemType;
    href: string;
  };