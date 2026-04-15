import React, { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { mockSellers } from "../data/mockSellers";

const initialRegisterState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "buyer",
  sellerId: mockSellers[0]?.id ?? "",
};

const initialLoginState = {
  email: "",
  password: "",
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { currentUser, login, register } = useCart();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [registerForm, setRegisterForm] = useState(initialRegisterState);

  const title = useMemo(
    () => (isLoginMode ? "Вход в аккаунт" : "Регистрация аккаунта"),
    [isLoginMode]
  );

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    setError("");

    const result = login(loginForm);

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
      role: registerForm.role,
      sellerId: registerForm.sellerId,
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
              Зарегистрироваться
            </button>
          </div>

          {isLoginMode ? (
            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="input-base"
                required
              />
              <input
                type="password"
                placeholder="Пароль"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                }
                className="input-base"
                required
              />
              <button type="submit" className="btn-primary w-full">
                Войти
              </button>
            </form>
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

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-soft)] p-1">
                <button
                  type="button"
                  onClick={() => setRegisterForm((prev) => ({ ...prev, role: "buyer" }))}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    registerForm.role === "buyer"
                      ? "bg-[var(--text)] text-white"
                      : "text-[var(--muted)]"
                  }`}
                >
                  Покупатель
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterForm((prev) => ({ ...prev, role: "seller" }))}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    registerForm.role === "seller"
                      ? "bg-[var(--text)] text-white"
                      : "text-[var(--muted)]"
                  }`}
                >
                  Продавец
                </button>
              </div>

              {registerForm.role === "seller" && (
                <select
                  value={registerForm.sellerId}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, sellerId: Number(event.target.value) }))
                  }
                  className="input-base"
                >
                  {mockSellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.shopName}
                    </option>
                  ))}
                </select>
              )}

              <button type="submit" className="btn-primary w-full">
                Создать аккаунт
              </button>
            </form>
          )}

          {error && <p className="mt-3 text-sm font-semibold text-[var(--danger)]">{error}</p>}
        </section>
      </main>
    </div>
  );
}
