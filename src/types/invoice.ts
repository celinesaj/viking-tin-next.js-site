export type InvoiceParty = {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  email?: string;
  phone?: string;
  trn?: string;   // Tax Registration Number, optional
};

export type InvoiceItem = {
  id: string;
  item: string;
  discountPercent?: number;   // optional
  discountAmount?: number;    // optional
  quantity: number;
  price: number;
  type: 'product' | 'bundle' | 'special_offer' | 'other';
  amount: number;
};

export type InvoiceSummary = {
  subtotal: number;
  taxes: number;
  discount: number;
  deliveryCharge: number;
  total: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  date: string;
  billedTo: InvoiceParty;
  from: InvoiceParty;
  paymentMethod: string;
  note?: string;
  currencySymbol?: string;
  items: InvoiceItem[];
  summary: InvoiceSummary;
};