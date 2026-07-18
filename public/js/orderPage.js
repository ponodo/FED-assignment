const CART_KEY = "hawkerhub_cart";

const stallListEl = document.getElementById("stall-list");
const menuTitleEl = document.getElementById("menu-title");
const menuGridEl = document.getElementById("menu-grid");
const cartCountEl = document.getElementById("cart-count");

// Reviews modal elements
const reviewsModalEl = document.getElementById("reviewsModal");
const reviewsModalTitleEl = document.getElementById("reviewsModalLabel");
const reviewsSummaryEl = document.getElementById("reviewsSummary");
const reviewsContainerEl = document.getElementById("reviewsContainer");

let currentStallId = null;
let currentStallName = "";

// ========================================
// CART FUNCTIONS
// ========================================

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

// ========================================
// HELPER FUNCTIONS
// ========================================

function escapeHtml(value) {
  const element = document.createElement("div");

  element.textContent = String(value ?? "");

  return element.innerHTML;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  try {
    return new Date(dateValue).toLocaleString();
  } catch {
    return dateValue;
  }
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

// ========================================
// BACKEND API FUNCTIONS
// ========================================

// GET all stalls
async function loadStalls() {
  return getJson("/api/stalls");
}

// GET menu items for a stall
async function loadMenuByStallId(stallId) {
  return getJson(`/api/stalls/${stallId}/menu`);
}

// GET rating summary for a stall
async function loadRatingSummary(stallId) {
  return getJson(`/api/feedback/stall/${stallId}/summary`);
}

// GET all reviews for a stall
async function loadReviews(stallId) {
  return getJson(`/api/feedback/stall/${stallId}`);
}

// ========================================
// MENU TITLE
// ========================================

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

// ========================================
// RENDER STALLS
// ========================================

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
        <div
          class="list-group-item"
          data-stall-row="${stall.stallId}"
        >
          <div
            class="d-flex justify-content-between align-items-center gap-3"
          >
            <!-- Select Stall -->
            <button
              type="button"
              class="btn text-start flex-grow-1 p-0 border-0"
              data-select-stall
              data-stall-id="${stall.stallId}"
              data-stall-name="${escapeHtml(stall.stallName)}"
            >
              <div class="fw-semibold">
                ${escapeHtml(stall.stallName)}
              </div>

              <small class="text-muted">
                ${escapeHtml(stall.location || "")}
              </small>
            </button>

            <!-- Rating and Reviews -->
            <div class="text-end">
              <span
                class="badge bg-danger rounded-pill d-block mb-2"
                id="rating-badge-${stall.stallId}"
              >
                -
              </span>

              <button
                type="button"
                class="btn btn-outline-danger btn-sm"
                data-view-reviews
                data-stall-id="${stall.stallId}"
                data-stall-name="${escapeHtml(stall.stallName)}"
              >
                <i class="bi bi-star me-1"></i>
                View Reviews
              </button>
            </div>
          </div>
        </div>
      `,
    )
    .join("");
}

// ========================================
// LOAD STALL RATINGS
// ========================================

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

// ========================================
// RENDER MENU ITEMS
// ========================================

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
      const safeName = escapeHtml(item.name || "(missing name)");

      const safeDescription = escapeHtml(item.description || "");

      const safePrice = (Number(item.price) || 0).toFixed(2);

      const imageFile = item.image || "placeholder.jpg";

      return `
        <div class="col-12 col-md-6">
          <div
            class="card h-100 shadow-sm overflow-hidden"
          >
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

              <div
                class="d-flex justify-content-between align-items-center"
              >
                <span
                  class="text-danger fw-bold"
                >
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

// ========================================
// SELECT STALL AND LOAD MENU
// ========================================

async function selectStall(button) {
  document
    .querySelectorAll("#stall-list [data-stall-row]")
    .forEach((element) => {
      element.classList.remove("active");
    });

  const stallRow = button.closest("[data-stall-row]");

  if (stallRow) {
    stallRow.classList.add("active");
  }

  currentStallId = Number(button.dataset.stallId);

  currentStallName = button.dataset.stallName;

  setMenuTitle(currentStallName);

  menuGridEl.innerHTML = `
    <div class="col-12">
      <div
        class="text-center text-secondary py-5"
      >
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
        <div
          class="alert alert-danger mb-0"
        >
          ${escapeHtml(error.message)}
        </div>
      </div>
    `;
  }
}

// ========================================
// VIEW REVIEWS
// ========================================

async function showReviews(stallId, stallName) {
  if (
    !reviewsModalEl ||
    !reviewsModalTitleEl ||
    !reviewsSummaryEl ||
    !reviewsContainerEl
  ) {
    console.error("Reviews modal elements could not be found.");

    return;
  }

  reviewsModalTitleEl.textContent = `${stallName} Reviews`;

  reviewsSummaryEl.textContent = "";

  reviewsContainerEl.innerHTML = `
    <div
      class="text-center py-5 text-secondary"
    >
      <div
        class="spinner-border text-danger"
        role="status"
      >
        <span class="visually-hidden">
          Loading reviews
        </span>
      </div>

      <p class="mt-3 mb-0">
        Loading reviews...
      </p>
    </div>
  `;

  // Open Bootstrap modal
  const reviewsModal = bootstrap.Modal.getOrCreateInstance(reviewsModalEl);

  reviewsModal.show();

  try {
    // Load reviews and rating summary
    // from the backend at the same time
    const [reviews, summary] = await Promise.all([
      loadReviews(stallId),
      loadRatingSummary(stallId),
    ]);

    const average = Number(summary.averageRating) || 0;

    const total = Number(summary.totalReviews) || 0;

    // Display average rating
    reviewsSummaryEl.textContent =
      total > 0
        ? `★ ${average.toFixed(1)} based on ${total} review${
            total === 1 ? "" : "s"
          }`
        : "No ratings yet";

    // No reviews
    if (!Array.isArray(reviews) || reviews.length === 0) {
      reviewsContainerEl.innerHTML = `
        <div
          class="text-center text-secondary py-5"
        >
          <i
            class="bi bi-chat-square-text fs-1"
          ></i>

          <p class="mt-3 mb-0">
            No reviews have been submitted yet.
          </p>
        </div>
      `;

      return;
    }

    // Display reviews
    reviewsContainerEl.innerHTML = reviews
      .map((review) => {
        const rating = Number(review.rating) || 0;

        const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

        const reviewDate = review.updatedAt || review.createdAt;

        return `
            <div
              class="card mb-3 shadow-sm"
            >
              <div class="card-body">
                <div
                  class="d-flex justify-content-between align-items-start gap-3"
                >
                  <div>
                    <!-- Customer Name -->
                    <div class="fw-bold">
                      ${escapeHtml(review.customerName || "Customer")}
                    </div>

                    <!-- Star Rating -->
                    <div
                      class="text-warning fs-5"
                      aria-label="${rating} out of 5 stars"
                    >
                      ${stars}
                    </div>
                  </div>

                  <!-- Review Date -->
                  <small class="text-muted">
                    ${escapeHtml(formatDate(reviewDate))}
                  </small>
                </div>

                <!-- Review Comment -->
                <p class="mt-3 mb-0">
                  ${escapeHtml(review.comments || "No written comment.")}
                </p>
              </div>
            </div>
          `;
      })
      .join("");
  } catch (error) {
    console.error("Reviews loading error:", error);

    reviewsContainerEl.innerHTML = `
      <div
        class="alert alert-danger mb-0"
      >
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

// ========================================
// ADD ITEM TO CART
// ========================================

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

// ========================================
// INITIALISE PAGE
// ========================================

async function initialisePage() {
  updateCartBadge();

  setMenuTitle("Select a hawker");

  menuGridEl.innerHTML = "";

  try {
    // Load stalls from backend
    const stalls = await loadStalls();

    // Display stalls
    renderStalls(stalls);

    // Load ratings from backend
    await loadStallRatings(stalls);
  } catch (error) {
    console.error("Stall loading error:", error);

    stallListEl.innerHTML = `
      <div
        class="alert alert-danger m-3"
      >
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

// ========================================
// STALL LIST CLICK EVENT
// ========================================

stallListEl.addEventListener("click", async (event) => {
  // Check if View Reviews was clicked
  const reviewButton = event.target.closest("button[data-view-reviews]");

  if (reviewButton) {
    const stallId = Number(reviewButton.dataset.stallId);

    const stallName = reviewButton.dataset.stallName;

    await showReviews(stallId, stallName);

    return;
  }

  // Check if stall was selected
  const stallButton = event.target.closest("button[data-select-stall]");

  if (!stallButton) {
    return;
  }

  await selectStall(stallButton);
});

// ========================================
// MENU CLICK EVENT
// ========================================

menuGridEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-add-to-cart]");

  if (!button) {
    return;
  }

  addToCart(button);
});

// ========================================
// START PAGE
// ========================================

document.addEventListener("DOMContentLoaded", initialisePage);
