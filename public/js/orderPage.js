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

let activeReviewStallId = null;
let activeReviewStallName = "";
let displayedReviews = [];

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

function getLoggedInCustomerId() {
  const directCustomerId = Number(localStorage.getItem("customerId"));

  if (directCustomerId) {
    return directCustomerId;
  }

  const possibleUserKeys = [
    "user",
    "currentUser",
    "loggedInUser",
    "authUser",
    "hawkerhub_user",
    "hawkerHubUser",
  ];

  for (const key of possibleUserKeys) {
    try {
      const storedValue = localStorage.getItem(key);

      if (!storedValue) {
        continue;
      }

      const user = JSON.parse(storedValue);

      const customerId = Number(
        user?.customerId ||
          user?.user?.customerId ||
          user?.customer?.customerId ||
          user?.data?.customerId,
      );

      if (customerId) {
        return customerId;
      }
    } catch (error) {
      console.error(`Unable to read ${key}:`, error);
    }
  }

  // Search other localStorage objects for a customerId
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    try {
      const storedValue = localStorage.getItem(key);

      if (!storedValue) {
        continue;
      }

      const parsedValue = JSON.parse(storedValue);

      const customerId = Number(
        parsedValue?.customerId ||
          parsedValue?.user?.customerId ||
          parsedValue?.customer?.customerId,
      );

      if (customerId) {
        return customerId;
      }
    } catch {
      // Ignore localStorage values that are not JSON
    }
  }

  return null;
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

// PUT update an existing review
async function updateReview(feedbackId, reviewData) {
  const response = await fetch(`/api/feedback/${feedbackId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reviewData),
  });

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.details || result?.error || "Unable to update the review",
    );
  }

  return result;
}

// DELETE an existing review
async function deleteReview(feedbackId) {
  const response = await fetch(`/api/feedback/${feedbackId}`, {
    method: "DELETE",
  });

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.details || result?.error || "Unable to delete the review",
    );
  }

  return result;
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

async function updateStallRatingBadge(stallId) {
  const badge = document.getElementById(`rating-badge-${stallId}`);

  if (!badge) {
    return;
  }

  try {
    const summary = await loadRatingSummary(stallId);

    const average = Number(summary.averageRating) || 0;
    const total = Number(summary.totalReviews) || 0;

    badge.textContent =
      total > 0 ? `★ ${average.toFixed(1)} (${total})` : "No reviews";
  } catch (error) {
    console.error(`Rating loading error for stall ${stallId}:`, error);

    badge.textContent = "N/A";
  }
}

async function loadStallRatings(stalls) {
  await Promise.all(
    stalls.map((stall) => updateStallRatingBadge(stall.stallId)),
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
      <div class="text-center text-secondary py-5">
        <div class="spinner-border text-danger" role="status">
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

// ========================================
// RENDER REVIEWS
// ========================================

function renderReviews(reviews) {
  const loggedInCustomerId = getLoggedInCustomerId();

  if (!Array.isArray(reviews) || reviews.length === 0) {
    reviewsContainerEl.innerHTML = `
      <div class="text-center text-secondary py-5">
        <i class="bi bi-chat-square-text fs-1"></i>

        <p class="mt-3 mb-0">
          No reviews have been submitted yet.
        </p>
      </div>
    `;

    return;
  }

  reviewsContainerEl.innerHTML = reviews
    .map((review) => {
      const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      const reviewDate = review.updatedAt || review.createdAt;

      const isOwnReview =
        loggedInCustomerId &&
        Number(review.customerId) === Number(loggedInCustomerId);

      return `
        <div
          class="card mb-3 shadow-sm"
          data-review-card="${review.feedbackId}"
        >
          <div class="card-body">
            <div
              class="d-flex justify-content-between align-items-start gap-3"
            >
              <div>
                <div class="fw-bold">
                  ${escapeHtml(review.customerName || "Customer")}
                </div>

                <div
                  class="text-warning fs-5"
                  aria-label="${rating} out of 5 stars"
                >
                  ${stars}
                </div>
              </div>

              <small class="text-muted">
                ${escapeHtml(formatDate(reviewDate))}
              </small>
            </div>

            <p class="mt-3 mb-0">
              ${escapeHtml(review.comments || "No written comment.")}
            </p>

            ${
              isOwnReview
                ? `
                  <div class="d-flex gap-2 mt-3">
                    <button
                      type="button"
                      class="btn btn-outline-primary btn-sm"
                      data-edit-review
                      data-feedback-id="${review.feedbackId}"
                    >
                      <i class="bi bi-pencil me-1"></i>
                      Edit
                    </button>

                    <button
                      type="button"
                      class="btn btn-outline-danger btn-sm"
                      data-delete-review
                      data-feedback-id="${review.feedbackId}"
                    >
                      <i class="bi bi-trash me-1"></i>
                      Delete
                    </button>
                  </div>
                `
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
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

  activeReviewStallId = Number(stallId);
  activeReviewStallName = stallName;

  reviewsModalTitleEl.textContent = `${stallName} Reviews`;
  reviewsSummaryEl.textContent = "";

  reviewsContainerEl.innerHTML = `
    <div class="text-center py-5 text-secondary">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">
          Loading reviews
        </span>
      </div>

      <p class="mt-3 mb-0">
        Loading reviews...
      </p>
    </div>
  `;

  const reviewsModal = bootstrap.Modal.getOrCreateInstance(reviewsModalEl);

  reviewsModal.show();

  try {
    const [reviews, summary] = await Promise.all([
      loadReviews(stallId),
      loadRatingSummary(stallId),
    ]);

    displayedReviews = Array.isArray(reviews) ? reviews : [];

    const average = Number(summary.averageRating) || 0;
    const total = Number(summary.totalReviews) || 0;

    reviewsSummaryEl.textContent =
      total > 0
        ? `★ ${average.toFixed(1)} based on ${total} review${
            total === 1 ? "" : "s"
          }`
        : "No ratings yet";

    renderReviews(displayedReviews);
  } catch (error) {
    console.error("Reviews loading error:", error);

    reviewsContainerEl.innerHTML = `
      <div class="alert alert-danger mb-0">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

// ========================================
// EDIT REVIEW
// ========================================

async function handleEditReview(feedbackId) {
  const review = displayedReviews.find(
    (item) => Number(item.feedbackId) === Number(feedbackId),
  );

  if (!review) {
    alert("Review could not be found.");
    return;
  }

  const ratingInput = prompt("Enter a new rating from 1 to 5:", review.rating);

  if (ratingInput === null) {
    return;
  }

  const rating = Number(ratingInput);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    alert("Rating must be a whole number from 1 to 5.");
    return;
  }

  const commentsInput = prompt(
    "Edit your review comment:",
    review.comments || "",
  );

  if (commentsInput === null) {
    return;
  }

  try {
    await updateReview(feedbackId, {
      rating,
      comments: commentsInput.trim(),
    });

    alert("Review updated successfully.");

    await showReviews(activeReviewStallId, activeReviewStallName);
    await updateStallRatingBadge(activeReviewStallId);
  } catch (error) {
    console.error("Review update error:", error);
    alert(error.message);
  }
}

// ========================================
// DELETE REVIEW
// ========================================

async function handleDeleteReview(feedbackId) {
  const confirmed = confirm("Are you sure you want to delete this review?");

  if (!confirmed) {
    return;
  }

  try {
    await deleteReview(feedbackId);

    alert("Review deleted successfully.");

    await showReviews(activeReviewStallId, activeReviewStallName);
    await updateStallRatingBadge(activeReviewStallId);
  } catch (error) {
    console.error("Review delete error:", error);
    alert(error.message);
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

// ========================================
// STALL LIST CLICK EVENT
// ========================================

stallListEl.addEventListener("click", async (event) => {
  const reviewButton = event.target.closest("button[data-view-reviews]");

  if (reviewButton) {
    const stallId = Number(reviewButton.dataset.stallId);
    const stallName = reviewButton.dataset.stallName;

    await showReviews(stallId, stallName);

    return;
  }

  const stallButton = event.target.closest("button[data-select-stall]");

  if (!stallButton) {
    return;
  }

  await selectStall(stallButton);
});

// ========================================
// REVIEWS CLICK EVENT
// ========================================

if (reviewsContainerEl) {
  reviewsContainerEl.addEventListener("click", async (event) => {
    const editButton = event.target.closest("button[data-edit-review]");

    if (editButton) {
      const feedbackId = Number(editButton.dataset.feedbackId);

      await handleEditReview(feedbackId);
      return;
    }

    const deleteButton = event.target.closest("button[data-delete-review]");

    if (deleteButton) {
      const feedbackId = Number(deleteButton.dataset.feedbackId);

      await handleDeleteReview(feedbackId);
    }
  });
}

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
