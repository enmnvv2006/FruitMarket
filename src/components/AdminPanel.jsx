import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import { getAdminAccounts, setAccountBlocked } from "../api/authApi";

function toReadableError(error, fallbackText) {
  const message = String(error?.message ?? "").trim();
  if (!message || message === "Request failed") {
    return fallbackText;
  }

  return message;
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value ?? "-");
  }

  return date.toLocaleString("ru-RU");
}

export default function AdminPanel({ products, sellersById }) {
  const { users, cart, orders, currentUser } = useCart();
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [actionKey, setActionKey] = useState("");

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
      activeCartItems: cart.length,
    };
  }, [products, cart]);

  useEffect(() => {
    let isMounted = true;

    const loadAccounts = async () => {
      setLoadingAccounts(true);
      setAccountsError("");

      try {
        const payload = await getAdminAccounts();

        if (!isMounted) {
          return;
        }

        setBuyers(Array.isArray(payload.buyers) ? payload.buyers : []);
        setSellers(Array.isArray(payload.sellers) ? payload.sellers : []);
        setIsFallbackMode(false);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const localBuyers = users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: "buyer",
          isBlocked: false,
        }));

        const localSellers = Object.values(sellersById).map((seller) => ({
          id: seller.id,
          name: seller.name,
          role: "seller",
          isBlocked: false,
        }));

        setBuyers(localBuyers);
        setSellers(localSellers);
        setIsFallbackMode(true);
        setAccountsError(
          toReadableError(
            error,
            "Не удалось загрузить аккаунты с сервера. Показан локальный список без блокировки."
          )
        );
      } finally {
        if (isMounted) {
          setLoadingAccounts(false);
        }
      }
    };

    void loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [users, sellersById]);

  const handleToggleBlock = async ({ targetRole, targetId, blocked }) => {
    const nextActionKey = `${targetRole}-${targetId}`;
    setActionKey(nextActionKey);
    setAccountsError("");

    try {
      await setAccountBlocked({ targetRole, targetId, blocked });

      if (targetRole === "buyer") {
        setBuyers((prev) =>
          prev.map((item) => (item.id === targetId ? { ...item, isBlocked: blocked } : item))
        );
      } else {
        setSellers((prev) =>
          prev.map((item) => (item.id === targetId ? { ...item, isBlocked: blocked } : item))
        );
      }
    } catch (error) {
      setAccountsError(toReadableError(error, "Не удалось обновить статус блокировки."));
    } finally {
      setActionKey("");
    }
  };

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
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{buyers.length}</p>
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
        {loadingAccounts ? (
          <p className="muted">Загрузка аккаунтов...</p>
        ) : buyers.length ? (
          <div className="space-y-2">
            {buyers.map((user) => {
              const key = `buyer-${user.id}`;
              const isProcessing = actionKey === key;
              const controlsDisabled = isProcessing || isFallbackMode;

              return (
              <div
                key={user.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-[var(--text)]">{user.name}</span>
                    <span className="ml-2 text-[var(--muted)]">{user.email}</span>
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                        user.isBlocked
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {user.isBlocked ? "Заблокирован" : "Активен"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      user.isBlocked
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                    onClick={() =>
                      handleToggleBlock({
                        targetRole: "buyer",
                        targetId: user.id,
                        blocked: !user.isBlocked,
                      })
                    }
                    disabled={controlsDisabled}
                  >
                    {isProcessing
                      ? "Сохранение..."
                      : user.isBlocked
                      ? "Разблокировать"
                      : "Блокировать"}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">Пока нет зарегистрированных покупателей.</p>
        )}
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <h3 className="section-title mb-3">Товары по продавцам</h3>
        <div className="space-y-2">
          {sellers.map((seller) => {
            const sellerProducts = products.filter((item) => item.sellerId === seller.id);
            const key = `seller-${seller.id}`;
            const isProcessing = actionKey === key;
            const controlsDisabled = isProcessing || isFallbackMode;
            const sellerView = sellersById[seller.id];
            const sellerName = sellerView?.shopName || seller.name;

            return (
              <div
                key={seller.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-[var(--text)]">{sellerName}</span>
                    <span className="ml-2 text-[var(--muted)]">товаров: {sellerProducts.length}</span>
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                        seller.isBlocked
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {seller.isBlocked ? "Заблокирован" : "Активен"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      seller.isBlocked
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                    onClick={() =>
                      handleToggleBlock({
                        targetRole: "seller",
                        targetId: seller.id,
                        blocked: !seller.isBlocked,
                      })
                    }
                    disabled={controlsDisabled}
                  >
                    {isProcessing
                      ? "Сохранение..."
                      : seller.isBlocked
                      ? "Разблокировать"
                      : "Блокировать"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {!loadingAccounts && !sellers.length && (
          <p className="muted mt-2">Список продавцов пока недоступен.</p>
        )}
        {accountsError && <p className="mt-3 text-sm font-medium text-red-600">{accountsError}</p>}
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <h3 className="section-title mb-3">Все заказы</h3>
        {orders.length ? (
          <div className="space-y-2">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--text)]">
                    Заказ #{order.id} • {formatDateTime(order.createdAt)}
                  </p>
                  <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--text)]">
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-[var(--muted)]">
                  👤 {order.customerName} {order.customerEmail ? `(${order.customerEmail})` : ""}
                </p>
                <p className="text-[var(--muted)]">💰 {order.total} сом</p>
                <p className="text-xs text-[var(--muted)]">
                  Товары: {order.items.map((item) => `${item.name} x${item.qty}`).join(", ")}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Пока нет оформленных заказов.</p>
        )}
      </section>
    </div>
  );
}
