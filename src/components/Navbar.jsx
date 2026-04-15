import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { mockSellers } from "../data/mockSellers";

export default function Navbar() {
  const { cartCount, currentUser, setRole, setSellerId, logout } = useCart();

  const navLinkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-[var(--brand)] text-white"
        : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
    }`;

  if (!currentUser) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(246,247,242,0.88)] backdrop-blur-md">
      <div className="shell flex flex-wrap items-center justify-between gap-3 py-3">
        <Link to="/" className="brand-font text-lg font-bold tracking-tight text-[var(--text)]">
          FruitMarket MVP
        </Link>

        <nav className="glass-panel flex items-center gap-1 p-1">
          <NavLink to="/" className={navLinkClass}>
            Каталог
          </NavLink>
          <NavLink to="/cart" className={navLinkClass}>
            Корзина ({cartCount})
          </NavLink>
          {currentUser.role === "seller" && (
            <NavLink to={`/seller/${currentUser.sellerId}`} className={navLinkClass}>
              Профиль
            </NavLink>
          )}
        </nav>

        <div className="glass-panel flex flex-wrap items-center gap-2 p-1">
          <span className="px-2 text-xs font-semibold text-[var(--muted)] sm:text-sm">
            {currentUser.name}
          </span>

          <button
            onClick={() => setRole("buyer")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              currentUser.role === "buyer"
                ? "bg-[var(--text)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--surface-soft)]"
            }`}
          >
            Покупатель
          </button>
          <button
            onClick={() => setRole("seller")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              currentUser.role === "seller"
                ? "bg-[var(--text)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--surface-soft)]"
            }`}
          >
            Продавец
          </button>

          {currentUser.role === "seller" && (
            <select
              value={currentUser.sellerId ?? ""}
              onChange={(event) => setSellerId(event.target.value)}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 py-2 text-sm text-[var(--text)] outline-none"
            >
              {mockSellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.shopName}
                </option>
              ))}
            </select>
          )}

          <button onClick={logout} className="btn-danger px-3 py-2">
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
