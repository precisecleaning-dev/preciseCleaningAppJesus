# code-notes.md — decisiones y pendientes (app móvil)

## 2026-10-12 · Idioma, estilos de pantallas y áreas seguras

- **Sin i18n**: la app es solo en español. Se quitaron `LanguageContext`, el diccionario en inglés,
  el selector de idioma del perfil y la librería `expo-localization`. Los textos siguen centralizados
  en `src/constants/texts.ts` para no repetirlos dentro de las pantallas.
- **Estilos de pantallas** en `src/styles/` (pedido del dueño). Los de componentes siguen junto a
  cada componente.
- **Áreas seguras**: auditoría sin fallas graves (un solo `SafeAreaProvider`, ningún `SafeAreaView`
  de `react-native`, ninguno envolviendo navegadores ni componentes pequeños). Mejoras:
  `initialMetrics` en el provider, `edges` explícitos en los 3 `SafeAreaView`, espacio inferior de
  las listas calculado con el inset real (`useTabBarSpace`) en vez de 120 px fijos, e inset inferior
  en Login y Avisos.
- `supportsTablet: false`: en iPad corre como app de iPhone, siempre vertical (no hacen falta
  capturas de iPad para la App Store).

## 2026-10-09 · Revisión para producción

### Decisiones
- **Sin comentarios en el código** (pedido del dueño). Lo que antes explicaban los comentarios está
  en `CLAUDE.md` y aquí.
- **Animaciones**: solo la apertura (`AnimatedSplash`), la pantalla de carga al iniciar y al cerrar
  sesión (`LoadingScreen`, mínimo 1,2 s para que se vea) y la campana (`IconButton`). Se quitaron
  confeti, números que cuentan, cascadas, pestañas con resorte, ilustraciones flotantes, brillo de
  los esqueletos, sacudida del login y transiciones entre pantallas. El aviso que baja (toast) ahora
  aparece fijo; ya no se desliza para cerrarlo (tiene botón ×).
- **React Compiler activado** (`app.json`). Se quitaron `useMemo`, `useCallback`, `memo` y
  `forwardRef`. El compilador no optimiza componentes con `try/finally` ni con `++` sobre variables
  capturadas: por eso las colas usan cadenas de promesas y funciones de módulo (`uploadOne`).
- **Firestore sale de los componentes**: todo pasa por `src/services/*` con `typedCollection<T>()`.
  `PayrollScreen` y `LoginScreen` ya no importan Firebase.
- **Menos lecturas**:
  - `customers` ya no se descarga completa: solo los clientes de las casas del empleado
    (por id, id legacy de AppSheet o nombre, en tandas de 30). Si una tanda falla, se reintenta al
    volver la señal o la app al frente.
  - Statuses, equipos, prioridades, productos, servicios, `photo_config`, roles y
    `houses_form_config` pasaron de `onSnapshot` permanente a una lectura del servidor con caché de
    10 min. Un cambio de la oficina en esos catálogos llega al volver a abrir la app o pasados 10 min.
  - Si el rol no puede leer un catálogo (permission-denied) se usa una lista vacía en vez de dejar
    la app sin catálogos.
- **Sin señal al abrir**: un resultado vacío "desde caché" se ignora en todas las consultas en vivo
  (`listen()`), y los avisos solo se calculan con señal. Antes podía avisar "casa retirada" de todas.
- **Fotos**: la subida lleva `cacheControl: public, max-age=31536000` (nombres únicos). Se quitó la
  compatibilidad con colas viejas que guardaban la ruta completa (`fileUri`): la app no está
  publicada todavía.
- **Fechas**: `dateFormat.ts` reescrito sin `toLocaleTimeString`. Una fecha sin hora (AAAA-MM-DD)
  se toma como día local (antes `formatDateTime` la corría al día anterior en Texas). Fechas
  imposibles (02/30) se muestran tal cual en vez de "corregirse" solas.
- **"Hoy"** se recalcula cada minuto y al volver la app (`useNow`): antes, con la app abierta toda
  la noche, seguía mostrando la fecha y el saludo de ayer.
- `getJob` busca en todas las casas del empleado (también las de un status oculto), para que la
  ficha abierta no desaparezca si la oficina cambia el status mientras se trabaja.
- Se quitó el "deslizar para actualizar" de Inicio: no hacía nada (los datos ya llegan en vivo).
- Configuración de Firebase escrita en `src/config/firebase.ts`: no es secreta (la protección son las
  Security Rules) y así EAS Build no depende de un `.env` que git ignora.
- Formato con Prettier (`.prettierrc`).

### Pendientes (preguntar antes)
- `react-native-gesture-handler` ya no se usa (solo servía para deslizar el aviso). Quitarlo de
  `package.json` cuando el dueño lo apruebe.
- Bug de prioridad alta reportado por Antonio: al cerrar sesión y volver a entrar, la lista de
  casas se queda cargando hasta reiniciar la app.
- Push con la app cerrada: requiere Cloud Function + FCM.
- La consulta de casas del equipo no tiene ventana de fechas; en equipos con mucho historial,
  agregar un filtro por fecha necesita un índice compuesto en Firestore.
