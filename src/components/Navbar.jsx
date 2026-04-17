import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { cartCount, currentUser, logout } = useCart();

  const navLinkClass = ({ isActive }) =>
    `rounded-2xl px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-[var(--brand)] text-white shadow-[0_10px_20px_rgba(63,143,58,0.2)]"
        : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
    }`;

  if (!currentUser) {
    return null;
  }

  const roleLabel =
    currentUser.role === "admin"
      ? "Администратор"
      : currentUser.role === "seller"
        ? "Продавец"
        : "Покупатель";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(244,248,241,0.88)] backdrop-blur-md">
      <div className="shell flex flex-wrap items-center justify-between gap-3 py-3">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand)] text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(63,143,58,0.26)]">
            FM
          </span>
          <span className="brand-font text-lg font-bold tracking-tight text-[var(--text)]">FruitMarket MVP</span>
        </Link>

        <nav className="glass-panel flex items-center gap-1 p-1.5">
          <NavLink to="/" className={navLinkClass}>
            Каталог
          </NavLink>
          {currentUser.role === "buyer" && (
            <NavLink to="/cart" className={navLinkClass}>
              Корзина ({cartCount})
            </NavLink>
          )}
          {currentUser.role !== "admin" && (
            <NavLink to="/account" className={navLinkClass}>
              Личный кабинет
            </NavLink>
          )}
          {currentUser.role === "seller" && (
            <NavLink to={`/seller/${currentUser.sellerId}`} className={navLinkClass}>
              Мой профиль
            </NavLink>
          )}
          {currentUser.role === "admin" && (
            <NavLink to="/admin" className={navLinkClass}>
              Админ-панель
            </NavLink>
          )}
        </nav>

        <div className="glass-panel flex flex-wrap items-center gap-2 p-1.5">
          <span className="ui-chip">
            {currentUser.name} ({roleLabel})
          </span>

          <button onClick={logout} className="btn-danger px-3 py-2 text-xs sm:text-sm">
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
