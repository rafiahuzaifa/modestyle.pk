"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
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

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-500 bg-amber-50",
  confirmed: "text-blue-500 bg-blue-50",
  processing: "text-purple-500 bg-purple-50",
  shipped: "text-indigo-500 bg-indigo-50",
  delivered: "text-green-600 bg-green-50",
  cancelled: "text-red-500 bg-red-50",
};

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [tab, setTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const wishlistItems = useWishlistStore((s) => s.items);

  useEffect(() => {
    if (!isSignedIn) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const res = await fetch(`/api/orders/mine?email=${encodeURIComponent(email || "")}`);
        const data = await res.json();
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch {
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [isSignedIn]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: `Orders${orders.length > 0 ? ` (${orders.length})` : ""}` },
    { key: "wishlist", label: `Wishlist${wishlistItems.length > 0 ? ` (${wishlistItems.length})` : ""}` },
    { key: "addresses", label: "Addresses" },
  ];

  // Loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-300 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="font-display text-3xl mb-3">My Account</h1>
          <p className="text-gray-500 text-sm mb-8">
            Please sign in to view your orders, wishlist, and account details.
          </p>
          <SignInButton mode="modal">
            <button className="bg-secondary text-white px-8 py-3 rounded-xl font-medium hover:bg-secondary/90 transition w-full">
              Sign In to Continue
            </button>
          </SignInButton>
          <Link href="/products" className="block mt-4 text-sm text-gold-500 hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 lg:py-12">

        {/* Header with user info */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="font-display text-2xl">
              {user?.firstName ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}` : "My Account"}
            </h1>
            <p className="text-sm text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-100 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm transition border-b-2 -mb-px whitespace-nowrap ${
                tab === t.key
                  ? "border-gold-500 text-gold-600 font-medium"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Orders</p>
              <p className="text-3xl font-display">{orders.length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Wishlist</p>
              <p className="text-3xl font-display">{wishlistItems.length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Spent</p>
              <p className="text-3xl font-display">PKR {totalSpent.toLocaleString()}</p>
            </div>

            {ordersLoading && (
              <div className="md:col-span-3 flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-gold-300 border-t-gold-500 rounded-full animate-spin" />
              </div>
            )}

            {!ordersLoading && orders.length > 0 && (
              <div className="md:col-span-3 mt-2">
                <h3 className="font-medium mb-4">Recent Orders</h3>
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4">
                      <div>
                        <p className="text-sm font-medium">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-PK")} &bull;{" "}
                          {order.items_count} item{order.items_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs capitalize px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || "text-gray-500 bg-gray-100"}`}>
                          {order.status}
                        </span>
                        <p className="text-sm font-semibold">PKR {order.total.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!ordersLoading && orders.length === 0 && (
              <div className="md:col-span-3 text-center py-10">
                <p className="text-gray-400 text-sm mb-4">You haven&apos;t placed any orders yet.</p>
                <Link href="/products" className="bg-secondary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary/90 transition inline-block">
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div>
            {ordersLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-gold-300 border-t-gold-500 rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 mb-4">No orders yet</p>
                <Link href="/products" className="text-gold-500 text-sm underline">Start Shopping</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("en-PK")} &bull;{" "}
                        {order.items_count} item{order.items_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs capitalize px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || "text-gray-500 bg-gray-100"}`}>
                        {order.status}
                      </span>
                      <p className="font-semibold text-sm">PKR {order.total.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {tab === "wishlist" && (
          <div>
            {wishlistItems.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 mb-4">Your wishlist is empty</p>
                <Link href="/products" className="text-gold-500 text-sm underline">Discover Products</Link>
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

        {/* Addresses Tab */}
        {tab === "addresses" && (
          <div className="max-w-lg">
            <p className="text-sm text-gray-500 mb-6">Manage your shipping addresses for faster checkout.</p>
            <button className="border-2 border-dashed border-gray-200 rounded-xl p-8 w-full text-center hover:border-gold-300 transition">
              <div className="text-2xl mb-2">+</div>
              <p className="text-sm text-gray-400">Add New Address</p>
              <p className="text-xs text-gray-300 mt-1">Coming soon</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
