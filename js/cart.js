const CART_KEY = "hawkerhub_cart";
const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

const emptyState = document.getElementById("cart-empty");
const itemsState = document.getElementById("cart-items");
const itemsList = document.getElementById("items");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");

if (cart.length === 0) {
  emptyState.classList.remove("d-none");
  itemsState.classList.add("d-none");
} else {
  emptyState.classList.add("d-none");
  itemsState.classList.remove("d-none");

  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.unitPrice * item.qty;

    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between";
    li.innerHTML = `${item.name} × ${item.qty} <span>$${(item.unitPrice * item.qty).toFixed(2)}</span>`;
    itemsList.appendChild(li);
  });

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  totalEl.textContent = `$${(subtotal + 3).toFixed(2)}`;
}
