import React from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import AddProductForm from "./components/AddProductForm";
import AuthPage from "./components/AuthPage";
import AdminPanel from "./components/AdminPanel";
import AccountPage from "./components/AccountPage";
import RightPageDrawer from "./components/RightPageDrawer";
import { CartProvider, useCart } from "./context/CartContext";
import { mockFruits } from "./data/mockFruits";
import { mockSellers } from "./data/mockSellers";
import {
  CATEGORY_LABELS,
  normalizeCategory,
  PRODUCT_CATEGORY_OPTIONS,
} from "./data/productCategories";

const PRODUCTS_STORAGE_KEY = "fruit-market-products";

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
    <section className="glass-panel mb-6 overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="brand-font text-xs uppercase tracking-[0.24em] text-[var(--brand)]">
            Fresh Marketplace
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">
            Каталог товаров
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {currentUser.name}: {roleLabel}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="pill">Товаров: {stats.items}</div>
          <div className="pill">В наличии: {stats.inStock} кг</div>
          <div className="pill">Средняя цена: {stats.avgPrice} сом</div>
        </div>
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
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[rgba(47,125,68,0.2)]"
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
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[rgba(47,125,68,0.2)]"
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

function AppContent() {
  const [products, setProducts] = useState(() => getInitialProducts());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { currentUser, isAuthenticated, isAuthChecked, initializeAuth } = useCart();
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
    <div className="min-h-screen pb-8">
      {isAuthenticated && <Navbar />}

      <main className="shell pt-5">
        {isAuthenticated && <DashboardHeader products={products} />}

        <Routes>
          <Route path="/auth" element={<AuthPage />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <HomePage
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  filteredProducts={filteredProducts}
                  sellersById={sellersById}
                />
              </RequireAuth>
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
            element={
              <RequireAuth>
                <ProductDetailsPage />
              </RequireAuth>
            }
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

        {isAuthenticated && <RightPageDrawer />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </CartProvider>
  );
}
