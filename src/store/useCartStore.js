import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mockSellers } from "../data/mockSellers";
import { sellerPasswords } from "../data/sellerPasswords";

const defaultCurrentUser = null;

const clampQty = (qty, maxQty) => Math.max(1, Math.min(qty, maxQty));
const normalizeEmail = (email) => email.trim().toLowerCase();

const buildBuyer = ({ id, name, email, password }) => ({
  id,
  name: name.trim(),
  email: normalizeEmail(email),
  password,
  role: "buyer",
  sellerId: null,
});

const buildSellerSession = (sellerId) => {
  const normalizedSellerId = Number(sellerId);
  const seller = mockSellers.find((item) => item.id === normalizedSellerId);

  if (!seller) return null;

  return {
    id: `seller-${seller.id}`,
    name: seller.name,
    email: null,
    password: null,
    role: "seller",
    sellerId: seller.id,
  };
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      users: [],
      currentUser: defaultCurrentUser,

      register: ({ name, email, password }) => {
        const normalizedEmail = normalizeEmail(email);
        const exists = get().users.some((user) => user.email === normalizedEmail);

        if (exists) {
          return { ok: false, error: "Пользователь с таким email уже существует." };
        }

        const newUser = buildBuyer({
          id: Date.now(),
          name,
          email: normalizedEmail,
          password,
        });

        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
          cart: [],
        }));

        return { ok: true, user: newUser };
      },

      loginBuyer: ({ email, password }) => {
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

      loginSeller: ({ sellerId, password }) => {
        const normalizedSellerId = Number(sellerId);
        const validPassword = sellerPasswords[normalizedSellerId];

        if (!validPassword || validPassword !== password) {
          return { ok: false, error: "Неверный пароль продавца." };
        }

        const sellerSession = buildSellerSession(normalizedSellerId);

        if (!sellerSession) {
          return { ok: false, error: "Продавец не найден." };
        }

        set({ currentUser: sellerSession, cart: [] });
        return { ok: true, user: sellerSession };
      },

      logout: () => set({ currentUser: null, cart: [] }),

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
        const persistedUsers = (persistedState?.users ?? []).filter(
          (user) => user?.role === "buyer" && user?.email
        );

        const persistedCurrentUser = persistedState?.currentUser;
        let normalizedCurrentUser = null;

        if (persistedCurrentUser?.role === "buyer" && persistedCurrentUser?.email) {
          normalizedCurrentUser = persistedCurrentUser;
        }

        if (persistedCurrentUser?.role === "seller" && persistedCurrentUser?.sellerId) {
          normalizedCurrentUser = buildSellerSession(persistedCurrentUser.sellerId);
        }

        return {
          ...currentState,
          ...persistedState,
          users: persistedUsers,
          currentUser: normalizedCurrentUser ?? defaultCurrentUser,
        };
      },
    }
  )
);
