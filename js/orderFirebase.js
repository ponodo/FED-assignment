import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDSjzqzTAXTqQ2lXbjtUItAlgrhxgDwkwI",
  authDomain: "hawkerhub-ee884.firebaseapp.com",
  projectId: "hawkerhub-ee884",
  storageBucket: "hawkerhub-ee884.firebasestorage.app",
  messagingSenderId: "643618495518",
  appId: "1:643618495518:web:56fd4c3b6a93474f1c220f",
  measurementId: "G-G0N80X4HWT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Must match Firestore collection names exactly
const HAWKER_COLLECTION = "Hawker";
const MENU_COLLECTION = "Menu";

// -------------------- CART --------------------
const CART_KEY = "hawkerhub_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartBadge() {
  const cart = getCart();
  const qty = cart.reduce((sum, x) => sum + (x.qty || 0), 0);
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = qty;
}

// -------------------- LOAD DATA --------------------
async function loadHawkers() {
  const snap = await getDocs(collection(db, HAWKER_COLLECTION));
  const hawkers = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
  hawkers.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return hawkers;
}

async function loadMenuByStallId(stallId) {
  const q = query(
    collection(db, MENU_COLLECTION),
    where("stallId", "==", Number(stallId))
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
}

// -------------------- RENDER --------------------
function setMenuTitle(text) {
  const title = document.getElementById("menu-title");
  title.innerHTML = `Menu from <span class="text-danger fw-bold">${text}</span>`;
}

function renderStallList(hawkers) {
  const list = document.getElementById("stall-list");

  list.innerHTML = hawkers
    .map(
      (h) => `
      <button type="button"
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
        data-stallid="${h.stallId}"
        data-name="${h.name}">
        <div>
          <div class="fw-semibold">${h.name}</div>
          <small class="text-muted">${h.hawkerCentre || ""}</small>
        </div>
        <span class="badge bg-danger rounded-pill">${h.rating ?? ""}</span>
      </button>
    `
    )
    .join("");
}

function renderMenu(items) {
  const grid = document.getElementById("menu-grid");

  if (!items.length) {
    grid.innerHTML = `<div class="text-muted">No items found for this hawker.</div>`;
    return;
  }

  grid.innerHTML = items
    .map((item) => {
      const safeName = item.name ?? "(missing name)";
      const safePrice = (Number(item.price) || 0).toFixed(2);

      return `
        <div class="col-12 col-md-6">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="fw-bold mb-2">${safeName}</h5>
              <p class="text-muted mb-3">${item.description || ""}</p>

              <div class="d-flex justify-content-between align-items-center">
                <span class="text-danger fw-bold">$${safePrice}</span>

                <button class="btn btn-outline-danger btn-sm"
                  data-add
                  data-id="${item.docId}"
                  data-name="${safeName}"
                  data-price="${item.price}"
                  data-stallid="${item.stallId}">
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

// -------------------- MAIN --------------------
document.addEventListener("DOMContentLoaded", async () => {
  updateCartBadge();
  setMenuTitle("Select a hawker");
  document.getElementById("menu-grid").innerHTML = "";

  const hawkers = await loadHawkers();
  renderStallList(hawkers);

  // Click hawker -> load menu
  document.getElementById("stall-list").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-stallid]");
    if (!btn) return;

    // active highlight
    document
      .querySelectorAll("#stall-list .active")
      .forEach((x) => x.classList.remove("active"));
    btn.classList.add("active");

    const stallId = btn.dataset.stallid;
    const name = btn.dataset.name;

    setMenuTitle(name);
    document.getElementById("menu-grid").innerHTML =
      `<div class="text-muted">Loading menu...</div>`;

    const items = await loadMenuByStallId(stallId);

    // Debug: see what Firebase returns
    console.table(
      items.map((i) => ({
        docId: i.docId,
        name: i.name,
        price: i.price,
        priceType: typeof i.price,
        stallId: i.stallId
      }))
    );

    renderMenu(items);
  });

  // Add-to-cart
  document.getElementById("menu-grid").addEventListener("click", (e) => {
    const addBtn = e.target.closest("button[data-add]");
    if (!addBtn) return;

    const cart = getCart();
    const id = addBtn.dataset.id;

    const existing = cart.find((x) => x.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id,
        stallId: Number(addBtn.dataset.stallid),
        name: addBtn.dataset.name,
        price: Number(addBtn.dataset.price) || 0,
        qty: 1
      });
    }

    saveCart(cart);
    updateCartBadge();
  });
});
