import { Order } from '../types/Order';

/**
 * Single source of truth for an order's status.
 *
 * Orders carry a legacy boolean `pending` flag alongside the newer `status`
 * field. The `status` field always wins; the legacy flag is only used when
 * `status` is missing (old orders). This guarantees an order is EITHER
 * pending, on the way (delivering), delivered (completed) or cancelled —
 * never two of those at the same time.
 */
export const getEffectiveOrderStatus = (order: Order): Order['status'] => {
  if (order.status) return order.status;
  // Legacy orders only had the `pending` flag: false meant completed
  if (order.pending === false) return 'completed';
  return 'pending';
};

/** Human-friendly label for an order's resolved status */
export const ORDER_STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Pending',
  delivering: 'On the way',
  completed: 'Delivered',
  cancelled: 'Cancelled',
};
