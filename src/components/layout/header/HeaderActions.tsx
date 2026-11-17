'use client';

import Link from 'next/link';
import { Menu, ShoppingBag, User } from 'lucide-react';
import { COLORS } from '@/constants/colors';

type Props = {
  cartCount: number;
  displayCount: string;
  onOpenMobileMenu: () => void;
};

export default function HeaderActions({
  cartCount,
  displayCount,
  onOpenMobileMenu,
}: Props) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        href="/cart"
        className="relative hidden h-9 w-9 items-center justify-center md:inline-flex"
        style={{ color: COLORS.black }}
        aria-label="Cart"
      >
        <ShoppingBag size={22} strokeWidth={2} />
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-[6px] text-[11px] font-bold text-white">
            {displayCount}
          </span>
        )}
      </Link>

      <Link
        href="/create-account"
        className="hidden h-9 w-9 items-center justify-center md:inline-flex"
        style={{ color: COLORS.black }}
        aria-label="Account"
      >
        <User size={22} strokeWidth={2} />
      </Link>

      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="inline-flex h-9 w-9 items-center justify-center lg:hidden"
        style={{ color: COLORS.black }}
        aria-label="Open menu"
      >
        <Menu size={24} strokeWidth={2.2} />
      </button>
    </div>
  );
}