'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { useAppDispatch, useAppSelector } from '@/store/hook';
import { clearCart } from '@/features/cart/cartSlice';
import { clearAppliedCoupon } from '@/features/coupons/couponSlice';

import CheckoutForm from './CheckoutForm';
import CheckoutOrderItems from './CheckoutOrderItems';
import CheckoutSummary from './CheckoutSummary';

import AddressModal, {
  type AddressFormValues,
} from '@/components/account/AddressModal';

import type { CheckoutFormValues, SavedAddress } from '@/types/order';
import type { CheckoutApiError } from '@/types/checkout';

import { useGetMeQuery } from '@/features/auth/authApi';
import {
  useCreateAddressMutation,
  useGetMyAddressesQuery,
  useUpdateAddressMutation,
} from '@/features/addresses/addressesApi';
import { useGetDeliveryZonesQuery } from '@/features/delivery-zones/deliveryZonesApi';
import { useGetActiveTaxRateQuery } from '@/features/tax-rates/taxRatesApi';
import { useCheckoutMutation } from '@/features/checkout/checkoutApi';

import { calculateCheckoutSummary } from '@/lib/calculateCheckoutSummary';
import { buildCheckoutPayload } from '@/lib/buildCheckoutPayload';
import { resetClaimedInSession } from '@/features/freebie/freebieSlice';

const checkoutInitialValues: CheckoutFormValues = {
  deliveryZoneId: '',
  paymentMethod: 'cash_on_delivery',
  orderNotes: '',
};

function toNumber(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isCheckoutFormValid(values: CheckoutFormValues) {
  return Boolean(values.deliveryZoneId.trim());
}

function getCheckoutErrorMessage(error: unknown) {
  const fallback = 'Failed to place order. Please try again.';

  if (!error || typeof error !== 'object') return fallback;

  const maybeData = error as {
    data?: CheckoutApiError;
    message?: string;
  };

  if (Array.isArray(maybeData.data?.message)) {
    return maybeData.data.message.join(', ') || fallback;
  }

  if (typeof maybeData.data?.message === 'string' && maybeData.data.message) {
    return maybeData.data.message;
  }

  if (typeof maybeData.message === 'string' && maybeData.message) {
    return maybeData.message;
  }

  return fallback;
}

function hasRealProductOffer(product: any) {
  if (!product) return false;

  return (
    (product.offer_price !== null &&
      product.offer_price !== undefined &&
      product.offer_price !== '' &&
      Number(product.offer_price) > 0) ||
    (product.offer_percentage !== null &&
      product.offer_percentage !== undefined &&
      product.offer_percentage !== '' &&
      Number(product.offer_percentage) > 0) ||
    (product.offer_discount_amount !== null &&
      product.offer_discount_amount !== undefined &&
      product.offer_discount_amount !== '' &&
      Number(product.offer_discount_amount) > 0)
  );
}

function isCouponEligibleCartItem(item: any) {
  if (item.type === 'bundle') return false;
  if (item.type === 'special_offer') return false;

  if (item.type === 'product' && hasRealProductOffer(item.product)) {
    return false;
  }

  return true;
}

export default function CheckoutPageContent() {
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector((state) => state.cart.items ?? []);
  const appliedCoupon = useAppSelector((state) => state.coupon.appliedCoupon);

  const {
    data: meData,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  const {
    data: addressesData = [],
    isLoading: isAddressesLoading,
    isError: isAddressesError,
  } = useGetMyAddressesQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  const {
    data: deliveryZones = [],
    isLoading: isZonesLoading,
    isError: isZonesError,
  } = useGetDeliveryZonesQuery();

  const {
    data: activeTaxRate,
    isLoading: isTaxLoading,
    isError: isTaxError,
  } = useGetActiveTaxRateQuery();

  const [checkout, { isLoading: isCheckoutSubmitting }] =
    useCheckoutMutation();

  const [createAddress, { isLoading: isCreatingAddress }] =
    useCreateAddressMutation();

  const [updateAddress, { isLoading: isUpdatingAddress }] =
    useUpdateAddressMutation();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [form, setForm] = useState<CheckoutFormValues>(checkoutInitialValues);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState<string | null>(null);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState<'add' | 'edit'>(
    'add'
  );
  const [editingAddress, setEditingAddress] =
    useState<AddressFormValues | null>(null);

  const user = meData?.user ?? null;
  const isLoggedIn = !!user && !isUserError;

  const savedAddresses = useMemo<SavedAddress[]>(() => {
    if (!user) return [];

    return addressesData.map((item) => ({
      id: String(item.id),
      title: item.title,
      email: user.email ?? '',
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? '',
      phone: user.phone ?? '',
      address: item.address_line ?? '',
      city: item.zone?.name ?? '',
      deliveryZoneId: String(item.zone_id ?? ''),
      street: item.street ?? '',
      moreInfo: item.more_info ?? '',
      isDefault: item.is_default,
    }));
  }, [addressesData, user]);

  const defaultAddress =
    savedAddresses.find((item) => item.isDefault) ?? savedAddresses[0] ?? null;

  const selectedAddress = useMemo(() => {
    return savedAddresses.find((item) => item.id === selectedAddressId) ?? null;
  }, [savedAddresses, selectedAddressId]);

  useEffect(() => {
    if (!user) {
      setForm(checkoutInitialValues);
      setSelectedAddressId(null);
      return;
    }

    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
      setForm({
        deliveryZoneId: defaultAddress.deliveryZoneId,
        paymentMethod: 'cash_on_delivery',
        orderNotes: '',
      });
    }
  }, [user, defaultAddress, selectedAddressId]);

  const selectedZone =
    deliveryZones.find((zone) => String(zone.id) === form.deliveryZoneId) ??
    null;

  const deliveryFee = useMemo(
    () => (selectedZone ? toNumber(selectedZone.price) : 0),
    [selectedZone]
  );

  const taxRatePercent = useMemo(
    () => Number(activeTaxRate?.rate ?? 0),
    [activeTaxRate]
  );

  const couponEligibleSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (!isCouponEligibleCartItem(item)) return sum;
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);
  }, [cartItems]);

  const totalCouponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.discount_type === 'percentage') {
      const discount =
        couponEligibleSubtotal * (appliedCoupon.discount_value / 100);

      if (
        appliedCoupon.max_discount_amount &&
        appliedCoupon.max_discount_amount > 0
      ) {
        return Number(
          Math.min(discount, appliedCoupon.max_discount_amount).toFixed(2)
        );
      }

      return Number(discount.toFixed(2));
    }

    return Number(
      Math.min(appliedCoupon.discount_value, couponEligibleSubtotal).toFixed(2)
    );
  }, [appliedCoupon, couponEligibleSubtotal]);

  const summary = useMemo(() => {
    return calculateCheckoutSummary(
      cartItems,
      deliveryFee,
      taxRatePercent,
      totalCouponDiscount
    );
  }, [cartItems, deliveryFee, taxRatePercent, totalCouponDiscount]);

  const isAddressSaving = isCreatingAddress || isUpdatingAddress;

  const isBusy =
    isUserLoading ||
    isAddressesLoading ||
    isZonesLoading ||
    isTaxLoading ||
    isCheckoutSubmitting ||
    isAddressSaving;

  const hasLoadError =
    isUserError || isAddressesError || isZonesError || isTaxError;

  const isSubmitBlocked =
    !isLoggedIn ||
    !cartItems.length ||
    isBusy ||
    hasLoadError ||
    !selectedAddress ||
    !isCheckoutFormValid(form);

  const handleChange = <K extends keyof CheckoutFormValues>(
    key: K,
    value: CheckoutFormValues[K]
  ) => {
    setSubmitError(null);

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSelectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setSubmitError(null);

    setForm((prev) => ({
      ...prev,
      deliveryZoneId: address.deliveryZoneId,
    }));
  };

  const openAddAddressModal = () => {
    setAddressModalMode('add');
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (address: SavedAddress) => {
    setAddressModalMode('edit');
    setEditingAddress({
      id: address.id,
      title: address.title,
      address: address.address,
      city: address.city,
      deliveryZoneId: address.deliveryZoneId,
      street: address.street,
      moreInfo: address.moreInfo,
      isDefault: address.isDefault,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (values: AddressFormValues) => {
    const payload = {
      zone_id: values.deliveryZoneId,
      title: values.title.trim(),
      address_line: values.address.trim(),
      street: values.street.trim(),
      more_info: values.moreInfo.trim(),
      is_default: values.isDefault,
    };

    try {
      let savedId = values.id;

      if (addressModalMode === 'add') {
        const created = await createAddress(payload).unwrap();
        savedId = String(created?.id ?? '');
        toast.success('Address added successfully.');
      } else {
        if (!values.id) {
          toast.error('Missing address id.');
          return;
        }

        await updateAddress({
          id: values.id,
          ...payload,
        }).unwrap();

        savedId = values.id;
        toast.success('Address updated successfully.');
      }

      setIsAddressModalOpen(false);
      setEditingAddress(null);

      if (savedId) {
        setSelectedAddressId(savedId);
      }

      setForm((prev) => ({
        ...prev,
        deliveryZoneId: values.deliveryZoneId,
      }));
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save address.');
    }
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toast.error('You must be logged in.');
      return;
    }

    if (!cartItems.length) {
      toast.error('Your cart is empty.');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select a saved address.');
      return;
    }

    if (!isCheckoutFormValid(form)) {
      toast.error('Please select a valid delivery address.');
      return;
    }

    try {
      const payload = buildCheckoutPayload({
        values: form,
        items: cartItems,
        selectedAddress,
        selectedAddressId,
        taxRatePercent,
        taxRateId: activeTaxRate?.id ? Number(activeTaxRate.id) : null,
        deliveryFee,
        couponCode: appliedCoupon?.code,
        couponDiscountType: appliedCoupon?.discount_type,
        couponDiscountValue: appliedCoupon?.discount_value,
        couponMaxDiscountAmount: appliedCoupon?.max_discount_amount,
      });

      const result = await checkout(payload).unwrap();

      toast.success('Order placed successfully');

      dispatch(clearCart());
      dispatch(clearAppliedCoupon());
      dispatch(resetClaimedInSession());

      setLastOrderNumber(
        result.order_number ? String(result.order_number) : 'Order placed'
      );
    } catch (error) {
      const message = getCheckoutErrorMessage(error);
      setSubmitError(message);
      toast.error(message);
    }
  };

  if (lastOrderNumber) {
    return (
      <main className="pb-24 pt-10 md:pt-14">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 xl:px-12 2xl:px-16">
          <div className="rounded-[28px] border border-black/10 px-6 py-16 text-center">
            <h2 className="text-[28px] font-semibold text-black">
              Order placed successfully
            </h2>
            <p className="mt-3 text-[16px] text-black/55">
              Your order number is {lastOrderNumber}.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!cartItems.length) {
    return (
      <main className="pb-24 pt-10 md:pt-14">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 xl:px-12 2xl:px-16">
          <div className="rounded-[28px] border border-black/10 px-6 py-16 text-center">
            <h2 className="text-[28px] font-semibold text-black">
              Your cart is empty
            </h2>
            <p className="mt-3 text-[16px] text-black/55">
              Add items to your cart before proceeding to checkout.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-24 pt-10 md:pt-14">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8 xl:px-12 2xl:px-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 border-b border-black/10 pb-10 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12 xl:pr-16">
            <CheckoutForm
              values={form}
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              isLoggedIn={isLoggedIn}
              isLoading={isBusy}
              hasError={hasLoadError}
              submitError={submitError}
              onSelectAddress={handleSelectAddress}
              onAddAddress={openAddAddressModal}
              onEditAddress={openEditAddressModal}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          </div>

          <div className="min-w-0 lg:pl-2">
            <CheckoutOrderItems items={cartItems} />

            {/* Prominent delivery message */}
            <div className="mt-4 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-800 shadow-sm md:mt-5 md:p-4 md:text-base">
              🚚 <span className="font-bold">Delivery between 24 and 48 hours</span>
            </div>

            <CheckoutSummary
              items={cartItems}
              deliveryFee={deliveryFee}
              taxRatePercent={taxRatePercent}
              discountAmount={totalCouponDiscount}
              isSubmitting={isCheckoutSubmitting}
              disabled={isSubmitBlocked}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        mode={addressModalMode}
        initialData={editingAddress}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
      />
    </main>
  );
}