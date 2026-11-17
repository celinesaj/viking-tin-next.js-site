'use client';

import Link from 'next/link';
import NavDropdown, { type DropdownItem } from '../NavDropdown';
import { COLORS } from '@/constants/colors';
import { isBrandsItem } from './header.utils';
import type { NavItem } from '@/types/nav';

type Props = {
  items: NavItem[];
  brandItems: DropdownItem[];
};

export default function DesktopNav({ items, brandItems }: Props) {
  return (
    <nav className="hidden items-center gap-5 font-semibold lg:flex">
      {items.map((item) => {
        if (isBrandsItem(item.label)) {
          return (
            <NavDropdown
              key={item.id}
              label={item.label}
              items={brandItems}
              viewAllHref="/store"
              viewAllLabel="View All Brands"
            />
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            className="text-[13px] font-semibold uppercase tracking-[0.02em] transition-opacity hover:opacity-75"
            style={{ color: COLORS.textPrimary }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}