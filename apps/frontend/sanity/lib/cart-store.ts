import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setOpen: (open: boolean) => void;
  // Computed
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i._id === newItem._id &&
              i.size === newItem.size &&
              i.color === newItem.color
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i._id === existing._id &&
                i.size === existing.size &&
                i.color === existing.color
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        }),

      removeItem: (id, size, color) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i._id === id && i.size === size && i.color === color)
          ),
        })),

      updateQuantity: (id, quantity, size, color) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) =>
                    !(i._id === id && i.size === size && i.color === color)
                )
              : state.items.map((i) =>
                  i._id === id && i.size === size && i.color === color
                    ? { ...i, quantity }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      setOpen: (open) => set({ isOpen: open }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "modeststyle-cart" }
  )
);
