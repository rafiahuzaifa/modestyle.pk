"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWishlistStore } from "@/sanity/lib/wishlist-store";
import { ProductCard } from "@/app/components/products/ProductCard";

type Tab = "overview" | "orders" | "wishlist" | "addresses";

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items_count: number;
}

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const wishlistItems = useWishlistStore((s) => s.items);

  useEffect(() => {
    // Fetch user orders from backend
    const fetchOrders = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/orders/mine`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch {
        // Backend not available — graceful fallback
      }
    };
    fetchOrders();
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: "Orders" },
    { key: "wishlist", label: "Wishlist" },
    { key: "addresses", label: "Addresses" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <h1 className="font-display text-3xl mb-8">My Account</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm transition border-b-2 -mb-px ${
                tab === t.key
                  ? "border-gold-500 text-gold-600 font-medium"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
              {t.key === "wishlist" && wishlistItems.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-gold-100 text-gold-600 px-1.5 py-0.5 rounded-full">
                  {wishlistItems.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Orders</p>
              <p className="text-3xl font-display mt-2">{orders.length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Wishlist Items</p>
              <p className="text-3xl font-display mt-2">{wishlistItems.length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Spent</p>
              <p className="text-3xl font-display mt-2">
                PKR {orders.reduce((s, o) => s + o.total, 0).toLocaleString()}
              </p>
            </div>

            {/* Recent orders */}
            {orders.length > 0 && (
              <div className="md:col-span-3 mt-4">
                <h3 className="font-medium mb-4">Recent Orders</h3>
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-6 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()} &bull;{" "}
                          {order.items_count} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">PKR {order.total.toLocaleString()}</p>
                        <p className="text-xs text-gold-500 capitalize">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 mb-2">No orders yet</p>
                <Link href="/products" className="text-gold-500 text-sm underline">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gray-50 rounded-xl p-6 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString()} &bull;{" "}
                        {order.items_count} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">PKR {order.total.toLocaleString()}</p>
                      <span className="text-xs capitalize text-gold-500">{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wishlist */}
        {tab === "wishlist" && (
          <div>
            {wishlistItems.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 mb-2">Your wishlist is empty</p>
                <Link href="/products" className="text-gold-500 text-sm underline">
                  Discover Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {wishlistItems.map((item) => (
                  <ProductCard
                    key={item._id}
                    product={{
                      ...item,
                      category: "",
                      rating: 0,
                      reviewCount: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses */}
        {tab === "addresses" && (
          <div className="max-w-lg">
            <p className="text-sm text-gray-500 mb-6">
              Manage your shipping addresses for faster checkout.
            </p>
            <button className="border-2 border-dashed border-gray-200 rounded-xl p-8 w-full text-center hover:border-gold-300 transition">
              <p className="text-sm text-gray-400">+ Add New Address</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
