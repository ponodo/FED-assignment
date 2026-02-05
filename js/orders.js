import { getJSON } from "./api.js";

const CART_KEY = "hawkerhub_cart";

// Elements (must exist in your HTML)
const stallListEl = document.getElementById("stall-list");
const menuTitleEl = document.getElementById("menu-title");
const menuGridEl = document.getElementById("menu-grid");
const cartCountEl = document.getElementById("cart-count");

function loadCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
  const cart = loadCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = totalQty;
}

function addToCart(item, stall) {
  const cart = loadCart();

  // Optional rule: only allow ONE stall in cart
  if (cart.length > 0 && cart[0].stallId !== stall.stallId) {
    const ok = confirm("Your cart has items from another stall. Clear cart and add this item?");
    if (!ok) return;
    cart.length = 0;
  }

  const existing = cart.find(x => x.menuItemId === item.menuItemId);
  if (existing) existing.qty += 1;
  else {
    cart.push({
      menuItemId: item.menuItemId,
      name: item.name,
      unitPrice: item.price,
      qty: 1,
      stallId: stall.stallId,
      stallName: stall.stallName
    });
  }

  saveCart(cart);
  updateCartCount();
}

function renderStalls(stalls, selectedStallId) {
  stallListEl.innerHTML = "";

  stalls.forEach(stall => {
    const a = document.createElement("a");
    a.href = "#";
    a.className = "list-group-item list-group-item-action" + (stall.stallId === selectedStallId ? " active" : "");
    a.innerHTML = `
      <div class="fw-bold">${stall.stallName}</div>
      <small class="${stall.stallId === selectedStallId ? "opacity-75" : "text-muted"}">${stall.hawkerCentre}</small>
    `;

    a.addEventListener("click", (e) => {
      e.preventDefault();
      renderStalls(stalls, stall.stallId);
      renderMenu(stall);
    });

    stallListEl.appendChild(a);
  });
}

function renderMenu(stall) {
  menuTitleEl.innerHTML = `Menu from <span class="text-danger fw-bold">${stall.stallName}</span>`;
  menuGridEl.innerHTML = "";

  stall.menu.forEach(item => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6";

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title fw-bold">${item.name}</h5>
          <p class="card-text text-muted">${item.desc}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <span class="text-danger fw-bold">$${item.price.toFixed(2)}</span>
            <button class="btn btn-outline-danger btn-sm" type="button">Add to Cart</button>
          </div>
        </div>
      </div>
    `;

    col.querySelector("button").addEventListener("click", () => addToCart(item, stall));
    menuGridEl.appendChild(col);
  });
}

async function init() {
  updateCartCount();

  const data = await getJSON("data/menu.json");
  const stalls = data.stalls;

  // default stall = first
  const defaultStall = stalls[0];
  renderStalls(stalls, defaultStall.stallId);
  renderMenu(defaultStall);
}

init().catch(err => {
  console.error(err);
  alert("Failed to load menu data. Check Live Server + data/menu.json path.");
});
