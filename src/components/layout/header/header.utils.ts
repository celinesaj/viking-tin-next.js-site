import type { DropdownItem } from '../NavDropdown';

export const isBrandsItem = (label: string) => {
  const normalized = label.trim().toLowerCase();
  return normalized === 'our brand' || normalized === 'our brands';
};

export const getBrandItems = (
  brands: { id: string; name: string; slug: string }[]
): DropdownItem[] =>
  brands.map((brand) => ({
    id: brand.id,
    label: brand.name,
    href: `/store?brand=${brand.slug}`,
  }));