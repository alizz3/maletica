# Maletica

Tu armario, tu maleta y tus pintas conectados, para no llevar de más ni dejar nada.

- **Armario:** todo lo que tienes, ropa y cosas (cargadores, aseo, documentos…).
- **Maleta:** empieza vacía. Eliges del armario lo que llevas y lo chuleas al empacar.
- **Pintas:** lo que te pones cada día. Si pones una prenda en un día, también entra a la maleta.
- **Checklist de regreso:** todo lo que viajó (maleta + lo que llevabas puesto) para que no se quede nada, más una revisión del lugar antes de salir.
- Varios viajes, modo claro/oscuro, login con Google y guardado en la nube.

Hecho con Vue 3 + Vite, Firebase (Auth + Firestore) y Vercel.

## Correr en tu computador

```bash
npm install
npm run dev
```

Sin archivo `.env.local` la app funciona igual, pero guarda solo en el navegador.

## Configuración (una sola vez)

### 1. Firebase
1. En [console.firebase.google.com](https://console.firebase.google.com) crea un proyecto `maletica`.
2. **Authentication → Método de acceso →** activa **Google**.
3. **Firestore Database →** créala en modo producción.
4. **Reglas:** pega el contenido de `firestore.rules` y publica.
   (o con la CLI: `firebase deploy --only firestore:rules --project TU_PROYECTO`)
5. **Configuración del proyecto → Tus apps →** agrega una app web y copia `apiKey`, `authDomain`, `projectId` y `appId`.
6. **Authentication → Configuración → Dominios autorizados:** agrega el dominio de Vercel.

### 2. Vercel
1. *Add New → Project →* importa el repo `maletica` desde GitHub. Vite se detecta solo.
2. En *Environment Variables* pon las de `.env.example` con los valores de Firebase.
3. *Deploy*. Desde ahí, cada push a `main` se publica solo.

### 3. Opcionales
- **App Check:** crea una clave reCAPTCHA v3, ponla en `VITE_RECAPTCHA_SITE_KEY` y activa App Check para Firestore.
- **Analytics:** crea una propiedad GA4 y pon el ID en `VITE_GA_ID`.

Ver `CHECKLIST.md` para el estado de la checklist de lanzamiento.
