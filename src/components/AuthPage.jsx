import React, { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { mockSellers } from "../data/mockSellers";

const initialRegisterState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const initialBuyerLoginState = {
  email: "",
  password: "",
};

const initialSellerLoginState = {
  sellerId: mockSellers[0]?.id ?? "",
  password: "",
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { currentUser, loginBuyer, loginSeller, register } = useCart();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginType, setLoginType] = useState("buyer");
  const [error, setError] = useState("");
  const [buyerLoginForm, setBuyerLoginForm] = useState(initialBuyerLoginState);
  const [sellerLoginForm, setSellerLoginForm] = useState(initialSellerLoginState);
  const [registerForm, setRegisterForm] = useState(initialRegisterState);

  const title = useMemo(
    () => (isLoginMode ? "Вход в аккаунт" : "Регистрация покупателя"),
    [isLoginMode]
  );

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleBuyerLoginSubmit = (event) => {
    event.preventDefault();
    setError("");

    const result = loginBuyer(buyerLoginForm);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate("/", { replace: true });
  };

  const handleSellerLoginSubmit = (event) => {
    event.preventDefault();
    setError("");

    const result = loginSeller(sellerLoginForm);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate("/", { replace: true });
  };

  const handleRegisterSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (registerForm.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    const result = register({
      name: registerForm.name,
      email: registerForm.email,
      password: registerForm.password,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen pb-8">
      <main className="shell flex min-h-screen items-center justify-center py-8">
        <section className="glass-panel w-full max-w-xl p-6 sm:p-8">
          <div className="text-center">
            <p className="brand-font text-xs uppercase tracking-[0.24em] text-[var(--brand)]">
              FruitMarket
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">
              {title}
            </h1>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-soft)] p-1">
            <button
              onClick={() => {
                setIsLoginMode(true);
                setError("");
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                isLoginMode ? "bg-[var(--text)] text-white" : "text-[var(--muted)]"
              }`}
            >
              Войти
            </button>
            <button
              onClick={() => {
                setIsLoginMode(false);
                setError("");
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                !isLoginMode ? "bg-[var(--text)] text-white" : "text-[var(--muted)]"
              }`}
            >
              Регистрация
            </button>
          </div>

          {isLoginMode ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-soft)] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginType("buyer");
                    setError("");
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    loginType === "buyer" ? "bg-[var(--text)] text-white" : "text-[var(--muted)]"
                  }`}
                >
                  Покупатель
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginType("seller");
                    setError("");
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    loginType === "seller" ? "bg-[var(--text)] text-white" : "text-[var(--muted)]"
                  }`}
                >
                  Продавец
                </button>
              </div>

              {loginType === "buyer" ? (
                <form onSubmit={handleBuyerLoginSubmit} className="mt-5 space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={buyerLoginForm.email}
                    onChange={(event) =>
                      setBuyerLoginForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="input-base"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Пароль"
                    value={buyerLoginForm.password}
                    onChange={(event) =>
                      setBuyerLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    className="input-base"
                    required
                  />
                  <button type="submit" className="btn-primary w-full">
                    Войти как покупатель
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSellerLoginSubmit} className="mt-5 space-y-3">
                  <select
                    value={sellerLoginForm.sellerId}
                    onChange={(event) =>
                      setSellerLoginForm((prev) => ({
                        ...prev,
                        sellerId: Number(event.target.value),
                      }))
                    }
                    className="input-base"
                  >
                    {mockSellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.shopName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="password"
                    placeholder="Пароль продавца"
                    value={sellerLoginForm.password}
                    onChange={(event) =>
                      setSellerLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    className="input-base"
                    required
                  />
                  <button type="submit" className="btn-primary w-full">
                    Войти как продавец
                  </button>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3">
              <input
                type="text"
                placeholder="Имя"
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="input-base"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="input-base"
                required
              />
              <input
                type="password"
                placeholder="Пароль"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                }
                className="input-base"
                required
              />
              <input
                type="password"
                placeholder="Повторите пароль"
                value={registerForm.confirmPassword}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
                className="input-base"
                required
              />

              <button type="submit" className="btn-primary w-full">
                Создать аккаунт покупателя
              </button>

              <p className="text-xs text-[var(--muted)]">
                Аккаунты продавцов создаются заранее, вход для них только через вкладку
                «Продавец» и отдельный пароль.
              </p>
            </form>
          )}

          {error && <p className="mt-3 text-sm font-semibold text-[var(--danger)]">{error}</p>}
        </section>
      </main>
    </div>
  );
}
