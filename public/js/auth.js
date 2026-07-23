// js/auth.js - LOGIN & REGISTRATION USING BACKEND API

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
    setupDemoButtons();
  }

  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterSubmit);
    setupRoleToggle();
  }
});

// ========================================
// HELPERS
// ========================================

async function readJsonResponse(response) {
  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(result?.details || result?.error || "Something went wrong");
  }

  return result;
}

function saveLoginSession(result) {
  localStorage.setItem("hawkerhub_user", JSON.stringify(result.user));

  localStorage.setItem("hawkerhub_token", result.token);
}

function redirectUser(user) {
  setTimeout(() => {
    if (user.role === "vendor") {
      window.location.href = "vendor-dashboard.html";
      return;
    }

    window.location.href = "customer-dashboard.html";
  }, 800);
}

// ========================================
// LOGIN
// ========================================

async function handleLoginSubmit(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();

  const password = document.getElementById("password").value;

  if (!email || !password) {
    showAlert("Please enter email and password", "danger");
    return;
  }

  const submitButton = event.submitter;

  const originalButtonHtml = submitButton?.innerHTML || "";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <span
        class="spinner-border spinner-border-sm me-2"
      ></span>
      Logging in...
    `;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const result = await readJsonResponse(response);

    saveLoginSession(result);

    showAlert("Login successful!", "success");

    redirectUser(result.user);
  } catch (error) {
    console.error("Login error:", error);

    showAlert(error.message, "danger");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonHtml;
    }
  }
}

// ========================================
// REGISTRATION
// ========================================

async function handleRegisterSubmit(event) {
  event.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();

  const lastName = document.getElementById("lastName").value.trim();

  const email = document.getElementById("email").value.trim().toLowerCase();

  const phone = document.getElementById("phone")?.value.trim() || "";

  const password = document.getElementById("password").value;

  const confirmPassword = document.getElementById("confirmPassword").value;

  const role =
    document.querySelector('input[name="role"]:checked')?.value || "customer";

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    showAlert("Please complete all required fields", "danger");
    return;
  }

  if (password !== confirmPassword) {
    showAlert("Passwords do not match", "danger");
    return;
  }

  if (password.length < 6) {
    showAlert("Password must be at least 6 characters", "danger");
    return;
  }

  const requestBody = {
    firstName,
    lastName,
    email,
    phone,
    password,
    role,
  };

  if (role === "vendor") {
    const stallName = document.getElementById("stallName").value.trim();

    const hawkerCenter = document.getElementById("hawkerCenter").value.trim();

    const cuisine = document.getElementById("cuisine")?.value.trim() || null;

    if (!stallName || !hawkerCenter) {
      showAlert("Please fill in vendor details", "danger");
      return;
    }

    requestBody.stallName = stallName;
    requestBody.hawkerCenter = hawkerCenter;
    requestBody.cuisine = cuisine;
  }

  const submitButton = event.submitter;

  const originalButtonHtml = submitButton?.innerHTML || "";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <span
        class="spinner-border spinner-border-sm me-2"
      ></span>
      Creating account...
    `;
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await readJsonResponse(response);

    saveLoginSession(result);

    showAlert("Registration successful!", "success");

    redirectUser(result.user);
  } catch (error) {
    console.error("Registration error:", error);

    showAlert(error.message, "danger");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonHtml;
    }
  }
}

// ========================================
// ROLE TOGGLE
// ========================================

function setupRoleToggle() {
  const roleRadios = document.querySelectorAll('input[name="role"]');

  const vendorFields = document.getElementById("vendorFields");

  if (!vendorFields) {
    return;
  }

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

// ========================================
// DEMO LOGIN BUTTONS
// ========================================

function setupDemoButtons() {
  const form = document.getElementById("loginForm");

  if (!form || document.getElementById("demo-login-section")) {
    return;
  }

  const demoSection = document.createElement("div");

  demoSection.id = "demo-login-section";
  demoSection.className = "mt-4 pt-3 border-top";

  demoSection.innerHTML = `
    <p class="text-center mb-3">
      <strong>Demo Accounts:</strong>
    </p>

    <div class="d-flex justify-content-center gap-2">
      <button
        type="button"
        class="btn btn-outline-success btn-sm"
        data-demo-login="customer"
      >
        <i class="bi bi-person me-1"></i>
        Customer Demo
      </button>

      <button
        type="button"
        class="btn btn-outline-primary btn-sm"
        data-demo-login="vendor"
      >
        <i class="bi bi-shop me-1"></i>
        Vendor Demo
      </button>
    </div>

    <p class="text-center mt-2 text-muted small">
      Password:
      <code>password123</code>
    </p>
  `;

  form.parentNode.appendChild(demoSection);

  demoSection.addEventListener("click", (event) => {
    const button = event.target.closest("[data-demo-login]");

    if (!button) {
      return;
    }

    demoLogin(button.dataset.demoLogin);
  });
}

function demoLogin(role) {
  const email = role === "customer" ? "elix@gmail.com" : "keith@gmail.com";

  document.getElementById("email").value = email;
  document.getElementById("password").value = "password123";

  document.getElementById("loginForm").requestSubmit();
}
