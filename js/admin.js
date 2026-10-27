// ============================================================
// Panel de administración: login, productos y encargos recibidos
// ============================================================
import { getFirebase, firebaseReady } from "./firebase-init.js";
import { compressImageToDataUrl } from "./image-utils.js";

const notConfiguredBox = document.getElementById("not-configured");
const loginShell = document.getElementById("login-shell");
const adminShell = document.getElementById("admin-shell");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginPasswordInput = document.getElementById("login-password");
const loginPasswordToggle = document.getElementById("login-password-toggle");
const forgotPasswordBtn = document.getElementById("forgot-password-btn");
const forgotPasswordMsg = document.getElementById("forgot-password-msg");
const logoutBtn = document.getElementById("logout-btn");
const adminEmailLabel = document.getElementById("admin-email");

const productForm = document.getElementById("product-form");
const productList = document.getElementById("product-list");
const productFilter = document.getElementById("product-filter");
const productFormTitle = document.getElementById("product-form-title");
const productSubmitBtn = document.getElementById("product-submit");
const productCancelEditBtn = document.getElementById("product-cancel-edit");
const productImageInput = document.getElementById("product-image");
const productMsg = document.getElementById("product-msg");

const orderList = document.getElementById("order-list");
const whatsappList = document.getElementById("whatsapp-list");

let fb = null;
let editingProductId = null;
let unsubProducts = null;
let unsubOrders = null;
let latestProducts = [];
const PRODUCT_CATEGORIES = [
  "Aretes",
  "Anillos",
  "Cadenas y Dijes",
  "Pulseras",
  "Manillas",
  "Personalizados",
  "Animales",
  "Otro",
];
let productCategoryFilter = "todos";

window.addEventListener("popstate", () => {
  document.querySelectorAll(".admin-inline-edit").forEach((f) => f.remove());
  document
    .querySelectorAll(".admin-row--editing")
    .forEach((r) => r.classList.remove("admin-row--editing"));
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

// -------------------- Arranque --------------------

async function init() {
  if (!firebaseReady) {
    notConfiguredBox.style.display = "block";
    loginShell.style.display = "none";
    return;
  }

  fb = await getFirebase();
  const { auth, authMod } = fb;

  authMod.onAuthStateChanged(auth, (user) => {
    if (user) {
      loginShell.style.display = "none";
      adminShell.style.display = "block";
      adminEmailLabel.textContent = user.email;
      watchProducts();
      watchOrders();
    } else {
      loginShell.style.display = "flex";
      adminShell.style.display = "none";
      if (unsubProducts) unsubProducts();
      if (unsubOrders) unsubOrders();
    }
  });
}

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.style.display = "none";
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  const btn = loginForm.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const { auth, authMod } = fb;
    await authMod.signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = "Correo o contraseña incorrectos.";
    loginError.style.display = "block";
  } finally {
    btn.disabled = false;
  }
});

logoutBtn?.addEventListener("click", async () => {
  const { auth, authMod } = fb;
  await authMod.signOut(auth);
});

loginPasswordToggle?.addEventListener("click", () => {
  const showing = loginPasswordInput.type === "text";
  loginPasswordInput.type = showing ? "password" : "text";
  loginPasswordToggle.querySelector(".eye-open").style.display = showing
    ? "block"
    : "none";
  loginPasswordToggle.querySelector(".eye-closed").style.display = showing
    ? "none"
    : "block";
});

forgotPasswordBtn?.addEventListener("click", async () => {
  const email = loginForm.email.value.trim();
  forgotPasswordMsg.style.display = "block";
  if (!email) {
    forgotPasswordMsg.textContent =
      "Escribe primero tu correo arriba y luego toca este enlace.";
    forgotPasswordMsg.className = "form-msg is-visible form-msg--error";
    return;
  }
  try {
    const { auth, authMod } = fb;
    await authMod.sendPasswordResetEmail(auth, email);
    forgotPasswordMsg.textContent =
      "Listo, revisa tu correo: te enviamos un enlace para crear una nueva contraseña.";
    forgotPasswordMsg.className = "form-msg is-visible";
  } catch (err) {
    forgotPasswordMsg.textContent =
      "No pudimos enviar el correo. Verifica que esté bien escrito.";
    forgotPasswordMsg.className = "form-msg is-visible form-msg--error";
  }
});

// -------------------- Pestañas --------------------

document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".admin-tab")
      .forEach((t) => t.classList.toggle("is-active", t === tab));
    document
      .querySelectorAll(".admin-panel")
      .forEach((p) =>
        p.classList.toggle("is-active", p.id === tab.dataset.panel),
      );
  });
});

// -------------------- Productos --------------------

function watchProducts() {
  const { db, firestore } = fb;
  const q = firestore.query(
    firestore.collection(db, "products"),
    firestore.orderBy("createdAt", "desc"),
  );
  unsubProducts = firestore.onSnapshot(q, (snap) => {
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    latestProducts = products;
    renderProducts(filterProducts(products));
  });
}

function filterProducts(products) {
  if (productCategoryFilter === "todos") return products;
  return products.filter((p) => p.category === productCategoryFilter);
}

productFilter?.addEventListener("change", () => {
  productCategoryFilter = productFilter.value;
  renderProducts(filterProducts(latestProducts));
});

function renderProducts(products) {
  if (products.length === 0) {
    productList.innerHTML =
      productCategoryFilter === "todos"
        ? `<p class="empty-hint">Todavía no has agregado piezas. Usa el formulario para subir la primera 💍</p>`
        : `<p class="empty-hint">No hay piezas en "${escapeHtml(productCategoryFilter)}" todavía.</p>`;
    return;
  }

  productList.innerHTML = products
    .map(
      (p) => `
      <div class="admin-row">
        <img
          class="admin-product-image"
          src="${escapeHtml(p.imageDataUrl || "")}"
          alt="Ver fotografía ampliada de ${escapeHtml(p.name)}"
          title="Pulsa para ampliar la fotografía"
          role="button"
          tabindex="0"
          data-preview-image="${escapeHtml(p.id)}"
        >
        <div class="admin-row__body">
          <h4>${escapeHtml(p.name)}</h4>
          <div class="admin-row__meta">
            ${escapeHtml(p.category || "")} · ${formatPrice(p.price)}
            · <span class="badge ${p.active ? "badge--new" : "badge--done"}">${p.active ? "Visible" : "Oculto"}</span>
          </div>
        </div>
        <div class="admin-row__actions">
          <button class="icon-btn icon-btn--label" title="Editar" data-edit="${p.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            Editar
          </button>
          <button class="icon-btn icon-btn--label" title="${p.active ? "Ocultar" : "Mostrar"}" data-toggle="${p.id}" data-active="${p.active}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            ${p.active ? "Ocultar" : "Mostrar"}
          </button>
          <button class="icon-btn icon-btn--label icon-btn--danger" title="Eliminar" data-delete="${p.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
            Eliminar
          </button>
        </div>
      </div>`,
    )
    .join("");

  const cerrarModalImagen = () => {
    if (history.state?.adminImage) {
      history.back();
    } else {
      const m = document.getElementById("admin-image-modal");
      if (m) {
        m.hidden = true;
        m.style.display = "none";
      }
    }
  };

  // Ampliar fotografías al hacer clic o pulsar Enter/Espacio.
  productList.querySelectorAll("[data-preview-image]").forEach((img) => {
    const abrirImagen = () => {
      const producto = products.find((p) => p.id === img.dataset.previewImage);

      if (!producto?.imageDataUrl) {
        alert("Este producto no tiene una fotografía disponible.");
        return;
      }

      let modal = document.getElementById("admin-image-modal");

      if (!modal) {
        modal = document.createElement("div");
        modal.id = "admin-image-modal";
        modal.className = "admin-image-modal";
        modal.style.cssText = `
          position: fixed !important;
          inset: 0 !important;
          z-index: 999999 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
          background: rgba(0, 0, 0, 0.85);
        `;

        modal.innerHTML = `
          <div class="admin-image-modal__content"
               role="dialog"
               aria-modal="true"
               aria-label="Fotografía del producto">
            <button type="button"
                    class="admin-image-modal__close"
                    aria-label="Cerrar fotografía">&times;</button>
            <img class="admin-image-modal__photo" alt="">
            <p class="admin-image-modal__caption"></p>
          </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", (event) => {
          const botonCerrar = event.target.closest(".admin-image-modal__close");

          if (event.target === modal || botonCerrar) {
            cerrarModalImagen();
          }
        });

        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && !modal.hidden) {
            cerrarModalImagen();
          }
        });

        // El botón "atrás" del navegador cierra la foto en vez de salir de la página.
        window.addEventListener("popstate", () => {
          modal.hidden = true;
          modal.style.display = "none";
        });
      }

      modal.querySelector(".admin-image-modal__photo").src =
        producto.imageDataUrl;

      modal.querySelector(".admin-image-modal__caption").textContent =
        producto.name || "Fotografía del producto";

      if (!history.state?.adminImage) {
        history.pushState({ adminImage: true }, "");
      }
      modal.hidden = false;
      modal.style.display = "flex";
    };

    img.addEventListener("click", abrirImagen);

    img.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        abrirImagen();
      }
    });
  });

  productList.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = products.find((x) => x.id === btn.dataset.edit);
      if (!p) return;

      const tarjeta = btn.closest(".admin-row");
      const formularioAbierto = tarjeta.querySelector(".admin-inline-edit");

      // Si ya está abierto, lo cerramos.
      if (formularioAbierto) {
        formularioAbierto.remove();
        tarjeta.classList.remove("admin-row--editing");
        return;
      }

      // Cerramos cualquier otro formulario abierto.
      productList.querySelectorAll(".admin-inline-edit").forEach((form) => {
        form.remove();
      });
      productList.querySelectorAll(".admin-row--editing").forEach((row) => {
        row.classList.remove("admin-row--editing");
      });

      tarjeta.classList.add("admin-row--editing");

      // "Atrás" del navegador cierra el formulario en vez de salir de la página.
      if (!history.state?.adminEdit) {
        history.pushState({ adminEdit: true }, "");
      }

      const formulario = document.createElement("form");
      formulario.className = "admin-inline-edit";

      formulario.innerHTML = `
  <h4>Editar pieza</h4>

  <label>
    Nombre
    <input name="name" type="text" required value="${escapeHtml(p.name || "")}">
  </label>

  <label>
    Categoría
    <select name="category" required>
      ${(PRODUCT_CATEGORIES.includes(p.category) || !p.category
        ? PRODUCT_CATEGORIES
        : [p.category, ...PRODUCT_CATEGORIES]
      )
        .map(
          (categoria) => `
          <option value="${categoria}" ${p.category === categoria ? "selected" : ""}>
            ${categoria}
          </option>
        `,
        )
        .join("")}
    </select>
  </label>

  <label>
    Precio
    <input name="price" type="number" min="0" step="any"
      value="${p.price ?? ""}">
  </label>

  <label>
    Descripción
    <textarea name="description" required>${escapeHtml(p.description || "")}</textarea>
  </label>

  <label>
    <input name="active" type="checkbox" ${p.active !== false ? "checked" : ""}>
    Producto visible
  </label>

  <label>
    Cambiar fotografía (opcional)
    <input name="image" type="file" accept="image/*">
  </label>

  <p class="inline-edit-message" role="status"></p>

  <div class="admin-row__actions">
    <button type="submit" class="icon-btn icon-btn--label">Guardar cambios</button>
    <button type="button" class="icon-btn icon-btn--label" data-cancel-inline>Cancelar</button>
  </div>
`;

      tarjeta.appendChild(formulario);

      formulario.addEventListener("submit", async (event) => {
        event.preventDefault();

        const botonGuardar = formulario.querySelector('[type="submit"]');
        const mensaje = formulario.querySelector(".inline-edit-message");
        const archivo = formulario.elements.image.files[0];

        if (archivo && archivo.size > 15 * 1024 * 1024) {
          mensaje.textContent = "La fotografía no puede superar los 15 MB.";
          return;
        }

        botonGuardar.disabled = true;
        mensaje.textContent = "Guardando cambios...";

        try {
          const nombre = formulario.elements.name.value.trim();
          const descripcion = formulario.elements.description.value.trim();
          const precioTexto = formulario.elements.price.value.trim();

          if (!nombre || !descripcion) {
            throw new Error("El nombre y la descripción son obligatorios.");
          }

          const datos = {
            name: nombre,
            category: formulario.elements.category.value,
            price: precioTexto === "" ? null : Number(precioTexto),
            description: descripcion,
            active: formulario.elements.active.checked,
          };

          if (archivo) {
            datos.imageDataUrl = await compressImageToDataUrl(archivo, {
              maxDim: 560,
              maxBytes: 45 * 1024,
            });
          }

          const { db, firestore } = fb;

          await firestore.updateDoc(firestore.doc(db, "products", p.id), datos);

          mensaje.textContent = "¡Cambios guardados!";
        } catch (error) {
          console.error(error);
          mensaje.textContent =
            error.message || "No se pudieron guardar los cambios.";
        } finally {
          botonGuardar.disabled = false;
        }
      });

      formulario
        .querySelector("[data-cancel-inline]")
        .addEventListener("click", () => {
          if (history.state?.adminEdit) {
            history.back();
          } else {
            formulario.remove();
            tarjeta.classList.remove("admin-row--editing");
          }
        });

      formulario.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });

  productList.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { db, firestore } = fb;
      await firestore.updateDoc(
        firestore.doc(db, "products", btn.dataset.toggle),
        {
          active: btn.dataset.active !== "true",
        },
      );
    });
  });

  productList.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta pieza? Esta acción no se puede deshacer.")) {
        return;
      }

      const p = products.find((x) => x.id === btn.dataset.delete);

      if (!p) {
        alert("No se encontró la pieza que intentas eliminar.");
        return;
      }

      const { db, firestore } = fb;

      btn.disabled = true;

      try {
        await firestore.deleteDoc(firestore.doc(db, "products", p.id));

        console.info("Producto eliminado correctamente:", p.id);
        alert("La pieza se ha eliminado correctamente.");
      } catch (err) {
        console.error("Error al eliminar el producto:", err);

        const mensajes = {
          "permission-denied":
            "Firebase ha rechazado la operación por permisos.",
          unauthenticated: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
          unavailable: "Firebase no está disponible en este momento.",
          "failed-precondition":
            "No se cumplen las condiciones necesarias para eliminar la pieza.",
        };

        const mensaje =
          mensajes[err.code] ||
          `No se pudo eliminar la pieza. Código: ${err.code || "desconocido"}.`;

        alert(mensaje);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function startEditProduct(p) {
  editingProductId = p.id;
  productForm.name.value = p.name || "";
  productForm.category.value = p.category || "Aretes";
  productForm.price.value = p.price || "";
  productForm.description.value = p.description || "";
  productForm.active.checked = p.active !== false;
  productImageInput.value = "";
  productFormTitle.textContent = "Editar pieza";
  productSubmitBtn.textContent = "Guardar cambios";
  productCancelEditBtn.style.display = "inline-flex";
  window.scrollTo({ top: productForm.offsetTop - 100, behavior: "smooth" });
}

function resetProductForm() {
  editingProductId = null;
  productForm.reset();
  productForm.active.checked = true;
  productFormTitle.textContent = "Agregar pieza nueva";
  productSubmitBtn.textContent = "Agregar producto";
  productCancelEditBtn.style.display = "none";
}

productCancelEditBtn?.addEventListener("click", resetProductForm);

productForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  productMsg.className = "form-msg";

  const name = productForm.name.value.trim();
  const category = productForm.category.value;
  const priceRaw = productForm.price.value.trim();
  const price = priceRaw === "" ? null : Number(priceRaw);
  const description = productForm.description.value.trim();
  const active = productForm.active.checked;
  const file = productImageInput.files[0];

  if (!name || !description) {
    productMsg.textContent = "Completa nombre y descripción.";
    productMsg.className = "form-msg is-visible form-msg--error";
    return;
  }
  if (!editingProductId && !file) {
    productMsg.textContent = "Sube una foto de la pieza.";
    productMsg.className = "form-msg is-visible form-msg--error";
    return;
  }
  if (file && file.size > 15 * 1024 * 1024) {
    productMsg.textContent = "La imagen debe pesar menos de 15 MB.";
    productMsg.className = "form-msg is-visible form-msg--error";
    return;
  }

  productSubmitBtn.disabled = true;
  const originalLabel = productSubmitBtn.textContent;
  productSubmitBtn.innerHTML = `<span class="spinner"></span>`;

  try {
    const { db, firestore } = fb;
    let imageDataUrl;

    if (file) {
      imageDataUrl = await compressImageToDataUrl(file, {
        maxDim: 560,
        maxBytes: 45 * 1024,
      });
    }

    if (editingProductId) {
      const data = { name, category, price, description, active };
      if (imageDataUrl) {
        data.imageDataUrl = imageDataUrl;
      }
      await firestore.updateDoc(
        firestore.doc(db, "products", editingProductId),
        data,
      );
    } else {
      await firestore.addDoc(firestore.collection(db, "products"), {
        name,
        category,
        price,
        description,
        active,
        imageDataUrl,
        createdAt: firestore.serverTimestamp(),
      });
    }

    resetProductForm();
  } catch (err) {
    console.error(err);
    productMsg.textContent = "No se pudo guardar la pieza. Intenta de nuevo.";
    productMsg.className = "form-msg is-visible form-msg--error";
  } finally {
    productSubmitBtn.disabled = false;
    productSubmitBtn.textContent = originalLabel;
  }
});

// -------------------- Encargos --------------------

function watchOrders() {
  const { db, firestore } = fb;
  const q = firestore.query(
    firestore.collection(db, "orders"),
    firestore.orderBy("createdAt", "desc"),
  );
  unsubOrders = firestore.onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderWhatsappInquiries(all.filter((o) => Boolean(o.productId)));
    renderCustomOrders(all.filter((o) => !o.productId));
  });
}

function productUrl(productId) {
  return `${window.location.origin}/index.html?producto=${encodeURIComponent(productId)}#catalogo`;
}

function bindStatusToggle(container) {
  container.querySelectorAll("[data-order-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { db, firestore } = fb;
      const next = btn.dataset.status === "atendido" ? "nuevo" : "atendido";
      await firestore.updateDoc(
        firestore.doc(db, "orders", btn.dataset.orderToggle),
        { status: next },
      );
    });
  });
}

// Consultas desde el catálogo: alguien hizo clic en "Pedir por WhatsApp".
// No hay nombre ni teléfono (no se le pide nada al cliente); solo se sabe
// qué pieza preguntó y cuándo. El contacto real llega directo al WhatsApp
// de la administradora, fuera de la página.
function renderWhatsappInquiries(orders) {
  if (orders.length === 0) {
    whatsappList.innerHTML = `<p class="empty-hint">Todavía nadie ha hecho clic en "Pedir por WhatsApp" desde el catálogo.</p>`;
    return;
  }

  whatsappList.innerHTML = orders
    .map((o) => {
      const product = latestProducts.find((p) => p.id === o.productId);
      return `
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start;">
          <h4 style="margin:0;">Consulta desde el catálogo</h4>
          <span class="badge ${o.status === "atendido" ? "badge--done" : "badge--new"}">${o.status === "atendido" ? "Atendido" : "Nuevo"}</span>
        </div>
        <div class="admin-row__meta" style="margin:4px 0 0;">${formatDate(o.createdAt)}</div>
        <div style="display:flex;gap:12px;align-items:center;margin:14px 0;padding:10px;background:var(--bg-soft);border-radius:10px;">
          <img src="${escapeHtml((product && product.imageDataUrl) || "")}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px;background:var(--surface-alt);flex:none;">
          <div style="min-width:0;">
            <div style="font-weight:600;">${escapeHtml(o.productName || (product && product.name) || "Producto eliminado")}</div>
            <div class="admin-row__meta">${formatPrice(o.productPrice)}</div>
            <a href="${productUrl(o.productId)}" target="_blank" rel="noopener" style="font-size:0.8rem;color:var(--gold-dark);">Ver producto en la página →</a>
          </div>
        </div>
        <p style="margin:0 0 14px;font-size:0.85rem;color:var(--text-soft);">Sin datos de contacto todavía: cuando esta persona te escriba por WhatsApp, verás su número directamente en tu chat.</p>
        <button class="btn btn--outline btn--sm" data-order-toggle="${o.id}" data-status="${o.status || "nuevo"}">
          Marcar como ${o.status === "atendido" ? "nuevo" : "atendido"}
        </button>
      </div>`;
    })
    .join("");

  bindStatusToggle(whatsappList);
}

// Encargos personalizados: enviados desde el formulario de encargo.html,
// con nombre, teléfono y descripción del pedido.
function renderCustomOrders(orders) {
  if (orders.length === 0) {
    orderList.innerHTML = `<p class="empty-hint">Todavía no han llegado encargos personalizados por la página.</p>`;
    return;
  }

  orderList.innerHTML = orders
    .map((o) => {
      const waMsg = encodeURIComponent(
        `Hola ${o.name}, te escribimos de Ana Otalvaro Joyería sobre tu pedido ✨`,
      );
      return `
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start;">
          <div>
            <h4 style="margin:0 0 4px;">${escapeHtml(o.name)} · <span class="badge">${escapeHtml(o.category || "Encargo")}</span></h4>
            <div class="admin-row__meta">${escapeHtml(o.phone || "")} · ${formatDate(o.createdAt)}</div>
          </div>
          <span class="badge ${o.status === "atendido" ? "badge--done" : "badge--new"}">${o.status === "atendido" ? "Atendido" : "Nuevo"}</span>
        </div>
        <p style="margin:14px 0;">${escapeHtml(o.message)}</p>
        ${o.budget ? `<p style="margin:0 0 10px;font-size:0.88rem;color:var(--text-soft);">Presupuesto: ${escapeHtml(o.budget)}</p>` : ""}
        ${o.designImageDataUrl ? `<a href="${escapeHtml(o.designImageDataUrl)}" target="_blank" rel="noopener"><img src="${escapeHtml(o.designImageDataUrl)}" alt="Diseño adjunto" style="width:110px;height:110px;object-fit:cover;border-radius:10px;margin-bottom:14px;"></a>` : ""}
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <a class="btn btn--whatsapp btn--sm" target="_blank" rel="noopener" href="https://wa.me/${(o.phone || "").replace(/\D/g, "")}?text=${waMsg}">Responder por WhatsApp</a>
          <button class="btn btn--outline btn--sm" data-order-toggle="${o.id}" data-status="${o.status || "nuevo"}">
            Marcar como ${o.status === "atendido" ? "nuevo" : "atendido"}
          </button>
        </div>
      </div>`;
    })
    .join("");

  bindStatusToggle(orderList);
}

init();
