import type { InvoiceData, InvoiceItem } from '@/types/invoice';
import { formatInvoiceDate } from './invoiceFormat';

type OrderAddress = {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  email?: string;
  phone?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  subtotal: number | string;
  shippingCost: number | string;
  tax: number | string;
  total: number | string;
  discount?: number | string | null;
  paymentMethod?: string | null;
  billingAddress?: OrderAddress | null;
};

type OrderItem = {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  itemType?: 'product' | 'bundle' | 'special_offer' | 'other' | null;
  discountPercent?: number | null;
};

function toNumber(value: string | number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function joinName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function buildAddressLine2(address?: OrderAddress | null) {
  if (!address) return '';
  return [address.addressLine2, address.city].filter(Boolean).join(', ');
}

export function mapOrderToInvoice(order: Order, orderItems: OrderItem[]): InvoiceData {
  const items: InvoiceItem[] = orderItems.map((item) => ({
    id: item.id,
    item: item.itemName,
    discountPercent: Number(item.discountPercent ?? 0),
    quantity: Number(item.quantity ?? 1),
    price: toNumber(item.unitPrice),
    type: item.itemType ?? 'other',
    amount: toNumber(item.lineTotal),
  }));

  const billedName =
    joinName(order.billingAddress?.firstName, order.billingAddress?.lastName) ||
    'Customer';

  return {
    invoiceNumber: order.orderNumber,
    date: formatInvoiceDate(order.createdAt),
    billedTo: {
      name: billedName,
      addressLine1: order.billingAddress?.addressLine1 ?? '',
      addressLine2: buildAddressLine2(order.billingAddress),
      email: order.billingAddress?.email ?? '',
      phone: order.billingAddress?.phone ?? '',
    },
    from: {
      name: 'VIKING TIN',
      addressLine1: 'Nordic Snus',
      addressLine2: 'Beirut, Lebanon',
      email: 'support@vikingtin.com',
    },
    paymentMethod: order.paymentMethod || 'Cash',
    note: 'THANK YOU FOR CHOOSING US!',
    currencySymbol: '$',
    items,
    summary: {
      subtotal: toNumber(order.subtotal),
      taxes: toNumber(order.tax),
      discount: toNumber(order.discount),
      deliveryCharge: toNumber(order.shippingCost),
      total: toNumber(order.total),
    },
  };
}