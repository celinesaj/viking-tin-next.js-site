import type { Bundle } from '@/types/bundles';

export type SpecialOffer = Bundle & {
  startDate: string | null;
  endDate: string | null;
};

export type SpecialOffersResponse = {
  data: SpecialOffer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
