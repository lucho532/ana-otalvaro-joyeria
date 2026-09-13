// ============================================================
// Formulario de encargos / pedidos personalizados
// ============================================================
import { getFirebase, firebaseReady } from "./firebase-init.js";
import { WHATSAPP_NUMBER, BRAND_NAME } from "./firebase-config.js";
import { compressImageToDataUrl } from "./image-utils.js";

const form = document.getElementById("encargo-form");
const fileInput = document.getElementById("design-file");
const fileDrop = document.getElementById("file-drop");
const filePreview = document.getElementById("file-preview");
const filePreviewImg = filePreview.querySelector("img");
const filePreviewName = filePreview.querySelector(".file-preview__name");
const removeFileBtn = filePreview.querySelector(".file-preview__remove");
const submitBtn = document.getElementById("encargo-submit");
const formMsg = document.getElementById("form-msg");
const formWrap = document.getElementById("form-wrap");
const successBox = document.getElementById("success-box");
const successWaBtn = document.getElementById("success-wa-btn");

let selectedFile = null;

fileDrop.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showMsg("Por favor adjunta una imagen (jpg, png o webp).", "error");
    fileInput.value = "";
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    showMsg("La imagen debe pesar menos de 8 MB.", "error");
    fileInput.value = "";
    return;
  }
  selectedFile = file;
  filePreviewName.textContent = file.name;
  filePreviewImg.src = URL.createObjectURL(file);
  filePreview.classList.add("is-visible");
});

removeFileBtn.addEventListener("click", () => {
  selectedFile = null;
  fileInput.value = "";
  filePreview.classList.remove("is-visible");
});

function showMsg(text, type) {
  formMsg.textContent = text;
  formMsg.className = `form-msg is-visible form-msg--${type}`;
}

function buildSummaryText(data) {
  const lines = [
    `Hola, soy ${data.name} y quiero hacer un encargo en ${BRAND_NAME} ✨`,
    `Tipo de joya: ${data.category}`,
    `Descripción: ${data.message}`,
  ];
  if (data.budget) lines.push(`Presupuesto aproximado: ${data.budget}`);
  if (data.hasDesign) lines.push("Voy a enviar una imagen de referencia por este chat.");
  return lines.join("\n");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.className = "form-msg";

  const data = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    category: form.category.value,
    message: form.message.value.trim(),
    budget: form.budget.value.trim(),
  };

  if (!data.name || !data.phone || !data.message) {
    showMsg("Por favor completa tu nombre, teléfono y la descripción del encargo.", "error");
    return;
  }

  submitBtn.disabled = true;
  const originalLabel = submitBtn.innerHTML;
  submitBtn.innerHTML = `<span class="spinner"></span> Enviando...`;

  let designImageDataUrl = "";

  try {
    if (firebaseReady) {
      const { db, firestore } = await getFirebase();

      if (selectedFile) {
        designImageDataUrl = await compressImageToDataUrl(selectedFile, {
          maxDim: 900,
          maxBytes: 450 * 1024,
        });
      }

      await firestore.addDoc(firestore.collection(db, "orders"), {
        name: data.name,
        phone: data.phone,
        category: data.category,
        message: data.message,
        budget: data.budget || null,
        designImageDataUrl: designImageDataUrl || null,
        status: "nuevo",
        createdAt: firestore.serverTimestamp(),
      });
    }

    const summary = buildSummaryText({ ...data, hasDesign: !!selectedFile && !firebaseReady });
    successWaBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(summary)}`;

    formWrap.style.display = "none";
    successBox.style.display = "block";
  } catch (err) {
    console.error(err);
    showMsg("No pudimos enviar tu encargo. Intenta de nuevo o escríbenos directo por WhatsApp.", "error");
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalLabel;
  }
});
