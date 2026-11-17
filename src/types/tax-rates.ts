export type TaxRate = {
  id: string;
  zoneId: string;
  /** When the admin list includes a zone relation */
  zoneName?: string;
  name: string;
  rate: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  apiMessage?: string;
};

export type TaxRatesResponse = {
  data: TaxRate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
