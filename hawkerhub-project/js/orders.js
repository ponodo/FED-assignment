// js/orders.js - ORDER MANAGEMENT
document.addEventListener("DOMContentLoaded", function () {
  if (
    window.location.pathname.includes("orders") ||
    window.location.pathname.includes("checkout.html") ||
    window.location.pathname.includes("dashboard")
  ) {
    loadOrders();
  }
});

// Place new order
function placeOrder(customerInfo) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    showAlert("Your cart is empty!", "danger");
    return false;
  }

  const user = JSON.parse(localStorage.getItem("hawkerhub_user"));
  if (!user) {
    showAlert("Please login to place order", "danger");
    window.location.href = "login.html";
    return false;
  }

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0,
  );
  const deliveryFee = customerInfo.deliveryType === "delivery" ? 3.0 : 0;
  const total = subtotal + deliveryFee;

  // Create order
  const newOrder = {
    id: "ORD" + Date.now(),
    userId: user.id,
    customerName: customerInfo.fullName || `${user.firstName} ${user.lastName}`,
    customerPhone: customerInfo.phone,
    customerAddress: customerInfo.address,
    date: new Date().toISOString(),
    items: [...cart], // Copy cart items
    subtotal: subtotal,
    deliveryFee: deliveryFee,
    total: total,
    deliveryType: customerInfo.deliveryType || "pickup",
    paymentMethod: customerInfo.paymentMethod || "PayNow",
    status: "pending",
    vendorId: 2, // Default vendor (in real app, would be based on items)
  };

  // Save order
  const orders = JSON.parse(localStorage.getItem("hawkerhub_orders")) || [];
  orders.push(newOrder);
  localStorage.setItem("hawkerhub_orders", JSON.stringify(orders));

  // Clear cart
  localStorage.removeItem("cart");
  updateCartDisplay();

  showAlert(`Order placed successfully! Order ID: ${newOrder.id}`, "success");

  // Redirect to orders page
  setTimeout(() => {
    window.location.href = "my-orders.html";
  }, 1500);

  return newOrder.id;
}

// Load orders for current user
function loadOrders() {
  const user = JSON.parse(localStorage.getItem("hawkerhub_user"));
  if (!user) return;

  const orders = JSON.parse(localStorage.getItem("hawkerhub_orders")) || [];
  const userOrders =
    user.role === "vendor"
      ? orders.filter((order) => order.vendorId === user.id)
      : orders.filter((order) => order.userId === user.id);

  // Update orders list page
  const ordersList = document.getElementById("ordersList");
  if (ordersList) {
    if (userOrders.length === 0) {
      ordersList.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-receipt display-1 text-muted mb-3"></i>
                    <h4>No orders yet</h4>
                    <p class="text-muted">${user.role === "vendor" ? "No customer orders yet" : "Start ordering from our hawkers!"}</p>
                    <a href="order.html" class="btn btn-danger mt-3">${user.role === "vendor" ? "View Menu" : "Order Now"}</a>
                </div>
            `;
    } else {
      let ordersHTML = "";

      userOrders.forEach((order) => {
        const totalItems = order.items.reduce(
          (sum, item) => sum + (item.quantity || 1),
          0,
        );

        // Status badge color
        let badgeClass = "bg-secondary";
        if (order.status === "pending") badgeClass = "bg-warning";
        else if (order.status === "preparing") badgeClass = "bg-info";
        else if (order.status === "ready") badgeClass = "bg-primary";
        else if (order.status === "completed") badgeClass = "bg-success";
        else if (order.status === "cancelled") badgeClass = "bg-danger";

        ordersHTML += `
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-3">
                                    <h6 class="mb-1">Order ${order.id}</h6>
                                    <small class="text-muted">${new Date(order.date).toLocaleDateString()}</small>
                                </div>
                                <div class="col-md-2">
                                    <p class="mb-0">${totalItems} items</p>
                                </div>
                                <div class="col-md-2">
                                    <span class="fw-bold text-danger">$${order.total.toFixed(2)}</span>
                                </div>
                                <div class="col-md-3">
                                    <span class="badge ${badgeClass}">${order.status}</span>
                                </div>
                                <div class="col-md-2 text-end">
                                    <button class="btn btn-sm btn-outline-danger" onclick="viewOrderDetails('${order.id}')">
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
      });

      ordersList.innerHTML = ordersHTML;
    }
  }

  // Update dashboard stats
  updateOrderStats(userOrders);
}

// Update order statistics
function updateOrderStats(orders) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;

  // Customer dashboard
  if (document.getElementById("totalOrders")) {
    document.getElementById("totalOrders").textContent = totalOrders;
  }
  if (document.getElementById("pendingOrders")) {
    document.getElementById("pendingOrders").textContent = pendingOrders;
  }

  // Vendor dashboard
  if (document.getElementById("todayOrders")) {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (o) => new Date(o.date).toDateString() === today,
    );
    document.getElementById("todayOrders").textContent = todayOrders.length;

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById("todayRevenue").textContent =
      `$${todayRevenue.toFixed(2)}`;
  }
}

// View order details
function viewOrderDetails(orderId) {
  const orders = JSON.parse(localStorage.getItem("hawkerhub_orders")) || [];
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    showAlert("Order not found", "danger");
    return;
  }

  let details = `Order Details\n\n`;
  details += `Order ID: ${order.id}\n`;
  details += `Date: ${new Date(order.date).toLocaleString()}\n`;
  details += `Customer: ${order.customerName}\n`;
  details += `Phone: ${order.customerPhone}\n`;
  details += `Delivery: ${order.deliveryType}\n`;
  details += `Address: ${order.customerAddress || "Pickup"}\n`;
  details += `Payment: ${order.paymentMethod}\n`;
  details += `Status: ${order.status}\n\n`;
  details += `Items:\n`;

  order.items.forEach((item) => {
    details += `- ${item.name} x${item.quantity || 1}: $${(item.price * (item.quantity || 1)).toFixed(2)}\n`;
  });

  details += `\nSubtotal: $${order.subtotal.toFixed(2)}\n`;
  details += `Delivery: $${order.deliveryFee.toFixed(2)}\n`;
  details += `Total: $${order.total.toFixed(2)}`;

  alert(details);
}

// Update order status (for vendors)
function updateOrderStatus(orderId, newStatus) {
  const orders = JSON.parse(localStorage.getItem("hawkerhub_orders")) || [];
  const orderIndex = orders.findIndex((o) => o.id === orderId);

  if (orderIndex > -1) {
    orders[orderIndex].status = newStatus;
    localStorage.setItem("hawkerhub_orders", JSON.stringify(orders));
    showAlert(`Order ${orderId} marked as ${newStatus}`, "success");
    loadOrders();
  }
}
