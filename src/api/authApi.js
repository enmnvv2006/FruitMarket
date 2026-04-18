const DEFAULT_GITHUB_PAGES_API_BASE = "https://fruitmarket-auth.onrender.com/api/auth";
const isGitHubPagesHost =
  typeof window !== "undefined" && window.location.hostname.endsWith("github.io");

const API_BASE = (
  import.meta.env.VITE_AUTH_API_BASE_URL ||
  (isGitHubPagesHost ? DEFAULT_GITHUB_PAGES_API_BASE : "/api/auth")
).replace(/\/+$/, "");

let accessToken = null;

function buildHeaders(headers = {}) {
  const result = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (accessToken) {
    result.Authorization = `Bearer ${accessToken}`;
  }

  return result;
}

async function parseResponse(response, endpoint) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  let payload = null;
  let textPayload = "";

  try {
    if (isJson) {
      payload = await response.json();
    } else {
      textPayload = (await response.text()).trim();
    }
  } catch {
    payload = null;
    textPayload = "";
  }

  if (!response.ok) {
    if (response.status === 404 && endpoint === "/login/gov") {
      throw new Error(
        "Вход для гос-пользователя недоступен: backend не содержит маршрут /login/gov. Обновите сервер на Render."
      );
    }

    const fallbackStatus = `HTTP ${response.status}`;
    const message =
      payload?.message ||
      (textPayload ? textPayload.replace(/\s+/g, " ").slice(0, 180) : "") ||
      fallbackStatus;
    throw new Error(message);
  }

  return payload;
}

async function requestJson(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await parseResponse(response, endpoint);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Сервер авторизации недоступен. Проверьте интернет или URL backend (VITE_AUTH_API_BASE_URL)."
      );
    }
    throw error;
  }
}

function setAccessToken(token) {
  accessToken = token || null;
}

export async function registerBuyer(body) {
  const payload = await requestJson("/register", {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  setAccessToken(payload.accessToken);
  return payload;
}

export async function loginBuyer(body) {
  const payload = await requestJson("/login/buyer", {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  setAccessToken(payload.accessToken);
  return payload;
}

export async function loginSeller(body) {
  const payload = await requestJson("/login/seller", {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  setAccessToken(payload.accessToken);
  return payload;
}

export async function loginAdmin(body) {
  const payload = await requestJson("/login/admin", {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  setAccessToken(payload.accessToken);
  return payload;
}

export async function loginGov(body) {
  const payload = await requestJson("/login/gov", {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  setAccessToken(payload.accessToken);
  return payload;
}

export async function refreshSession() {
  const payload = await requestJson("/refresh", {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
  });
  setAccessToken(payload.accessToken);
  return payload;
}

export async function logoutSession() {
  try {
    await requestJson("/logout", {
      method: "POST",
      credentials: "include",
      headers: buildHeaders(),
    });
  } finally {
    setAccessToken(null);
  }
}

export async function getMe() {
  return requestJson("/me", {
    method: "GET",
    credentials: "include",
    headers: buildHeaders(),
  });
}

export async function getAdminAccounts() {
  return requestJson("/admin/accounts", {
    method: "GET",
    credentials: "include",
    headers: buildHeaders(),
  });
}

export async function setAccountBlocked({ targetRole, targetId, blocked }) {
  return requestJson("/admin/accounts/block", {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify({ targetRole, targetId, blocked }),
  });
}

export function clearAccessToken() {
  setAccessToken(null);
}
