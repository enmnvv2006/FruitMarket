import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  clearAccessToken,
  loginAdmin as loginAdminRequest,
  loginBuyer as loginBuyerRequest,
  loginSeller as loginSellerRequest,
  logoutSession,
  refreshSession,
  registerBuyer,
} from "../api/authApi";

const clampQty = (qty, maxQty) => Math.max(1, Math.min(qty, maxQty));

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      users: [],
      currentUser: null,
      isAuthChecked: false,
      authLoading: false,

      initializeAuth: async () => {
        if (get().isAuthChecked) {
          return;
        }

        try {
          const payload = await refreshSession();
          set({ currentUser: payload.user, isAuthChecked: true });
        } catch {
          clearAccessToken();
          set({ currentUser: null, isAuthChecked: true });
        }
      },

      register: async ({ name, email, password }) => {
        set({ authLoading: true });

        try {
          const payload = await registerBuyer({ name, email, password });

          set((state) => ({
            currentUser: payload.user,
            users: state.users.some((item) => item.email === payload.user.email)
              ? state.users
              : [...state.users, payload.user],
            cart: [],
            authLoading: false,
            isAuthChecked: true,
          }));

          return { ok: true, user: payload.user };
        } catch (error) {
          set({ authLoading: false, isAuthChecked: true });
          return { ok: false, error: error.message };
        }
      },

      loginBuyer: async ({ email, password }) => {
        set({ authLoading: true });

        try {
          const payload = await loginBuyerRequest({ email, password });

          set((state) => ({
            currentUser: payload.user,
            users: state.users.some((item) => item.email === payload.user.email)
              ? state.users
              : [...state.users, payload.user],
            cart: [],
            authLoading: false,
            isAuthChecked: true,
          }));

          return { ok: true, user: payload.user };
        } catch (error) {
          set({ authLoading: false, isAuthChecked: true });
          return { ok: false, error: error.message };
        }
      },

      loginSeller: async ({ sellerId, password }) => {
        set({ authLoading: true });

        try {
          const payload = await loginSellerRequest({ sellerId, password });

          set({
            currentUser: payload.user,
            cart: [],
            authLoading: false,
            isAuthChecked: true,
          });

          return { ok: true, user: payload.user };
        } catch (error) {
          set({ authLoading: false, isAuthChecked: true });
          return { ok: false, error: error.message };
        }
      },

      loginAdmin: async ({ username, password }) => {
        set({ authLoading: true });

        try {
          const payload = await loginAdminRequest({ username, password });

          set({
            currentUser: payload.user,
            cart: [],
            authLoading: false,
            isAuthChecked: true,
          });

          return { ok: true, user: payload.user };
        } catch (error) {
          set({ authLoading: false, isAuthChecked: true });
          return { ok: false, error: error.message };
        }
      },

      logout: async () => {
        await logoutSession();
        set({ currentUser: null, cart: [], isAuthChecked: true });
      },

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
        users: state.users,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        cart: persistedState?.cart ?? [],
        users: persistedState?.users ?? [],
        currentUser: null,
        isAuthChecked: false,
        authLoading: false,
      }),
    }
  )
);
