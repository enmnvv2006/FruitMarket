const API_BASE =
  (import.meta.env.VITE_AUTH_API_BASE_URL || "/api/auth").replace(/\/+$/, "");

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

async function parseResponse(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}

function setAccessToken(token) {
  accessToken = token || null;
}

export async function registerBuyer(body) {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  const payload = await parseResponse(response);
  setAccessToken(payload.accessToken);
  return payload;
}

export async function loginBuyer(body) {
  const response = await fetch(`${API_BASE}/login/buyer`, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  const payload = await parseResponse(response);
  setAccessToken(payload.accessToken);
  return payload;
}

export async function loginSeller(body) {
  const response = await fetch(`${API_BASE}/login/seller`, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  const payload = await parseResponse(response);
  setAccessToken(payload.accessToken);
  return payload;
}

export async function loginAdmin(body) {
  const response = await fetch(`${API_BASE}/login/admin`, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  const payload = await parseResponse(response);
  setAccessToken(payload.accessToken);
  return payload;
}

export async function refreshSession() {
  const response = await fetch(`${API_BASE}/refresh`, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
  });

  const payload = await parseResponse(response);
  setAccessToken(payload.accessToken);
  return payload;
}

export async function logoutSession() {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
      headers: buildHeaders(),
    });
  } finally {
    setAccessToken(null);
  }
}

export async function getMe() {
  const response = await fetch(`${API_BASE}/me`, {
    method: "GET",
    credentials: "include",
    headers: buildHeaders(),
  });

  return parseResponse(response);
}

export async function getAdminAccounts() {
  const response = await fetch(`${API_BASE}/admin/accounts`, {
    method: "GET",
    credentials: "include",
    headers: buildHeaders(),
  });

  return parseResponse(response);
}

export async function setAccountBlocked({ targetRole, targetId, blocked }) {
  const response = await fetch(`${API_BASE}/admin/accounts/block`, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify({ targetRole, targetId, blocked }),
  });

  return parseResponse(response);
}

export function clearAccessToken() {
  setAccessToken(null);
}
