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
const DB_PATH =
  process.env.AUTH_DB_PATH || path.join(__dirname, "data", "auth-db.json");
const DB_EXAMPLE_PATH =
  process.env.AUTH_DB_EXAMPLE_PATH || path.join(__dirname, "data", "auth-db.example.json");
const FALLBACK_DB_PATH = "/tmp/auth-db.json";
let activeDbPath = DB_PATH;
const EMPTY_DB_TEMPLATE = `${JSON.stringify(
  {
    buyers: [],
    refreshTokens: [],
    blockedBuyerIds: [],
    blockedSellerIds: [],
  },
  null,
  2
)}\n`;

const app = express();
const PORT = Number(process.env.PORT || process.env.AUTH_SERVER_PORT || 4000);
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
    isBlocked: Boolean(user.isBlocked),
  };
}

async function readDb() {
  try {
    await fs.mkdir(path.dirname(activeDbPath), { recursive: true });
    await fs.writeFile(path.join(path.dirname(activeDbPath), ".write-test"), "", "utf8");
    await fs.unlink(path.join(path.dirname(activeDbPath), ".write-test"));
  } catch {
    activeDbPath = FALLBACK_DB_PATH;
    await fs.mkdir(path.dirname(activeDbPath), { recursive: true });
  }

  try {
    await fs.access(activeDbPath);
  } catch {
    let fallback = EMPTY_DB_TEMPLATE;
    try {
      fallback = await fs.readFile(DB_EXAMPLE_PATH, "utf8");
    } catch {
      fallback = EMPTY_DB_TEMPLATE;
    }
    await fs.writeFile(activeDbPath, fallback, "utf8");
  }

  let parsed = null;
  try {
    const raw = await fs.readFile(activeDbPath, "utf8");
    parsed = JSON.parse(raw);
  } catch {
    parsed = JSON.parse(EMPTY_DB_TEMPLATE);
    await fs.writeFile(activeDbPath, EMPTY_DB_TEMPLATE, "utf8");
  }

  return {
    buyers: Array.isArray(parsed.buyers) ? parsed.buyers : [],
    refreshTokens: Array.isArray(parsed.refreshTokens) ? parsed.refreshTokens : [],
    blockedBuyerIds: Array.isArray(parsed.blockedBuyerIds) ? parsed.blockedBuyerIds : [],
    blockedSellerIds: Array.isArray(parsed.blockedSellerIds) ? parsed.blockedSellerIds : [],
  };
}

async function writeDb(db) {
  await fs.writeFile(activeDbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
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
    isBlocked: false,
  };
}

function isBuyerBlocked(db, buyerId) {
  return db.blockedBuyerIds.includes(String(buyerId));
}

function isSellerBlocked(db, sellerId) {
  return db.blockedSellerIds.includes(Number(sellerId));
}

function isUserBlocked(db, user) {
  if (!user) {
    return false;
  }

  if (user.role === "buyer") {
    return isBuyerBlocked(db, user.id);
  }

  if (user.role === "seller") {
    return isSellerBlocked(db, user.sellerId);
  }

  return false;
}

function decodeAccessFromRequest(req) {
  const token = extractBearerToken(req);

  if (!token) {
    return null;
  }

  const payload = decodeAccessToken(token);

  if (payload.type !== "access") {
    return null;
  }

  return payload;
}

function ensureAdmin(req, res) {
  try {
    const payload = decodeAccessFromRequest(req);

    if (!payload || payload.role !== "admin") {
      res.status(403).json({ message: "Требуются права администратора." });
      return null;
    }

    return payload;
  } catch {
    res.status(401).json({ message: "Access token недействителен." });
    return null;
  }
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
    res.status(500).json({
      message: "Не удалось зарегистрировать пользователя.",
      detail: error instanceof Error ? error.message : String(error),
    });
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

    if (isBuyerBlocked(db, buyer.id)) {
      res.status(403).json({ message: "Покупатель заблокирован администратором." });
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

    const db = await readDb();
    if (isSellerBlocked(db, sellerId)) {
      res.status(403).json({ message: "Продавец заблокирован администратором." });
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

    if (isUserBlocked(db, user)) {
      db.refreshTokens = db.refreshTokens.filter((item) => item.userId !== user.id);
      await writeDb(db);
      clearRefreshCookie(res);
      res.status(403).json({ message: "Пользователь заблокирован администратором." });
      return;
    }

    const response = await issueAuth(res, user);
    res.json(response);
  } catch {
    res.status(401).json({ message: "Сессия истекла. Выполните вход снова." });
  }
});

app.get("/api/auth/me", async (req, res) => {
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

    const user = fromAccessPayload(payload);
    const db = await readDb();

    if (isUserBlocked(db, user)) {
      res.status(403).json({ message: "Пользователь заблокирован администратором." });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch {
    res.status(401).json({ message: "Access token недействителен." });
  }
});

app.get("/api/auth/admin/accounts", async (req, res) => {
  const adminPayload = ensureAdmin(req, res);

  if (!adminPayload) {
    return;
  }

  try {
    const db = await readDb();
    const buyers = db.buyers.map((buyer) => ({
      id: buyer.id,
      name: buyer.name,
      email: buyer.email,
      role: "buyer",
      isBlocked: isBuyerBlocked(db, buyer.id),
    }));

    const sellers = sellerAccounts.map((seller) => ({
      id: seller.sellerId,
      name: seller.name,
      role: "seller",
      isBlocked: isSellerBlocked(db, seller.sellerId),
    }));

    res.json({ buyers, sellers, requestedBy: adminPayload.sub });
  } catch {
    res.status(500).json({ message: "Не удалось загрузить список аккаунтов." });
  }
});

app.post("/api/auth/admin/accounts/block", async (req, res) => {
  const adminPayload = ensureAdmin(req, res);

  if (!adminPayload) {
    return;
  }

  const targetRole = String(req.body?.targetRole ?? "").trim();
  const blocked = Boolean(req.body?.blocked);

  try {
    const db = await readDb();

    if (targetRole === "buyer") {
      const buyerId = String(req.body?.targetId ?? "").trim();
      const buyerExists = db.buyers.some((item) => item.id === buyerId);

      if (!buyerId || !buyerExists) {
        res.status(404).json({ message: "Покупатель не найден." });
        return;
      }

      if (blocked) {
        if (!db.blockedBuyerIds.includes(buyerId)) {
          db.blockedBuyerIds.push(buyerId);
        }
        db.refreshTokens = db.refreshTokens.filter((item) => item.userId !== buyerId);
      } else {
        db.blockedBuyerIds = db.blockedBuyerIds.filter((item) => item !== buyerId);
      }

      await writeDb(db);
      res.json({ ok: true, targetRole, targetId: buyerId, blocked, requestedBy: adminPayload.sub });
      return;
    }

    if (targetRole === "seller") {
      const sellerId = Number(req.body?.targetId);
      const sellerExists = sellerAccounts.some((item) => item.sellerId === sellerId);

      if (!sellerExists) {
        res.status(404).json({ message: "Продавец не найден." });
        return;
      }

      if (blocked) {
        if (!db.blockedSellerIds.includes(sellerId)) {
          db.blockedSellerIds.push(sellerId);
        }
        db.refreshTokens = db.refreshTokens.filter((item) => item.userId !== `seller-${sellerId}`);
      } else {
        db.blockedSellerIds = db.blockedSellerIds.filter((item) => item !== sellerId);
      }

      await writeDb(db);
      res.json({ ok: true, targetRole, targetId: sellerId, blocked, requestedBy: adminPayload.sub });
      return;
    }

    res.status(400).json({ message: "targetRole должен быть buyer или seller." });
  } catch {
    res.status(500).json({ message: "Не удалось обновить статус блокировки." });
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
