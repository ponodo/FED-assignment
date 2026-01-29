// js/menu.js - MENU MANAGEMENT (VENDOR)
document.addEventListener("DOMContentLoaded", function () {
  if (window.location.pathname.includes("menu-management.html")) {
    loadMenuItems();
    setupMenuForm();
  }
});

// Load vendor's menu items
function loadMenuItems() {
  const user = JSON.parse(localStorage.getItem("hawkerhub_user"));
  if (!user || user.role !== "vendor") return;

  const menuItems = JSON.parse(localStorage.getItem("hawkerhub_menu")) || [
    {
      id: 1,
      name: "Chicken Rice",
      category: "Main Course",
      price: 5.5,
      description: "Signature Hainanese chicken rice",
      availability: "available",
    },
    {
      id: 2,
      name: "Roasted Chicken Rice",
      category: "Main Course",
      price: 6.0,
      description: "Crispy roasted chicken",
      availability: "available",
    },
    {
      id: 3,
      name: "Iced Teh Tarik",
      category: "Beverage",
      price: 2.5,
      description: "Traditional pulled tea",
      availability: "soldout",
    },
  ];

  const tableBody = document.getElementById("menuItemsTable");
  if (!tableBody) return;

  let tableHTML = "";

  menuItems.forEach((item) => {
    // Status badge
    let badgeClass = "bg-secondary";
    if (item.availability === "available") badgeClass = "bg-success";
    else if (item.availability === "unavailable") badgeClass = "bg-danger";
    else if (item.availability === "soldout") badgeClass = "bg-warning";

    tableHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td><span class="badge ${badgeClass}">${item.availability}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger me-1" onclick="editMenuItem(${item.id})">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
  });

  tableBody.innerHTML = tableHTML;
}

// Setup menu form
function setupMenuForm() {
  const form = document.getElementById("addItemForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("itemName").value;
    const category = document.getElementById("itemCategory").value;
    const price = parseFloat(document.getElementById("itemPrice").value);
    const description = document.getElementById("itemDescription").value;
    const availability = document.getElementById("itemAvailability").value;

    if (!name || !category || !price) {
      showAlert("Please fill in all required fields", "danger");
      return;
    }

    // Create new item
    const newItem = {
      id: Date.now(),
      name,
      category,
      price,
      description,
      availability,
    };

    // Save to localStorage
    const menuItems = JSON.parse(localStorage.getItem("hawkerhub_menu")) || [];
    menuItems.push(newItem);
    localStorage.setItem("hawkerhub_menu", JSON.stringify(menuItems));

    showAlert("Menu item added successfully!", "success");

    // Reset form and reload
    form.reset();
    loadMenuItems();
  });
}

// Edit menu item
function editMenuItem(itemId) {
  const menuItems = JSON.parse(localStorage.getItem("hawkerhub_menu")) || [];
  const item = menuItems.find((m) => m.id === itemId);

  if (!item) {
    showAlert("Item not found", "danger");
    return;
  }

  // Fill form with item data
  document.getElementById("itemName").value = item.name;
  document.getElementById("itemCategory").value = item.category;
  document.getElementById("itemPrice").value = item.price;
  document.getElementById("itemDescription").value = item.description || "";
  document.getElementById("itemAvailability").value = item.availability;

  // Change form to update mode
  const form = document.getElementById("addItemForm");
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "Update Item";

  // Store the item ID for update
  form.dataset.editingId = itemId;

  // Change submit handler
  form.onsubmit = function (e) {
    e.preventDefault();
    updateMenuItem(itemId);
  };
}

// Update menu item
function updateMenuItem(itemId) {
  const menuItems = JSON.parse(localStorage.getItem("hawkerhub_menu")) || [];
  const index = menuItems.findIndex((m) => m.id === itemId);

  if (index === -1) {
    showAlert("Item not found", "danger");
    return;
  }

  // Update item
  menuItems[index] = {
    ...menuItems[index],
    name: document.getElementById("itemName").value,
    category: document.getElementById("itemCategory").value,
    price: parseFloat(document.getElementById("itemPrice").value),
    description: document.getElementById("itemDescription").value,
    availability: document.getElementById("itemAvailability").value,
  };

  localStorage.setItem("hawkerhub_menu", JSON.stringify(menuItems));
  showAlert("Menu item updated!", "success");

  // Reset form
  const form = document.getElementById("addItemForm");
  form.reset();
  form.dataset.editingId = "";

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "Add Item to Menu";

  // Restore original handler
  form.onsubmit = function (e) {
    e.preventDefault();
    setupMenuForm();
  };

  loadMenuItems();
}

// Delete menu item
function deleteMenuItem(itemId) {
  if (!confirm("Are you sure you want to delete this menu item?")) return;

  let menuItems = JSON.parse(localStorage.getItem("hawkerhub_menu")) || [];
  menuItems = menuItems.filter((m) => m.id !== itemId);

  localStorage.setItem("hawkerhub_menu", JSON.stringify(menuItems));
  showAlert("Menu item deleted", "info");
  loadMenuItems();
}
