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
import { CartProvider, useCart } from "./context/CartContext";
import { mockFruits } from "./data/mockFruits";
import { mockSellers } from "./data/mockSellers";

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
            Каталог фруктов
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
  filteredProducts,
  sellersById,
}) {
  return (
    <div className="space-y-4">
      <section className="glass-panel p-4 sm:p-5">
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
  const [products, setProducts] = useState(() =>
    mockFruits.map((item) => ({
      ...item,
      isLabTested: item.isLabTested ?? false,
    }))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { currentUser, isAuthenticated, isAuthChecked, initializeAuth } = useCart();
  const sellersById = useMemo(
    () => Object.fromEntries(mockSellers.map((seller) => [seller.id, seller])),
    []
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((item) => {
      const sellerShopName = sellersById[item.sellerId]?.shopName ?? "";
      const searchableText = `${item.name} ${item.description} ${sellerShopName}`.toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [products, searchQuery, sellersById]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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
                <Cart />
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
