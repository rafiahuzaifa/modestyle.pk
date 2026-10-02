"use client";

import { Fragment, useState, useEffect } from "react";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
}

interface ShippingAddress {
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  promo_code: string | null;
  shipping_address: ShippingAddress | null;
  items: OrderItem[];
  status: string;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  created_at: string;
  items_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-teal-50 text-teal-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-gray-50 text-gray-600",
  pending: "bg-yellow-50 text-yellow-700",
  paid: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-purple-50 text-purple-700",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "COD",
  safepay: "Card",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      // DB not available
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // State updates happen after the awaited fetch, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: data.status, payment_status: data.payment_status }
            : o
        )
      );
    } catch (err) {
      console.error("Failed to update order:", err);
      alert("Could not update the order status. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display">Orders</h2>
        <p className="text-sm text-gray-500 mt-1">
          Click an order to see the customer&apos;s address, phone and items.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Order ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Items</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400">Total</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Payment</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No orders yet. Orders will appear here once customers checkout.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <Fragment key={order.id}>
                  <tr
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="text-gray-400 mr-1">{expanded === order.id ? "▾" : "▸"}</span>
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-4">{order.items_count} items</td>
                    <td className="px-6 py-4 text-right font-medium">
                      PKR {order.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-xs font-medium">
                          {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                        </span>
                        <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PAYMENT_STATUS_COLORS[order.payment_status] || "bg-gray-50 text-gray-600"}`}>
                          {order.payment_status}
                        </span>
                      </div>
                      {order.transaction_id && (
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{order.transaction_id.slice(0, 12)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || "bg-gray-50 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-300"
                      >
                        <option value="pending">Pending (awaiting confirmation)</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                  {expanded === order.id && <OrderDetails order={order} />}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function toWhatsApp(phone: string) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.startsWith("0") ? "92" + digits.slice(1) : digits;
}

function OrderDetails({ order }: { order: Order }) {
  const addr = order.shipping_address || {};
  const codFee = order.total - order.subtotal - order.shipping + order.discount;
  return (
    <tr className="bg-gray-50/60 border-b border-gray-100">
      <td colSpan={8} className="px-6 py-5">
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Customer</p>
            <p className="font-medium">{order.customer_name}</p>
            {order.customer_phone && (
              <p>
                <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">
                  {order.customer_phone}
                </a>
                {" · "}
                <a
                  href={`https://wa.me/${toWhatsApp(order.customer_phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  WhatsApp
                </a>
              </p>
            )}
            <p className="text-gray-500">{order.customer_email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Deliver to</p>
            <p>{addr.address || "—"}</p>
            <p className="text-gray-500">
              {[addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Items</p>
            <ul className="space-y-1.5">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>
                    {item.name} × {item.quantity}
                    {(item.size || item.color) && (
                      <span className="text-gray-400 text-xs">
                        {" "}({[item.size, item.color].filter(Boolean).join(" / ")})
                      </span>
                    )}
                  </span>
                  <span className="whitespace-nowrap">PKR {(item.price * item.quantity).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 mt-3 pt-2 space-y-0.5 text-xs text-gray-500">
              <div className="flex justify-between"><span>Subtotal</span><span>PKR {order.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{order.shipping ? `PKR ${order.shipping}` : "FREE"}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between"><span>Discount{order.promo_code ? ` (${order.promo_code})` : ""}</span><span>-PKR {order.discount.toLocaleString()}</span></div>
              )}
              {codFee > 0 && (
                <div className="flex justify-between"><span>COD fee</span><span>PKR {codFee}</span></div>
              )}
              <div className="flex justify-between font-medium text-gray-800 text-sm pt-1">
                <span>{order.payment_method === "cod" && order.payment_status !== "paid" ? "Collect on delivery" : "Total"}</span>
                <span>PKR {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
