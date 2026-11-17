import type { UserAddress } from '@/types/addresses';
import type { AddressFormValues } from '@/components/account/AddressModal';

export type AddressCardItem = {
  id: string;
  title: string;
  address: string;
  city: string;
  deliveryZoneId: string;
  street: string;
  moreInfo: string;
  isDefault: boolean;
};

export function mapApiAddressToCardItem(address: UserAddress): AddressCardItem {
  return {
    id: address.id,
    title: address.title,
    address: address.address_line,
    city: address.zone?.name ?? '',
    deliveryZoneId: address.zone_id,
    street: address.street,
    moreInfo: address.more_info ?? '',
    isDefault: address.is_default,
  };
}

export function mapFormValuesToCreatePayload(values: AddressFormValues) {
  return {
    zone_id: values.deliveryZoneId,
    title: values.title.trim(),
    address_line: values.address.trim(),
    street: values.street.trim(),
    more_info: values.moreInfo.trim(),
    is_default: values.isDefault,
  };
}

export function mapFormValuesToUpdatePayload(values: AddressFormValues) {
  return {
    id: values.id!,
    zone_id: values.deliveryZoneId,
    title: values.title.trim(),
    address_line: values.address.trim(),
    street: values.street.trim(),
    more_info: values.moreInfo.trim(),
    is_default: values.isDefault,
  };
}