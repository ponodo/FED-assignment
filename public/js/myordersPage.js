import { ORDERS_KEY, load } from "./storage.js";

const filterEl = document.getElementById("order-filter");
const loadingEl = document.getElementById("orders-loading");
const emptyEl = document.getElementById("orders-empty");
const listEl = document.getElementById("orders-list");
const containerEl = document.getElementById("orders-container");

const socket = typeof io === "function" ? io() : null;

let allOrders = [];
let deliveryDataByOrderId = new Map();
const joinedDeliveryRooms = new Set();

// =======================================
// Helper Functions
// =======================================

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

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

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function formatDistance(distanceMetres) {
  if (
    distanceMetres === null ||
    distanceMetres === undefined ||
    distanceMetres === ""
  ) {
    return "Not available";
  }

  const distance = Number(distanceMetres);

  if (!Number.isFinite(distance) || distance < 0) {
    return "Not available";
  }

  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }

  return `${(distance / 1000).toFixed(1)} km`;
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

function getFrontendStatus(order, delivery) {
  const deliveryStatus = delivery?.deliveryStatus?.toLowerCase() || "";

  if (deliveryStatus === "delivered" || order.status === "completed") {
    return "completed";
  }

  if (deliveryStatus === "cancelled" || order.status === "cancelled") {
    return "cancelled";
  }

  return "ongoing";
}

function getStatusBadgeClass(status) {
  if (status === "completed") {
    return "bg-success";
  }

  if (status === "cancelled") {
    return "bg-secondary";
  }

  return "bg-warning text-dark";
}

function getDeliveryStatusBadgeClass(status) {
  switch (status) {
    case "Delivered":
      return "bg-success";

    case "Cancelled":
      return "bg-secondary";

    case "Out for Delivery":
      return "bg-primary";

    case "Rider Assigned":
      return "bg-info text-dark";

    case "Ready for Delivery":
      return "bg-warning text-dark";

    default:
      return "bg-danger";
  }
}

// =======================================
// Delivery API
// =======================================

async function getDeliveryByOrderId(orderId) {
  const response = await fetch(`/api/deliveries/order/${orderId}`);

  if (response.status === 404) {
    return null;
  }

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.message || `Unable to load delivery for order ${orderId}`,
    );
  }

  return result;
}

async function loadDeliveryInformation(orders) {
  const results = await Promise.all(
    orders.map(async (order) => {
      try {
        const result = await getDeliveryByOrderId(order.orderId);

        return {
          orderId: Number(order.orderId),
          result,
        };
      } catch (error) {
        console.error(
          `Delivery loading error for order ${order.orderId}:`,
          error,
        );

        return {
          orderId: Number(order.orderId),
          result: null,
        };
      }
    }),
  );

  results.forEach(({ orderId, result }) => {
    if (result?.delivery) {
      deliveryDataByOrderId.set(orderId, result);

      joinDeliveryRoom(result.delivery.deliveryId);
    }
  });
}

// =======================================
// Socket.IO
// =======================================

function joinDeliveryRoom(deliveryId) {
  if (!socket || !deliveryId || joinedDeliveryRooms.has(Number(deliveryId))) {
    return;
  }

  socket.emit("joinDelivery", Number(deliveryId));

  joinedDeliveryRooms.add(Number(deliveryId));
}

function findOrderIdByDeliveryId(deliveryId) {
  for (const [orderId, result] of deliveryDataByOrderId) {
    if (Number(result?.delivery?.deliveryId) === Number(deliveryId)) {
      return orderId;
    }
  }

  return null;
}

function updateStoredDelivery(delivery, statusHistory) {
  if (!delivery) {
    return;
  }

  const orderId = Number(delivery.orderId);

  if (!orderId) {
    return;
  }

  const existing = deliveryDataByOrderId.get(orderId) || {};

  deliveryDataByOrderId.set(orderId, {
    ...existing,
    delivery,
    statusHistory: statusHistory || existing.statusHistory || [],
  });

  renderOrders();
}

if (socket) {
  socket.on("connect", () => {
    joinedDeliveryRooms.clear();

    deliveryDataByOrderId.forEach((result) => {
      joinDeliveryRoom(result?.delivery?.deliveryId);
    });
  });

  socket.on("deliveryLocationUpdated", (payload) => {
    const delivery = payload?.delivery || payload;

    updateStoredDelivery(delivery);
  });

  socket.on("deliveryStatusUpdated", (payload) => {
    updateStoredDelivery(
      payload?.delivery,
      payload?.statusHistory
        ? [
            ...(deliveryDataByOrderId.get(Number(payload.delivery?.orderId))
              ?.statusHistory || []),
            payload.statusHistory,
          ]
        : undefined,
    );
  });

  socket.on("riderAssigned", (payload) => {
    updateStoredDelivery(
      payload?.delivery,
      payload?.statusHistory
        ? [
            ...(deliveryDataByOrderId.get(Number(payload.delivery?.orderId))
              ?.statusHistory || []),
            payload.statusHistory,
          ]
        : undefined,
    );
  });

  socket.on("deliveryDeleted", ({ deliveryId }) => {
    const orderId = findOrderIdByDeliveryId(deliveryId);

    if (orderId) {
      deliveryDataByOrderId.delete(orderId);
      renderOrders();
    }
  });
}

// =======================================
// Render Delivery Tracking
// =======================================

function renderStatusHistory(statusHistory) {
  if (!Array.isArray(statusHistory) || statusHistory.length === 0) {
    return "";
  }

  const latestStatuses = statusHistory.slice(-4).reverse();

  return `
    <div class="mt-4">
      <div class="fw-semibold mb-2">
        Recent Updates
      </div>

      <div class="list-group list-group-flush">
        ${latestStatuses
          .map(
            (history) => `
              <div
                class="list-group-item px-0 py-2 bg-transparent"
              >
                <div
                  class="d-flex justify-content-between gap-3"
                >
                  <span>
                    ${escapeHtml(history.deliveryStatus || "Status updated")}
                  </span>

                  <small class="text-muted text-nowrap">
                    ${escapeHtml(formatDate(history.changedAt))}
                  </small>
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderDeliveryTracking(order, result) {
  if (order.deliveryType !== "delivery") {
    return `
      <div class="alert alert-light border mt-4 mb-0">
        <div class="d-flex align-items-center">
          <i class="bi bi-bag-check fs-4 text-danger me-3"></i>

          <div>
            <div class="fw-semibold">
              Pickup Order
            </div>

            <small class="text-muted">
              This order does not require delivery tracking.
            </small>
          </div>
        </div>
      </div>
    `;
  }

  if (!result?.delivery) {
    return `
      <div class="alert alert-light border mt-4 mb-0">
        <div class="d-flex align-items-center">
          <i class="bi bi-truck fs-4 text-secondary me-3"></i>

          <div>
            <div class="fw-semibold">
              Delivery Tracking
            </div>

            <small class="text-muted">
              Tracking information is not available for this order yet.
            </small>
          </div>
        </div>
      </div>
    `;
  }

  const delivery = result.delivery;
  const statusHistory = result.statusHistory || [];

  const statusBadgeClass = getDeliveryStatusBadgeClass(delivery.deliveryStatus);

  const eta =
    delivery.estimatedArrivalMinutes !== null &&
    delivery.estimatedArrivalMinutes !== undefined
      ? `${delivery.estimatedArrivalMinutes} min`
      : "Calculating...";

  return `
    <div
      class="card border-danger-subtle bg-light mt-4"
      id="delivery-tracking-${delivery.deliveryId}"
    >
      <div class="card-body">
        <div
          class="d-flex flex-wrap justify-content-between align-items-center gap-3"
        >
          <div>
            <div class="fw-bold text-danger">
              <i class="bi bi-truck me-2"></i>
              Live Delivery Tracking
            </div>

            <small class="text-muted">
              Updates automatically without refreshing
            </small>
          </div>

          <span class="badge ${statusBadgeClass}">
            ${escapeHtml(delivery.deliveryStatus || "Order Confirmed")}
          </span>
        </div>

        <hr />

        <div class="row g-3">
          <div class="col-6 col-lg-3">
            <small class="text-muted d-block">
              Estimated Arrival
            </small>

            <div class="fw-bold fs-5">
              <i class="bi bi-clock text-danger me-1"></i>
              ${escapeHtml(eta)}
            </div>
          </div>

          <div class="col-6 col-lg-3">
            <small class="text-muted d-block">
              Remaining Distance
            </small>

            <div class="fw-bold fs-5">
              <i class="bi bi-geo-alt text-danger me-1"></i>
              ${escapeHtml(formatDistance(delivery.remainingDistanceMetres))}
            </div>
          </div>

          <div class="col-6 col-lg-3">
            <small class="text-muted d-block">
              Rider
            </small>

            <div class="fw-semibold">
              <i class="bi bi-person text-danger me-1"></i>
              ${escapeHtml(delivery.riderName || "Waiting for rider")}
            </div>
          </div>

          <div class="col-6 col-lg-3">
            <small class="text-muted d-block">
              Rider Phone
            </small>

            <div class="fw-semibold">
              ${
                delivery.riderPhone
                  ? `
                    <a
                      href="tel:${escapeHtml(delivery.riderPhone)}"
                      class="text-decoration-none text-dark"
                    >
                      <i class="bi bi-telephone text-danger me-1"></i>
                      ${escapeHtml(delivery.riderPhone)}
                    </a>
                  `
                  : `
                    <span class="text-muted">
                      Not available
                    </span>
                  `
              }
            </div>
          </div>
        </div>

        ${
          delivery.deliveryAddress
            ? `
              <div class="mt-3">
                <small class="text-muted d-block">
                  Delivery Address
                </small>

                <div>
                  <i class="bi bi-house text-danger me-1"></i>
                  ${escapeHtml(delivery.deliveryAddress)}
                </div>
              </div>
            `
            : ""
        }

        ${renderStatusHistory(statusHistory)}
      </div>
    </div>
  `;
}

// =======================================
// Render Orders
// =======================================

function renderOrders() {
  const filter = filterEl.value;

  const ordersWithStatus = allOrders.map((order) => {
    const deliveryResult = deliveryDataByOrderId.get(Number(order.orderId));

    const frontendStatus = getFrontendStatus(order, deliveryResult?.delivery);

    return {
      ...order,
      frontendStatus,
      deliveryResult,
    };
  });

  const shown =
    filter === "all"
      ? ordersWithStatus
      : ordersWithStatus.filter((order) => order.frontendStatus === filter);

  loadingEl.classList.add("d-none");

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

      const badgeClass = getStatusBadgeClass(order.frontendStatus);

      const groupedStalls = groupItemsByStall(order.items);

      const itemsHtml = groupedStalls
        .map((group) => {
          const lines = group.items
            .map(
              (item) => `
                <div class="d-flex justify-content-between gap-3">
                  <span class="text-muted">
                    ${escapeHtml(item.name || "Item")}
                    ×
                    ${Number(item.qty) || 1}
                  </span>

                  <span class="text-muted text-nowrap">
                    ${money(
                      (Number(item.unitPrice) || 0) * (Number(item.qty) || 0),
                    )}
                  </span>
                </div>
              `,
            )
            .join("");

          const feedbackButton =
            order.frontendStatus === "completed"
              ? `
                <a
                  href="feedback.html?orderId=${encodeURIComponent(
                    order.orderId,
                  )}&stallId=${encodeURIComponent(
                    group.stallId,
                  )}&stallName=${encodeURIComponent(group.stallName)}"
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
                ${escapeHtml(group.stallName)}
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
              <div
                class="d-flex justify-content-between align-items-start gap-3"
              >
                <div>
                  <div class="fw-bold">
                    Order #${escapeHtml(order.orderId)}
                  </div>

                  <div class="text-muted small">
                    ${escapeHtml(formatDate(order.createdAt))}
                  </div>

                  <div class="text-muted small">
                    ${order.deliveryType === "delivery" ? "Delivery" : "Pickup"}
                    •
                    ${escapeHtml(order.customerName || "Customer")}
                  </div>
                </div>

                <span
                  class="badge ${badgeClass} text-uppercase"
                >
                  ${escapeHtml(order.frontendStatus)}
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

              ${renderDeliveryTracking(order, order.deliveryResult)}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

// =======================================
// Initialise
// =======================================

async function initialisePage() {
  try {
    const rawOrders = load(ORDERS_KEY, []);

    allOrders = Array.isArray(rawOrders)
      ? [...rawOrders].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      : [];

    if (allOrders.length === 0) {
      loadingEl.classList.add("d-none");
      emptyEl.classList.remove("d-none");
      return;
    }

    await loadDeliveryInformation(allOrders);

    renderOrders();
  } catch (error) {
    console.error("My Orders loading error:", error);

    loadingEl.innerHTML = `
      <div class="alert alert-danger">
        Unable to load orders. Please try again.
      </div>
    `;
  }
}

filterEl.addEventListener("change", renderOrders);

initialisePage();
