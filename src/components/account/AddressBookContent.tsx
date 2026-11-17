'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import AddressModal, { type AddressFormValues } from './AddressModal';
import {
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useGetMyAddressesQuery,
  useUpdateAddressMutation,
} from '@/features/addresses/addressesApi';
import Skeleton from '@/components/common/Skeleton';
import type { UserAddress } from '@/types/addresses';

type AddressItem = {
  id: string;
  title: string;
  address: string;
  city: string;
  deliveryZoneId: string;
  street: string;
  moreInfo: string;
  isDefault: boolean;
};

function mapAddressToItem(address: UserAddress): AddressItem {
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

export default function AddressBookContent() {
  const { data: addressesData = [], isLoading, isError } =
    useGetMyAddressesQuery();

  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedAddress, setSelectedAddress] = useState<AddressFormValues | null>(null);

  const addresses = useMemo(() => addressesData.map(mapAddressToItem), [addressesData]);

  const isBusy = isCreating || isUpdating || isDeleting;

  const openAddModal = () => {
    setModalMode('add');
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const openEditModal = (address: AddressItem) => {
    setModalMode('edit');
    setSelectedAddress({
      id: address.id,
      title: address.title,
      address: address.address,
      city: address.city,
      deliveryZoneId: address.deliveryZoneId,
      street: address.street,
      moreInfo: address.moreInfo,
      isDefault: address.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteAddress(id).unwrap();
      toast.success('Address removed successfully.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to remove address.');
    }
  };

  const handleSave = async (values: AddressFormValues) => {
    const payload = {
      zone_id: values.deliveryZoneId,
      title: values.title.trim(),
      address_line: values.address.trim(),
      street: values.street.trim(),
      more_info: values.moreInfo.trim(),
      is_default: values.isDefault,
    };

    try {
      if (modalMode === 'add') {
        await createAddress(payload).unwrap();
        toast.success('Address added successfully.');
      } else {
        if (!values.id) {
          toast.error('Missing address id.');
          return;
        }
        await updateAddress({ id: values.id, ...payload }).unwrap();
        toast.success('Address updated successfully.');
      }

      setIsModalOpen(false);
      setSelectedAddress(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save address.');
    }
  };

  return (
    <div className="w-full max-w-[640px] px-4 sm:px-5 md:px-0">
      <p className="text-[13px] text-[#8c8c8c] sm:text-[14px] md:text-[15px]">
        Home <span className="mx-2">{'>'}</span>
        <span className="text-black">Address</span>
      </p>

      <h1 className="mt-8 text-[28px] font-bold uppercase leading-none tracking-[-0.03em] text-black sm:mt-10 sm:text-[34px] md:mt-14 md:text-[64px]">
        Your Address
      </h1>

      <p className="mt-4 max-w-[720px] text-[14px] leading-[1.5] text-[#8c8c8c] sm:text-[15px] md:mt-6 md:text-[18px]">
        Manage your saved addresses for faster checkout.
      </p>

      {isLoading ? (
        <div className="mt-8 grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[18px] border border-black/10 bg-white px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-8"
            >
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="mt-6 flex gap-3">
                <Skeleton className="h-[38px] w-[120px] rounded-full" />
                <Skeleton className="h-[38px] w-[120px] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="mt-8 text-red-500">Failed to load addresses.</div>
      ) : (
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:gap-4 md:mt-14 md:gap-5">
          {addresses.map((item) => (
            <div
              key={item.id}
              className="rounded-[18px] border border-black/10 bg-white px-4 py-4 sm:rounded-[22px] sm:px-5 sm:py-5 md:rounded-[28px] md:px-6 md:py-6"
            >
              {/* Header row: title + edit link */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3 flex-wrap">
                  <h3 className="text-[16px] font-bold uppercase text-black sm:text-[18px] md:text-[22px]">
                    {item.title}
                  </h3>
                  {item.isDefault && (
                    <span className="inline-flex rounded-full bg-black px-2.5 py-1 text-[9px] font-semibold uppercase text-white sm:text-[10px]">
                      Default
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="shrink-0 text-[12px] font-semibold uppercase text-black/50 transition hover:text-black md:text-[13px]"
                >
                  Edit
                </button>
              </div>

              {/* Details */}
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3 sm:text-[14px] md:gap-y-4 md:text-[15px]">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-black/40 md:text-[11px]">
                    Address
                  </span>
                  <p className="mt-0.5 font-medium text-black line-clamp-2">{item.address}</p>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase text-black/40 md:text-[11px]">
                    City
                  </span>
                  <p className="mt-0.5 font-medium text-black">{item.city}</p>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase text-black/40 md:text-[11px]">
                    Street
                  </span>
                  <p className="mt-0.5 font-medium text-black">{item.street}</p>
                </div>

                {item.moreInfo && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="block text-[10px] font-bold uppercase text-black/40 md:text-[11px]">
                      More Info
                    </span>
                    <p className="mt-0.5 line-clamp-2 font-medium text-black">{item.moreInfo}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2 md:mt-5 md:gap-3">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="inline-flex h-[38px] flex-1 items-center justify-center rounded-full bg-black px-4 text-[11px] font-semibold uppercase text-white transition hover:opacity-80 sm:text-[12px] md:h-[44px] md:text-[13px]"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={isBusy}
                  className="inline-flex h-[38px] flex-1 items-center justify-center rounded-full border border-black px-4 text-[11px] font-semibold uppercase text-black transition hover:bg-black hover:text-white disabled:opacity-50 sm:text-[12px] md:h-[44px] md:text-[13px]"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Add new */}
          <button
            type="button"
            onClick={openAddModal}
            className="flex min-h-[100px] items-center justify-center rounded-[18px] border border-dashed border-black/25 bg-transparent px-4 py-4 text-center text-[13px] font-semibold uppercase text-black/55 transition hover:border-black hover:text-black sm:min-h-[110px] sm:rounded-[22px] sm:text-[15px] md:min-h-[120px] md:rounded-[28px] md:text-[17px]"
          >
            + Add New Address
          </button>
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialData={selectedAddress}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}