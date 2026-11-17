import type {
  OrderHistoryItem,
  OrderHistoryOrder,
  OrdersPagination,
  OrdersResponse,
} from '@/types/orders';

function toSafeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getOrdersList(response?: OrdersResponse): OrderHistoryOrder[] {
  return Array.isArray(response?.data) ? response.data : [];
}

export function getOrdersPagination(response?: OrdersResponse): OrdersPagination {
  return response?.pagination ?? {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };
}

export function getOrderDisplayId(order: OrderHistoryOrder) {
  return order.order_number || order.order_id;
}

export function getOrderCreatedAt(order: OrderHistoryOrder) {
  return order.created_at;
}

export function getOrderItems(order: OrderHistoryOrder): OrderHistoryItem[] {
  return Array.isArray(order.items) ? order.items : [];
}

export function getOrderTotal(order: OrderHistoryOrder) {
  return toSafeNumber(order.total, 0);
}

export function getOrderStatusLabel(status?: string) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function getOrderItemLabel(item: OrderHistoryItem) {
  return `${item.item_type.replace(/_/g, ' ')} #${item.item_id}`;
}

export function getOrderItemLineTotal(item: OrderHistoryItem) {
  return toSafeNumber(item.unit_price) * toSafeNumber(item.quantity, 1);
}