import React, { useMemo } from "react";
import { useCart } from "../context/CartContext";

const ORDER_STATUSES = ["В обработке", "Доставлен", "Отменён"];

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU");
}

function badgeClass(status) {
  if (status === "В обработке") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "Доставлен") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-red-100 text-red-700";
}

export default function AccountPage() {
  const {
    currentUser,
    orders,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    updateOrderStatus,
  } = useCart();
  const isSeller = currentUser?.role === "seller";

  const visibleOrders = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    if (currentUser.role === "admin") {
      return orders;
    }

    if (currentUser.role === "seller") {
      return orders
        .map((order) => {
          const sellerItems = order.items.filter(
            (item) => item.sellerId === Number(currentUser.sellerId)
          );

          if (!sellerItems.length) {
            return null;
          }

          return {
            ...order,
            items: sellerItems,
            total: sellerItems.reduce((sum, item) => sum + item.price * item.qty, 0),
          };
        })
        .filter(Boolean);
    }

    return orders.filter((order) => order.customerUserId === currentUser.id);
  }, [currentUser, orders]);

  const canManageStatus = currentUser?.role === "admin" || currentUser?.role === "seller";

  return (
    <div className="space-y-5">
      <section className="glass-panel p-5 sm:p-6">
        <h2 className="section-title">Личный кабинет</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="pill">📦 Заказов: {visibleOrders.length}</span>
          <span className="pill">🔄 Статусы: {ORDER_STATUSES.join(" / ")}</span>
        </div>
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <h3 className="section-title mb-3">Список заказов</h3>
        {visibleOrders.length ? (
          <div className="space-y-3">
            {visibleOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text)]">
                    Заказ #{order.id} • {formatDateTime(order.createdAt)}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                  <p>
                    💰 {isSeller ? "Сумма по вашим товарам" : "Общая сумма"}:{" "}
                    <span className="font-semibold text-[var(--text)]">{order.total} сом</span>
                  </p>
                  <p>👤 Кто заказал: <span className="font-semibold text-[var(--text)]">{order.customerName}</span></p>
                  <p>🔄 Статус: <span className="font-semibold text-[var(--text)]">{order.status}</span></p>
                </div>

                <div className="mt-2 text-xs text-[var(--muted)]">
                  Товары: {order.items.map((item) => `${item.name} x${item.qty}`).join(", ")}
                </div>

                {canManageStatus && (
                  <div className="mt-3">
                    <label htmlFor={`status-${order.id}`} className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                      Изменить статус
                    </label>
                    <select
                      id={`status-${order.id}`}
                      value={order.status}
                      onChange={(event) =>
                        updateOrderStatus({ orderId: order.id, status: event.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[rgba(47,125,68,0.2)] sm:w-auto"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Заказов пока нет.</p>
        )}
      </section>

      <section className="glass-panel p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="section-title">Уведомления</h3>
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="text-xs font-semibold text-[var(--brand)]"
          >
            Отметить все прочитанными
          </button>
        </div>

        {notifications.length ? (
          <div className="space-y-2">
            {notifications.slice(0, 12).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markNotificationRead(item.id)}
                className={`w-full rounded-xl border p-3 text-left ${
                  item.isRead
                    ? "border-[var(--line)] bg-[var(--surface)]"
                    : "border-[rgba(63,143,58,0.45)] bg-[var(--surface-soft)]"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.message}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(item.createdAt)}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">Уведомлений пока нет.</p>
        )}
      </section>
    </div>
  );
}
