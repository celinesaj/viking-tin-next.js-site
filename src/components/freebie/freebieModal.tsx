'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { setClaimedInSession } from '@/features/freebie/freebieSlice';
import { useGetFreebieEligibilityQuery } from '@/features/freebie/freebieApi';
import { addFreebieToCart } from '@/features/cart/cartSlice';
import Image from 'next/image';
import { X } from 'lucide-react';
import Skeleton from '@/components/common/Skeleton';

interface FreebieModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FreebieModal({ isOpen, onClose }: FreebieModalProps) {
  const dispatch = useAppDispatch();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const { data: eligibility, isFetching: isLoadingEligibility } = useGetFreebieEligibilityQuery(undefined, {
    skip: !isOpen,
  });
  const hasClaimedInSession = useAppSelector(state => state.freebie.hasClaimedInSession);
useEffect(() => {
  if (isOpen && (hasClaimedInSession || (eligibility && !eligibility.eligible))) {
    onClose();
  }
}, [isOpen, hasClaimedInSession, eligibility, onClose]);
  useEffect(() => {
    if (isOpen && eligibility) {
      setSelectedIds([]);
    }
  }, [isOpen, eligibility]);

  useEffect(() => {
    if (isOpen && eligibility && !eligibility.eligible) {
      onClose();
    }
  }, [isOpen, eligibility, onClose]);

  if (!isOpen) return null;
  if (isLoadingEligibility) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[85%]" />
          </div>
        </div>
      </div>
    );
  }

  if (!eligibility || !eligibility.eligible) return null;

  const { maxFreeItems, products } = eligibility;

  const handleSelect = (productId: string) => {
    if (selectedIds.includes(productId)) {
      setSelectedIds(prev => prev.filter(id => id !== productId));
    } else if (selectedIds.length < maxFreeItems) {
      setSelectedIds(prev => [...prev, productId]);
    }
  };

const handleClaim = () => {
  if (selectedIds.length === 0) return;
  setIsAdding(true);
  const selectedProducts = products.filter(p => selectedIds.includes(p.id));
  dispatch(addFreebieToCart(selectedProducts));
  dispatch(setClaimedInSession(true));   // mark as claimed in this session
  onClose();
  // optional toast
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-black/60 hover:text-black">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold">🎁 You qualify for a free gift!</h2>
        <p className="mt-2 text-black/70">
          As a first‑time customer, you can choose up to <strong>{maxFreeItems}</strong> product{maxFreeItems !== 1 && 's'} for free.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {products.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            const isDisabled = !isSelected && selectedIds.length >= maxFreeItems;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product.id)}
                disabled={isDisabled}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-black bg-black/5 ring-2 ring-black'
                    : 'border-black/20 hover:border-black/50'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-black">{product.name}</p>
                  <p className="text-sm text-black/60 line-through">${product.price.toFixed(2)}</p>
                  <p className="text-sm font-medium text-green-600">FREE</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/20 px-5 py-2 text-sm font-medium text-black/70 transition hover:bg-black/5"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={handleClaim}
            disabled={selectedIds.length === 0 || isAdding}
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Adding...' : `Add ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''} to cart`}
          </button>
        </div>
      </div>
    </div>
  );
}