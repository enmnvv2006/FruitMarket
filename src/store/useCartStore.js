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
const ORDER_STATUSES = ["В обработке", "Доставлен", "Отменён"];

const normalizeOrder = (order) => ({
  id: String(order?.id ?? `order-${Date.now()}`),
  createdAt: String(order?.createdAt ?? new Date().toISOString()),
  status: ORDER_STATUSES.includes(order?.status) ? order.status : "В обработке",
  total: Number(order?.total ?? 0),
  customerName: String(order?.customerName ?? ""),
  customerUserId: String(order?.customerUserId ?? ""),
  customerEmail: order?.customerEmail ? String(order.customerEmail) : null,
  items: Array.isArray(order?.items)
    ? order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        qty: Number(item.qty),
        sellerId: Number(item.sellerId),
      }))
    : [],
});

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      users: [],
      orders: [],
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

      placeOrder: ({ customerName }) =>
        set((state) => {
          const normalizedName = String(customerName ?? "").trim();
          const hasCart = state.cart.length > 0;

          if (!hasCart || !normalizedName || !state.currentUser) {
            return {};
          }

          const items = state.cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            qty: Number(item.qty),
            sellerId: Number(item.sellerId),
          }));

          const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
          const order = normalizeOrder({
            id: `order-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: "В обработке",
            total,
            customerName: normalizedName,
            customerUserId: state.currentUser.id,
            customerEmail: state.currentUser.email ?? null,
            items,
          });

          return {
            orders: [order, ...state.orders],
            cart: [],
          };
        }),

      updateOrderStatus: ({ orderId, status }) =>
        set((state) => {
          if (!ORDER_STATUSES.includes(status)) {
            return {};
          }

          return {
            orders: state.orders.map((order) =>
              order.id === orderId ? { ...order, status } : order
            ),
          };
        }),
    }),
    {
      name: "fruit-market-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        users: state.users,
        orders: state.orders,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        cart: persistedState?.cart ?? [],
        users: persistedState?.users ?? [],
        orders: Array.isArray(persistedState?.orders)
          ? persistedState.orders.map(normalizeOrder)
          : [],
        currentUser: null,
        isAuthChecked: false,
        authLoading: false,
      }),
    }
  )
);
