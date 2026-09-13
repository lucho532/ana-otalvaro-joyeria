// ============================================================
// Comprime una imagen en el navegador y la devuelve como "data URL"
// (texto base64) lista para guardarse directo en un documento de
// Firestore, sin necesitar Firebase Storage ni tarjeta de pago.
// ============================================================

/**
 * @param {File} file
 * @param {{maxDim?: number, maxBytes?: number, mimeType?: string}} [options]
 * @returns {Promise<string>} data URL comprimida
 */
export function compressImageToDataUrl(file, options = {}) {
  const { maxDim = 1100, maxBytes = 550 * 1024, mimeType = "image/jpeg" } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.85;
      let dataUrl = canvas.toDataURL(mimeType, quality);

      // Los data URL en base64 pesan ~37% más que el archivo binario.
      while (dataUrl.length > maxBytes * 1.37 && quality > 0.35) {
        quality -= 0.12;
        dataUrl = canvas.toDataURL(mimeType, quality);
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen."));
    };

    img.src = objectUrl;
  });
}
