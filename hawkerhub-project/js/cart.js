// js/cart.js - SHOPPING CART FUNCTIONS
document.addEventListener("DOMContentLoaded", function () {
  if (
    window.location.pathname.includes("cart.html") ||
    window.location.pathname.includes("checkout.html") ||
    window.location.pathname.includes("order.html")
  ) {
    loadCart();
    updateCartDisplay();
  }
});

// Add item to cart
function addToCart(itemName, price, quantity = 1) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Check if item already exists
  const existingItem = cart.find((item) => item.name === itemName);

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + quantity;
  } else {
    cart.push({
      id: Date.now(),
      name: itemName,
      price: price,
      quantity: quantity,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDisplay();
  showAlert(`${itemName} added to cart!`, "success");
}

// Load cart items
function loadCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartItemsContainer = document.getElementById("cartItems");
  const orderItemsContainer = document.getElementById("orderItems");

  // Update cart page
  if (cartItemsContainer) {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-cart display-1 text-muted mb-3"></i>
                    <h4>Your cart is empty</h4>
                    <a href="order.html" class="btn btn-danger mt-3">Browse Food</a>
                </div>
            `;
    } else {
      let itemsHTML = "";
      let subtotal = 0;

      cart.forEach((item, index) => {
        const itemTotal = item.price * (item.quantity || 1);
        subtotal += itemTotal;

        itemsHTML += `
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                        <div>
                            <h6 class="mb-1">${item.name}</h6>
                            <p class="mb-0 text-muted">$${item.price.toFixed(2)} each</p>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="input-group input-group-sm" style="width: 120px;">
                                <button class="btn btn-outline-secondary" onclick="updateCartQuantity(${index}, -1)">-</button>
                                <input type="text" class="form-control text-center" value="${item.quantity || 1}" readonly>
                                <button class="btn btn-outline-secondary" onclick="updateCartQuantity(${index}, 1)">+</button>
                            </div>
                            <span class="ms-3 fw-bold">$${itemTotal.toFixed(2)}</span>
                            <button class="btn btn-link text-danger ms-3" onclick="removeFromCart(${index})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
      });

      cartItemsContainer.innerHTML = itemsHTML;

      // Update totals
      const delivery = 3.0;
      const total = subtotal + delivery;

      document.getElementById("subtotal").textContent =
        `$${subtotal.toFixed(2)}`;
      document.getElementById("total").textContent = `$${total.toFixed(2)}`;
    }
  }

  // Update checkout page
  if (orderItemsContainer) {
    if (cart.length === 0) {
      orderItemsContainer.innerHTML =
        '<p class="text-muted">No items in cart</p>';
    } else {
      let itemsHTML = "";
      let subtotal = 0;

      cart.forEach((item) => {
        const itemTotal = item.price * (item.quantity || 1);
        subtotal += itemTotal;
        itemsHTML += `
                    <div class="d-flex justify-content-between mb-1">
                        <span>${item.name} x${item.quantity || 1}</span>
                        <span>$${itemTotal.toFixed(2)}</span>
                    </div>
                `;
      });

      orderItemsContainer.innerHTML = itemsHTML;

      const delivery =
        document.getElementById("deliveryType")?.value === "delivery" ? 3.0 : 0;
      const total = subtotal + delivery;

      document.getElementById("orderSubtotal").textContent =
        `$${subtotal.toFixed(2)}`;
      document.getElementById("orderDelivery").textContent =
        `$${delivery.toFixed(2)}`;
      document.getElementById("orderTotal").textContent =
        `$${total.toFixed(2)}`;
    }
  }
}

// Update cart quantity
function updateCartQuantity(index, change) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart[index]) {
    const currentQuantity = cart[index].quantity || 1;
    const newQuantity = currentQuantity + change;

    if (newQuantity < 1) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = newQuantity;
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
    updateCartDisplay();
  }
}

// Remove item from cart
function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
  updateCartDisplay();
  showAlert("Item removed from cart", "info");
}

// Update cart display (count in header)
function updateCartDisplay() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCountElements = document.querySelectorAll(".cart-count");

  cartCountElements.forEach((element) => {
    const totalItems = cart.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0,
    );
    element.textContent = totalItems;
    element.style.display = totalItems > 0 ? "inline-block" : "none";
  });
}

// Clear cart
function clearCart() {
  localStorage.removeItem("cart");
  updateCartDisplay();
  if (window.location.pathname.includes("cart.html")) {
    loadCart();
  }
}
