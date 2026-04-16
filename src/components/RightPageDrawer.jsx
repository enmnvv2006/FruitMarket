import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import { useCart } from "../context/CartContext";

function PageIcon({ kind }) {
  if (kind === "catalog") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7h18" />
        <path d="M6 3h12l2 4H4l2-4Z" />
        <path d="M5 7h14v13H5z" />
      </svg>
    );
  }

  if (kind === "cart") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
        <path d="M3 4h2l2.2 10h10.8l2-7H7.2" />
      </svg>
    );
  }

  if (kind === "admin") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V6h4z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (kind === "profile") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4 20c1.2-3.4 4-5 8-5s6.8 1.6 8 5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 10h8M8 14h8" />
    </svg>
  );
}

function getPageKind(page) {
  if (page.to === "/") {
    return "catalog";
  }

  if (page.to === "/cart") {
    return "cart";
  }

  if (page.to === "/admin") {
    return "admin";
  }

  if (page.to.startsWith("/seller/")) {
    return "profile";
  }

  return "account";
}

function iconBadgeClass(isActive) {
  return `grid h-10 w-10 place-items-center rounded-xl border text-sm font-bold transition ${
    isActive
      ? "border-[var(--brand)] bg-[rgba(47,125,68,0.14)] text-[var(--brand)]"
      : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
  }`;
}

function drawerLinkClass({ isActive }) {
  return `flex items-center gap-3 rounded-xl px-2 py-2.5 text-xl transition ${
    isActive ? "text-[var(--brand)]" : "text-[var(--text)] hover:text-[var(--brand)]"
  }`;
}

export default function RightPageDrawer() {
  const { currentUser, cartCount } = useCart();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const pages = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    if (currentUser.role === "admin") {
      return [
        { to: "/", label: "Каталог" },
        { to: "/admin", label: "Админ-панель" },
      ];
    }

    if (currentUser.role === "seller") {
      return [
        { to: "/", label: "Каталог" },
        { to: "/account", label: "Личный кабинет" },
        { to: `/seller/${currentUser.sellerId}`, label: "Мой профиль" },
      ];
    }

    return [
      { to: "/", label: "Каталог" },
      { to: "/cart", label: `Корзина (${cartCount})` },
      { to: "/account", label: "Личный кабинет" },
    ];
  }, [currentUser, cartCount]);

  if (!currentUser || !pages.length) {
    return null;
  }

  return (
    <>
      <aside className="fixed left-0 top-16 z-40 flex w-16 flex-col items-center gap-5 rounded-r-2xl border border-l-0 border-[var(--line)] bg-[var(--surface)] py-4 shadow-[12px_0_30px_rgba(31,92,48,0.18)]">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--brand)] text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(31,92,48,0.35)]"
          aria-label="Открыть меню"
          title="Открыть меню"
        >
          FM
        </button>

        <nav className="flex flex-col items-center gap-3">
          {pages.map((page) => {
            const pageKind = getPageKind(page);

            return (
              <NavLink
                key={page.to}
                to={page.to}
                className={({ isActive }) => iconBadgeClass(isActive)}
                title={page.label}
                aria-label={page.label}
              >
                <PageIcon kind={pageKind} />
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <Drawer
        open={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        direction="left"
        className="!w-[92%] !max-w-md !bg-[var(--surface)]"
      >
        <div className="h-full border-r border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-3xl font-extrabold tracking-wide text-[var(--text)]">FruitMarket</p>
            <button
              type="button"
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-soft)]"
              onClick={() => setIsMobileOpen(false)}
            >
              Закрыть
            </button>
          </div>
          <nav className="space-y-3">
            {pages.map((page) => {
              const pageKind = getPageKind(page);

              return (
                <NavLink key={page.to} to={page.to} className={drawerLinkClass}>
                  {({ isActive }) => (
                    <>
                      <span className={iconBadgeClass(isActive)}>
                        <PageIcon kind={pageKind} />
                      </span>
                      <span className="text-[2rem] leading-none">{page.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </Drawer>
    </>
  );
}
