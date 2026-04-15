import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { adminAccount } from "./data/adminAccount.js";
import { sellerAccounts } from "./data/sellerAccounts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "data", "auth-db.json");
const DB_EXAMPLE_PATH = path.join(__dirname, "data", "auth-db.example.json");

const app = express();
const PORT = Number(process.env.AUTH_SERVER_PORT || 4000);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fruit-market-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fruit-market-refresh-secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";
const REFRESH_COOKIE = "refreshToken";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : IS_PRODUCTION;
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || (COOKIE_SECURE ? "none" : "lax");
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

const allowedOrigins = new Set(
  (
    process.env.CORS_ORIGINS ||
    `${FRONTEND_URL},http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173`
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FruitMarket Auth API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>FruitMarket Auth API</h1>
        <p>Backend запущен успешно.</p>
        <p>Frontend открывайте на <a href="${FRONTEND_URL}">${FRONTEND_URL}</a>.</p>
        <p>API маршруты доступны по префиксу <code>/api/auth/*</code>.</p>
      </body>
    </html>
  `);
});

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? null,
    role: user.role,
    sellerId: user.sellerId ?? null,
  };
}

async function readDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    const fallback = await fs.readFile(DB_EXAMPLE_PATH, "utf8");
    await fs.writeFile(DB_PATH, fallback, "utf8");
  }

  const raw = await fs.readFile(DB_PATH, "utf8");
  const parsed = JSON.parse(raw);

  return {
    buyers: Array.isArray(parsed.buyers) ? parsed.buyers : [],
    refreshTokens: Array.isArray(parsed.refreshTokens) ? parsed.refreshTokens : [],
  };
}

async function writeDb(db) {
  await fs.writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function buildSellerUser(sellerId) {
  const seller = sellerAccounts.find((item) => item.sellerId === Number(sellerId));

  if (!seller) {
    return null;
  }

  return {
    id: `seller-${seller.sellerId}`,
    name: seller.name,
    email: null,
    role: "seller",
    sellerId: seller.sellerId,
  };
}

function buildAdminUser() {
  return {
    id: "admin",
    name: adminAccount.name,
    email: null,
    role: "admin",
    sellerId: null,
  };
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      sellerId: user.sellerId ?? null,
      name: user.name,
      email: user.email ?? null,
      type: "access",
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      sellerId: user.sellerId ?? null,
      type: "refresh",
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function decodeRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

function decodeAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function setRefreshCookie(res, refreshToken) {
  const cookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    domain: COOKIE_DOMAIN,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    domain: COOKIE_DOMAIN,
    path: "/api/auth",
  });
}

async function persistRefreshToken(user, refreshToken) {
  const db = await readDb();
  const tokenHash = hashToken(refreshToken);

  db.refreshTokens = db.refreshTokens.filter((item) => item.userId !== user.id);
  db.refreshTokens.push({ userId: user.id, tokenHash, createdAt: Date.now() });
  await writeDb(db);
}

async function issueAuth(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await persistRefreshToken(user, refreshToken);
  setRefreshCookie(res, refreshToken);

  return { accessToken, user: sanitizeUser(user) };
}

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

function fromAccessPayload(payload) {
  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    sellerId: payload.sellerId ?? null,
  };
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const email = normalizeEmail(req.body?.email ?? "");
    const password = String(req.body?.password ?? "");

    if (!name || !email || password.length < 6) {
      res.status(400).json({ message: "Некорректные данные регистрации." });
      return;
    }

    const db = await readDb();
    const exists = db.buyers.some((item) => item.email === email);

    if (exists) {
      res.status(409).json({ message: "Пользователь с таким email уже существует." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const buyer = {
      id: `buyer-${Date.now()}`,
      role: "buyer",
      name,
      email,
      passwordHash,
      sellerId: null,
    };

    db.buyers.push(buyer);
    await writeDb(db);

    const payload = await issueAuth(res, buyer);
    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: "Не удалось зарегистрировать пользователя." });
  }
});

app.post("/api/auth/login/buyer", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email ?? "");
    const password = String(req.body?.password ?? "");

    const db = await readDb();
    const buyer = db.buyers.find((item) => item.email === email);

    if (!buyer) {
      res.status(401).json({ message: "Неверный email или пароль." });
      return;
    }

    const isMatch = await bcrypt.compare(password, buyer.passwordHash);

    if (!isMatch) {
      res.status(401).json({ message: "Неверный email или пароль." });
      return;
    }

    const payload = await issueAuth(res, buyer);
    res.json(payload);
  } catch {
    res.status(500).json({ message: "Не удалось выполнить вход." });
  }
});

app.post("/api/auth/login/seller", async (req, res) => {
  try {
    const sellerId = Number(req.body?.sellerId);
    const password = String(req.body?.password ?? "");

    const sellerAccount = sellerAccounts.find((item) => item.sellerId === sellerId);

    if (!sellerAccount || sellerAccount.password !== password) {
      res.status(401).json({ message: "Неверный пароль продавца." });
      return;
    }

    const seller = buildSellerUser(sellerId);
    const payload = await issueAuth(res, seller);
    res.json(payload);
  } catch {
    res.status(500).json({ message: "Не удалось выполнить вход продавца." });
  }
});

app.post("/api/auth/login/admin", async (req, res) => {
  try {
    const username = String(req.body?.username ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (username !== adminAccount.username || password !== adminAccount.password) {
      res.status(401).json({ message: "Неверный логин или пароль администратора." });
      return;
    }

    const admin = buildAdminUser();
    const payload = await issueAuth(res, admin);
    res.json(payload);
  } catch {
    res.status(500).json({ message: "Не удалось выполнить вход администратора." });
  }
});

app.post("/api/auth/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token отсутствует." });
      return;
    }

    const payload = decodeRefreshToken(refreshToken);

    if (payload.type !== "refresh") {
      res.status(401).json({ message: "Некорректный refresh token." });
      return;
    }

    const db = await readDb();
    const tokenHash = hashToken(refreshToken);
    const savedToken = db.refreshTokens.find(
      (item) => item.userId === payload.sub && item.tokenHash === tokenHash
    );

    if (!savedToken) {
      res.status(401).json({ message: "Refresh token не найден." });
      return;
    }

    let user = null;

    if (payload.role === "buyer") {
      user = db.buyers.find((item) => item.id === payload.sub) ?? null;
    }

    if (payload.role === "seller") {
      user = buildSellerUser(payload.sellerId);
    }

    if (payload.role === "admin") {
      user = buildAdminUser();
    }

    if (!user) {
      res.status(401).json({ message: "Пользователь не найден." });
      return;
    }

    const response = await issueAuth(res, user);
    res.json(response);
  } catch {
    res.status(401).json({ message: "Сессия истекла. Выполните вход снова." });
  }
});

app.get("/api/auth/me", (req, res) => {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      res.status(401).json({ message: "Access token отсутствует." });
      return;
    }

    const payload = decodeAccessToken(token);

    if (payload.type !== "access") {
      res.status(401).json({ message: "Некорректный access token." });
      return;
    }

    res.json({ user: sanitizeUser(fromAccessPayload(payload)) });
  } catch {
    res.status(401).json({ message: "Access token недействителен." });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (refreshToken) {
      const db = await readDb();
      const tokenHash = hashToken(refreshToken);
      db.refreshTokens = db.refreshTokens.filter((item) => item.tokenHash !== tokenHash);
      await writeDb(db);
    }

    clearRefreshCookie(res);
    res.json({ ok: true });
  } catch {
    clearRefreshCookie(res);
    res.json({ ok: true });
  }
});

app.listen(PORT, () => {
  console.log(`Auth server is running on http://localhost:${PORT}`);
});
