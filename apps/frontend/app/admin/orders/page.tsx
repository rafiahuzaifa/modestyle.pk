"use client";

import { useState, useEffect } from "react";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  created_at: string;
  items_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/admin/orders`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      // Backend not available yet — show empty state
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      console.error("Failed to update order:", err);
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
          Manage customer orders from PostgreSQL
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
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">#{order.id.slice(0, 8)}</td>
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
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-300"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
