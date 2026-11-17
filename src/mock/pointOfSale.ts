import type { PointOfSalePageData } from '@/types/pointsOfSale';

export const pointOfSalePageData: PointOfSalePageData = {
  hero: {
    title: 'Point Of Store',
    description:
      'Find the nearest Viking Tin retail location around you and open directions instantly in Google Maps.',
    bannerImage: '/images/point-of-sale-banner.jpg',
  },
  locations: [
    {
      id: '1',
      name: 'UAE Store - Dubai Mall',
      slug: 'uae-store-dubai-mall',
      imageUrl: '/images/store.jpg',
      shortDescription:
        'Premium retail location with the latest nicotine pouch collections and in-store support.',
      fullAddress: 'Dubai Mall, Downtown Dubai, UAE',
      city: 'Dubai',
      phone: '+971 50 111 2222',
      phoneSecondary: '+971 50 333 4444',
      latitude: 25.197197,
      longitude: 55.279673,
      isActive: true,
    },
    {
      id: '2',
      name: 'UAE Store - Mall of the Emirates',
      slug: 'uae-store-mall-of-the-emirates',
      imageUrl: '/images/store.jpg',
      shortDescription:
        'Easy-access point of store with full product availability and curated display.',
      fullAddress: 'Mall of the Emirates, Al Barsha, Dubai, UAE',
      city: 'Dubai',
      phone: '+971 50 222 3333',
      phoneSecondary: '+971 50 444 5555',
      latitude: 25.118171,
      longitude: 55.200566,
      isActive: true,
    },
    {
      id: '3',
      name: 'Abu Dhabi Store',
      slug: 'abu-dhabi-store',
      imageUrl: '/images/store.jpg',
      shortDescription:
        'Central Abu Dhabi location with fast access and premium in-store support.',
      fullAddress: 'Abu Dhabi Mall, Abu Dhabi, UAE',
      city: 'Abu Dhabi',
      phone: '+971 50 987 6543',
      phoneSecondary: '+971 50 111 8888',
      latitude: 24.495006,
      longitude: 54.382568,
      isActive: true,
    },
    {
      id: '4',
      name: 'Sharjah Store',
      slug: 'sharjah-store',
      imageUrl: '/images/store.jpg',
      shortDescription:
        'Convenient Sharjah retail point with full in-store browsing experience.',
      fullAddress: 'City Centre Sharjah, Sharjah, UAE',
      city: 'Sharjah',
      phone: '+971 50 555 1111',
      phoneSecondary: '+971 50 555 2222',
      latitude: 25.318119,
      longitude: 55.398056,
      isActive: true,
    },
  ],
};