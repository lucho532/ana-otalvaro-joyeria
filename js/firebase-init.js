// ============================================================
// Inicializa Firebase (App, Firestore, Auth) una sola vez y lo
// comparte con el resto de los scripts del sitio.
//
// Nota: este proyecto NO usa Firebase Storage (evita necesitar el
// plan Blaze / tarjeta de pago). Las fotos se comprimen en el
// navegador y se guardan como texto (base64) directo en Firestore;
// ver js/image-utils.js.
// ============================================================
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

let app = null;
let db = null;
let auth = null;

export const firebaseReady = isFirebaseConfigured();

export async function getFirebase() {
  if (!firebaseReady) return { app: null, db: null, auth: null };
  if (app) return { app, db, auth };

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js");
  const firestore = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js");
  const authMod = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js");

  app = initializeApp(firebaseConfig);
  db = firestore.getFirestore(app);
  auth = authMod.getAuth(app);

  return {
    app,
    db,
    auth,
    firestore,
    authMod,
  };
}
