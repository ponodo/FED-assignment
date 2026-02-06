
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

// ✅ IMPORTANT: must match your Firestore collection names EXACTLY
const HAWKER_COLLECTION = "Hawker";
const MENU_COLLECTION = "Menu";

function renderHawkers(hawkers) {
  const sel = document.getElementById("hawkerSelect");
  sel.innerHTML =
    `<option value="">Select Hawker</option>` +
    hawkers.map(h => `<option value="${h.stallId}">${h.name}</option>`).join("");
}

function renderMenu(items) {
  const c = document.getElementById("menuContainer");

  if (!items.length) {
    c.innerHTML = `<div class="text-muted">No menu items found.</div>`;
    return;
  }

  c.innerHTML = items.map(item => `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card h-100">
        <img src="images/${item.image}" class="card-img-top" alt="${item.name}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${item.name}</h5>
          <p class="card-text text-muted">${item.description}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <span class="fw-bold">$${Number(item.price).toFixed(2)}</span>
            <button class="btn btn-danger btn-sm">Add</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

async function loadHawkers() {
  const snap = await getDocs(collection(db, HAWKER_COLLECTION));
  const hawkers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  hawkers.sort((a, b) => a.name.localeCompare(b.name));
  return hawkers;
}

async function loadMenuByStallId(stallId) {
  const q = query(
    collection(db, MENU_COLLECTION),
    where("stallId", "==", Number(stallId))
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

document.addEventListener("DOMContentLoaded", async () => {
  // Fill dropdown
  const hawkers = await loadHawkers();
  renderHawkers(hawkers);

  // Load menu on selection
  document.getElementById("hawkerSelect").addEventListener("change", async (e) => {
    const stallId = e.target.value;

    const hawkerName = e.target.options[e.target.selectedIndex]?.text || "Loading...";
    document.getElementById("hawkerName").textContent = hawkerName;

    if (!stallId) {
      document.getElementById("menuContainer").innerHTML = "";
      return;
    }

    document.getElementById("menuContainer").innerHTML =
      `<div class="text-muted">Loading menu...</div>`;

    const items = await loadMenuByStallId(stallId);
    renderMenu(items);
  });
});
