# Checklist de lanzamiento · Maletica

✅ hecho en el código · 🔧 lo configuras tú una vez · ➖ no aplica

## 1. Seguridad y legal
- ✅ Claves fuera del repo: todo va en variables de entorno (`.env.example`), `.env.local` está en `.gitignore`.
  La `apiKey` web de Firebase es un identificador público; la protección real son las reglas de Firestore.
  🔧 En Google Cloud → Credenciales, restringe esa clave a tu dominio de Vercel.
- ✅ Autenticación real con Google (Firebase Auth).
- ✅ Reglas por usuario en `firestore.rules`: cada quien solo lee y escribe su documento, todo lo demás cerrado.
- ✅ Validación del lado del servidor en las reglas: solo los campos permitidos, tipo texto y tamaño máximo.
- ✅ Rate limiting / bots: App Check con reCAPTCHA v3 listo en el código. 🔧 Crear la clave y activarlo en Firebase.
- ✅ HTTPS forzado: Vercel da SSL y el encabezado HSTS está en `vercel.json` (más nosniff, anti-iframe y referrer).
- ✅ Política de privacidad (`/privacidad.html`, Ley 1581 de 2012) y Términos (`/terminos.html`).
- ✅ Banner de cookies: Google Analytics no carga hasta que la persona acepta.

## 2. Accesibilidad (WCAG A/AA)
- ✅ Idioma `es`, enlace "Saltar al contenido", etiquetas en todos los campos, foco visible, `aria-pressed` en chips, barra de progreso con rol.
- ✅ Contraste AA revisado en modo claro y oscuro (acentos oscurecidos en modo claro).
- ✅ ALT en la foto de perfil. La app no usa otras imágenes de contenido.

## 3. SEO
- ✅ Título (35 caracteres) y descripción (87) únicos en cada página.
- ✅ `sitemap.xml` y `robots.txt`. 🔧 Si el dominio final no es `maletica.vercel.app`, cámbialo ahí, en `index.html` (og:url, og:image, canonical).
- ✅ Una acción principal por pantalla.

## 4. Identidad y UX
- ✅ Favicon (`favicon.svg`).
- ✅ Open Graph + imagen 1200×630 (`og.png`) para WhatsApp y redes.
- ✅ Página 404 propia con botón al inicio.
- ✅ Botón de modo claro/oscuro que se recuerda.

## 5. Rendimiento y pruebas
- ✅ Firebase carga después de que la app se ve (archivo inicial ≈35 KB comprimido).
- ✅ Caché larga para `/assets`.
- 🔧 Pasar por PageSpeed Insights después del primer deploy.
- ➖ Imágenes WebP/AVIF: la app no tiene fotos; `og.png` debe ser PNG para WhatsApp.
- ✅ Diseñada primero para celular; funciona en tablet y escritorio.
- ➖ Spam en formularios: los formularios no envían nada a un servidor; App Check protege la base de datos.
- 🔧 Revisar enlaces rotos después del deploy.

## 6. Analítica
- ✅ GA4 listo, con consentimiento. 🔧 Poner `VITE_GA_ID` en Vercel.
