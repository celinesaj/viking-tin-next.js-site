import CartPageClient from '@/components/cart/CartPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review and manage your Viking Tin products in your cart',
};

export default function CartPage() {
  return <CartPageClient />;
}