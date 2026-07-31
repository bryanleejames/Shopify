// TruthWell Authentication Server Module
// Uses JSON file storage + Node.js crypto for password hashing
// All functions are designed to be called from TanStack Start server functions

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomBytes, pbkdf2Sync } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";

// ─── Types ───

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  isPremium: boolean;
  createdAt: string;
  name?: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface UserStore {
  users: User[];
  sessions: Session[];
}

// ─── Storage ───

const DATA_DIR = path.resolve(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "users.json");

function getEmptyStore(): UserStore {
  return { users: [], sessions: [] };
}

async function readStore(): Promise<UserStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as UserStore;
  } catch {
    return getEmptyStore();
  }
}

async function writeStore(store: UserStore): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

// ─── Password Hashing ───

const HASH_ITERATIONS = 100000;
const HASH_KEY_LEN = 64;
const HASH_DIGEST = "sha512";

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || randomBytes(32).toString("hex");
  const hash = pbkdf2Sync(password, s, HASH_ITERATIONS, HASH_KEY_LEN, HASH_DIGEST).toString("hex");
  return { hash, salt: s };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computed } = hashPassword(password, salt);
  return computed === hash;
}

// ─── Session Token ───

function generateSessionToken(): string {
  return randomBytes(48).toString("hex");
}

// ─── Public API ───

export async function signup(email: string, password: string, name?: string): Promise<{ success: boolean; error?: string; sessionToken?: string }> {
  const store = await readStore();
  const emailLower = email.toLowerCase().trim();

  // Validate email
  if (!emailLower || !emailLower.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  // Validate password
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  // Check if user exists
  if (store.users.some((u) => u.email === emailLower)) {
    return { success: false, error: "An account with this email already exists." };
  }

  // Create user
  const { hash, salt } = hashPassword(password);
  const user: User = {
    id: randomBytes(16).toString("hex"),
    email: emailLower,
    passwordHash: hash,
    salt,
    isPremium: false,
    createdAt: new Date().toISOString(),
    name: name || emailLower.split("@")[0],
  };

  // Create session
  const token = generateSessionToken();
  const session: Session = {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };

  store.users.push(user);
  store.sessions.push(session);
  await writeStore(store);

  return { success: true, sessionToken: token };
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; sessionToken?: string; user?: { id: string; email: string; name: string; isPremium: boolean } }> {
  const store = await readStore();
  const emailLower = email.toLowerCase().trim();

  const user = store.users.find((u) => u.email === emailLower);
  if (!user) {
    return { success: false, error: "No account found with this email." };
  }

  if (!verifyPassword(password, user.passwordHash, user.salt)) {
    return { success: false, error: "Incorrect password." };
  }

  // Create session
  const token = generateSessionToken();
  const session: Session = {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  store.sessions.push(session);
  await writeStore(store);

  return {
    success: true,
    sessionToken: token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
      isPremium: user.isPremium,
    },
  };
}

export async function logout(sessionToken: string): Promise<boolean> {
  const store = await readStore();
  const idx = store.sessions.findIndex((s) => s.token === sessionToken);
  if (idx === -1) return false;
  store.sessions.splice(idx, 1);
  await writeStore(store);
  return true;
}

export async function getSession(sessionToken: string): Promise<{ valid: boolean; user?: { id: string; email: string; name: string; isPremium: boolean } }> {
  if (!sessionToken) return { valid: false };

  const store = await readStore();
  const session = store.sessions.find((s) => s.token === sessionToken);
  if (!session) return { valid: false };

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
    store.sessions = store.sessions.filter((s) => s.token !== sessionToken);
    await writeStore(store);
    return { valid: false };
  }

  const user = store.users.find((u) => u.id === session.userId);
  if (!user) return { valid: false };

  return {
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
      isPremium: user.isPremium,
    },
  };
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string; resetToken?: string }> {
  const store = await readStore();
  const emailLower = email.toLowerCase().trim();
  const user = store.users.find((u) => u.email === emailLower);
  if (!user) {
    // Don't reveal whether the email exists for security
    return { success: true };
  }

  // In a real app, send an email. For now, return the token directly.
  const resetToken = randomBytes(32).toString("hex");
  // Store reset token on user
  (user as any).resetToken = resetToken;
  (user as any).resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  await writeStore(store);

  return { success: true, resetToken };
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  const store = await readStore();
  const userIdx = store.users.findIndex(
    (u) => (u as any).resetToken === resetToken && new Date((u as any).resetTokenExpiresAt) > new Date()
  );

  if (userIdx === -1) {
    return { success: false, error: "Invalid or expired reset token." };
  }

  const { hash, salt } = hashPassword(newPassword);
  store.users[userIdx].passwordHash = hash;
  store.users[userIdx].salt = salt;
  delete (store.users[userIdx] as any).resetToken;
  delete (store.users[userIdx] as any).resetTokenExpiresAt;

  // Invalidate all existing sessions for this user
  store.sessions = store.sessions.filter((s) => s.userId !== store.users[userIdx].id);

  await writeStore(store);
  return { success: true };
}