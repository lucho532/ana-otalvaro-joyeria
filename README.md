# Ana Otalvaro Joyería — Sitio web

Sitio web para la marca **Ana Otalvaro Joyería** (joyas en plata: aretes y anillos).

Incluye:
- **Catálogo público** (`index.html`) con fotos, descripción y precio de cada pieza, y botón directo para pedir por WhatsApp.
- **Formulario de encargos** (`encargo.html`) para que cualquier persona describa el diseño que quiere y adjunte una imagen de referencia.
- **Panel de administración** (`admin.html`), protegido con usuario y contraseña, para que subas/edites/elimines productos y veas los encargos recibidos.
- Botón flotante de WhatsApp y botón de "Compartir" en todas las páginas.

El sitio es 100% archivos estáticos (HTML/CSS/JS) y usa **Firebase** (gratis, sin tarjeta) como base de datos, y **Netlify** (gratis) para publicarlo en internet.

**Sobre las fotos:** este proyecto NO usa Firebase Storage, porque desde hace poco Google exige activar el plan de pago (Blaze, con tarjeta) para usarlo. En cambio, cada foto se comprime automáticamente en el navegador y se guarda como texto directo en la base de datos (Firestore), que sigue siendo 100% gratis sin tarjeta. La única diferencia es que las fotos quedan optimizadas para verse bien en la web (no en alta resolución para imprimir).

---

## 1. Crear el proyecto de Firebase (una sola vez)

1. Entra a https://console.firebase.google.com con una cuenta de Google.
2. Clic en **"Crear un proyecto"**, ponle un nombre (ej. `ana-otalvaro-joyeria`) y termina el asistente (puedes desactivar Google Analytics, no es necesario).
3. En el panel izquierdo, bajo **"Categorías de producto"**, despliega **"Bases de datos y almacenamiento"** > entra a **Firestore Database** > **Crear base de datos** > elige modo **producción** > escoge una región cercana (ej. `southamerica-east1` o `us-central1`) > **Habilitar**.
   > Nota: la consola de Firebase cambia de vez en cuando de nombre/ubicación para estos menús. Si no ves "Compilación (Build)" como antes, busca **Firestore Database** en el buscador de productos de arriba a la izquierda ("Buscar productos").
4. **No necesitas activar Storage** — este proyecto no lo usa (evita pedirte tarjeta). Si ya lo abriste y viste el aviso de "Actualizar proyecto", puedes ignorarlo y salir sin activar nada.
5. Despliega la categoría **"Seguridad"** > entra a **Authentication** > **Comenzar** > en la pestaña **Sign-in method**, habilita **Correo electrónico/contraseña**.
6. En **Authentication > Users**, clic en **Agregar usuario** y crea el usuario para tu esposa (su correo + una contraseña segura). Con ese correo y contraseña ella entrará al panel en `admin.html`.

## 2. Conectar el sitio con tu proyecto de Firebase

1. En Firebase, ve a **Configuración del proyecto** (el engranaje, arriba a la izquierda) > pestaña **General**.
2. Baja hasta "Tus apps" y clic en el ícono **`</>`** (Web) para registrar una app web. Ponle un nombre (ej. `sitio-web`) y clic en **Registrar app**.
3. Firebase te mostrará un bloque `firebaseConfig = { apiKey: "...", ... }`. Copia esos valores.
4. Abre el archivo [js/firebase-config.js](js/firebase-config.js) de este proyecto y reemplaza cada `"PON-AQUI-..."` con el valor correspondiente. Guarda el archivo.

## 3. Configurar los permisos (reglas de seguridad)

Esto controla quién puede leer y escribir cada cosa (por ejemplo: cualquiera puede ver el catálogo, pero solo tu esposa puede modificarlo).

1. En Firebase, ve a **Firestore Database > Reglas**. Borra el contenido y pega el de [firestore.rules](firestore.rules) de este proyecto. Clic en **Publicar**.

## 4. Probar el sitio en tu computador (opcional pero recomendado)

Como el sitio usa módulos de JavaScript, ábrelo con un servidor local (no funciona bien abriendo el archivo `index.html` directamente por doble clic). La forma más simple:

- Si tienes **Visual Studio Code**: instala la extensión "Live Server", clic derecho sobre `index.html` > **Open with Live Server**.
- O, si tienes Node.js instalado, desde la carpeta del proyecto ejecuta: `npx serve .`

Entra a `admin.html`, inicia sesión con el usuario que creaste en el paso 1.6, y agrega tu primer producto para comprobar que todo funciona.

## 5. Publicar el sitio en internet (Netlify, gratis)

**Opción rápida — arrastrar y soltar:**

1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta completa de este proyecto (`Ana Otalvaro Joyeria`) sobre la página.
3. En segundos Netlify te da una URL pública (algo como `https://nombre-al-azar.netlify.app`). Esa es la dirección que puedes compartir.
4. Puedes cambiar el subdominio o conectar un dominio propio (ej. `www.anaotalvarojoyeria.com`) desde **Site settings > Domain management** en Netlify.

El sitio ya está publicado en **https://anaotalvarojoyeria.netlify.app/** y `sitemap.xml`/`robots.txt` ya apuntan a esa dirección.

Cada vez que quieras actualizar archivos del sitio (no los productos, esos se manejan desde el panel admin), vuelve a arrastrar la carpeta actualizada a Netlify, o conecta el sitio a un repositorio de GitHub para que se publique automáticamente.

**Importante — acceso público:** si al abrir el enlace ves una pantalla de Netlify pidiendo iniciar sesión ("edge-access"), significa que el sitio quedó con restricción de visitantes activada. Entra a **Site configuration > Visitor access** (o "Access control") en el panel de Netlify y ponlo en público/sin restricción — de lo contrario tus clientas tampoco podrán ver el catálogo.

## 6. Uso diario para tu esposa

1. Entra a `https://anaotalvarojoyeria.netlify.app/admin.html`.
2. Inicia sesión con su correo y contraseña.
3. Pestaña **Productos**: agrega una pieza nueva (nombre, categoría, precio, descripción y foto) o edita/elimina/oculta las existentes.
4. Pestaña **Encargos recibidos**: ve los pedidos personalizados que lleguen desde el formulario, con el diseño adjunto (si lo enviaron) y un botón para responder directo por WhatsApp.

## 7. Número de WhatsApp

El número configurado es **+57 313 5317411** (ver `WHATSAPP_NUMBER` en [js/firebase-config.js](js/firebase-config.js)). Si cambia, solo edita ese valor.

## 8. Notas y límites a tener en cuenta

- El plan gratuito de Firebase ("Spark", sin tarjeta) incluye 1 GB de almacenamiento en Firestore y buena cantidad de lecturas/escrituras gratis al día — con fotos de ~500 KB, eso alcanza para varios cientos de piezas y encargos, de sobra para un catálogo de joyería en sus inicios.
- Las fotos se comprimen automáticamente a un tamaño razonable para web (hasta ~1100px de lado y ~550 KB en productos, ~450 KB en diseños adjuntos). Si en el futuro necesitan fotos en alta resolución para imprimir catálogos físicos, se recomienda guardarlas aparte (no en el sitio).
- El formulario de encargos es público (cualquier visitante puede enviarlo), lo cual es necesario para que funcione sin que el cliente inicie sesión. Las reglas limitan el tamaño de los campos y de la imagen adjunta, pero si en el futuro llegan encargos falsos o spam en volumen, se puede añadir verificación adicional (reCAPTCHA / Firebase App Check).
- La imagen que aparece al compartir el enlace en WhatsApp/redes es `assets/logo-full.svg` (el logo de la marca). Algunas apps de mensajería no muestran bien vistas previas en SVG; si notan que la vista previa no aparece, se puede exportar ese logo como `.png` y apuntar `og:image` en `index.html` a esa versión.

---

## Estructura del proyecto

```
index.html          Página principal (catálogo)
encargo.html         Formulario de encargos personalizados
admin.html           Panel de administración (login + productos + encargos)
css/styles.css       Estilos de todo el sitio
js/firebase-config.js   Tus llaves de Firebase y el número de WhatsApp (edítalo tú)
js/firebase-init.js  Conexión técnica con Firebase (no es necesario tocarlo)
js/image-utils.js    Comprime las fotos en el navegador antes de guardarlas
js/site.js           Menú móvil, botón compartir, botón de WhatsApp flotante
js/products.js       Carga el catálogo en la página principal
js/encargo.js        Envío del formulario de encargos
js/admin.js          Lógica del panel de administración
firestore.rules      Reglas de seguridad de la base de datos (pegar en Firebase)
assets/logo-full.svg Logo completo de la marca (usado en el hero y para compartir)
assets/mark.svg      Ícono recortado del logo (encabezado y favicon)
```
