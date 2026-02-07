// js/storage.js

// ---------- KEYS ----------
export const CART_KEY = "hawkerhub_cart";
export const ORDERS_KEY = "hawkerhub_orders";

// ---------- LOAD ----------
export function load(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Storage load error:", e);
    return fallback;
  }
}

// ---------- SAVE ----------
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage save error:", e);
  }
}
