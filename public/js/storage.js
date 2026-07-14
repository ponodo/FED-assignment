// js/storage.js

// ---------- KEYS ----------
export const CART_KEY = "hawkerhub_cart";
export const ORDERS_KEY = "hawkerhub_orders";
export const USERS_KEY = "hawkerhub_users";
export const CURRENT_USER_KEY = "hawkerhub_user";

// ---------- LOAD ----------
export function load(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);

    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error("Storage load error:", error);

    return fallback;
  }
}

// ---------- SAVE ----------
export function save(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;
  } catch (error) {
    console.error("Storage save error:", error);

    return false;
  }
}

// ---------- REMOVE ----------
export function remove(key) {
  try {
    localStorage.removeItem(key);

    return true;
  } catch (error) {
    console.error("Storage remove error:", error);

    return false;
  }
}

// ---------- USER HELPERS ----------
export function loadUsers() {
  return load(USERS_KEY, []);
}

export function saveUsers(users) {
  return save(USERS_KEY, users);
}

export function loadCurrentUser() {
  return load(CURRENT_USER_KEY, null);
}

export function saveCurrentUser(user) {
  return save(CURRENT_USER_KEY, user);
}

export function logoutUser() {
  return remove(CURRENT_USER_KEY);
}