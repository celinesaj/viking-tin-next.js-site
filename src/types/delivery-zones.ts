export type DeliveryZoneApiRow = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  isActive?: boolean;
  is_active?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DeliveryZone = {
  id: string;
  name: string;
  description: string;
  price: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};
