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

async function createDatabaseOrder(orderData) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Unable to create order");
  }

  return result.order;
}

deliveryTypeEl.addEventListener("change", updateSummary);

btnPlaceOrder.addEventListener("click", async () => {
  const cart = load(CART_KEY, []);

  if (cart.length === 0) {
    return;
  }

  const fullName = document.getElementById("fullName").value.trim();

  const phone = document.getElementById("phone").value.trim();

  const tac = document.getElementById("tac").checked;

  if (!fullName || !phone) {
    alert("Please fill in Full Name and Phone Number.");

    return;
  }

  if (!tac) {
    alert("Please agree to the Terms & Conditions.");

    return;
  }

  const currentUser = loadCurrentUser();

  /*
      Temporary fallback:
      Customer 1 already exists in the SQL sample data.

      When authentication is connected to SQL,
      replace this fallback with the logged-in
      customer's real database ID.
    */
  let customerId = Number(currentUser?.customerId);

  if (
    !Number.isInteger(customerId) ||
    customerId < 1 ||
    customerId > 2147483647
  ) {
    customerId = 1;
  }

  const originalButtonHtml = btnPlaceOrder.innerHTML;

  btnPlaceOrder.disabled = true;
  btnPlaceOrder.innerHTML = `
      <span
        class="spinner-border spinner-border-sm me-2"
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

      const databaseOrder = await createDatabaseOrder({
        customerId,
        stallId: group.stallId,
        totalAmount,
        paymentStatus: "Paid",
        orderStatus: "Completed",
      });

      savedOrders.push({
        orderId: databaseOrder.orderId,
        customerId,
        customerName: fullName,
        phone,
        stallId: group.stallId,
        stallName: group.stallName,
        deliveryType: deliveryTypeEl.value,
        items: group.items,
        totalAmount,
        status: "completed",
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
