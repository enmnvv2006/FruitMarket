import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../context/CartContext";
import { mockSellers } from "../data/mockSellers";

const initialRegisterState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const initialFarmerRegisterState = {
  lastName: "",
  firstName: "",
  middleName: "",
  phone: "",
  email: "",
  inn: "",
  farmName: "",
  legalAddress: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
};

const initialBuyerLoginState = {
  email: "",
  password: "",
};

const initialSellerLoginState = {
  sellerId: mockSellers[0]?.id ?? "",
  password: "",
};

const initialAdminLoginState = {
  username: "",
  password: "",
};

const initialGovLoginState = {
  username: "",
  password: "",
};

const REMEMBER_KEYS = {
  buyer: "fruit-market-remember-buyer",
  seller: "fruit-market-remember-seller",
  admin: "fruit-market-remember-admin",
  gov: "fruit-market-remember-gov",
};

const FARMER_APPLICATIONS_KEY = "fruit-market-farmer-applications";

function readRemembered(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function saveRemembered(key, payload) {
  localStorage.setItem(key, JSON.stringify(payload));
}

function saveFarmerApplication(payload) {
  try {
    const raw = localStorage.getItem(FARMER_APPLICATIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(list) ? list : [];

    safeList.push({
      id: `farmer-app-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload,
    });

    localStorage.setItem(FARMER_APPLICATIONS_KEY, JSON.stringify(safeList));
    return true;
  } catch {
    return false;
  }
}

function WheatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 7c0-1.7 1.3-3 3-3v0c0 1.7-1.3 3-3 3Zm0 0c0 1.7-1.3 3-3 3v0c0-1.7 1.3-3 3-3Zm8 0c0-1.7-1.3-3-3-3v0c0 1.7 1.3 3 3 3Zm0 0c0 1.7 1.3 3 3 3v0c0-1.7-1.3-3-3-3ZM6.5 11c0-1.7 1.3-3 3-3v0c0 1.7-1.3 3-3 3Zm11 0c0-1.7-1.3-3-3-3v0c0 1.7 1.3 3 3 3Zm-8 4c0-1.7 1.3-3 3-3v0c0 1.7-1.3 3-3 3Zm5 0c0-1.7-1.3-3-3-3v0c0 1.7 1.3 3 3 3Zm-3 0v5" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h8v11H5a2 2 0 0 1-2-2V7Zm10 2h4l3 4v3h-7V9Z" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
        <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 3.1 11 7-1 2.3-2.7 4.2-4.9 5.5" />
        <path d="M6.2 6.2C3.9 7.5 2.1 9.5 1 12c.8 1.9 2.1 3.5 3.7 4.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { currentUser, loginBuyer, loginSeller, loginAdmin, loginGov, register, authLoading } = useCart();

  const [view, setView] = useState("role-selection");
  const [loginType, setLoginType] = useState("buyer");
  const [error, setError] = useState("");

  const [buyerLoginForm, setBuyerLoginForm] = useState(initialBuyerLoginState);
  const [sellerLoginForm, setSellerLoginForm] = useState(initialSellerLoginState);
  const [adminLoginForm, setAdminLoginForm] = useState(initialAdminLoginState);
  const [govLoginForm, setGovLoginForm] = useState(initialGovLoginState);
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [farmerRegisterForm, setFarmerRegisterForm] = useState(initialFarmerRegisterState);

  const [rememberBuyer, setRememberBuyer] = useState(false);
  const [rememberSeller, setRememberSeller] = useState(false);
  const [rememberAdmin, setRememberAdmin] = useState(false);
  const [rememberGov, setRememberGov] = useState(false);

  const [showFarmerPassword, setShowFarmerPassword] = useState(false);
  const [showFarmerConfirmPassword, setShowFarmerConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    const rememberedBuyer = readRemembered(REMEMBER_KEYS.buyer);
    const rememberedSeller = readRemembered(REMEMBER_KEYS.seller);
    const rememberedAdmin = readRemembered(REMEMBER_KEYS.admin);
    const rememberedGov = readRemembered(REMEMBER_KEYS.gov);

    if (rememberedBuyer?.email && rememberedBuyer?.password) {
      setBuyerLoginForm({
        email: String(rememberedBuyer.email),
        password: String(rememberedBuyer.password),
      });
      setRememberBuyer(true);
    }

    if (rememberedSeller?.sellerId && rememberedSeller?.password) {
      setSellerLoginForm({
        sellerId: Number(rememberedSeller.sellerId),
        password: String(rememberedSeller.password),
      });
      setRememberSeller(true);
    }

    if (rememberedAdmin?.username && rememberedAdmin?.password) {
      setAdminLoginForm({
        username: String(rememberedAdmin.username),
        password: String(rememberedAdmin.password),
      });
      setRememberAdmin(true);
    }

    if (rememberedGov?.username && rememberedGov?.password) {
      setGovLoginForm({
        username: String(rememberedGov.username),
        password: String(rememberedGov.password),
      });
      setRememberGov(true);
    }
  }, []);

  if (currentUser) {
    return <Navigate to={currentUser.role === "gov" ? "/gov" : "/"} replace />;
  }

  const handleBuyerLoginSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const result = await loginBuyer(buyerLoginForm);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (rememberBuyer) {
      saveRemembered(REMEMBER_KEYS.buyer, buyerLoginForm);
    } else {
      localStorage.removeItem(REMEMBER_KEYS.buyer);
    }

    navigate("/", { replace: true });
  };

  const handleSellerLoginSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const result = await loginSeller(sellerLoginForm);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (rememberSeller) {
      saveRemembered(REMEMBER_KEYS.seller, sellerLoginForm);
    } else {
      localStorage.removeItem(REMEMBER_KEYS.seller);
    }

    navigate("/", { replace: true });
  };

  const handleAdminLoginSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const result = await loginAdmin(adminLoginForm);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (rememberAdmin) {
      saveRemembered(REMEMBER_KEYS.admin, adminLoginForm);
    } else {
      localStorage.removeItem(REMEMBER_KEYS.admin);
    }

    navigate("/admin", { replace: true });
  };

  const handleGovLoginSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const result = await loginGov(govLoginForm);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (rememberGov) {
      saveRemembered(REMEMBER_KEYS.gov, govLoginForm);
    } else {
      localStorage.removeItem(REMEMBER_KEYS.gov);
    }

    navigate("/gov", { replace: true });
  };

  const handleBuyerRegisterSubmit = async (event) => {
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

    const result = await register({
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

  const handleFarmerRegisterSubmit = (event) => {
    event.preventDefault();
    setError("");

    const requiredFields = [
      farmerRegisterForm.lastName,
      farmerRegisterForm.firstName,
      farmerRegisterForm.phone,
      farmerRegisterForm.email,
      farmerRegisterForm.inn,
      farmerRegisterForm.farmName,
      farmerRegisterForm.legalAddress,
      farmerRegisterForm.password,
      farmerRegisterForm.confirmPassword,
    ];

    if (requiredFields.some((item) => !String(item).trim())) {
      setError("Заполните обязательные поля формы.");
      return;
    }

    if (!/^\d+$/.test(farmerRegisterForm.inn.trim())) {
      setError("ИНН/патент должен содержать только цифры.");
      return;
    }

    if (farmerRegisterForm.password.length < 8) {
      setError("Пароль должен содержать минимум 8 символов.");
      return;
    }

    if (farmerRegisterForm.password !== farmerRegisterForm.confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    if (!farmerRegisterForm.acceptedTerms) {
      setError("Необходимо принять условия использования и политику конфиденциальности.");
      return;
    }

    const saved = saveFarmerApplication({
      type: "farmer",
      lastName: farmerRegisterForm.lastName.trim(),
      firstName: farmerRegisterForm.firstName.trim(),
      middleName: farmerRegisterForm.middleName.trim(),
      phone: farmerRegisterForm.phone.trim(),
      email: farmerRegisterForm.email.trim(),
      inn: farmerRegisterForm.inn.trim(),
      farmName: farmerRegisterForm.farmName.trim(),
      legalAddress: farmerRegisterForm.legalAddress.trim(),
    });

    if (!saved) {
      setError("Не удалось сохранить заявку. Попробуйте еще раз.");
      return;
    }

    toast.success("Заявка фермера отправлена. После проверки войдите как фермер.");
    setFarmerRegisterForm(initialFarmerRegisterState);
    setView("login");
    setLoginType("seller");
  };

  const renderLoginForm = () => {
    if (loginType === "buyer") {
      return (
        <form onSubmit={handleBuyerLoginSubmit} className="space-y-3">
          <label className="mb-1 block text-sm font-semibold text-[#111827]">Email</label>
          <input
            type="email"
            placeholder="example@mail.com"
            value={buyerLoginForm.email}
            onChange={(event) => setBuyerLoginForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
            required
          />
          <label className="mb-1 block text-sm font-semibold text-[#111827]">Пароль</label>
          <div className="relative">
            <input
              type={showLoginPassword ? "text" : "password"}
              placeholder="••••••••"
              value={buyerLoginForm.password}
              onChange={(event) => setBuyerLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 pr-12 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
              required
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
              aria-label="Показать или скрыть пароль"
            >
              <EyeIcon hidden={!showLoginPassword} />
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={rememberBuyer}
              onChange={(event) => setRememberBuyer(event.target.checked)}
            />
            Запомнить логин и пароль
          </label>
          <button type="submit" className="w-full rounded-[14px] bg-[#1d6f3a] px-4 py-3 text-base font-semibold text-white transition hover:brightness-95" disabled={authLoading}>
            {authLoading ? "Вход..." : "Войти"}
          </button>
        </form>
      );
    }

    if (loginType === "seller") {
      return (
        <form onSubmit={handleSellerLoginSubmit} className="space-y-3">
          <select
            value={sellerLoginForm.sellerId}
            onChange={(event) =>
              setSellerLoginForm((prev) => ({
                ...prev,
                sellerId: Number(event.target.value),
              }))
            }
            className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
          >
            {mockSellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.shopName}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              type={showLoginPassword ? "text" : "password"}
              placeholder="Пароль продавца"
              value={sellerLoginForm.password}
              onChange={(event) => setSellerLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 pr-12 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
              required
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
              aria-label="Показать или скрыть пароль"
            >
              <EyeIcon hidden={!showLoginPassword} />
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={rememberSeller}
              onChange={(event) => setRememberSeller(event.target.checked)}
            />
            Запомнить логин и пароль
          </label>
          <button type="submit" className="w-full rounded-[14px] bg-[#1d6f3a] px-4 py-3 text-base font-semibold text-white transition hover:brightness-95" disabled={authLoading}>
            {authLoading ? "Вход..." : "Войти"}
          </button>
        </form>
      );
    }

    if (loginType === "admin") {
      return (
        <form onSubmit={handleAdminLoginSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Логин администратора"
            value={adminLoginForm.username}
            onChange={(event) => setAdminLoginForm((prev) => ({ ...prev, username: event.target.value }))}
            className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
            required
          />
          <div className="relative">
            <input
              type={showLoginPassword ? "text" : "password"}
              placeholder="Пароль администратора"
              value={adminLoginForm.password}
              onChange={(event) => setAdminLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 pr-12 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
              required
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
              aria-label="Показать или скрыть пароль"
            >
              <EyeIcon hidden={!showLoginPassword} />
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={rememberAdmin}
              onChange={(event) => setRememberAdmin(event.target.checked)}
            />
            Запомнить логин и пароль
          </label>
          <button type="submit" className="w-full rounded-[14px] bg-[#1d6f3a] px-4 py-3 text-base font-semibold text-white transition hover:brightness-95" disabled={authLoading}>
            {authLoading ? "Вход..." : "Войти"}
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handleGovLoginSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Логин гос-пользователя"
          value={govLoginForm.username}
          onChange={(event) => setGovLoginForm((prev) => ({ ...prev, username: event.target.value }))}
          className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
          required
        />
        <div className="relative">
          <input
            type={showLoginPassword ? "text" : "password"}
            placeholder="Пароль гос-пользователя"
            value={govLoginForm.password}
            onChange={(event) => setGovLoginForm((prev) => ({ ...prev, password: event.target.value }))}
            className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 pr-12 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
            required
          />
          <button
            type="button"
            onClick={() => setShowLoginPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
            aria-label="Показать или скрыть пароль"
          >
            <EyeIcon hidden={!showLoginPassword} />
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={rememberGov}
            onChange={(event) => setRememberGov(event.target.checked)}
          />
          Запомнить логин и пароль
        </label>
        <button type="submit" className="w-full rounded-[14px] bg-[#1d6f3a] px-4 py-3 text-base font-semibold text-white transition hover:brightness-95" disabled={authLoading}>
          {authLoading ? "Вход..." : "Войти"}
        </button>
      </form>
    );
  };

  if (view === "role-selection") {
    return (
      <div className="min-h-screen bg-[#f4f5f4] px-4 py-10 sm:py-16">
        <main className="mx-auto w-full max-w-6xl">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1f6f3b] sm:text-4xl">Aykyn Charba</h1>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1e293b] sm:text-4xl">Выберите ваш статус</h2>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setView("register-farmer");
                setError("");
              }}
              className="rounded-[24px] border border-[rgba(0,0,0,0.04)] bg-white p-6 text-center shadow-[0_14px_30px_rgba(19,26,39,0.1)] transition hover:-translate-y-0.5"
            >
              <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#ebf0ec] text-[#2a7a46]">
                <WheatIcon />
              </span>
              <h3 className="mt-5 text-2xl font-bold text-[#0f172a] sm:text-3xl">Я фермер</h3>
              <p className="mx-auto mt-3 max-w-md text-lg leading-[1.45] text-[#475569] sm:text-xl">
                Регистрирую урожай, получаю QR-коды, продаю оптом.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setView("register-buyer");
                setError("");
              }}
              className="rounded-[24px] border border-[rgba(0,0,0,0.04)] bg-white p-6 text-center shadow-[0_14px_30px_rgba(19,26,39,0.1)] transition hover:-translate-y-0.5"
            >
              <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#ebf0ec] text-[#2a7a46]">
                <TruckIcon />
              </span>
              <h3 className="mt-5 text-2xl font-bold text-[#0f172a] sm:text-3xl">Я оптовый покупатель</h3>
              <p className="mx-auto mt-3 max-w-md text-lg leading-[1.45] text-[#475569] sm:text-xl">
                Ищу продукцию фермеров, управляю заказами, отслеживаю поставки.
              </p>
            </button>
          </div>

          <p className="mt-8 text-center text-base text-[#475569] sm:text-lg">
            Уже есть аккаунт?{" "}
            <button
              type="button"
              onClick={() => {
                setView("login");
                setLoginType("buyer");
                setError("");
              }}
              className="font-semibold text-[#247443]"
            >
              Войти
            </button>
          </p>
        </main>
      </div>
    );
  }

  if (view === "register-farmer") {
    return (
      <div className="min-h-screen bg-[#f6f7f6] px-4 py-6 sm:py-8">
        <main className="mx-auto w-full max-w-4xl">
          <button
            type="button"
            onClick={() => {
              setView("role-selection");
              setError("");
            }}
            className="mb-5 inline-flex items-center gap-2 text-base font-semibold text-[#1d6f3a] hover:opacity-90"
          >
            <span aria-hidden="true">←</span>
            Назад
          </button>

          <section className="rounded-[20px] border border-[#e9ece8] bg-white p-5 shadow-[0_12px_24px_rgba(15,23,42,0.08)] sm:p-7">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1f6f3b] sm:text-4xl">Регистрация фермера</h1>
              <p className="mt-2 text-base text-[#64748b]">Заполните все поля формы</p>
            </div>

            <form onSubmit={handleFarmerRegisterSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#111827]">Фамилия *</label>
                  <input
                    type="text"
                    value={farmerRegisterForm.lastName}
                    onChange={(event) =>
                      setFarmerRegisterForm((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                    className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#111827]">Имя *</label>
                  <input
                    type="text"
                    value={farmerRegisterForm.firstName}
                    onChange={(event) =>
                      setFarmerRegisterForm((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                    className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#111827]">Отчество</label>
                  <input
                    type="text"
                    value={farmerRegisterForm.middleName}
                    onChange={(event) =>
                      setFarmerRegisterForm((prev) => ({ ...prev, middleName: event.target.value }))
                    }
                    className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#111827]">Номер телефона *</label>
                  <input
                    type="tel"
                    placeholder="+996 XXX XX XX XX"
                    value={farmerRegisterForm.phone}
                    onChange={(event) =>
                      setFarmerRegisterForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#111827]">Email *</label>
                  <input
                    type="email"
                    placeholder="example@mail.com"
                    value={farmerRegisterForm.email}
                    onChange={(event) =>
                      setFarmerRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#111827]">ИНН или патент *</label>
                <input
                  type="text"
                  placeholder="Только цифры"
                  value={farmerRegisterForm.inn}
                  onChange={(event) =>
                    setFarmerRegisterForm((prev) => ({
                      ...prev,
                      inn: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                  className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#111827]">Название хозяйства *</label>
                <input
                  type="text"
                  value={farmerRegisterForm.farmName}
                  onChange={(event) =>
                    setFarmerRegisterForm((prev) => ({ ...prev, farmName: event.target.value }))
                  }
                  className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#111827]">Юридический адрес *</label>
                <input
                  type="text"
                  value={farmerRegisterForm.legalAddress}
                  onChange={(event) =>
                    setFarmerRegisterForm((prev) => ({ ...prev, legalAddress: event.target.value }))
                  }
                  className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#111827]">Пароль *</label>
                  <div className="relative">
                    <input
                      type={showFarmerPassword ? "text" : "password"}
                      placeholder="Минимум 8 символов"
                      value={farmerRegisterForm.password}
                      onChange={(event) =>
                        setFarmerRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 pr-12 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowFarmerPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                      aria-label="Показать или скрыть пароль"
                    >
                      <EyeIcon hidden={!showFarmerPassword} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#111827]">Подтверждение пароля *</label>
                  <div className="relative">
                    <input
                      type={showFarmerConfirmPassword ? "text" : "password"}
                      placeholder="Повторите пароль"
                      value={farmerRegisterForm.confirmPassword}
                      onChange={(event) =>
                        setFarmerRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                      }
                      className="w-full rounded-[14px] border border-transparent bg-[#f1f2f3] px-4 py-3 pr-12 text-sm text-[#0f172a] outline-none transition focus:border-[rgba(31,111,59,0.35)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowFarmerConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                      aria-label="Показать или скрыть подтверждение пароля"
                    >
                      <EyeIcon hidden={!showFarmerConfirmPassword} />
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 pt-1 text-sm text-[#334155]">
                <input
                  type="checkbox"
                  checked={farmerRegisterForm.acceptedTerms}
                  onChange={(event) =>
                    setFarmerRegisterForm((prev) => ({ ...prev, acceptedTerms: event.target.checked }))
                  }
                  className="mt-0.5"
                />
                Я согласен с
                <span className="font-semibold text-[#1d6f3a]">условиями использования и политикой конфиденциальности</span>
              </label>

              <button
                type="submit"
                className="w-full rounded-[14px] bg-[#1d6f3a] px-4 py-3 text-base font-semibold text-white transition hover:brightness-95"
              >
                Зарегистрироваться
              </button>

              <p className="text-center text-sm text-[#64748b]">
                Уже есть аккаунт?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setLoginType("seller");
                    setError("");
                  }}
                  className="font-semibold text-[#1d6f3a]"
                >
                  Войти
                </button>
              </p>
            </form>

            {error && <p className="mt-3 text-sm font-semibold text-[var(--danger)]">{error}</p>}
          </section>
        </main>
      </div>
    );
  }

  if (view === "login") {
    return (
      <div className="min-h-screen bg-[#f7f7f7] px-4 py-10">
        <main className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center">
          <section className="w-full max-w-[480px] rounded-[20px] border border-[#ececec] bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.1)] sm:p-7">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-[#1f6f3b]">Aykyn Charba</h1>
              <p className="mt-2 text-2xl font-semibold text-[#1f2937]">Вход в платформу</p>
            </div>

            <div className="mt-4 rounded-full bg-[#f1f2f3] p-1 text-center text-sm font-semibold text-[#2f3b4e]">
              По email и паролю
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#f1f2f3] p-1 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  setLoginType("buyer");
                  setError("");
                }}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  loginType === "buyer" ? "bg-white text-[#111827]" : "text-[#64748b]"
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
                  loginType === "seller" ? "bg-white text-[#111827]" : "text-[#64748b]"
                }`}
              >
                Фермер
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType("admin");
                  setError("");
                }}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  loginType === "admin" ? "bg-white text-[#111827]" : "text-[#64748b]"
                }`}
              >
                Админ
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType("gov");
                  setError("");
                }}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  loginType === "gov" ? "bg-white text-[#111827]" : "text-[#64748b]"
                }`}
              >
                Гос
              </button>
            </div>

            <div className="mt-4">{renderLoginForm()}</div>

            <div className="mt-2 flex justify-end">
              <button type="button" className="text-sm font-semibold text-[#1d6f3a]">
                Забыли пароль?
              </button>
            </div>

            <p className="mt-4 text-center text-sm text-[#64748b]">
              Нет аккаунта?{" "}
              <button
                type="button"
                onClick={() => {
                  setView("register-buyer");
                  setError("");
                }}
                className="font-semibold text-[#1d6f3a]"
              >
                Зарегистрироваться
              </button>
            </p>

            {error && <p className="mt-3 text-sm font-semibold text-[var(--danger)]">{error}</p>}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <main className="shell flex min-h-screen items-center justify-center py-8">
        <section className="glass-panel w-full max-w-xl p-6 sm:p-8">
          <div className="text-center">
            <p className="brand-font text-xs uppercase tracking-[0.24em] text-[var(--brand)]">Aykyn Charba</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">
              {view === "login" ? "Вход в аккаунт" : "Регистрация покупателя"}
            </h1>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setView("role-selection");
                setError("");
              }}
              className="btn-secondary"
            >
              Назад
            </button>
          </div>

          <form onSubmit={handleBuyerRegisterSubmit} className="mt-5 space-y-3">
            <input
              type="text"
              placeholder="Имя"
              value={registerForm.name}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
              className="input-base"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
              className="input-base"
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={registerForm.password}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
              className="input-base"
              required
            />
            <input
              type="password"
              placeholder="Повторите пароль"
              value={registerForm.confirmPassword}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              className="input-base"
              required
            />
            <button type="submit" className="btn-primary w-full" disabled={authLoading}>
              {authLoading ? "Создание..." : "Создать аккаунт покупателя"}
            </button>
          </form>

          {error && <p className="mt-3 text-sm font-semibold text-[var(--danger)]">{error}</p>}
        </section>
      </main>
    </div>
  );
}
