import { CART_KEY, load, save, ORDERS_KEY } from "./storage.js";

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
  return cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}

function updateSummary() {
  const cart = load(CART_KEY, []);
  const subtotal = calcSubtotal(cart);

  let deliveryFee = 0;
  let message = "";

  if (deliveryTypeEl.value === "delivery" && subtotal > 0) {
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      deliveryFee = 0;
      message = "🎉 Free delivery for orders above $20";
    } else {
      deliveryFee = DELIVERY_FEE;
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

deliveryTypeEl.addEventListener("change", updateSummary);

btnPlaceOrder.addEventListener("click", () => {
  const cart = load(CART_KEY, []);
  if (cart.length === 0) return;

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

  const orders = load(ORDERS_KEY, []);
  orders.push({
    orderId: Date.now(),
    customerName: fullName,
    phone,
    deliveryType: deliveryTypeEl.value,
    items: cart,
    createdAt: new Date().toISOString()
  });

  save(ORDERS_KEY, orders);
  save(CART_KEY, []);

  window.location.href = "my-orders.html";
});

updateSummary();
