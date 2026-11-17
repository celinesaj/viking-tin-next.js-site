// src/lib/delivery.ts

import {
  DELIVERY_FEES_BY_CITY,
  DEFAULT_DELIVERY_FEE,
} from '@/constants/deliveryFees';

export function getDeliveryFeeByCity(city?: string | null): number {
  if (!city) return DEFAULT_DELIVERY_FEE;

  const normalizedCity = city.trim().toLowerCase();

  return DELIVERY_FEES_BY_CITY[normalizedCity] ?? DEFAULT_DELIVERY_FEE;
}