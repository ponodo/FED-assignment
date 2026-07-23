import {
  CART_KEY,
  load,
  save,
  ORDERS_KEY,
  loadCurrentUser,
} from "./storage.js";

const deliveryTypeEl = document.getElementById("deliveryType");

const emptyTextEl = document.getElementById("summary-empty-text");

const subtotalEl = document.getElementById("summary-subtotal");

const deliveryEl = document.getElementById("summary-delivery");

const totalEl = document.getElementById("summary-total");

const deliveryMsgEl = document.getElementById("delivery-message");

const btnPlaceOrder = document.getElementById("btn-place-order");

const DELIVERY_FEE = 5;
const FREE_DELIVERY_THRESHOLD = 20;

// ========================================
// CALCULATIONS
// ========================================

function calcSubtotal(cart) {
  return cart.reduce(
    (sum, item) =>
      sum + (Number(item.unitPrice) || 0) * (Number(item.qty) || 0),
    0,
  );
}

function calculateDeliveryFee(subtotal) {
  if (deliveryTypeEl.value !== "delivery") {
    return 0;
  }

  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

// ========================================
// ORDER SUMMARY
// ========================================

function updateSummary() {
  const cart = load(CART_KEY, []);

  const subtotal = calcSubtotal(cart);
  const deliveryFee = calculateDeliveryFee(subtotal);

  let message = "";

  if (deliveryTypeEl.value === "delivery") {
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      message = "🎉 Free delivery for orders above $20";
    } else {
      message = "Delivery fee $5 applies for orders below $20";
    }
  } else {
    message = "Pickup selected — no delivery fee";
  }

  const total = subtotal + deliveryFee;

  emptyTextEl.textContent = cart.length === 0 ? "No items in cart" : "";

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;

  deliveryEl.textContent = `$${deliveryFee.toFixed(2)}`;

  totalEl.textContent = `$${total.toFixed(2)}`;

  deliveryMsgEl.textContent = message;

  btnPlaceOrder.disabled = cart.length === 0;
}

// ========================================
// CART GROUPING
// ========================================

function groupCartByStall(cart) {
  const stallGroups = new Map();

  cart.forEach((item) => {
    const stallId = Number(item.stallId);

    if (!stallGroups.has(stallId)) {
      stallGroups.set(stallId, {
        stallId,
        stallName: item.stallName || "Unknown Stall",
        items: [],
      });
    }

    stallGroups.get(stallId).items.push(item);
  });

  return [...stallGroups.values()];
}

// ========================================
// API HELPERS
// ========================================

async function readJsonResponse(response) {
  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.details ||
        result?.error ||
        result?.message ||
        "Unable to complete request",
    );
  }

  return result;
}

async function createDatabaseOrder(orderData) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  const result = await readJsonResponse(response);

  return result.order;
}

async function createDatabaseDelivery(deliveryData) {
  const response = await fetch("/api/deliveries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(deliveryData),
  });

  return readJsonResponse(response);
}

// ========================================
// EVENTS
// ========================================

deliveryTypeEl.addEventListener("change", updateSummary);

btnPlaceOrder.addEventListener("click", async () => {
  const cart = load(CART_KEY, []);

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const fullName = document.getElementById("fullName").value.trim();

  const phone = document.getElementById("phone").value.trim();

  const deliveryAddress =
    document.getElementById("deliveryAddress")?.value.trim() || "";

  const tac = document.getElementById("tac").checked;

  if (!fullName || !phone) {
    alert("Please fill in Full Name and Phone Number.");

    return;
  }

  if (deliveryTypeEl.value === "delivery" && !deliveryAddress) {
    alert("Please enter a delivery address.");

    return;
  }

  if (!tac) {
    alert("Please agree to the Terms & Conditions.");

    return;
  }

  const currentUser = loadCurrentUser();

  if (!currentUser) {
    alert("Please log in before placing an order.");

    window.location.href = "login.html";

    return;
  }

  const customerId = Number(currentUser.customerId);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    alert(
      "Your account is not linked to a customer profile. Please log out and log in again.",
    );

    return;
  }

  const originalButtonHtml = btnPlaceOrder.innerHTML;

  btnPlaceOrder.disabled = true;

  btnPlaceOrder.innerHTML = `
      <span
        class="spinner-border spinner-border-sm me-2"
        role="status"
        aria-hidden="true"
      ></span>
      Placing order...
    `;

  try {
    const stallGroups = groupCartByStall(cart);

    const savedOrders = [];

    for (const group of stallGroups) {
      const subtotal = calcSubtotal(group.items);

      const deliveryFee = calculateDeliveryFee(subtotal);

      const totalAmount = subtotal + deliveryFee;

      const isDelivery = deliveryTypeEl.value === "delivery";

      const databaseOrder = await createDatabaseOrder({
        customerId,
        stallId: group.stallId,
        totalAmount,
        paymentStatus: "Paid",
        orderStatus: isDelivery ? "Preparing" : "Completed",
      });

      let deliveryResult = null;

      if (isDelivery) {
        deliveryResult = await createDatabaseDelivery({
          orderId: databaseOrder.orderId,

          deliveryAddress,

          deliveryStatus: "Order Confirmed",

          changedByUserId: currentUser.userId,
        });
      }

      savedOrders.push({
        orderId: databaseOrder.orderId,

        customerId,

        customerName: fullName,

        phone,

        stallId: group.stallId,

        stallName: group.stallName,

        deliveryType: deliveryTypeEl.value,

        deliveryAddress: isDelivery ? deliveryAddress : null,

        deliveryId: deliveryResult?.delivery?.deliveryId || null,

        items: group.items,

        totalAmount,

        status: isDelivery ? "ongoing" : "completed",

        createdAt: databaseOrder.orderDate || new Date().toISOString(),
      });
    }

    const existingOrders = load(ORDERS_KEY, []);

    save(ORDERS_KEY, [...existingOrders, ...savedOrders]);

    save(CART_KEY, []);

    window.location.href = "my-orders.html";
  } catch (error) {
    console.error("Order submission error:", error);

    alert(error.message);
  } finally {
    btnPlaceOrder.disabled = false;

    btnPlaceOrder.innerHTML = originalButtonHtml;
  }
});

updateSummary();
