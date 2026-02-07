import { CART_KEY, load, save } from "./storage.js";

const emptyEl = document.getElementById("cart-empty");
const itemsEl = document.getElementById("cart-items");
const listEl = document.getElementById("cart-item-list");
const stallNameEl = document.getElementById("cart-stall-name");
const subtotalEl = document.getElementById("cart-subtotal");
const deliveryFeeEl = document.getElementById("cart-delivery-fee");
const deliveryMsgEl = document.getElementById("cart-delivery-message");
const totalEl = document.getElementById("cart-total");
const clearBtn = document.getElementById("btn-clear-cart");

const DELIVERY_FEE = 5;
const FREE_DELIVERY_THRESHOLD = 20;

function render() {
  const cart = load(CART_KEY, []);

  // empty cart
  if (cart.length === 0) {
    emptyEl.classList.remove("d-none");
    itemsEl.classList.add("d-none");

    subtotalEl.textContent = "$0.00";
    if (deliveryFeeEl) deliveryFeeEl.textContent = "$0.00";
    if (deliveryMsgEl) deliveryMsgEl.textContent = "Add items to see delivery fee";
    totalEl.textContent = "$0.00";
    return;
  }

  emptyEl.classList.add("d-none");
  itemsEl.classList.remove("d-none");

  // If you're using multi-store cart, you can change this to something like "Multiple stalls"
  // For now, keep it simple:
  stallNameEl.textContent = "Your Items";

  listEl.innerHTML = "";
  let subtotal = 0;

  cart.forEach((item, idx) => {
    subtotal += (Number(item.unitPrice) || 0) * (Number(item.qty) || 0);

    const row = document.createElement("div");
    row.className = "d-flex justify-content-between align-items-center border-bottom py-3";
    row.innerHTML = `
      <div>
        <div class="fw-semibold">${item.name}</div>
        <div class="text-muted small">$${Number(item.unitPrice || 0).toFixed(2)} × ${item.qty}</div>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-danger btn-sm" data-action="minus" data-idx="${idx}">-</button>
        <button class="btn btn-outline-danger btn-sm" data-action="plus" data-idx="${idx}">+</button>
        <button class="btn btn-danger btn-sm" data-action="remove" data-idx="${idx}">×</button>
      </div>
    `;
    listEl.appendChild(row);
  });

  // delivery logic (same as checkout)
  let deliveryFee = DELIVERY_FEE;
  let msg = `Delivery fee $${DELIVERY_FEE} applies for orders below $${FREE_DELIVERY_THRESHOLD}`;

  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    deliveryFee = 0;
    msg = `🎉 Free delivery for orders above $${FREE_DELIVERY_THRESHOLD}`;
  }

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (deliveryFeeEl) deliveryFeeEl.textContent = `$${deliveryFee.toFixed(2)}`;
  if (deliveryMsgEl) deliveryMsgEl.textContent = msg;

  totalEl.textContent = `$${(subtotal + deliveryFee).toFixed(2)}`;
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
