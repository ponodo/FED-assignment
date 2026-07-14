const CART_KEY = "hawkerhub_cart";

const stallListEl = document.getElementById("stall-list");
const menuTitleEl = document.getElementById("menu-title");
const menuGridEl = document.getElementById("menu-grid");
const cartCountEl = document.getElementById("cart-count");

let currentStallId = null;
let currentStallName = "";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (error) {
    console.error("Cart load error:", error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartBadge() {
  const cart = getCart();

  const totalQuantity = cart.reduce(
    (sum, item) => sum + (Number(item.qty) || 0),
    0,
  );

  if (cartCountEl) {
    cartCountEl.textContent = totalQuantity;
  }
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

async function getJson(url) {
  const response = await fetch(url);

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(result?.details || result?.error || "Unable to load data");
  }

  return result;
}

async function loadStalls() {
  return getJson("/api/stalls");
}

async function loadMenuByStallId(stallId) {
  return getJson(`/api/stalls/${stallId}/menu`);
}
async function loadRatingSummary(stallId) {
  return getJson(`/api/feedback/stall/${stallId}/summary`);
}
function setMenuTitle(text) {
  if (!menuTitleEl) {
    return;
  }

  menuTitleEl.innerHTML = `
    Menu from
    <span class="text-danger fw-bold">
      ${escapeHtml(text)}
    </span>
  `;
}

function renderStalls(stalls) {
  if (!stallListEl) {
    return;
  }

  if (!Array.isArray(stalls) || stalls.length === 0) {
    stallListEl.innerHTML = `
      <div class="text-center text-secondary py-4">
        No hawker stalls found.
      </div>
    `;

    return;
  }

  stallListEl.innerHTML = stalls
    .map(
      (stall) => `
        <button
          type="button"
          class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          data-stall-id="${stall.stallId}"
          data-stall-name="${escapeHtml(stall.stallName)}"
        >
          <div>
            <div class="fw-semibold">
              ${escapeHtml(stall.stallName)}
            </div>

            <small class="text-muted">
              ${escapeHtml(stall.location || "")}
            </small>
          </div>

          <span
            class="badge bg-danger rounded-pill"
            id="rating-badge-${stall.stallId}"
          >
            -
          </span>
        </button>
      `,
    )
    .join("");
}
async function loadStallRatings(stalls) {
  await Promise.all(
    stalls.map(async (stall) => {
      const badge = document.getElementById(`rating-badge-${stall.stallId}`);

      if (!badge) {
        return;
      }

      try {
        const summary = await loadRatingSummary(stall.stallId);

        const average = Number(summary.averageRating) || 0;

        const total = Number(summary.totalReviews) || 0;

        badge.textContent =
          total > 0 ? `★ ${average.toFixed(1)} (${total})` : "No reviews";
      } catch (error) {
        console.error(
          `Rating loading error for stall ${stall.stallId}:`,
          error,
        );

        badge.textContent = "N/A";
      }
    }),
  );
}
function renderMenu(items) {
  if (!menuGridEl) {
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    menuGridEl.innerHTML = `
      <div class="col-12">
        <div class="text-muted">
          No items found for this hawker.
        </div>
      </div>
    `;

    return;
  }

  menuGridEl.innerHTML = items
    .map((item) => {
      const safeName = escapeHtml(item.itemName || "(missing name)");

      const safeDescription = escapeHtml(item.description || "");

      const safePrice = (Number(item.price) || 0).toFixed(2);

      const imageFile = item.image || "placeholder.jpg";

      return `
        <div class="col-12 col-md-6">
          <div class="card h-100 shadow-sm overflow-hidden">
            <img
              src="Images/${escapeHtml(imageFile)}"
              alt="${safeName}"
              class="w-100"
              style="height: 160px; object-fit: cover;"
              onerror="this.onerror=null; this.src='Images/placeholder.jpg';"
            />

            <div class="card-body">
              <h5 class="fw-bold mb-2">
                ${safeName}
              </h5>

              <p class="text-muted mb-3">
                ${safeDescription}
              </p>

              <div class="d-flex justify-content-between align-items-center">
                <span class="text-danger fw-bold">
                  $${safePrice}
                </span>

                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  data-add-to-cart
                  data-menu-item-id="${item.menuItemId}"
                  data-item-name="${safeName}"
                  data-price="${item.price}"
                  data-stall-id="${item.stallId}"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

async function selectStall(button) {
  document.querySelectorAll("#stall-list .active").forEach((element) => {
    element.classList.remove("active");
  });

  button.classList.add("active");

  currentStallId = Number(button.dataset.stallId);

  currentStallName = button.dataset.stallName;

  setMenuTitle(currentStallName);

  menuGridEl.innerHTML = `
    <div class="col-12">
      <div class="text-center text-secondary py-5">
        <div
          class="spinner-border text-danger"
          role="status"
        >
          <span class="visually-hidden">
            Loading menu
          </span>
        </div>

        <p class="mt-3 mb-0">
          Loading menu...
        </p>
      </div>
    </div>
  `;

  try {
    const items = await loadMenuByStallId(currentStallId);

    renderMenu(items);
  } catch (error) {
    console.error("Menu loading error:", error);

    menuGridEl.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger mb-0">
          ${escapeHtml(error.message)}
        </div>
      </div>
    `;
  }
}

function addToCart(button) {
  if (!currentStallId || !currentStallName) {
    alert("Please select a hawker first.");
    return;
  }

  const cart = getCart();

  const menuItemId = button.dataset.menuItemId;

  const unitPrice = Number(button.dataset.price) || 0;

  const existingItem = cart.find(
    (item) => String(item.id) === String(menuItemId),
  );

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      id: menuItemId,
      menuItemId: Number(menuItemId),
      stallId: currentStallId,
      stallName: currentStallName,
      name: button.dataset.itemName,
      unitPrice,
      qty: 1,
    });
  }

  saveCart(cart);
  updateCartBadge();

  button.textContent = "Added";

  setTimeout(() => {
    button.textContent = "Add to Cart";
  }, 700);
}

async function initialisePage() {
  updateCartBadge();
  setMenuTitle("Select a hawker");

  menuGridEl.innerHTML = "";

  try {
    const stalls = await loadStalls();

    renderStalls(stalls);

    await loadStallRatings(stalls);
  } catch (error) {
    console.error("Stall loading error:", error);

    stallListEl.innerHTML = `
      <div class="alert alert-danger m-3">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

stallListEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-stall-id]");

  if (!button) {
    return;
  }

  await selectStall(button);
});

menuGridEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-add-to-cart]");

  if (!button) {
    return;
  }

  addToCart(button);
});

document.addEventListener("DOMContentLoaded", initialisePage);
