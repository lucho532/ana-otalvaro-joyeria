// ============================================================
// Carga y muestra el catálogo de productos en index.html
// ============================================================
import { getFirebase, firebaseReady } from "./firebase-init.js";
import { WHATSAPP_NUMBER } from "./firebase-config.js";

const grid = document.getElementById("product-grid");
const filtersEl = document.getElementById("filters");

let allProducts = [];
let activeFilter = "todos";
let fb = null;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function productUrl(product) {
  return `${window.location.origin}${window.location.pathname}?producto=${encodeURIComponent(product.id)}#catalogo`;
}

function waLink(product) {
  const msg = `Hola ✨ Me interesa esta pieza: "${product.name}" (${formatPrice(product.price)}).\n${productUrl(product)}\n¿Sigue disponible?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// Registra en silencio, sin pedirle nada al cliente, que alguien preguntó
// por esta pieza (para que aparezca en "Encargos recibidos"). No incluye
// nombre ni teléfono: eso solo lo sabrá la administradora cuando la
// persona le escriba, dentro de su propio WhatsApp.
async function logCatalogInterest(product) {
  if (!firebaseReady) return;
  try {
    if (!fb) fb = await getFirebase();
    const { db, firestore } = fb;
    await firestore.addDoc(firestore.collection(db, "orders"), {
      productId: product.id,
      productName: product.name,
      productPrice: product.price ?? null,
      category: product.category || null,
      status: "nuevo",
      source: "catalogo",
      createdAt: firestore.serverTimestamp(),
    });
  } catch (err) {
    console.error("No se pudo registrar el interés en el producto:", err);
  }
}

function renderState(message, title) {
  grid.innerHTML = `<div class="state-msg"><strong>${escapeHtml(title)}</strong>${escapeHtml(message)}</div>`;
}

function renderProducts() {
  const list = activeFilter === "todos" ? allProducts : allProducts.filter((p) => p.category === activeFilter);

  if (list.length === 0) {
    renderState("Muy pronto encontrarás piezas nuevas en esta categoría. Escríbenos por WhatsApp si buscas algo en especial.", "Aún no hay piezas aquí");
    return;
  }

  grid.innerHTML = list
    .map((p) => {
      const img = p.imageDataUrl
        ? `<img src="${escapeHtml(p.imageDataUrl)}" alt="${escapeHtml(p.name)}" loading="lazy">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(20,158,132,0.35);font-size:2.4rem;">✦</div>`;
      return `
        <article class="product-card" id="producto-${escapeHtml(p.id)}">
          <div class="product-card__img">
            ${p.category ? `<span class="product-card__badge">${escapeHtml(p.category)}</span>` : ""}
            ${img}
          </div>
          <div class="product-card__body">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="product-card__desc">${escapeHtml(p.description)}</p>
            <div class="product-card__price">${formatPrice(p.price)}</div>
            <div class="product-card__actions">
              <a class="btn btn--whatsapp btn--block btn--sm" target="_blank" rel="noopener" href="${waLink(p)}" data-product-id="${escapeHtml(p.id)}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.1.2-.3.2-.6.1-.2-.1-1-.4-2-1.2-.7-.7-1.2-1.5-1.4-1.7-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.7.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
                Pedir por WhatsApp
              </a>
            </div>
          </div>
        </article>`;
    })
    .join("");

  grid.querySelectorAll("[data-product-id]").forEach((link) => {
    link.addEventListener("click", () => {
      const product = allProducts.find((p) => p.id === link.dataset.productId);
      if (product) logCatalogInterest(product);
    });
  });
}

function buildFilters() {
  const categories = ["todos", ...new Set(allProducts.map((p) => p.category).filter(Boolean))];
  filtersEl.innerHTML = categories
    .map(
      (c) =>
        `<button class="filter-btn${c === activeFilter ? " is-active" : ""}" data-filter="${escapeHtml(c)}">${
          c === "todos" ? "Todos" : escapeHtml(c)
        }</button>`
    )
    .join("");

  filtersEl.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      filtersEl.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderProducts();
    });
  });
}

// -------------------- Enlace directo a un producto --------------------
// Cuando la administradora recibe el mensaje de WhatsApp con el enlace del
// producto y lo abre, esta función resalta esa pieza en la página.

function focusSharedProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("producto");
  if (!id) return;

  const card = document.getElementById(`producto-${id}`);
  if (!card) return;

  setTimeout(() => {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("product-card--highlight");
    setTimeout(() => card.classList.remove("product-card--highlight"), 4000);
  }, 300);
}

async function init() {
  if (!firebaseReady) {
    renderState(
      "El sitio todavía no está conectado a la base de datos de productos. Sigue las instrucciones del README.md para activar el catálogo.",
      "Catálogo en preparación"
    );
    filtersEl.innerHTML = "";
    return;
  }

  renderState("Cargando piezas...", "Un momento");

  try {
    fb = await getFirebase();
    const { db, firestore } = fb;
    // Se ordena solo por fecha (sin combinar con el filtro "active") para no
    // depender de un índice compuesto de Firestore; los inactivos se filtran
    // aquí mismo, en el navegador.
    const q = firestore.query(firestore.collection(db, "products"), firestore.orderBy("createdAt", "desc"));
    const snap = await firestore.getDocs(q);
    allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.active !== false);
    buildFilters();
    renderProducts();
    focusSharedProduct();
  } catch (err) {
    console.error(err);
    renderState(
      "No pudimos cargar el catálogo en este momento. Escríbenos por WhatsApp y con gusto te mostramos las piezas disponibles.",
      "Ocurrió un problema"
    );
  }
}

init();
