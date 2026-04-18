import React from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import AddProductForm from "./components/AddProductForm";
import AuthPage from "./components/AuthPage";
import AdminPanel from "./components/AdminPanel";
import AccountPage from "./components/AccountPage";
import { CartProvider, useCart } from "./context/CartContext";
import { mockFruits } from "./data/mockFruits";
import { mockSellers } from "./data/mockSellers";
import {
  CATEGORY_LABELS,
  normalizeCategory,
  PRODUCT_CATEGORY_OPTIONS,
} from "./data/productCategories";

const PRODUCTS_STORAGE_KEY = "fruit-market-products";
const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80";

function normalizeBatchText(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeBatchDate(value) {
  const text = String(value ?? "").trim();
  if (text) {
    return text;
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeBatchFields(item) {
  const fallbackBatchId = item.id ? `BATCH-${item.id}` : `BATCH-${Date.now()}`;

  return {
    batchId: normalizeBatchText(item.batchId, fallbackBatchId),
    receivedAt: normalizeBatchDate(item.receivedAt),
    source: normalizeBatchText(item.source, "Не указано"),
    destination: normalizeBatchText(item.destination, "Склад"),
  };
}

function normalizeProduct(item) {
  return {
    ...item,
    price: Number(item.price),
    quantity: Number(item.quantity),
    isLabTested: Boolean(item.isLabTested),
    category: normalizeCategory(item.category),
    ...normalizeBatchFields(item),
  };
}

function getInitialProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      return mockFruits.map(normalizeProduct);
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return mockFruits.map(normalizeProduct);
    }

    const storedProducts = parsed.map(normalizeProduct);
    const storedIds = new Set(storedProducts.map((item) => item.id));
    const missingSeedProducts = mockFruits
      .map(normalizeProduct)
      .filter((item) => !storedIds.has(item.id));

    return [...storedProducts, ...missingSeedProducts];
  } catch {
    return mockFruits.map(normalizeProduct);
  }
}

function RequireAuth({ children }) {
  const { isAuthenticated } = useCart();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const { currentUser } = useCart();

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (currentUser.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function NavGlyph({ kind }) {
  if (kind === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (kind === "cart") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 5h2l1.5 9.2h10.7l1.8-6.2H8.2" />
        <circle cx="10" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
      </svg>
    );
  }

  if (kind === "account") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4 20c1.2-3.5 4.1-5 8-5s6.8 1.5 8 5" />
      </svg>
    );
  }

  if (kind === "admin") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    );
  }

  if (kind === "tracking") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="5" height="5" rx="1" />
        <rect x="16" y="3" width="5" height="5" rx="1" />
        <rect x="3" y="16" width="5" height="5" rx="1" />
        <path d="M11 3h3v3h-3zM11 11h3v3h-3zM16 11h5v5h-5zM8 8h3v3H8zM3 11h3v3H3zM11 16h3v5h-3z" />
      </svg>
    );
  }

  if (kind === "analytics") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20H2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function AppSidebar({ currentUser, cartCount, logout }) {
  if (!currentUser) {
    return null;
  }

  const links =
    currentUser.role === "admin"
      ? [
          { to: "/", label: "Дашборд", kind: "dashboard" },
          { to: "/admin", label: "Админ-панель", kind: "admin" },
        ]
      : currentUser.role === "seller"
        ? [
            { to: "/", label: "Дашборд", kind: "dashboard" },
            { to: `/seller/${currentUser.sellerId}`, label: "Урожай", kind: "cart" },
            { to: "/account", label: "Сделки", kind: "account" },
            { to: "/tracking", label: "Прослеживаемость", kind: "tracking" },
            { to: "/analytics", label: "Аналитика", kind: "analytics" },
          ]
        : [
            { to: "/", label: "Дашборд", kind: "dashboard" },
            { to: "/cart", label: `Корзина (${cartCount})`, kind: "cart" },
            { to: "/account", label: "Сделки", kind: "account" },
          ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition ${
      isActive
        ? "bg-[rgba(63,143,58,0.95)] text-white"
        : "text-[rgba(232,245,224,0.88)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
    }`;

  return (
    <aside className="app-sidebar hidden xl:sticky xl:top-3 xl:flex xl:h-[calc(100vh-1.5rem)] xl:w-[290px] xl:flex-col">
      <div>
        <h1 className="brand-font text-[42px] leading-none text-white">Aykyn Charba</h1>
        <p className="mt-3 text-base text-[rgba(229,240,223,0.82)]">Фермерская платформа</p>
      </div>

      <nav className="mt-8 space-y-2">
        {links.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <NavGlyph kind={item.kind} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-2 border-t border-[rgba(189,218,174,0.2)] pt-5">
        <NavLink to="/account" className={linkClass}>
          <NavGlyph kind="account" />
          <span>Настройки</span>
        </NavLink>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-semibold text-[rgba(232,245,224,0.88)] transition hover:bg-[rgba(255,255,255,0.1)] hover:text-white">
          <NavGlyph kind="menu" />
          <span>Выход</span>
        </button>
      </div>
    </aside>
  );
}

function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (minutes < 1) {
    return "только что";
  }

  if (minutes < 60) {
    return `${minutes} мин назад`;
  }

  if (hours < 24) {
    return `${hours} ч назад`;
  }

  return date.toLocaleDateString("ru-RU");
}

function NotificationTypeIcon({ type }) {
  if (type === "order_status_changed") {
    return (
      <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-[rgba(63,143,58,0.14)] text-[var(--brand)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="m5 13 4 4L19 7" />
        </svg>
      </span>
    );
  }

  if (type === "order_created") {
    return (
      <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-[rgba(240,176,74,0.16)] text-[rgba(210,134,12,1)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4 12h4l2 5 4-10 2 5h4" />
        </svg>
      </span>
    );
  }

  return (
    <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-[rgba(96,114,85,0.14)] text-[var(--muted)]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
    </span>
  );
}

function AppTopBar({
  currentUser,
  cartCount,
  logout,
  searchQuery,
  setSearchQuery,
  notifications,
  unreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const mobileLinks =
    currentUser.role === "admin"
      ? [{ to: "/", label: "Дашборд" }, { to: "/admin", label: "Админ" }]
      : currentUser.role === "seller"
        ? [
            { to: "/", label: "Дашборд" },
            { to: `/seller/${currentUser.sellerId}`, label: "Урожай" },
            { to: "/account", label: "Сделки" },
            { to: "/tracking", label: "Прослеживаемость" },
            { to: "/analytics", label: "Аналитика" },
          ]
        : [
            { to: "/", label: "Дашборд" },
            { to: "/cart", label: `Корзина (${cartCount})` },
            { to: "/account", label: "Сделки" },
          ];

  return (
    <header className="glass-panel relative z-40 overflow-visible flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
      <label htmlFor="global-search" className="relative block min-w-[260px] flex-1">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input
          id="global-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Поиск по партиям, сделкам..."
          className="input-base w-full pl-12"
        />
      </label>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(27,42,22,0.24)] bg-white text-[var(--muted)] shadow-[0_6px_16px_rgba(23,55,24,0.08)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
              <path d="M10 17a2 2 0 0 0 4 0" />
            </svg>
            {unreadNotificationsCount > 0 && (
              <span className="absolute right-0.5 top-0.5 h-5 min-w-5 rounded-full bg-[var(--accent)] px-1 text-xs font-bold leading-5 text-white ring-2 ring-white">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full z-[120] mt-2 w-[420px] max-w-[92vw] overflow-hidden rounded-3xl border border-[var(--line)] bg-[#f7faf5] shadow-[0_30px_60px_rgba(23,55,24,0.18)]">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
                <p className="text-3xl font-extrabold leading-none text-[var(--text)]">Уведомления</p>
                <button
                  type="button"
                  onClick={() => {
                    markAllNotificationsRead();
                    setIsNotificationsOpen(false);
                  }}
                  className="text-sm font-semibold text-[var(--brand)]"
                >
                  Прочитать все
                </button>
              </div>

              <div className="max-h-[430px] overflow-auto">
                {notifications.length ? (
                  notifications.slice(0, 8).map((item) => (
                    <div key={item.id} className="border-b border-[var(--line)] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => markNotificationRead(item.id)}
                        className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-[rgba(63,143,58,0.06)]"
                      >
                        <NotificationTypeIcon type={item.type} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-base font-bold leading-5 text-[var(--text)]">
                              {item.title}
                            </p>
                            {!item.isRead && (
                              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                            )}
                          </div>
                          <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                            {item.message}
                          </p>
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            {formatNotificationTime(item.createdAt)}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="px-5 py-6 text-sm text-[var(--muted)]">
                    Новых уведомлений пока нет.
                  </p>
                )}
              </div>

              <Link
                to="/account"
                onClick={() => setIsNotificationsOpen(false)}
                className="block border-t border-[var(--line)] px-5 py-4 text-center text-base font-semibold text-[var(--brand)] transition hover:bg-[rgba(63,143,58,0.06)]"
              >
                Посмотреть все уведомления
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-3 py-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-[var(--text)]">{currentUser.name}</p>
            <p className="text-xs text-[var(--muted)]">{currentUser.role === "seller" ? "Фермер" : currentUser.role === "admin" ? "Администратор" : "Покупатель"}</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
            {String(currentUser.name).slice(0, 1).toUpperCase()}
          </span>
        </div>
      </div>

      <nav className="flex w-full flex-wrap items-center gap-2 xl:hidden">
        {mobileLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-[var(--brand)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--muted)]"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <button type="button" onClick={logout} className="btn-danger px-3 py-2 text-sm">
          Выход
        </button>
      </nav>
    </header>
  );
}

function DashboardHeader({ products }) {
  const { currentUser } = useCart();

  if (!currentUser) {
    return null;
  }

  const stats = useMemo(() => {
    const inStock = products.reduce((sum, item) => sum + item.quantity, 0);
    const avgPrice = products.length
      ? Math.round(products.reduce((sum, item) => sum + item.price, 0) / products.length)
      : 0;

    return { items: products.length, inStock, avgPrice };
  }, [products]);

  const roleLabel =
    currentUser.role === "admin"
      ? "Администратор"
      : currentUser.role === "seller"
        ? "Продавец"
        : "Покупатель";

  return (
    <section className="space-y-4">
      <div className="glass-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-[46px] sm:leading-[1.04]">
              Добро пожаловать, {currentUser.name}!
            </h1>
            <p className="mt-2 text-lg text-[var(--muted)]">Управляйте своими партиями и сделками</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{roleLabel}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button type="button" className="btn-secondary border-[rgba(63,143,58,0.6)] text-[var(--brand)]">
              Мои QR-коды
            </button>
            <button type="button" className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#322100] transition hover:brightness-95">
              Найти покупателя
            </button>
            <button type="button" className="btn-primary">
              Добавить урожай
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="glass-panel motion-card motion-delay-1 p-5">
          <p className="text-base font-semibold text-[var(--muted)]">Активные партии</p>
          <p className="mt-2 text-5xl font-extrabold text-[var(--text)]">{stats.items}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Готовы к продаже</p>
        </article>
        <article className="glass-panel border-[rgba(240,176,74,0.45)] p-5">
          <p className="text-base font-semibold text-[var(--muted)]">Общий объём</p>
          <p className="mt-2 text-5xl font-extrabold text-[var(--text)]">{stats.inStock}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Тонн продукции</p>
        </article>
        <article className="glass-panel motion-card motion-delay-2 p-5">
          <p className="text-base font-semibold text-[var(--muted)]">Потенциальная выручка</p>
          <p className="mt-2 text-5xl font-extrabold text-[var(--text)]">{stats.avgPrice}k</p>
          <p className="mt-1 text-sm text-[var(--muted)]">По текущим ценам</p>
        </article>
      </div>
    </section>
  );
}

function HomePage({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  filteredProducts,
  sellersById,
}) {
  return (
    <div className="space-y-4">
      <section className="glass-panel p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="ui-chip">Фильтры каталога</span>
          <span className="accent-badge">Подбор за 1 клик</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
          <div>
            <label
              htmlFor="product-search"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
            >
              Поиск товаров
            </label>
            <input
              id="product-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Например: манго, яблоко, Organic..."
              className="input-base"
            />
          </div>

          <div>
            <label
              htmlFor="product-category"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
            >
              Категория
            </label>
            <select
              id="product-category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="input-base"
            >
              {PRODUCT_CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {searchQuery && (
        <p className="px-1 text-sm text-[var(--muted)]">
          Найдено товаров: <span className="font-semibold text-[var(--text)]">{filteredProducts.length}</span>
        </p>
      )}

      <div className="flex items-end justify-between px-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Активные партии</h2>
          <p className="mt-1 text-lg text-[var(--muted)]">Последние 5 партий урожая</p>
        </div>
        <span className="hidden text-lg font-semibold text-[var(--brand)] sm:inline">Посмотреть все →</span>
      </div>

      <ProductList
        products={filteredProducts}
        sellersById={sellersById}
        emptyTitle={searchQuery ? "По вашему запросу ничего не найдено" : undefined}
        emptyDescription={
          searchQuery
            ? "Попробуйте изменить запрос: по названию товара, описанию или магазину."
            : undefined
        }
      />
    </div>
  );
}

function TrackingPage({ currentUser, products }) {
  const sellerProducts =
    currentUser?.role === "seller"
      ? products.filter((item) => item.sellerId === currentUser.sellerId)
      : [];

  const initialBatch = sellerProducts[0]?.batchId ?? "P-2301";
  const [trackingInput, setTrackingInput] = useState(initialBatch);
  const [trackingQuery, setTrackingQuery] = useState(initialBatch);

  const normalizeTrackingText = (value) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/[п]/g, "p")
      .replace(/[о]/g, "o")
      .replace(/[с]/g, "c")
      .replace(/[х]/g, "x")
      .replace(/[а]/g, "a")
      .replace(/[е]/g, "e")
      .replace(/[к]/g, "k")
      .replace(/[м]/g, "m")
      .replace(/[т]/g, "t")
      .replace(/[^a-z0-9]+/g, "");

  const productIndexById = useMemo(
    () => Object.fromEntries(sellerProducts.map((item, index) => [item.id, index])),
    [sellerProducts]
  );

  const getPublicBatchCode = (item) => {
    const index = productIndexById[item.id] ?? 0;
    return `P-${2301 + index}`;
  };

  const selectedProduct = useMemo(() => {
    if (!sellerProducts.length) {
      return null;
    }

    const query = normalizeTrackingText(trackingQuery);
    if (!query) {
      return sellerProducts[0];
    }

    return sellerProducts.find((item) => {
      const searchable = normalizeTrackingText(
        `${item.batchId} ${item.id} ${item.name} ${item.source} ${item.destination} ${getPublicBatchCode(item)}`
      );
      return searchable.includes(query);
    });
  }, [sellerProducts, trackingQuery]);

  const handleTrackingSearch = (event) => {
    event.preventDefault();
    setTrackingQuery(trackingInput);
  };

  if (!sellerProducts.length) {
    return (
      <section className="glass-panel p-8 text-center">
        <h2 className="section-title">Прослеживаемость</h2>
        <p className="muted mt-2">У вас пока нет партий для отслеживания.</p>
      </section>
    );
  }

  const activeProduct = selectedProduct ?? sellerProducts[0];
  const scanCount = Math.max(3, Math.min(12, Math.round((activeProduct.quantity || 0) / 10)));
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const publicProductPath = `${basePath}/product/${activeProduct.id}`.replace(/\/{2,}/g, "/");
  const publicProductUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicProductPath}`
      : publicProductPath;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(
    publicProductUrl
  )}`;
  const movementHistory = [
    {
      id: "stage-3",
      title: "Сканирование при приёмке",
      location: `${activeProduct.destination}, Алматы`,
      person: "Менеджер Ахметов К.",
      timestamp: "17.04.2026 14:23",
    },
    {
      id: "stage-2",
      title: "Сканирование при отгрузке",
      location: 'Транспортная компания "КазЛогистика"',
      person: "Водитель Петров И.",
      timestamp: "16.04.2026 09:15",
    },
    {
      id: "stage-1",
      title: "Создание партии",
      location: activeProduct.source || "Фермерское хозяйство",
      person: `Фермер ${currentUser?.name || "Иванов С."}`,
      timestamp: "15.04.2026 16:45",
    },
  ];

  const productLink = `/product/${activeProduct.id}`;

  const handleDownloadQr = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${activeProduct.batchId || "batch"}-qr.png`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const handlePrintQr = () => {
    const printWindow = window.open("", "_blank", "width=760,height=880");
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html lang="ru">
        <head>
          <meta charset="UTF-8" />
          <title>QR-код партии ${activeProduct.batchId}</title>
          <style>
            body { font-family: Manrope, Arial, sans-serif; margin: 24px; color: #1b2a16; }
            .wrap { max-width: 560px; margin: 0 auto; text-align: center; }
            img { width: 320px; height: 320px; border: 1px solid #d4ddc6; border-radius: 20px; padding: 10px; }
            h1 { font-size: 26px; margin: 0 0 8px; }
            p { margin: 6px 0; color: #607255; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <h1>QR-код партии ${activeProduct.batchId}</h1>
            <p>${activeProduct.name}</p>
            <img src="${qrCodeUrl}" alt="QR код партии" />
            <p>Ссылка: ${publicProductUrl}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  };

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text)]">Прослеживаемость</h1>
        <p className="mt-2 text-lg text-[var(--muted)]">История сканирований и перемещений партий</p>
      </section>

      <section className="glass-panel p-5 sm:p-6">
        <h2 className="text-2xl font-extrabold text-[var(--text)]">Поиск по партии или QR-коду</h2>
        <form onSubmit={handleTrackingSearch} className="mt-4 flex flex-col gap-3 lg:flex-row">
          <label htmlFor="tracking-query" className="relative block flex-1">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4h4v4H4zm12 0h4v4h-4zM4 16h4v4H4zM11 4h3v3h-3zm0 7h3v3h-3zm5 0h4v4h-4zM8 8h3v3H8zM4 11h3v3H4zm7 5h3v4h-3z" />
            </svg>
            <input
              id="tracking-query"
              type="text"
              value={trackingInput}
              onChange={(event) => setTrackingInput(event.target.value)}
              placeholder="Например: P-2301 или BATCH-1044"
              className="input-base w-full pl-12"
            />
          </label>
          <button type="submit" className="btn-primary min-w-[120px]">
            Найти
          </button>
        </form>
        {!selectedProduct && trackingQuery.trim() && (
          <p className="mt-3 text-sm font-semibold text-[rgba(181,65,65,0.95)]">
            Партия по запросу «{trackingQuery.trim()}» не найдена.
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="glass-panel motion-card motion-delay-3 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(63,143,58,0.14)] text-[var(--brand)]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
                <path d="m12 3 8 4.5-8 4.5L4 7.5z" />
                <path d="M12 12v9" />
              </svg>
            </span>
            <div>
              <p className="text-xl text-[var(--muted)]">Партия</p>
              <p className="text-5xl font-extrabold leading-none text-[var(--text)]">
                {getPublicBatchCode(activeProduct)}
              </p>
            </div>
          </div>
        </article>

        <article className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(63,143,58,0.14)] text-[var(--brand)]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h4v4H4zm12 0h4v4h-4zM4 16h4v4H4zM11 4h3v3h-3zm0 7h3v3h-3zm5 0h4v4h-4zM8 8h3v3H8zM4 11h3v3H4zm7 5h3v4h-3z" />
              </svg>
            </span>
            <div>
              <p className="text-xl text-[var(--muted)]">Сканирований</p>
              <p className="text-5xl font-extrabold leading-none text-[var(--text)]">{scanCount}</p>
            </div>
          </div>
        </article>

        <article className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[rgba(240,176,74,0.16)] text-[rgba(210,134,12,1)]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s7-4.6 7-10a7 7 0 1 0-14 0c0 5.4 7 10 7 10z" />
                <circle cx="12" cy="11" r="2.5" />
              </svg>
            </span>
            <div>
              <p className="text-xl text-[var(--muted)]">Текущая локация</p>
              <p className="text-2xl font-extrabold leading-tight text-[var(--text)]">{activeProduct.destination}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="glass-panel motion-card motion-delay-4 p-5 sm:p-6">
        <h2 className="text-2xl font-extrabold text-[var(--text)]">Информация о партии</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-lg text-[var(--muted)]">
              Культура
              <br />
              <span className="text-3xl font-extrabold leading-tight text-[var(--text)]">{activeProduct.name}</span>
            </p>
            <p className="text-lg text-[var(--muted)]">
              Объём
              <br />
              <span className="text-3xl font-extrabold leading-tight text-[var(--text)]">{activeProduct.quantity} кг</span>
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-[var(--muted)]">
              Дата уборки
              <br />
              <span className="text-3xl font-extrabold leading-tight text-[var(--text)]">{activeProduct.receivedAt}</span>
            </p>
            <p className="text-lg text-[var(--muted)]">
              Место уборки
              <br />
              <span className="text-3xl font-extrabold leading-tight text-[var(--text)]">{activeProduct.source}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel motion-card motion-delay-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-[var(--text)]">История перемещений</h2>
          <Link to={productLink} className="btn-secondary">
            Открыть карточку товара
          </Link>
        </div>

        <div className="mt-5 space-y-6">
          {movementHistory.map((entry, index) => (
            <article key={entry.id} className="relative grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
              <div className="relative pl-10">
                {index < movementHistory.length - 1 && (
                  <span className="absolute left-[10px] top-7 h-[62px] w-[2px] bg-[rgba(63,143,58,0.2)]" />
                )}
                <span className="absolute left-0 top-1.5 h-5 w-5 rounded-full border-4 border-[rgba(63,143,58,0.18)] bg-[var(--brand)]" />
                <p className="text-4xl font-bold leading-tight text-[var(--text)]">{entry.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-xl text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 21s7-4.6 7-10a7 7 0 1 0-14 0c0 5.4 7 10 7 10z" />
                      <circle cx="12" cy="11" r="2.5" />
                    </svg>
                    {entry.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="7.5" r="3.5" />
                      <path d="M4 20c1.2-3.8 4.3-5.5 8-5.5s6.8 1.7 8 5.5" />
                    </svg>
                    {entry.person}
                  </span>
                </div>
              </div>
              <p className="text-right text-xl font-semibold text-[var(--muted)]">{entry.timestamp}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel motion-card motion-delay-4 p-5 sm:p-6">
        <h2 className="text-2xl font-extrabold text-[var(--text)]">QR-код партии</h2>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="grid h-[136px] w-[136px] place-items-center rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-2">
            <img src={qrCodeUrl} alt={`QR-код партии ${activeProduct.batchId}`} className="h-full w-full rounded-2xl object-contain" />
          </div>

          <div className="flex-1">
            <p className="text-lg leading-7 text-[var(--muted)]">
              QR-код содержит всю информацию о партии и её истории перемещений. Покажите этот код
              покупателям для подтверждения прозрачности.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={handleDownloadQr} className="btn-primary">
                Скачать QR
              </button>
              <button type="button" onClick={handlePrintQr} className="btn-secondary">
                Распечатать
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AnalyticsPage({ currentUser, products }) {
  const sellerProducts =
    currentUser?.role === "seller"
      ? products.filter((item) => item.sellerId === currentUser.sellerId)
      : [];

  const monthlyRevenue = sellerProducts.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const soldTons = Math.round(
    sellerProducts.reduce((sum, item) => sum + Number(item.quantity || 0), 0) / 100
  );
  const avgPrice = sellerProducts.length
    ? sellerProducts.reduce((sum, item) => sum + Number(item.price || 0), 0) / sellerProducts.length
    : 0;

  const monthLabels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"];
  const wheatSeries = [44, 52, 60, 58, 71, 86];
  const barleySeries = [20, 25, 30, 28, 35, 40];
  const sunflowerSeries = [14, 17, 21, 19, 24, 30];
  const maxValue = 100;

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text)]">Аналитика</h1>
        <p className="mt-2 text-lg text-[var(--muted)]">Статистика продаж и тренды</p>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="glass-panel motion-card motion-delay-1 p-5">
          <p className="text-xl text-[var(--muted)]">Выручка (месяц)</p>
          <p className="mt-2 text-5xl font-extrabold leading-none text-[var(--text)]">
            {Math.max(850, Math.round(monthlyRevenue / 1000))} тыс. ₸
          </p>
          <p className="mt-3 text-2xl font-semibold text-[var(--brand)]">↗ +18% vs май</p>
        </article>
        <article className="glass-panel motion-card motion-delay-2 p-5">
          <p className="text-xl text-[var(--muted)]">Продано (тонн)</p>
          <p className="mt-2 text-5xl font-extrabold leading-none text-[var(--text)]">
            {Math.max(155, soldTons)}
          </p>
          <p className="mt-3 text-2xl font-semibold text-[var(--brand)]">↗ +12% vs май</p>
        </article>
        <article className="glass-panel motion-card motion-delay-3 p-5">
          <p className="text-xl text-[var(--muted)]">Средняя цена</p>
          <p className="mt-2 text-5xl font-extrabold leading-none text-[var(--text)]">
            {Math.max(5.5, avgPrice / 1000).toFixed(1)} тыс. ₸
          </p>
          <p className="mt-3 text-2xl font-semibold text-[rgba(199,57,57,0.95)]">↘ -3% vs май</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="glass-panel motion-card motion-delay-4 p-5 sm:p-6">
          <h2 className="text-2xl font-extrabold text-[var(--text)]">Продажи по культурам (тонны)</h2>
          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[620px] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="grid grid-cols-6 gap-3">
                {monthLabels.map((month, index) => (
                  <div key={month} className="flex flex-col items-center gap-2">
                    <div className="flex h-[260px] items-end gap-1">
                      <span
                        className="chart-bar w-3 rounded-t-md bg-[rgba(48,135,56,0.95)]"
                        style={{
                          height: `${(wheatSeries[index] / maxValue) * 240}px`,
                          animationDelay: `${80 + index * 70}ms`,
                        }}
                      />
                      <span
                        className="chart-bar w-3 rounded-t-md bg-[rgba(101,187,111,0.95)]"
                        style={{
                          height: `${(barleySeries[index] / maxValue) * 240}px`,
                          animationDelay: `${120 + index * 70}ms`,
                        }}
                      />
                      <span
                        className="chart-bar w-3 rounded-t-md bg-[rgba(245,168,37,0.95)]"
                        style={{
                          height: `${(sunflowerSeries[index] / maxValue) * 240}px`,
                          animationDelay: `${160 + index * 70}ms`,
                        }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-[var(--muted)]">{month}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="font-semibold text-[rgba(48,135,56,0.95)]">■ Пшеница</span>
                <span className="font-semibold text-[rgba(101,187,111,0.95)]">■ Ячмень</span>
                <span className="font-semibold text-[rgba(245,168,37,0.95)]">■ Подсолнечник</span>
              </div>
            </div>
          </div>
        </article>

        <article className="glass-panel motion-card motion-delay-4 p-5 sm:p-6">
          <h2 className="text-2xl font-extrabold text-[var(--text)]">Распределение по культурам (%)</h2>
          <div className="mt-6 flex flex-col items-center gap-4">
            <svg viewBox="0 0 200 200" className="h-[280px] w-[280px]">
              <circle className="pie-slice" cx="100" cy="100" r="80" fill="transparent" stroke="#2f8438" strokeWidth="40" strokeDasharray="301.59 201.06" strokeDashoffset="0" style={{ animationDelay: "120ms" }} />
              <circle className="pie-slice" cx="100" cy="100" r="80" fill="transparent" stroke="#66ba6f" strokeWidth="40" strokeDasharray="125.66 377.00" strokeDashoffset="-301.59" style={{ animationDelay: "220ms" }} />
              <circle className="pie-slice" cx="100" cy="100" r="80" fill="transparent" stroke="#f4a623" strokeWidth="40" strokeDasharray="75.40 427.26" strokeDashoffset="-427.25" style={{ animationDelay: "320ms" }} />
            </svg>
            <div className="grid w-full grid-cols-1 gap-2 text-lg sm:text-xl">
              <p className="font-semibold text-[rgba(48,135,56,0.95)]">Пшеница: 60%</p>
              <p className="font-semibold text-[rgba(101,187,111,0.95)]">Ячмень: 25%</p>
              <p className="font-semibold text-[rgba(245,168,37,0.95)]">Подсолнечник: 15%</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function LandingPage({ products, isAuthenticated }) {
  const totalItems = products.length;
  const totalVolume = products.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const avgPrice = totalItems
    ? Math.round(products.reduce((sum, item) => sum + (Number(item.price) || 0), 0) / totalItems)
    : 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-[rgba(63,143,58,0.18)] bg-[linear-gradient(135deg,#163923_0%,#1f4f2b_54%,#2d6f39_100%)] px-5 py-8 text-white shadow-[0_28px_56px_rgba(12,35,18,0.32)] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[rgba(240,176,74,0.2)] blur-2xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[rgba(255,255,255,0.08)] blur-2xl" />

        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(224,244,217,0.86)]">
              Farm Ops Platform
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.06] sm:text-5xl">
              Управляйте фермой
              <br />
              в одном рабочем месте
            </h1>
            <p className="mt-4 max-w-2xl text-base text-[rgba(234,245,230,0.92)] sm:text-lg">
              Учет партий, поставок, заказов и продаж в едином интерфейсе для команды, продавцов и
              покупателей.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={isAuthenticated ? "/" : "/auth"} className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[#3b2600] transition hover:brightness-95">
                {isAuthenticated ? "Открыть каталог" : "Начать работу"}
              </Link>
              <Link to={isAuthenticated ? "/account" : "/auth"} className="rounded-2xl border border-[rgba(224,244,217,0.45)] bg-[rgba(255,255,255,0.06)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.12)]">
                {isAuthenticated ? "Личный кабинет" : "Войти в аккаунт"}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <article className="rounded-2xl border border-[rgba(224,244,217,0.25)] bg-[rgba(255,255,255,0.07)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[rgba(224,244,217,0.8)]">Партии</p>
              <p className="mt-2 text-3xl font-extrabold">{totalItems}</p>
              <p className="mt-1 text-sm text-[rgba(224,244,217,0.88)]">В активном каталоге</p>
            </article>
            <article className="rounded-2xl border border-[rgba(224,244,217,0.25)] bg-[rgba(255,255,255,0.07)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[rgba(224,244,217,0.8)]">Объём</p>
              <p className="mt-2 text-3xl font-extrabold">{totalVolume} кг</p>
              <p className="mt-1 text-sm text-[rgba(224,244,217,0.88)]">Актуальные остатки</p>
            </article>
            <article className="rounded-2xl border border-[rgba(224,244,217,0.25)] bg-[rgba(255,255,255,0.07)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[rgba(224,244,217,0.8)]">Средняя цена</p>
              <p className="mt-2 text-3xl font-extrabold">{avgPrice} сом</p>
              <p className="mt-1 text-sm text-[rgba(224,244,217,0.88)]">За килограмм</p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="glass-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">Процессы</p>
          <h3 className="mt-2 text-xl font-extrabold text-[var(--text)]">Управление задачами и урожаем</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Планируйте работы по полям, фиксируйте партии и держите всю операционку в одном месте без таблиц.
          </p>
        </article>
        <article className="glass-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">Продажи</p>
          <h3 className="mt-2 text-xl font-extrabold text-[var(--text)]">Заказы и покупатели</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Принимайте заказы, отслеживайте статусы и работайте с клиентами через единый поток уведомлений.
          </p>
        </article>
        <article className="glass-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">Прозрачность</p>
          <h3 className="mt-2 text-xl font-extrabold text-[var(--text)]">Трассировка партий по QR</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Каждая партия доступна по QR-коду с ключевыми данными: источник, дата поступления и логистика.
          </p>
        </article>
      </section>

      <section className="glass-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">
              Готовы начать
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text)]">
              Запустите цифровой контур вашей фермы
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Регистрация занимает меньше минуты, после входа откроется каталог и рабочие разделы.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={isAuthenticated ? "/" : "/auth"} className="btn-primary">
              {isAuthenticated ? "Перейти в каталог" : "Регистрация / Вход"}
            </Link>
            <Link to="/auth" className="btn-secondary">
              Открыть авторизацию
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function AppContent() {
  const [products, setProducts] = useState(() => getInitialProducts());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const location = useLocation();
  const {
    currentUser,
    cartCount,
    logout,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    isAuthenticated,
    isAuthChecked,
    initializeAuth,
  } = useCart();
  const showDashboardHero = isAuthenticated && location.pathname === "/";
  const sellersById = useMemo(
    () => Object.fromEntries(mockSellers.map((seller) => [seller.id, seller])),
    []
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((item) => {
      const categoryMatches = selectedCategory === "all" || item.category === selectedCategory;
      if (!categoryMatches) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const sellerShopName = sellersById[item.sellerId]?.shopName ?? "";
      const searchableText =
        `${item.name} ${item.description} ${sellerShopName} ${item.batchId} ${item.source} ${item.destination}`.toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [products, searchQuery, selectedCategory, sellersById]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const handleAddProduct = (newProduct) => {
    if (!currentUser?.sellerId) return;

    setProducts((prev) => [
      ...prev,
      {
        ...newProduct,
        id: Date.now(),
        sellerId: currentUser.sellerId,
        price: Number(newProduct.price),
        quantity: Number(newProduct.quantity),
        isLabTested: Boolean(newProduct.isLabTested),
        category: normalizeCategory(newProduct.category),
        ...normalizeBatchFields(newProduct),
      },
    ]);
  };

  const handleDeleteProduct = (id) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  function SellerProfilePage() {
    const { sellerId } = useParams();
    const normalizedSellerId = Number(sellerId);
    const seller = sellersById[normalizedSellerId];
    const [editingProductId, setEditingProductId] = useState(null);

    if (!seller) {
      return (
        <section className="glass-panel p-8 text-center">
          <h2 className="section-title">Продавец не найден</h2>
          <p className="muted mt-2">Проверьте ссылку на профиль.</p>
        </section>
      );
    }

    const sellerProducts = products.filter((item) => item.sellerId === normalizedSellerId);
    const isOwner = currentUser?.role === "seller" && currentUser?.sellerId === normalizedSellerId;

    const editingProduct = sellerProducts.find((item) => item.id === editingProductId) ?? null;

    const handleUpdateProduct = (updatedProduct) => {
      if (!editingProductId || !isOwner) return;

      setProducts((prev) =>
        prev.map((item) =>
          item.id === editingProductId
            ? {
                ...item,
                ...updatedProduct,
                price: Number(updatedProduct.price),
                quantity: Number(updatedProduct.quantity),
                isLabTested: Boolean(updatedProduct.isLabTested),
                category: normalizeCategory(updatedProduct.category),
                ...normalizeBatchFields(updatedProduct),
              }
            : item
        )
      );

      setEditingProductId(null);
    };

    const handleDeleteAndResetEdit = (id) => {
      if (editingProductId === id) {
        setEditingProductId(null);
      }
      handleDeleteProduct(id);
    };

    return (
      <div className="space-y-5">
        <section className="glass-panel p-5 sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={seller.avatar}
                alt={seller.name}
                className="h-16 w-16 rounded-full border border-[var(--line)] object-cover"
              />
              <div>
                <h2 className="section-title">{seller.shopName}</h2>
                <p className="muted text-sm">{seller.bio}</p>
              </div>
            </div>
            <span className="pill">Товаров продавца: {sellerProducts.length}</span>
          </div>
        </section>

        {isOwner && (
          <>
            <AddProductForm onAddProduct={handleAddProduct} />
            {editingProduct && (
              <AddProductForm
                initialProduct={editingProduct}
                onAddProduct={handleUpdateProduct}
                onCancel={() => setEditingProductId(null)}
                title="Редактирование товара"
                description="Измените данные товара и сохраните обновления."
                submitText="Сохранить изменения"
              />
            )}
          </>
        )}

        <ProductList
          products={sellerProducts}
          sellersById={sellersById}
          onDeleteProduct={isOwner ? handleDeleteAndResetEdit : undefined}
          onEditProduct={isOwner ? (product) => setEditingProductId(product.id) : undefined}
          isSellerView={isOwner}
        />
      </div>
    );
  }

  function ProductDetailsPage() {
    const { productId } = useParams();
    const normalizedProductId = Number(productId);
    const product = products.find((item) => item.id === normalizedProductId);

    if (!product) {
      return (
        <section className="glass-panel p-8 text-center">
          <h2 className="section-title">Товар не найден</h2>
          <p className="muted mt-2">Проверьте ссылку или вернитесь в каталог.</p>
          <Link to="/" className="btn-secondary mt-4 inline-flex">
            Вернуться в каталог
          </Link>
        </section>
      );
    }

    const seller = sellersById[product.sellerId];
    const outOfStock = product.quantity <= 0;
    const basePath = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
    const productPath = `${basePath}/product/${product.id}`.replace(/\/{2,}/g, "/");
    const productLink =
      typeof window !== "undefined"
        ? `${window.location.origin}${productPath}`
        : productPath;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
      productLink,
    )}`;

    return (
      <section className="glass-panel p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Детали товара</h2>
          <Link to="/" className="btn-secondary">
            Назад в каталог
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
          <img
            src={product.image}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
            }}
            className="h-64 w-full rounded-2xl border border-[var(--line)] object-cover sm:h-80"
          />

          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                {CATEGORY_LABELS[product.category] ?? CATEGORY_LABELS.fruits}
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-[var(--text)]">{product.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{product.description}</p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]">
              <p>Цена: {product.price} сом за кг</p>
              <p className={outOfStock ? "text-[rgba(181,65,65,0.92)]" : ""}>
                Остаток: {outOfStock ? "Нет в наличии" : `${product.quantity} кг`}
              </p>
              <p>{product.isLabTested ? "Лабораторно проверен" : "Без лабораторной проверки"}</p>
              {seller && (
                <p>
                  Продавец:{" "}
                  <Link to={`/seller/${product.sellerId}`} className="font-semibold text-[var(--brand)] hover:underline">
                    {seller.shopName}
                  </Link>
                </p>
              )}
            </div>

            <div className="space-y-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)]">
              <p>🆔 ID партии: {product.batchId}</p>
              <p>📅 Дата поступления: {product.receivedAt}</p>
              <p>🧪 Лабораторная проверка: {product.isLabTested ? "Пройдена" : "Не пройдена"}</p>
              <p>🚚 Откуда пришёл: {product.source}</p>
              <p>📦 Куда ушёл: {product.destination}</p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="text-sm font-semibold text-[var(--text)]">QR-код товара</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Сканируйте для просмотра данных партии и ссылки на товар.
              </p>
              <img
                src={qrCodeUrl}
                alt={`QR-код товара ${product.name}`}
                className="mt-3 h-52 w-52 rounded-xl border border-[var(--line)] bg-white object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen pb-8">
        <main className="shell pt-10">
          <section className="glass-panel p-8 text-center">
            <h2 className="section-title">Проверка сессии...</h2>
            <p className="muted mt-2">Подождите, выполняется авторизация.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="mx-auto flex w-full max-w-[1700px] gap-4">
        {isAuthenticated && (
          <AppSidebar currentUser={currentUser} cartCount={cartCount} logout={logout} />
        )}

        <main className="min-w-0 flex-1 space-y-4">
          {isAuthenticated && (
            <AppTopBar
              currentUser={currentUser}
              cartCount={cartCount}
              logout={logout}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              notifications={notifications}
              unreadNotificationsCount={unreadNotificationsCount}
              markNotificationRead={markNotificationRead}
              markAllNotificationsRead={markAllNotificationsRead}
            />
          )}

          {showDashboardHero && <DashboardHeader products={products} />}

          <Routes>
          <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />} />

          <Route
            path="/"
            element={
              isAuthenticated ? (
                <HomePage
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  filteredProducts={filteredProducts}
                  sellersById={sellersById}
                />
              ) : (
                <LandingPage products={products} isAuthenticated={isAuthenticated} />
              )
            }
          />
          <Route
            path="/cart"
            element={
              <RequireAuth>
                {currentUser?.role === "buyer" ? <Cart /> : <Navigate to={currentUser?.role === "admin" ? "/admin" : "/"} replace />}
              </RequireAuth>
            }
          />
          <Route
            path="/account"
            element={
              <RequireAuth>
                {currentUser?.role === "admin" ? <Navigate to="/admin" replace /> : <AccountPage />}
              </RequireAuth>
            }
          />
          <Route
            path="/tracking"
            element={
              <RequireAuth>
                {currentUser?.role === "seller" ? (
                  <TrackingPage currentUser={currentUser} products={products} />
                ) : (
                  <Navigate to="/" replace />
                )}
              </RequireAuth>
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth>
                {currentUser?.role === "seller" ? (
                  <AnalyticsPage currentUser={currentUser} products={products} />
                ) : (
                  <Navigate to="/" replace />
                )}
              </RequireAuth>
            }
          />
          <Route
            path="/seller"
            element={
              <RequireAuth>
                {currentUser?.role === "seller" ? (
                  <Navigate to={`/seller/${currentUser.sellerId}`} replace />
                ) : (
                  <Navigate to="/" replace />
                )}
              </RequireAuth>
            }
          />
          <Route
            path="/seller/:sellerId"
            element={
              <RequireAuth>
                <SellerProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/product/:productId"
            element={<ProductDetailsPage />}
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPanel products={products} sellersById={sellersById} />
              </RequireAdmin>
            }
          />
          <Route
            path="*"
            element={
              <section className="glass-panel p-8 text-center">
                <h2 className="section-title">Страница не найдена</h2>
                <p className="muted mt-2">
                  Вернуться в{" "}
                  <Link to={isAuthenticated ? "/" : "/auth"} className="font-semibold text-[var(--brand)]">
                    {isAuthenticated ? "каталог" : "авторизацию"}
                  </Link>
                  .
                </p>
              </section>
            }
          />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const routerBasename = import.meta.env.BASE_URL;

  return (
    <CartProvider>
      <BrowserRouter basename={routerBasename}>
        <AppContent />
        <ToastContainer position="top-right" autoClose={1800} newestOnTop />
      </BrowserRouter>
    </CartProvider>
  );
}
