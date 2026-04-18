import React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../context/CartContext";
import { CATEGORY_LABELS } from "../data/productCategories";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80";

export default function ProductList({
  products,
  sellersById = {},
  onDeleteProduct,
  onEditProduct,
  isSellerView = false,
  emptyTitle = "Пока нет товаров",
  emptyDescription,
}) {
  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`"${product.name}" добавлен в корзину`);
  };

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
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const outOfStock = product.quantity <= 0;
        const seller = sellersById[product.sellerId];

        return (
          <article
            key={product.id}
            className="group product-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(23,55,24,0.1)]"
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-3xl font-extrabold leading-none text-[var(--text)]">
                  {product.name}
                </h3>
                <p className="mt-1 text-base text-[var(--muted)]">
                  Сорт:{" "}
                  {CATEGORY_LABELS[product.category] ??
                    CATEGORY_LABELS.fruits}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  № {product.batchId}
                </p>
              </div>

              <div className="flex justify-center border-y border-[var(--line)] py-3">
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                  className="h-40 w-full max-w-[280px] rounded-2xl object-cover"
                />
              </div>

              <div className="space-y-1 text-base text-[var(--muted)]">
                <p>
                  Дата сбора:{" "}
                  <span className="font-semibold text-[var(--text)]">
                    {product.receivedAt}
                  </span>
                </p>
                <p>
                  Локация:{" "}
                  <span className="font-semibold text-[var(--text)]">
                    {product.source || "Поле №5, Костанай"}
                  </span>
                </p>
                {!isSellerView && seller && (
                  <Link
                    to={`/seller/${product.sellerId}`}
                    className="inline-block font-semibold text-[var(--brand)] hover:underline"
                  >
                    Продавец: {seller.shopName}
                  </Link>
                )}
              </div>

              {isSellerView ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Link
                    to={`/product/${product.id}`}
                    className="btn-secondary text-center"
                  >
                    QR-код
                  </Link>
                  <button
                    onClick={() => onEditProduct?.(product)}
                    className="btn-primary"
                  >
                    Найти покупателя
                  </button>
                  <button
                    onClick={() => onDeleteProduct?.(product.id)}
                    className="btn-danger"
                  >
                    Удалить
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={outOfStock}
                    className={outOfStock ? "btn-secondary" : "btn-primary"}
                  >
                    {outOfStock ? "Нет в наличии" : "Добавить в корзину"}
                  </button>
                  <Link
                    to={`/product/${product.id}`}
                    className="btn-secondary text-center"
                  >
                    Подробнее
                  </Link>
                </div>
              )}

              <p className="text-sm leading-6 text-[var(--muted)]">
                {product.description}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
