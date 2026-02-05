import { ORDERS_KEY, load } from "./storage.js";

const emptyEl = document.getElementById("orders-empty");
const listSectionEl = document.getElementById("orders-list");
const containerEl = document.getElementById("orders-container");
const filterEl = document.getElementById("order-filter");

function render() {
  const orders = load(ORDERS_KEY, []);
  const filter = filterEl.value;

  const filtered = orders.filter(o => {
    if (filter === "all") return true;
    return (o.status || "completed").toLowerCase() === filter;
  });

  if (filtered.length === 0) {
    emptyEl.classList.remove("d-none");
    listSectionEl.classList.add("d-none");
    return;
  }

  emptyEl.classList.add("d-none");
  listSectionEl.classList.remove("d-none");

  containerEl.innerHTML = "";

  filtered.forEach(order => {
    const card = document.createElement("div");
    card.className = "col-12";

    const total = (order.items || []).reduce((sum, it) => sum + it.unitPrice * it.qty, 0);

    card.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body d-flex justify-content-between align-items-start">
          <div>
            <div class="fw-bold">Order #${order.orderId}</div>
            <div class="text-muted small">${new Date(order.createdAt).toLocaleString()}</div>
            <div class="mt-2 text-muted">Items: ${(order.items || []).length}</div>
          </div>
          <div class="text-end">
            <div class="fw-bold text-danger">$${total.toFixed(2)}</div>
            <div class="badge text-bg-light border">${(order.status || "Completed")}</div>
          </div>
        </div>
      </div>
    `;

    containerEl.appendChild(card);
  });
}

filterEl.addEventListener("change", render);
render();
