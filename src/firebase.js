// Login con Google + guardado en la nube (Firestore).
// La configuración viene de variables de entorno (Vercel / .env.local), nunca del repo.
// Si no hay configuración, la app funciona igual pero solo guarda en este navegador.
// El SDK de Firebase se carga después de que la app ya se ve, para que abra rápido.
import { ref, watch } from 'vue'
import { s, reemplazar } from './store.js'

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
}

export const nubeDisponible = !!(config.apiKey && config.projectId)
export const usuario = ref(null)
export const authListo = ref(!nubeDisponible) // ya sabemos si hay sesión o no
export const entrando = ref(false)
// local | cargando | guardado | guardando | error | sin-config
export const estadoNube = ref(nubeDisponible ? 'local' : 'sin-config')
export const errorLogin = ref('')

// Traduce los errores de Firebase a qué hacer para arreglarlos
function explicar(e) {
  const code = (e && e.code) || ''
  const host = typeof location !== 'undefined' ? location.hostname : 'tu dominio'
  const m = {
    'auth/unauthorized-domain': `Firebase no tiene autorizado ${host}. Agrégalo en Authentication → Configuración → Dominios autorizados.`,
    'auth/operation-not-allowed': 'El acceso con Google está apagado. Actívalo en Firebase → Authentication → Método de acceso → Google.',
    'auth/configuration-not-found': 'Authentication no está configurado en Firebase. Entra a Authentication, dale "Comenzar" y activa Google.',
    'auth/invalid-api-key': 'La API key no es válida. Revisa VITE_FIREBASE_API_KEY en Vercel y vuelve a desplegar.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'La API key no es válida. Revisa VITE_FIREBASE_API_KEY en Vercel y vuelve a desplegar.',
    'auth/network-request-failed': 'No hay conexión con Google. Revisa tu internet e intenta otra vez.',
    'auth/internal-error': 'Google devolvió un error interno. Revisa que el dominio esté autorizado en Firebase.',
    'permission-denied': 'Firestore rechazó el guardado. Revisa que pegaste las reglas de firestore.rules y las publicaste.',
    'failed-precondition': 'Falta crear la base de datos Firestore en tu proyecto de Firebase.',
    'not-found': 'Falta crear la base de datos Firestore en tu proyecto de Firebase.'
  }
  return m[code] || 'No se pudo completar (' + (code || e.message || 'error desconocido') + ').'
}

let fb = null

async function iniciar() {
  const [appM, authM, fsM] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore')
  ])
  const app = appM.initializeApp(config)

  // App Check: frena bots y abuso de la base de datos
  if (env.VITE_RECAPTCHA_SITE_KEY) {
    const ac = await import('firebase/app-check')
    ac.initializeAppCheck(app, {
      provider: new ac.ReCaptchaV3Provider(env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    })
  }

  const auth = authM.getAuth(app)
  auth.languageCode = 'es'
  fb = { auth, db: fsM.getFirestore(app), authM, fsM }

  // Si se entró por redirección (plan B), aquí aparece el error si lo hubo
  authM.getRedirectResult(auth).catch((e) => (errorLogin.value = explicar(e)))

  authM.onAuthStateChanged(auth, async (u) => {
    usuario.value = u ? { uid: u.uid, nombre: u.displayName, foto: u.photoURL } : null
    if (!u) {
      estadoNube.value = 'local'
      authListo.value = true
      return
    }
    estadoNube.value = 'cargando'
    try {
      const snap = await fsM.getDoc(fsM.doc(fb.db, 'usuarios', u.uid))
      if (snap.exists() && snap.data().estado) {
        reemplazar(JSON.parse(snap.data().estado)) // ya tenías datos en la nube
      } else {
        await guardar() // primera vez: sube lo de este navegador
      }
      estadoNube.value = 'guardado'
    } catch (e) {
      console.error(e)
      errorLogin.value = explicar(e)
      estadoNube.value = 'error'
    }
    authListo.value = true
  })
}

async function guardar() {
  if (!fb || !usuario.value) return
  const { fsM, db } = fb
  try {
    await fsM.setDoc(fsM.doc(db, 'usuarios', usuario.value.uid), {
      estado: JSON.stringify(s),
      actualizado: fsM.serverTimestamp()
    })
    estadoNube.value = 'guardado'
  } catch (e) {
    console.error(e)
    errorLogin.value = explicar(e)
    estadoNube.value = 'error'
  }
}

if (nubeDisponible) {
  iniciar().catch((e) => {
    console.error(e)
    errorLogin.value = explicar(e)
    estadoNube.value = 'error'
    authListo.value = true
  })

  // Guarda en la nube un segundo después del último cambio
  let t
  watch(
    s,
    () => {
      if (!usuario.value || estadoNube.value === 'cargando') return
      clearTimeout(t)
      estadoNube.value = 'guardando'
      t = setTimeout(guardar, 1000)
    },
    { deep: true }
  )
}

export async function entrar() {
  if (!fb) return
  errorLogin.value = ''
  entrando.value = true
  const provider = new fb.authM.GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    await fb.authM.signInWithPopup(fb.auth, provider)
  } catch (e) {
    console.error(e)
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      // Plan B: si el navegador bloquea la ventana, entra en la misma pestaña
      await fb.authM.signInWithRedirect(fb.auth, provider)
      return
    }
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      errorLogin.value = explicar(e)
    }
  } finally {
    entrando.value = false
  }
}

export async function salir() {
  if (fb) await fb.authM.signOut(fb.auth)
}
