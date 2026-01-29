// js/auth.js - LOGIN & REGISTRATION
document.addEventListener("DOMContentLoaded", function () {
  // Setup login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
    setupDemoButtons();
  }

  // Setup registration form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterSubmit);
    setupRoleToggle();
  }
});

// Handle login form submission
function handleLoginSubmit(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showAlert("Please enter email and password", "danger");
    return;
  }

  const users = JSON.parse(localStorage.getItem("hawkerhub_users")) || [];
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    // Create session user (remove password)
    const sessionUser = { ...user };
    delete sessionUser.password;
    localStorage.setItem("hawkerhub_user", JSON.stringify(sessionUser));

    showAlert("Login successful!", "success");

    // Redirect based on role
    setTimeout(() => {
      if (user.role === "vendor") {
        window.location.href = "vendor-dashboard.html";
      } else {
        window.location.href = "customer-dashboard.html";
      }
    }, 1000);
  } else {
    showAlert("Invalid email or password", "danger");
  }
}

// Handle registration form submission
function handleRegisterSubmit(event) {
  event.preventDefault();

  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const role =
    document.querySelector('input[name="role"]:checked')?.value || "customer";

  // Validation
  if (password !== confirmPassword) {
    showAlert("Passwords do not match", "danger");
    return;
  }

  if (password.length < 6) {
    showAlert("Password must be at least 6 characters", "danger");
    return;
  }

  // Check if user exists
  const users = JSON.parse(localStorage.getItem("hawkerhub_users")) || [];
  if (users.find((u) => u.email === email)) {
    showAlert("User with this email already exists", "danger");
    return;
  }

  // Create new user
  const newUser = {
    id: Date.now(),
    firstName,
    lastName,
    email,
    password,
    role,
    createdAt: new Date().toISOString(),
  };

  // Add vendor-specific fields
  if (role === "vendor") {
    const stallName = document.getElementById("stallName").value;
    const hawkerCenter = document.getElementById("hawkerCenter").value;

    if (!stallName || !hawkerCenter) {
      showAlert("Please fill in vendor details", "danger");
      return;
    }

    newUser.stallName = stallName;
    newUser.hawkerCenter = hawkerCenter;
  }

  // Save user
  users.push(newUser);
  localStorage.setItem("hawkerhub_users", JSON.stringify(users));

  // Auto login
  const sessionUser = { ...newUser };
  delete sessionUser.password;
  localStorage.setItem("hawkerhub_user", JSON.stringify(sessionUser));

  showAlert("Registration successful!", "success");

  // Redirect
  setTimeout(() => {
    if (role === "vendor") {
      window.location.href = "vendor-dashboard.html";
    } else {
      window.location.href = "customer-dashboard.html";
    }
  }, 1000);
}

// Setup role toggle for registration
function setupRoleToggle() {
  const roleRadios = document.querySelectorAll('input[name="role"]');
  const vendorFields = document.getElementById("vendorFields");

  if (!vendorFields) return;

  roleRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "vendor") {
        vendorFields.classList.remove("d-none");
      } else {
        vendorFields.classList.add("d-none");
      }
    });
  });
}

// Setup demo login buttons
function setupDemoButtons() {
  // Add demo buttons to login page
  const demoSection = document.createElement("div");
  demoSection.className = "mt-4 pt-3 border-top";
  demoSection.innerHTML = `
        <p class="text-center mb-3"><strong>Demo Accounts:</strong></p>
        <div class="d-flex justify-content-center gap-2">
            <button class="btn btn-outline-success btn-sm" onclick="demoLogin('customer')">
                <i class="bi bi-person me-1"></i>Customer Demo
            </button>
            <button class="btn btn-outline-primary btn-sm" onclick="demoLogin('vendor')">
                <i class="bi bi-shop me-1"></i>Vendor Demo
            </button>
        </div>
        <p class="text-center mt-2 text-muted small">
            Password: <code>password123</code>
        </p>
    `;

  const form = document.getElementById("loginForm");
  if (form) {
    form.parentNode.appendChild(demoSection);
  }
}

// Demo login function
function demoLogin(role) {
  const email =
    role === "customer" ? "customer@example.com" : "vendor@example.com";
  const password = "password123";

  document.getElementById("email").value = email;
  document.getElementById("password").value = password;

  // Submit the form
  document.getElementById("loginForm").dispatchEvent(new Event("submit"));
}
