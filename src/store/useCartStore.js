import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mockSellers } from "../data/mockSellers";

const defaultCurrentUser = null;

const clampQty = (qty, maxQty) => Math.max(1, Math.min(qty, maxQty));
const normalizeEmail = (email) => email.trim().toLowerCase();

const buildUser = ({ id, name, email, password, role, sellerId }) => ({
  id,
  name: name.trim(),
  email: normalizeEmail(email),
  password,
  role,
  sellerId: role === "seller" ? Number(sellerId ?? mockSellers[0]?.id ?? null) : null,
});

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      users: [],
      currentUser: defaultCurrentUser,

      register: ({ name, email, password, role, sellerId }) => {
        const normalizedEmail = normalizeEmail(email);
        const exists = get().users.some((user) => user.email === normalizedEmail);

        if (exists) {
          return { ok: false, error: "Пользователь с таким email уже существует." };
        }

        const newUser = buildUser({
          id: Date.now(),
          name,
          email: normalizedEmail,
          password,
          role,
          sellerId,
        });

        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
          cart: [],
        }));

        return { ok: true, user: newUser };
      },

      login: ({ email, password }) => {
        const normalizedEmail = normalizeEmail(email);
        const matchedUser = get().users.find(
          (user) => user.email === normalizedEmail && user.password === password
        );

        if (!matchedUser) {
          return { ok: false, error: "Неверный email или пароль." };
        }

        set({ currentUser: matchedUser, cart: [] });
        return { ok: true, user: matchedUser };
      },

      logout: () => set({ currentUser: null, cart: [] }),

      setRole: (role) =>
        set((state) => {
          if (!state.currentUser) return state;

          return {
            currentUser: {
              ...state.currentUser,
              role,
              sellerId: role === "seller" ? state.currentUser.sellerId ?? mockSellers[0]?.id ?? null : null,
            },
            users: state.users.map((user) =>
              user.id === state.currentUser.id
                ? {
                    ...user,
                    role,
                    sellerId:
                      role === "seller"
                        ? state.currentUser.sellerId ?? mockSellers[0]?.id ?? null
                        : null,
                  }
                : user
            ),
          };
        }),

      setSellerId: (sellerId) =>
        set((state) => {
          if (!state.currentUser) return state;

          const normalizedSellerId = Number(sellerId);

          return {
            currentUser: {
              ...state.currentUser,
              sellerId: normalizedSellerId,
            },
            users: state.users.map((user) =>
              user.id === state.currentUser.id
                ? {
                    ...user,
                    sellerId: normalizedSellerId,
                  }
                : user
            ),
          };
        }),

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
        currentUser: state.currentUser,
      }),
      merge: (persistedState, currentState) => {
        const persistedCurrentUser = persistedState?.currentUser;

        // Legacy sessions (without email) are ignored to enforce real auth flow.
        const normalizedCurrentUser =
          persistedCurrentUser && persistedCurrentUser.email ? persistedCurrentUser : null;

        return {
          ...currentState,
          ...persistedState,
          users: persistedState?.users ?? [],
          currentUser: normalizedCurrentUser ?? defaultCurrentUser,
        };
      },
    }
  )
);
