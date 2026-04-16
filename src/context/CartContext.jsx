import { useCartStore } from "../store/useCartStore";

export function CartProvider({ children }) {
  return children;
}

export function useCart() {
  const cart = useCartStore((state) => state.cart);
  const users = useCartStore((state) => state.users);
  const orders = useCartStore((state) => state.orders);
  const currentUser = useCartStore((state) => state.currentUser);
  const isAuthChecked = useCartStore((state) => state.isAuthChecked);
  const authLoading = useCartStore((state) => state.authLoading);
  const initializeAuth = useCartStore((state) => state.initializeAuth);
  const register = useCartStore((state) => state.register);
  const loginBuyer = useCartStore((state) => state.loginBuyer);
  const loginSeller = useCartStore((state) => state.loginSeller);
  const loginAdmin = useCartStore((state) => state.loginAdmin);
  const logout = useCartStore((state) => state.logout);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQty = useCartStore((state) => state.updateQty);
  const clearCart = useCartStore((state) => state.clearCart);
  const placeOrder = useCartStore((state) => state.placeOrder);
  const updateOrderStatus = useCartStore((state) => state.updateOrderStatus);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return {
    cart,
    users,
    orders,
    cartCount,
    cartTotal,
    currentUser,
    isAuthenticated: Boolean(currentUser),
    isAuthChecked,
    authLoading,
    initializeAuth,
    register,
    loginBuyer,
    loginSeller,
    loginAdmin,
    logout,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    placeOrder,
    updateOrderStatus,
  };
}
