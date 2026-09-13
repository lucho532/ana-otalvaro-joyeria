// ============================================================
// Comportamiento compartido en todas las páginas del sitio
// ============================================================
import { WHATSAPP_NUMBER, BRAND_NAME } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  // Menú móvil
  const toggle = document.querySelector(".nav__toggle");
  const links = document.querySelector(".nav__links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", links.classList.contains("is-open"));
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("is-open"))
    );
  }

  // Año en el pie de página
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Botón flotante y enlaces genéricos de WhatsApp
  document.querySelectorAll("[data-wa-generic]").forEach((el) => {
    const msg = encodeURIComponent(`Hola, vi ${BRAND_NAME} en internet y quiero más información ✨`);
    el.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  });

  // Botón "compartir" (Web Share API con respaldo de copiar enlace)
  document.querySelectorAll("[data-share-btn]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const url = window.location.origin + window.location.pathname;
      const shareData = {
        title: BRAND_NAME,
        text: `Mira las joyas en plata de ${BRAND_NAME} 💍`,
        url,
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (e) {
          /* el usuario canceló, no hacer nada */
        }
      } else {
        try {
          await navigator.clipboard.writeText(url);
          btn.textContent = "¡Enlace copiado!";
          setTimeout(() => (btn.textContent = "Copiar enlace"), 2000);
        } catch (e) {
          window.prompt("Copia este enlace:", url);
        }
      }
    });
  });

  // Caja de enlace visible + botón de copiar
  document.querySelectorAll("[data-copy-link]").forEach((box) => {
    const span = box.querySelector("span");
    const button = box.querySelector("button");
    const url = window.location.origin + window.location.pathname.replace(/[^/]+$/, "");
    if (span) span.textContent = url || window.location.origin;
    if (button) {
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(span.textContent);
          button.textContent = "¡Copiado!";
          setTimeout(() => (button.textContent = "Copiar"), 2000);
        } catch (e) {
          window.prompt("Copia este enlace:", span.textContent);
        }
      });
    }
  });
});
