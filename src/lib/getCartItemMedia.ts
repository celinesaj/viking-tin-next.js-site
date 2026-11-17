import type { CartItem } from '@/types/cart';
import { IMAGES } from '@/constants/images';

export function getCartItemMedia(item: CartItem) {
  if (item.imageUrl) {
    return {
      url: item.imageUrl,
      isVideo: false,
    };
  }

  if (item.videoUrl) {
    return {
      url: item.videoUrl,
      isVideo: true,
    };
  }

  return {
    url: IMAGES.placeholders.product,
    isVideo: false,
  };
}