"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore, CartItem } from "@/sanity/lib/cart-store";

export function SlideoutCart() {
  const { items, isOpen, setOpen, removeItem, updateQuantity, totalPrice } =
    useCartStore();

  if (!isOpen) return null;

  const FREE_SHIPPING_THRESHOLD = 5000;
  const total = totalPrice();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-display text-xl">Shopping Bag ({items.length})</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 hover:text-gold-500 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free shipping progress */}
        {total > 0 && (
          <div className="px-6 py-3 bg-gold-50">
            {remaining > 0 ? (
              <p className="text-xs text-gold-700">
                Add <strong>PKR {remaining.toLocaleString()}</strong> more for FREE shipping!
              </p>
            ) : (
              <p className="text-xs text-green-700 font-medium">
                You&apos;ve unlocked FREE shipping!
              </p>
            )}
            <div className="mt-1.5 h-1.5 bg-gold-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-400 text-sm">Your bag is empty</p>
              <button
                onClick={() => setOpen(false)}
                className="mt-4 text-gold-500 text-sm underline"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item: CartItem) => (
                <div
                  key={`${item._id}-${item.size}-${item.color}`}
                  className="flex gap-4 pb-4 border-b border-gray-50"
                >
                  <div className="relative w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-sm font-medium truncate block hover:text-gold-500"
                      onClick={() => setOpen(false)}
                    >
                      {item.name}
                    </Link>
                    {(item.size || item.color) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && " / "}
                        {item.color && `Color: ${item.color}`}
                      </p>
                    )}
                    <p className="text-sm font-medium text-gold-600 mt-1">
                      PKR {item.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.quantity - 1, item.size, item.color)
                        }
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-xs hover:border-gold-400"
                      >
                        -
                      </button>
                      <span className="text-sm w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.quantity + 1, item.size, item.color)
                        }
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-xs hover:border-gold-400"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item._id, item.size, item.color)}
                        className="ml-auto text-gray-300 hover:text-red-400 transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="font-display text-lg">
                PKR {total.toLocaleString()}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="block w-full text-center bg-secondary text-white py-3.5 rounded-lg font-medium hover:bg-secondary/90 transition"
            >
              Checkout
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="block w-full text-center text-sm text-gold-500 hover:underline"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
