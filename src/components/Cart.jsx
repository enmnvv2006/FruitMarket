import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cart, cartTotal, currentUser, updateQty, removeFromCart, placeOrder } = useCart();
  const [customerName, setCustomerName] = useState(currentUser?.name ?? "");

  useEffect(() => {
    setCustomerName(currentUser?.name ?? "");
  }, [currentUser?.name]);

  const handleOrder = (e) => {
    e.preventDefault();
    if (!cart.length || !customerName.trim()) return;

    placeOrder({ customerName: customerName.trim() });
    setCustomerName(currentUser?.name ?? "");
    toast.success("Заказ оформлен");
  };

  if (!cart.length) {
    return (
      <section className="glass-panel p-8 text-center sm:p-10">
        <p className="brand-font text-xs uppercase tracking-[0.2em] text-[var(--brand)]">Cart</p>
        <h2 className="section-title">Корзина пуста</h2>
        <p className="muted mt-1">Добавьте товары из каталога, чтобы оформить заказ.</p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
      <div className="glass-panel p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="brand-font text-xs uppercase tracking-[0.2em] text-[var(--brand)]">Checkout</p>
            <h2 className="section-title">Корзина</h2>
          </div>
          <span className="accent-badge">Позиций: {cart.length}</span>
        </div>

        <div className="space-y-3">
          {cart.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-bold text-[var(--text)]">{item.name}</p>
                  <p className="text-sm text-[var(--muted)]">{item.price} сом за кг</p>
                  <p className="text-xs text-[var(--muted)]">
                    {item.isLabTested ? "Лабораторно проверен" : "Без лабораторной проверки"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="btn-secondary min-h-9 min-w-9 px-0 py-0"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="btn-secondary min-h-9 min-w-9 px-0 py-0"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <p className="min-w-24 rounded-xl bg-[var(--surface-soft)] px-2 py-1 text-right text-sm font-extrabold text-[var(--brand-strong)]">
                    {item.qty * item.price} сом
                  </p>
                  <button onClick={() => removeFromCart(item.id)} className="btn-danger px-3 py-1.5 text-xs sm:text-sm">
                    Удалить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="glass-panel h-fit p-5 lg:sticky lg:top-24">
        <h3 className="section-title">Оформление</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">Проверьте данные и подтвердите заказ.</p>

        <p className="my-5 rounded-2xl border border-[rgba(63,143,58,0.24)] bg-[var(--surface-soft)] p-3 text-lg font-extrabold text-[var(--text)]">
          Итого: {cartTotal} сом
        </p>

        <form onSubmit={handleOrder} className="space-y-3">
          <input
            type="text"
            placeholder="Ваше имя"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input-base"
            required
          />
          <button type="submit" className="btn-primary w-full">
            Заказать
          </button>
        </form>
      </aside>
    </section>
  );
}
