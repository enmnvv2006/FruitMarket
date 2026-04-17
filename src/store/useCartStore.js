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
const NOTIFICATION_TYPES = ["order_created", "order_status_changed", "system"];

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

const normalizeNotification = (notification) => ({
  id: String(notification?.id ?? `notification-${Date.now()}`),
  type: NOTIFICATION_TYPES.includes(notification?.type)
    ? notification.type
    : "system",
  title: String(notification?.title ?? "Уведомление"),
  message: String(notification?.message ?? ""),
  createdAt: String(notification?.createdAt ?? new Date().toISOString()),
  isRead: Boolean(notification?.isRead),
  orderId: notification?.orderId ? String(notification.orderId) : null,
  recipientRole: String(notification?.recipientRole ?? ""),
  recipientUserId: notification?.recipientUserId
    ? String(notification.recipientUserId)
    : null,
  recipientSellerId:
    notification?.recipientSellerId === null ||
    notification?.recipientSellerId === undefined
      ? null
      : Number(notification.recipientSellerId),
});

const isNotificationForUser = (notification, user) => {
  if (!user) {
    return false;
  }

  if (user.role === "seller") {
    return (
      notification.recipientRole === "seller" &&
      Number(notification.recipientSellerId) === Number(user.sellerId)
    );
  }

  if (user.role === "buyer") {
    return (
      notification.recipientRole === "buyer" &&
      String(notification.recipientUserId) === String(user.id)
    );
  }

  if (user.role === "admin") {
    return notification.recipientRole === "admin";
  }

  return false;
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      users: [],
      orders: [],
      notifications: [],
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
          const createdAt = new Date().toISOString();
          const order = normalizeOrder({
            id: `order-${Date.now()}`,
            createdAt,
            status: "В обработке",
            total,
            customerName: normalizedName,
            customerUserId: state.currentUser.id,
            customerEmail: state.currentUser.email ?? null,
            items,
          });

          const sellerGroups = items.reduce((acc, item) => {
            const key = String(item.sellerId);
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(item);
            return acc;
          }, {});

          const sellerNotifications = Object.entries(sellerGroups).map(
            ([sellerId, sellerItems], index) =>
              normalizeNotification({
                id: `notification-${Date.now()}-${sellerId}-${index}`,
                type: "order_created",
                title: "Новый заказ по вашим товарам",
                message: `${normalizedName} оформил заказ: ${sellerItems
                  .map((item) => `${item.name} x${item.qty}`)
                  .join(", ")}.`,
                createdAt,
                isRead: false,
                orderId: order.id,
                recipientRole: "seller",
                recipientSellerId: Number(sellerId),
              })
          );

          const buyerNotification = normalizeNotification({
            id: `notification-${Date.now()}-buyer`,
            type: "order_created",
            title: "Заказ оформлен",
            message: `Ваш заказ #${order.id} принят в обработку.`,
            createdAt,
            isRead: false,
            orderId: order.id,
            recipientRole: "buyer",
            recipientUserId: state.currentUser.id,
          });

          return {
            orders: [order, ...state.orders],
            notifications: [buyerNotification, ...sellerNotifications, ...state.notifications],
            cart: [],
          };
        }),

      updateOrderStatus: ({ orderId, status }) =>
        set((state) => {
          if (!ORDER_STATUSES.includes(status)) {
            return {};
          }

          const order = state.orders.find((item) => item.id === orderId);
          if (!order) {
            return {};
          }

          const statusNotification = normalizeNotification({
            id: `notification-${Date.now()}-status-${order.id}`,
            type: "order_status_changed",
            title: "Статус заказа обновлён",
            message: `Заказ #${order.id}: новый статус «${status}».`,
            createdAt: new Date().toISOString(),
            isRead: false,
            orderId: order.id,
            recipientRole: "buyer",
            recipientUserId: order.customerUserId,
          });

          return {
            orders: state.orders.map((order) =>
              order.id === orderId ? { ...order, status } : order
            ),
            notifications: [statusNotification, ...state.notifications],
          };
        }),

      markNotificationRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === notificationId ? { ...item, isRead: true } : item
          ),
        })),

      markAllNotificationsRead: () =>
        set((state) => {
          if (!state.currentUser) {
            return {};
          }

          return {
            notifications: state.notifications.map((item) =>
              isNotificationForUser(item, state.currentUser)
                ? { ...item, isRead: true }
                : item
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
        notifications: state.notifications,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        cart: persistedState?.cart ?? [],
        users: persistedState?.users ?? [],
        orders: Array.isArray(persistedState?.orders)
          ? persistedState.orders.map(normalizeOrder)
          : [],
        notifications: Array.isArray(persistedState?.notifications)
          ? persistedState.notifications.map(normalizeNotification)
          : [],
        currentUser: null,
        isAuthChecked: false,
        authLoading: false,
      }),
    }
  )
);
