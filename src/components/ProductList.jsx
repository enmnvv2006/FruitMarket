import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80";

export default function ProductList({
  products,
  sellersById = {},
  onDeleteProduct,
  isSellerView = false,
  emptyTitle = "Пока нет товаров",
  emptyDescription,
}) {
  const { addToCart } = useCart();

  if (!products.length) {
    return (
      <section className="glass-panel p-8 text-center">
        <h2 className="section-title">{emptyTitle}</h2>
        <p className="muted mt-1">
          {emptyDescription ??
            (isSellerView
              ? "Добавьте первый товар в этом профиле продавца."
              : "Товары скоро появятся в каталоге.")}
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const outOfStock = product.quantity <= 0;
        const seller = sellersById[product.sellerId];

        return (
          <article
            key={product.id}
            className="group glass-panel overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(31,92,48,0.12)]"
          >
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
                className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              />
              <span
                className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                  outOfStock
                    ? "bg-[rgba(181,65,65,0.92)] text-white"
                    : "bg-[rgba(47,125,68,0.92)] text-white"
                }`}
              >
                {outOfStock ? "Нет в наличии" : `${product.quantity} кг`}
              </span>
              <span
                className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                  product.isLabTested
                    ? "bg-[rgba(35,93,55,0.92)] text-white"
                    : "bg-[rgba(108,117,125,0.92)] text-white"
                }`}
              >
                {product.isLabTested ? "Лаб. проверен" : "Не проверен"}
              </span>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-extrabold text-[var(--text)]">{product.name}</h3>
                <p className="rounded-lg bg-[var(--surface-soft)] px-2 py-1 text-sm font-bold text-[var(--brand-strong)]">
                  {product.price} сом
                </p>
              </div>

              <p className="text-sm leading-6 text-[var(--muted)]">{product.description}</p>

              <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">за 1 кг</p>
                  {!isSellerView && seller && (
                    <Link
                      to={`/seller/${product.sellerId}`}
                      className="mt-1 inline-block text-xs font-semibold text-[var(--brand)] hover:underline"
                    >
                      Продавец: {seller.shopName}
                    </Link>
                  )}
                </div>

                {isSellerView ? (
                  <button onClick={() => onDeleteProduct?.(product.id)} className="btn-danger">
                    Удалить
                  </button>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    className="btn-primary"
                  >
                    В корзину
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
