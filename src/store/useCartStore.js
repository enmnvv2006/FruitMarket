import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mockSellers } from "../data/mockSellers";

const defaultCurrentUser = {
  role: "buyer",
  sellerId: mockSellers[0]?.id ?? null,
};

const clampQty = (qty, maxQty) => Math.max(1, Math.min(qty, maxQty));

export const useCartStore = create(
  persist(
    (set) => ({
      cart: [],
      currentUser: defaultCurrentUser,

      setRole: (role) =>
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            role,
            sellerId: state.currentUser.sellerId ?? mockSellers[0]?.id ?? null,
          },
        })),

      setSellerId: (sellerId) =>
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            sellerId: Number(sellerId),
          },
        })),

      addToCart: (product) =>
        set((state) => {
          const existing = state.cart.find((item) => item.id === product.id);

          if (existing) {
            const nextQty = Math.min(existing.qty + 1, product.quantity);
            return {
              cart: state.cart.map((item) =>
                item.id === product.id ? { ...item, qty: nextQty } : item
              ),
            };
          }

          return { cart: [...state.cart, { ...product, qty: 1 }] };
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== productId),
        })),

      updateQty: (productId, qty) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === productId
              ? { ...item, qty: clampQty(qty, item.quantity) }
              : item
          ),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "fruit-market-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        currentUser: state.currentUser,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        currentUser: {
          ...defaultCurrentUser,
          ...(persistedState?.currentUser ?? {}),
        },
      }),
    }
  )
);
