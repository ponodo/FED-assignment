// js/dashboard.js - DASHBOARD FUNCTIONS
document.addEventListener("DOMContentLoaded", function () {
  if (
    window.location.pathname.includes("dashboard") ||
    window.location.pathname.includes("profile.html")
  ) {
    loadDashboardData();
    setupProfileForm();
  }
});

// Load dashboard data
function loadDashboardData() {
  const user = JSON.parse(localStorage.getItem("hawkerhub_user"));
  if (!user) return;

  // Update user info
  updateUserInfo(user);

  // Load different data based on role
  if (user.role === "vendor") {
    loadVendorDashboard();
  } else {
    loadCustomerDashboard();
  }
}

// Update user information
function updateUserInfo(user) {
  // Profile page
  if (document.getElementById("profileName")) {
    document.getElementById("profileName").textContent =
      `${user.firstName} ${user.lastName}`;
  }
  if (document.getElementById("profileEmail")) {
    document.getElementById("profileEmail").textContent = user.email;
  }
  if (document.getElementById("profileRole")) {
    document.getElementById("profileRole").textContent =
      user.role === "vendor" ? "Hawker Vendor" : "Customer";
  }

  // Form fields
  if (document.getElementById("firstName")) {
    document.getElementById("firstName").value = user.firstName || "";
    document.getElementById("lastName").value = user.lastName || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phone").value = user.phone || "";
    document.getElementById("address").value = user.address || "";
  }
}

// Setup profile form
function setupProfileForm() {
  const form = document.getElementById("profileForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("hawkerhub_user"));
    if (!user) return;

    // Update user data
    user.firstName = document.getElementById("firstName").value;
    user.lastName = document.getElementById("lastName").value;
    user.email = document.getElementById("email").value;
    user.phone = document.getElementById("phone").value;
    user.address = document.getElementById("address").value;

    // Update in localStorage
    localStorage.setItem("hawkerhub_user", JSON.stringify(user));

    // Update in users list
    const users = JSON.parse(localStorage.getItem("hawkerhub_users")) || [];
    const index = users.findIndex((u) => u.id === user.id);
    if (index > -1) {
      users[index] = { ...users[index], ...user };
      localStorage.setItem("hawkerhub_users", JSON.stringify(users));
    }

    showAlert("Profile updated successfully!", "success");
    updateUserInfo(user);
  });
}

// Load customer dashboard data
function loadCustomerDashboard() {
  const orders = JSON.parse(localStorage.getItem("hawkerhub_orders")) || [];
  const user = JSON.parse(localStorage.getItem("hawkerhub_user"));

  if (!user) return;

  const userOrders = orders.filter((order) => order.userId === user.id);

  // Update stats
  const totalOrders = userOrders.length;
  const pendingOrders = userOrders.filter((o) => o.status === "pending").length;
  const completedOrders = userOrders.filter(
    (o) => o.status === "completed",
  ).length;

  if (document.getElementById("totalOrders")) {
    document.getElementById("totalOrders").textContent = totalOrders;
  }
  if (document.getElementById("pendingOrders")) {
    document.getElementById("pendingOrders").textContent = pendingOrders;
  }
  if (document.getElementById("points")) {
    document.getElementById("points").textContent = completedOrders * 10; // 10 points per completed order
  }

  // Load recent orders for table
  loadRecentOrders(userOrders.slice(0, 5));
}

// Load vendor dashboard data
function loadVendorDashboard() {
  const orders = JSON.parse(localStorage.getItem("hawkerhub_orders")) || [];
  const user = JSON.parse(localStorage.getItem("hawkerhub_user"));

  if (!user) return;

  const vendorOrders = orders.filter((order) => order.vendorId === user.id);
  const today = new Date().toDateString();
  const todayOrders = vendorOrders.filter(
    (order) => new Date(order.date).toDateString() === today,
  );

  // Update stats
  if (document.getElementById("todayOrders")) {
    document.getElementById("todayOrders").textContent = todayOrders.length;
  }
  if (document.getElementById("todayRevenue")) {
    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );
    document.getElementById("todayRevenue").textContent =
      `$${todayRevenue.toFixed(2)}`;
  }
  if (document.getElementById("pendingOrders")) {
    document.getElementById("pendingOrders").textContent = vendorOrders.filter(
      (o) => o.status === "pending",
    ).length;
  }
  if (document.getElementById("avgRating")) {
    document.getElementById("avgRating").textContent = "4.8"; // Mock rating
  }

  // Load vendor orders table
  loadVendorOrders(vendorOrders.slice(0, 5));
}

// Load recent orders for customer dashboard table
function loadRecentOrders(orders) {
  const tableBody = document.getElementById("recentOrders");
  if (!tableBody || !orders.length) return;

  let tableHTML = "";

  orders.forEach((order) => {
    const totalItems = order.items.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0,
    );

    // Status badge
    let badgeClass = "bg-secondary";
    if (order.status === "pending") badgeClass = "bg-warning";
    else if (order.status === "preparing") badgeClass = "bg-info";
    else if (order.status === "ready") badgeClass = "bg-primary";
    else if (order.status === "completed") badgeClass = "bg-success";

    tableHTML += `
            <tr>
                <td>${order.id}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>${totalItems} items</td>
                <td>$${order.total.toFixed(2)}</td>
                <td><span class="badge ${badgeClass}">${order.status}</span></td>
            </tr>
        `;
  });

  tableBody.innerHTML = tableHTML;
}

// Load vendor orders table
function loadVendorOrders(orders) {
  const tableBody = document.getElementById("vendorOrders");
  if (!tableBody || !orders.length) return;

  let tableHTML = "";

  orders.forEach((order) => {
    const totalItems = order.items.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0,
    );

    // Status badge
    let badgeClass = "bg-secondary";
    if (order.status === "pending") badgeClass = "bg-warning";
    else if (order.status === "preparing") badgeClass = "bg-info";
    else if (order.status === "ready") badgeClass = "bg-primary";

    tableHTML += `
            <tr>
                <td>${order.id}</td>
                <td>${new Date(order.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td>${order.customerName}</td>
                <td>${totalItems}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td><span class="badge ${badgeClass}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="updateOrderStatus('${order.id}', 'preparing')">
                        Start
                    </button>
                    <button class="btn btn-sm btn-danger ms-1" onclick="updateOrderStatus('${order.id}', 'ready')">
                        Ready
                    </button>
                </td>
            </tr>
        `;
  });

  tableBody.innerHTML = tableHTML;
}
