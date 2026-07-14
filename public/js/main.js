// js/main.js - SHARED FUNCTIONS
console.log("HawkerHub main.js loaded");

// Initialize demo data
function initializeDemoData() {
  if (localStorage.getItem("hawkerhub_initialized")) {
    return;
  }

  console.log("Setting up demo data...");

  // Demo users
  const demoUsers = [
    {
      id: 1,
      firstName: "John",
      lastName: "Customer",
      email: "customer@example.com",
      password: "password123",
      role: "customer",
      phone: "+65 9123 4567",
      address: "123 Orchard Road, Singapore",
    },
    {
      id: 2,
      firstName: "Ah",
      lastName: "Tan",
      email: "vendor@example.com",
      password: "password123",
      role: "vendor",
      stallName: "Tian Tian Chicken Rice",
      hawkerCenter: "Maxwell Food Centre",
      phone: "+65 8123 4567",
    },
  ];

  // Demo menu items
  const demoMenu = [
    { id: 1, name: "Chicken Rice", price: 5.5, category: "Main Course" },
    {
      id: 2,
      name: "Roasted Chicken Rice",
      price: 6.0,
      category: "Main Course",
    },
    { id: 3, name: "Char Kway Teow", price: 5.0, category: "Main Course" },
    { id: 4, name: "Laksa", price: 6.0, category: "Main Course" },
  ];

  localStorage.setItem("hawkerhub_users", JSON.stringify(demoUsers));
  localStorage.setItem("hawkerhub_menu", JSON.stringify(demoMenu));
  localStorage.setItem("hawkerhub_orders", JSON.stringify([]));
  localStorage.setItem("cart", JSON.stringify([]));
  localStorage.setItem("hawkerhub_initialized", "true");

  console.log("✅ Demo data created!");
  console.log("Customer: customer@example.com / password123");
  console.log("Vendor: vendor@example.com / password123");
}

// Get current user
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("hawkerhub_user"));
}

// Set current user
function setCurrentUser(user) {
  localStorage.setItem("hawkerhub_user", JSON.stringify(user));
}

// Logout
function logout() {
  localStorage.removeItem("hawkerhub_user");
  localStorage.removeItem("cart");
  window.location.href = "index.html";
}

// Update cart count in header
function updateCartCount() {
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

// Show notification
function showAlert(message, type = "success") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText =
    "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
  alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${type === "success" ? "check-circle" : "exclamation-triangle"} me-2"></i>
            <span>${message}</span>
        </div>
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    if (alertDiv.parentElement) {
      alertDiv.remove();
    }
  }, 3000);
}

// Format price
function formatPrice(amount) {
  return "$" + parseFloat(amount).toFixed(2);
}

// Check if user is logged in (for protected pages)
function requireLogin() {
  const user = getCurrentUser();
  const protectedPages = [
    "customer-dashboard.html",
    "vendor-dashboard.html",
    "profile.html",
    "my-orders.html",
    "checkout.html",
    "menu-management.html",
    "stall-management.html",
  ];

  const currentPage = window.location.pathname.split("/").pop();

  if (protectedPages.includes(currentPage) && !user) {
    window.location.href = "login.html";
    return false;
  }

  if (user) {
    // Redirect if already logged in
    if (currentPage === "login.html" || currentPage === "register.html") {
      if (user.role === "vendor") {
        window.location.href = "vendor-dashboard.html";
      } else {
        window.location.href = "customer-dashboard.html";
      }
      return false;
    }

    // Check role for vendor pages
    if (
      currentPage === "menu-management.html" ||
      currentPage === "stall-management.html" ||
      currentPage === "rental-agreements.html"
    ) {
      if (user.role !== "vendor") {
        window.location.href = "customer-dashboard.html";
        return false;
      }
    }
  }

  return true;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  initializeDemoData();
  updateCartCount();
  requireLogin();
  // Load data from JSON files
  async function loadJSONData() {
    try {
      // Load users
      const usersResponse = await fetch("data/users.json");
      const users = await usersResponse.json();
      localStorage.setItem("hawkerhub_users", JSON.stringify(users));

      // Load menu
      const menuResponse = await fetch("data/menu.json");
      const menu = await menuResponse.json();
      localStorage.setItem("hawkerhub_menu", JSON.stringify(menu));

      // Load hawkers
      const hawkersResponse = await fetch("data/hawkers.json");
      const hawkers = await hawkersResponse.json();
      localStorage.setItem("hawkerhub_hawkers", JSON.stringify(hawkers));

      // Load orders
      const ordersResponse = await fetch("data/orders.json");
      const orders = await ordersResponse.json();
      localStorage.setItem("hawkerhub_orders", JSON.stringify(orders));

      console.log("✅ JSON data loaded successfully!");
    } catch (error) {
      console.log("Using demo data instead of JSON files");
      // Use demo data if JSON files not found
      initializeDemoData();
    }
  }

  // Update the DOMContentLoaded function
  document.addEventListener("DOMContentLoaded", function () {
    // Try to load from JSON files first
    loadJSONData()
      .then(() => {
        updateCartCount();
        requireLogin();
      })
      .catch(() => {
        // Fallback to demo data
        initializeDemoData();
        updateCartCount();
        requireLogin();
      });
  });
});
