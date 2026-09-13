// ============================================================
// Configuración de Firebase
// ============================================================
// 1. Ve a https://console.firebase.google.com y crea un proyecto gratis.
// 2. Dentro del proyecto: "Configuración del proyecto" > "Tus apps" > ícono </> (Web).
// 3. Copia los valores que te da Firebase y pégalos abajo, reemplazando
//    cada "PON-AQUI-...".
// 4. Guarda este archivo. No necesitas tocar ningún otro archivo .js.
//
// Mientras estos valores digan "PON-AQUI", el sitio funciona en modo
// "sin conexión": el catálogo mostrará un aviso y el formulario de
// encargos escribirá directo a WhatsApp sin guardar el diseño adjunto.
// Sigue las instrucciones del README.md para completar la configuración.
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyCqEEeYgB7hb0-TrnGi2_2olCUAW3A5ONw",
  authDomain: "ana-otalvaro-joyeria.firebaseapp.com",
  projectId: "ana-otalvaro-joyeria",
  storageBucket: "ana-otalvaro-joyeria.firebasestorage.app",
  messagingSenderId: "207676558354",
  appId: "1:207676558354:web:9a673504b6291b81649ccb"
};

// Número de WhatsApp de la marca, en formato internacional sin "+" ni espacios.
export const WHATSAPP_NUMBER = "573135317411";

// Nombre de la marca, usado en mensajes automáticos.
export const BRAND_NAME = "Ana Otalvaro Joyería";

export function isFirebaseConfigured() {
  return !Object.values(firebaseConfig).some((v) => String(v).includes("PON-AQUI"));
}
