export type AddressZone = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_active: boolean;
};

export type UserAddress = {
  id: string;
  user_id: string;
  zone_id: string;
  zone: AddressZone;
  title: string;
  address_line: string;
  street: string;
  more_info: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateAddressPayload = {
  zone_id: string;
  title: string;
  address_line: string;
  street: string;
  more_info?: string;
  is_default?: boolean;
};

export type UpdateAddressPayload = {
  id: string;
  zone_id: string;
  title: string;
  address_line: string;
  street: string;
  more_info?: string;
  is_default?: boolean;
};