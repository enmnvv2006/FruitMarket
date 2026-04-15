import { useCartStore } from "../store/useCartStore";

export function CartProvider({ children }) {
  return children;
}

export function useCart() {
  const cart = useCartStore((state) => state.cart);
  const currentUser = useCartStore((state) => state.currentUser);
  const setRole = useCartStore((state) => state.setRole);
  const setSellerId = useCartStore((state) => state.setSellerId);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQty = useCartStore((state) => state.updateQty);
  const clearCart = useCartStore((state) => state.clearCart);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return {
    cart,
    cartCount,
    cartTotal,
    currentUser,
    setRole,
    setSellerId,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
  };
}
