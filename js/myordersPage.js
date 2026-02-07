// js/myOrdersPage.js
import { ORDERS_KEY, load } from "./storage.js";

const filterEl = document.getElementById("order-filter");
const emptyEl = document.getElementById("orders-empty");
const listEl = document.getElementById("orders-list");
const containerEl = document.getElementById("orders-container");

// -------- helpers --------
function money(n) {
  return `$${(Number(n) || 0).toFixed(2)}`;
}

function calcSubtotal(items) {
  return (items || []).reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.qty) || 0), 0);
}

function calcDeliveryFee(order) {
  // Mirror your checkout rules:
  // - pickup => $0
  // - delivery => free if subtotal >= 20 else $5
  const subtotal = calcSubtotal(order.items);
  if (order.deliveryType !== "delivery" || subtotal <= 0) return 0;
  return subtotal >= 20 ? 0 : 5;
}

function calcTotal(order) {
  const subtotal = calcSubtotal(order.items);
  const delivery = calcDeliveryFee(order);
  return subtotal + delivery;
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso || "";
  }
}

function groupItemsByStall(items) {
  const map = new Map();
  (items || []).forEach((it) => {
    const stall = it.stallName || "Unknown Stall";
    if (!map.has(stall)) map.set(stall, []);
    map.get(stall).push(it);
  });
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

// Simple status generator (since your checkout doesn't store status yet)
// Newest order = ongoing, older = completed
function enrichStatuses(orders) {
  const sorted = [...orders].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return sorted.map((o, idx) => ({
    ...o,
    status: o.status || (idx === 0 ? "ongoing" : "completed")
  }));
}

// -------- render --------
function render() {
  const raw = load(ORDERS_KEY, []);
  const orders = enrichStatuses(Array.isArray(raw) ? raw : []);

  const filter = filterEl.value; // all / completed / ongoing / cancelled
  const shown =
    filter === "all" ? orders : orders.filter((o) => (o.status || "ongoing") === filter);

  if (shown.length === 0) {
    emptyEl.classList.remove("d-none");
    listEl.classList.add("d-none");
    containerEl.innerHTML = "";
    return;
  }

  emptyEl.classList.add("d-none");
  listEl.classList.remove("d-none");

  containerEl.innerHTML = shown
    .map((order) => {
      const subtotal = calcSubtotal(order.items);
      const deliveryFee = calcDeliveryFee(order);
      const total = calcTotal(order);

      const badgeClass =
        order.status === "completed"
          ? "bg-success"
          : order.status === "cancelled"
          ? "bg-secondary"
          : "bg-warning text-dark";

      const grouped = groupItemsByStall(order.items);

      const itemsHtml = grouped
        .map(([stall, items]) => {
          const lines = items
            .map(
              (it) => `
                <div class="d-flex justify-content-between">
                  <span class="text-muted">${it.name || "Item"} × ${it.qty || 1}</span>
                  <span class="text-muted">${money((Number(it.unitPrice) || 0) * (Number(it.qty) || 0))}</span>
                </div>
              `
            )
            .join("");

          return `
            <div class="mt-3">
              <div class="fw-semibold text-danger">${stall}</div>
              <div class="mt-2">${lines}</div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="col-12">
          <div class="card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="fw-bold">Order #${order.orderId}</div>
                  <div class="text-muted small">${formatDate(order.createdAt)}</div>
                  <div class="text-muted small">
                    ${order.deliveryType === "delivery" ? "Delivery" : "Pickup"} • ${order.customerName || "Customer"}
                  </div>
                </div>

                <span class="badge ${badgeClass} text-uppercase">${order.status || "ongoing"}</span>
              </div>

              <hr />

              ${itemsHtml}

              <hr />

              <div class="d-flex justify-content-between">
                <span class="text-muted">Subtotal</span>
                <span class="fw-semibold">${money(subtotal)}</span>
              </div>
              <div class="d-flex justify-content-between">
                <span class="text-muted">Delivery</span>
                <span class="fw-semibold">${money(deliveryFee)}</span>
              </div>
              <div class="d-flex justify-content-between mt-2">
                <span class="fw-bold">Total</span>
                <span class="fw-bold text-danger">${money(total)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

// -------- events --------
filterEl.addEventListener("change", render);
render();
