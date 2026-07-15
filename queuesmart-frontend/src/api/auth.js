import { apiRequest } from "./client.js";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getRole() {
  return getStoredUser()?.role || null;
}

export function setSession({ token, user }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem("role");
}

export async function register({ email, password }) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login({ email, password }) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setSession({ token: data.token, user: data.user });
  return data;
}

export async function fetchMe() {
  const data = await apiRequest("/auth/me");
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function logout() {
  try {
    if (getToken()) {
      await apiRequest("/auth/logout", { method: "POST" });
    }
  } catch {
    // Always clear local session even if the request fails.
  } finally {
    clearSession();
  }
}
