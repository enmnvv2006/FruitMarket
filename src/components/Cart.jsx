import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cart, cartTotal, currentUser, updateQty, removeFromCart, clearCart } = useCart();
  const [customerName, setCustomerName] = useState(currentUser?.name ?? "");

  useEffect(() => {
    setCustomerName(currentUser?.name ?? "");
  }, [currentUser?.name]);

  const handleOrder = (e) => {
    e.preventDefault();
    if (!cart.length || !customerName.trim()) return;

    clearCart();
    setCustomerName(currentUser?.name ?? "");
    alert("Заказ оформлен");
  };

  if (!cart.length) {
    return (
      <section className="glass-panel p-8 text-center">
        <h2 className="section-title">Корзина пуста</h2>
        <p className="muted mt-1">Добавьте фрукты из каталога, чтобы оформить заказ.</p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="glass-panel p-4 sm:p-5">
        <h2 className="section-title mb-4">Корзина</h2>

        <div className="space-y-3">
          {cart.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:p-4"
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
                    className="btn-secondary px-3 py-1.5"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="btn-secondary px-3 py-1.5"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <p className="min-w-24 text-right text-sm font-extrabold text-[var(--brand-strong)]">
                    {item.qty * item.price} сом
                  </p>
                  <button onClick={() => removeFromCart(item.id)} className="btn-danger px-3 py-1.5">
                    Удалить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="glass-panel h-fit p-5">
        <h3 className="section-title">Оформление</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">Проверьте данные и подтвердите заказ.</p>

        <p className="my-5 rounded-xl bg-[var(--surface-soft)] p-3 text-lg font-extrabold text-[var(--text)]">
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
