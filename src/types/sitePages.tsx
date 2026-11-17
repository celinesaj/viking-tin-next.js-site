export type SitePage = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  imageUrl1: string | null;
  imageUrl2: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SitePageSlugs =
  | 'privacy-policy'
  | 'terms-and-conditions'
  | 'shipping-policy'
  | 'refund-policy'
  | 'age-policy'
  | 'faq'
  | 'our-story'
  | 'shipping';