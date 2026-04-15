import React, { useMemo } from "react";
import { useCart } from "../context/CartContext";

export default function AdminPanel({ products, sellersById }) {
  const { users, cart, currentUser } = useCart();

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, item) => sum + item.quantity, 0);
    const lowStock = products.filter((item) => item.quantity > 0 && item.quantity <= 10).length;
    const outOfStock = products.filter((item) => item.quantity <= 0).length;
    const catalogValue = products.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      totalStock,
      lowStock,
      outOfStock,
      catalogValue,
      buyerAccounts: users.length,
      activeCartItems: cart.length,
    };
  }, [products, users, cart]);

  return (
    <div className="space-y-5">
      <section className="glass-panel p-5 sm:p-6">
        <h2 className="section-title">Админ-панель</h2>
        <p className="muted mt-2">
          Доступ только для администратора. Текущая сессия: {currentUser?.name ?? "-"}.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="glass-panel p-4">
          <p className="muted">Товаров в каталоге</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{products.length}</p>
        </article>
        <article className="glass-panel p-4">
          <p className="muted">Продавцов</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{Object.keys(sellersById).length}</p>
        </article>
        <article className="glass-panel p-4">
          <p className="muted">Зарегистрированных покупателей</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{stats.buyerAccounts}</p>
        </article>
        <article className="glass-panel p-4">
          <p className="muted">Остаток на складе</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{stats.totalStock} кг</p>
        </article>
        <article className="glass-panel p-4">
          <p className="muted">Товаров мало (до 10 кг)</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{stats.lowStock}</p>
        </article>
        <article className="glass-panel p-4">
          <p className="muted">Нет в наличии</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{stats.outOfStock}</p>
        </article>
        <article className="glass-panel p-4">
          <p className="muted">Оценка стоимости каталога</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{stats.catalogValue} сом</p>
        </article>
        <article className="glass-panel p-4">
          <p className="muted">Позиции в текущей корзине</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{stats.activeCartItems}</p>
        </article>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <h3 className="section-title mb-3">Покупатели</h3>
        {users.length ? (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <span className="font-semibold text-[var(--text)]">{user.name}</span>
                <span className="ml-2 text-[var(--muted)]">{user.email}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Пока нет зарегистрированных покупателей.</p>
        )}
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <h3 className="section-title mb-3">Товары по продавцам</h3>
        <div className="space-y-2">
          {Object.values(sellersById).map((seller) => {
            const sellerProducts = products.filter((item) => item.sellerId === seller.id);

            return (
              <div
                key={seller.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <span className="font-semibold text-[var(--text)]">{seller.shopName}</span>
                <span className="ml-2 text-[var(--muted)]">товаров: {sellerProducts.length}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
