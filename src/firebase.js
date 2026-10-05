// Login con Google + guardado en la nube (Firestore).
// La configuración viene de variables de entorno (Vercel / .env.local), nunca del repo.
// Si no hay configuración, la app funciona igual pero solo guarda en este navegador.
// El SDK de Firebase se carga después de que la app ya se ve, para que abra rápido.
import { ref, watch } from 'vue'
import { s } from './store.js'

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
}

export const nubeDisponible = !!(config.apiKey && config.projectId)
export const usuario = ref(null)
// local | cargando | guardado | guardando | error | sin-config
export const estadoNube = ref(nubeDisponible ? 'local' : 'sin-config')

let fb = null // { auth, db, m: módulos }

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

  fb = { auth: authM.getAuth(app), db: fsM.getFirestore(app), authM, fsM }

  authM.onAuthStateChanged(fb.auth, async (u) => {
    usuario.value = u ? { uid: u.uid, nombre: u.displayName, foto: u.photoURL } : null
    if (!u) {
      estadoNube.value = 'local'
      return
    }
    estadoNube.value = 'cargando'
    try {
      const snap = await fsM.getDoc(fsM.doc(fb.db, 'usuarios', u.uid))
      if (snap.exists() && snap.data().estado) {
        Object.assign(s, JSON.parse(snap.data().estado)) // ya tenías datos en la nube
      } else {
        await guardar() // primera vez: sube lo de este navegador
      }
      estadoNube.value = 'guardado'
    } catch (e) {
      console.error(e)
      estadoNube.value = 'error'
    }
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
    estadoNube.value = 'error'
  }
}

if (nubeDisponible) {
  iniciar().catch((e) => {
    console.error(e)
    estadoNube.value = 'error'
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
  try {
    await fb.authM.signInWithPopup(fb.auth, new fb.authM.GoogleAuthProvider())
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') estadoNube.value = 'error'
  }
}

export async function salir() {
  if (fb) await fb.authM.signOut(fb.auth)
}
