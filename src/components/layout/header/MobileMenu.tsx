'use client';

import Link from 'next/link';
import { ChevronDown, X } from 'lucide-react';
import { COLORS } from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { isBrandsItem } from './header.utils';
import type { NavItem } from '@/types/nav';
import type { DropdownItem } from '../NavDropdown';

type Props = {
  open: boolean;
  navItems: NavItem[];
  brandItems: DropdownItem[];
  mobileBrandsOpen: boolean;
  setMobileBrandsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
};

export default function MobileMenu({
  open,
  navItems,
  brandItems,
  mobileBrandsOpen,
  setMobileBrandsOpen,
  onClose,
}: Props) {
  return (
    <div
      className={`fixed inset-0 z-[70] transition-all duration-300 lg:hidden ${
        open
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <aside
        className={`absolute right-0 top-0 h-full w-[88%] max-w-[360px] transform overflow-y-auto transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: COLORS.white }}
      >
        <div
          className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: `1px solid ${COLORS.border}` }}
        >
          <img
            src={IMAGES.logo.main}
            alt="Viking Tin"
            className="h-12 w-auto object-contain"
          />

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: COLORS.black,
              color: COLORS.white,
            }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="px-5 py-5">
          <ul className="space-y-2">
            {navItems.map((item) => {
              if (isBrandsItem(item.label)) {
                return (
                  <li
                    key={item.id}
                    className="overflow-hidden rounded-2xl"
                    style={{ backgroundColor: COLORS.background }}
                  >
                    <button
                      type="button"
                      onClick={() => setMobileBrandsOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between px-4 py-4 text-sm font-medium uppercase"
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`transition ${
                          mobileBrandsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {mobileBrandsOpen && (
                      <div className="flex flex-col gap-2 px-4 pb-4">
                        <Link
                          href="/store"
                          onClick={onClose}
                          className="block rounded-xl px-3 py-3 text-sm font-medium text-black transition hover:opacity-75"
                        >
                          View All Brands
                        </Link>

                        {brandItems.map((brand) => (
                          <Link
                            key={brand.id}
                            href={brand.href}
                            onClick={onClose}
                            className="block rounded-xl px-3 py-3 text-sm font-medium text-black transition hover:opacity-75"
                          >
                            {brand.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="block rounded-2xl px-4 py-4 text-sm font-medium uppercase"
                    style={{
                      backgroundColor: COLORS.background,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </div>
  );
}