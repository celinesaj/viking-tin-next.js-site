import type {
    SearchApiResponse,
    UnifiedSearchItem,
  } from '@/types/search';
  
  export function getSearchItemHref(
    type: UnifiedSearchItem['type'],
    slug: string
  ): string {
    switch (type) {
      case 'product':
        return `/products/${slug}`;
      case 'bundle':
        return `/bundles/${slug}`;
      case 'special_offer':
        return `/specialOffers/${slug}`;
      default:
        return '/';
    }
  }
  
  export function normalizeSearchResults(
    data?: SearchApiResponse
  ): UnifiedSearchItem[] {
    if (!data) return [];
  
    const products: UnifiedSearchItem[] = (data.products ?? []).map((item) => ({
      ...item,
      type: 'product',
      href: getSearchItemHref('product', item.slug),
    }));
  
    const bundles: UnifiedSearchItem[] = (data.bundles ?? []).map((item) => ({
      ...item,
      type: 'bundle',
      href: getSearchItemHref('bundle', item.slug),
    }));
  
    const specialOffers: UnifiedSearchItem[] = (data.special_offers ?? []).map(
      (item) => ({
        ...item,
        type: 'special_offer',
        href: getSearchItemHref('special_offer', item.slug),
      })
    );
  
    return [...products, ...bundles, ...specialOffers];
  }
  
  export function getSearchItemTypeLabel(type: UnifiedSearchItem['type']): string {
    switch (type) {
      case 'product':
        return 'Product';
      case 'bundle':
        return 'Bundle';
      case 'special_offer':
        return 'Special Offer';
      default:
        return '';
    }
  }
  
  export function isVideoUrl(url: string | null): boolean {
    if (!url) return false;
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  }