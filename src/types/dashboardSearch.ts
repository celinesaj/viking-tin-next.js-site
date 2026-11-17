export type DashboardSearchProductHit = {
  id: string;
  name: string;
  slug: string;
  brand_name?: string;
  flavor_name?: string;
  strength_name?: string;
};

export type DashboardSearchFlavorHit = {
  id: string;
  name: string;
  slug: string;
};

export type DashboardSearchBrandHit = {
  id: string;
  name: string;
  slug: string;
};

export type DashboardSearchStrengthLevelHit = {
  id: string;
  name: string;
  slug: string;
};

export type DashboardSearchOfferHit = {
  id: string;
  name: string;
  slug: string;
};

export type DashboardSearchSpecialOfferHit = {
  id: string;
  name: string;
  slug: string;
};

export type DashboardSearchUserHit = {
  id: string;
  first_name?: string;
  last_name?: string;
  client_name?: string;
  email?: string;
  phone?: string;
};

export type DashboardSearchOrderHit = {
  id: string;
  order_number: string;
  status: string;
  client_name?: string;
  email?: string;
  phone?: string;
};

export type DashboardSearchResponse = {
  products: DashboardSearchProductHit[];
  flavors: DashboardSearchFlavorHit[];
  brands: DashboardSearchBrandHit[];
  strength_levels: DashboardSearchStrengthLevelHit[];
  offers: DashboardSearchOfferHit[];
  special_offers: DashboardSearchSpecialOfferHit[];
  users: DashboardSearchUserHit[];
  orders: DashboardSearchOrderHit[];
};
