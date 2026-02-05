export const CART_KEY = "hawkerhub_cart";
export const ORDERS_KEY = "hawkerhub_orders";

export function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
