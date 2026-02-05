import { CART_KEY, load, save } from "./storage.js";

const emptyEl = document.getElementById("cart-empty");
const itemsEl = document.getElementById("cart-items");
const listEl = document.getElementById("cart-item-list");
const stallNameEl = document.getElementById("cart-stall-name");
const subtotalEl = document.getElementById("cart-subtotal");
const totalEl = document.getElementById("cart-total");
const clearBtn = document.getElementById("btn-clear-cart");

const DELIVERY_FEE = 3;

function render() {
  const cart = load(CART_KEY, []);

  if (cart.length === 0) {
    emptyEl.classList.remove("d-none");
    itemsEl.classList.add("d-none");

    subtotalEl.textContent = "$0.00";
    totalEl.textContent = `$${DELIVERY_FEE.toFixed(2)}`;
    return;
  }

  emptyEl.classList.add("d-none");
  itemsEl.classList.remove("d-none");

  stallNameEl.textContent = cart[0].stallName;

  listEl.innerHTML = "";
  let subtotal = 0;

  cart.forEach((item, idx) => {
    subtotal += item.unitPrice * item.qty;

    const row = document.createElement("div");
    row.className = "d-flex justify-content-between align-items-center border-bottom py-3";
    row.innerHTML = `
      <div>
        <div class="fw-semibold">${item.name}</div>
        <div class="text-muted small">$${item.unitPrice.toFixed(2)} × ${item.qty}</div>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-danger btn-sm" data-action="minus" data-idx="${idx}">-</button>
        <button class="btn btn-outline-danger btn-sm" data-action="plus" data-idx="${idx}">+</button>
        <button class="btn btn-danger btn-sm" data-action="remove" data-idx="${idx}">×</button>
      </div>
    `;
    listEl.appendChild(row);
  });

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  totalEl.textContent = `$${(subtotal + DELIVERY_FEE).toFixed(2)}`;
}

listEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const cart = load(CART_KEY, []);
  const idx = Number(btn.dataset.idx);
  const action = btn.dataset.action;

  if (!cart[idx]) return;

  if (action === "plus") cart[idx].qty += 1;
  if (action === "minus") cart[idx].qty = Math.max(1, cart[idx].qty - 1);
  if (action === "remove") cart.splice(idx, 1);

  save(CART_KEY, cart);
  render();
});

clearBtn.addEventListener("click", () => {
  save(CART_KEY, []);
  render();
});

render();
