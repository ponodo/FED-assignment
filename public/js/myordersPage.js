// js/myOrdersPage.js
import { ORDERS_KEY, load } from "./storage.js";

const filterEl = document.getElementById("order-filter");
const emptyEl = document.getElementById("orders-empty");
const listEl = document.getElementById("orders-list");
const containerEl = document.getElementById("orders-container");

function money(value) {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

function calcSubtotal(items) {
  return (items || []).reduce(
    (sum, item) =>
      sum + (Number(item.unitPrice) || 0) * (Number(item.qty) || 0),
    0,
  );
}

function calcDeliveryFee(order) {
  const subtotal = calcSubtotal(order.items);

  if (order.deliveryType !== "delivery" || subtotal <= 0) {
    return 0;
  }

  return subtotal >= 20 ? 0 : 5;
}

function calcTotal(order) {
  return calcSubtotal(order.items) + calcDeliveryFee(order);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
}

function groupItemsByStall(items) {
  const map = new Map();

  (items || []).forEach((item) => {
    const stallId = Number(item.stallId);
    const stallName = item.stallName || "Unknown Stall";

    const key = `${stallId}-${stallName}`;

    if (!map.has(key)) {
      map.set(key, {
        stallId,
        stallName,
        items: [],
      });
    }

    map.get(key).items.push(item);
  });

  return [...map.values()];
}

function enrichStatuses(orders) {
  const sorted = [...orders].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || ""),
  );

  return sorted.map((order, index) => ({
    ...order,
    status: order.status || (index === 0 ? "ongoing" : "completed"),
  }));
}

function render() {
  const rawOrders = load(ORDERS_KEY, []);

  const orders = enrichStatuses(Array.isArray(rawOrders) ? rawOrders : []);

  const filter = filterEl.value;

  const shown =
    filter === "all"
      ? orders
      : orders.filter((order) => (order.status || "ongoing") === filter);

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

      const groupedStalls = groupItemsByStall(order.items);

      const itemsHtml = groupedStalls
        .map((group) => {
          const lines = group.items
            .map(
              (item) => `
                <div class="d-flex justify-content-between">
                  <span class="text-muted">
                    ${item.name || "Item"} × ${item.qty || 1}
                  </span>

                  <span class="text-muted">
                    ${money(
                      (Number(item.unitPrice) || 0) * (Number(item.qty) || 0),
                    )}
                  </span>
                </div>
              `,
            )
            .join("");

          const feedbackButton =
            order.status === "completed"
              ? `
                <a
                  href="feedback.html?orderId=${order.orderId}&stallId=${group.stallId}&stallName=${encodeURIComponent(group.stallName)}"
                  class="btn btn-danger btn-sm mt-3"
                >
                  <i class="bi bi-star me-1"></i>
                  Leave Feedback
                </a>
              `
              : "";

          return `
            <div class="mt-3">
              <div class="fw-semibold text-danger">
                ${group.stallName}
              </div>

              <div class="mt-2">
                ${lines}
              </div>

              ${feedbackButton}
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
                  <div class="fw-bold">
                    Order #${order.orderId}
                  </div>

                  <div class="text-muted small">
                    ${formatDate(order.createdAt)}
                  </div>

                  <div class="text-muted small">
                    ${order.deliveryType === "delivery" ? "Delivery" : "Pickup"}
                    • ${order.customerName || "Customer"}
                  </div>
                </div>

                <span
                  class="badge ${badgeClass} text-uppercase"
                >
                  ${order.status || "ongoing"}
                </span>
              </div>

              <hr />

              ${itemsHtml}

              <hr />

              <div class="d-flex justify-content-between">
                <span class="text-muted">
                  Subtotal
                </span>

                <span class="fw-semibold">
                  ${money(subtotal)}
                </span>
              </div>

              <div class="d-flex justify-content-between">
                <span class="text-muted">
                  Delivery
                </span>

                <span class="fw-semibold">
                  ${money(deliveryFee)}
                </span>
              </div>

              <div class="d-flex justify-content-between mt-2">
                <span class="fw-bold">
                  Total
                </span>

                <span class="fw-bold text-danger">
                  ${money(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

filterEl.addEventListener("change", render);

render();
