# CLAUDE.md — Precise Cleaning · app del equipo (móvil)

App React Native + Expo (SDK 57, TypeScript) para los empleados de Precise Cleaning.
Comparte el **mismo proyecto de Firebase** (`bdprecise-2d4bc`) que la app web
`Precise-Cleaning-Services-App`. No hay backend propio: las dos apps leen y escriben
los mismos documentos.

## Forma de trabajar

- Sigue también el `CLAUDE.md` de la web (mismas reglas, adaptadas a React Native aquí).
- Cambios pequeños y verificables. Pregunta antes de instalar o quitar dependencias, cambiar
  Security Rules o índices, o publicar en las tiendas. No se despliega desde Claude.
- Decisiones no obvias y pendientes → `code-notes.md`.

## Contrato con la app web (no romper)

| Qué | Dónde | Quién escribe |
|---|---|---|
| Perfil del empleado | `system_users` (match por `email` en minúsculas) | Web |
| Rol / permisos | `settings_roles` (`Administrator` = super admin; módulo `Houses`: `scope`, `allowedStatusIds`, `readOnlyFields`, `canEdit`) | Web |
| Visibilidad por rol | `app_settings/houses_form_config` (`visibility[elementId] = roleId[]`, `readOnly`) — mismos ids que `HousesView.tsx` (`btn_startJob`, `btn_markFinished`, `btn_takePhoto`, `btn_uploadPhoto`, `card_photos`, `btn_tabMedia`, `employeeNote`, `note`, `status_<id>`, …) | Web |
| Config de fotos | `app_settings/photo_config` | Web |
| Casas asignadas | `properties` donde `assignedWorkers` contiene el id del usuario **o** `teamId` = su equipo | Web asigna |
| Start / Finish | `employeeStartedAt/By/ById`, `employeeFinishedAt/By/ById` (ISO, nombre completo, id) | Móvil y web |
| Fotos | Storage `{Cliente}/BeforePhotos|AfterPhotos/{dirección}_{marca única}.jpg`; URL agregada con `arrayUnion` a `beforePhotos` / `afterPhotos` | Móvil y web |
| Notas | `employeeNote` (texto concatenado con `\n`) + entrada en `notesHistory` `{field, text, user: email, at, action}` | Móvil y web |
| Payroll | `payroll` filtrado por `employeeId`; total = `totalAmount` o `base + extra − discount` | Web (móvil solo lee) |
| Bitácora | `activity_logs` (mismo formato que `activityLogService.ts`, `detail` termina en "(app móvil)") | Ambas |

Si la web renombra o agrega uno de estos campos, hay que reflejarlo en `src/types/index.ts`
y en el servicio correspondiente. Las reglas de negocio están portadas de `HousesView.tsx`
(fotos bloqueadas hasta Start Job para roles sin Edit; Finish exige Start + ≥1 foto Before
y ≥1 After; solo quien marcó o un admin puede deshacer).

## Sin conexión

- **Fotos**: `src/context/PhotoQueueContext.tsx` — cola en disco (`Paths.document/pending-photos`)
  + `usePersistentList`. Se guarda solo el NOMBRE del archivo (en iOS la ruta de la app cambia con
  cada actualización). Errores de conexión no cuentan como intento; espera creciente (30 s → 10 min).
- **Start/Finish y notas**: `src/context/OutboxContext.tsx` — Firestore en RN no tiene caché
  persistente, así que los cambios se guardan en el teléfono hasta que el servidor confirma.
  Las notas son idempotentes (no se duplican al reintentar).
- Las dos colas usan `src/hooks/usePersistentList.ts` y `src/hooks/useWhenOnline.ts` (envían al
  volver la señal y al volver la app al frente) y guardan el `userId`: nunca se sube nada de otro
  empleado que usó el mismo teléfono.
- Sin señal, Firestore entrega primero un resultado vacío "desde caché": `listen()` de
  `src/services/firestore.ts` lo ignora (si no, la app avisaría "casa retirada" de todas).

## Diseño (sistema visual)

- **Tokens** en `src/theme/tokens.ts`: azul de la marca + degradado azul→índigo en
  encabezados, y acentos con SIGNIFICADO fijo — no usarlos como decoración:
  `sky` por hacer/agenda · `violet` en curso · `mint` terminado/pagado ·
  `amber` fotos y pendientes · `coral` atrasado/alertas · `teal` notas.
  Fondo/texto de un acento → `solidBg`, `softBg`, `inkText` de `src/theme/accentStyles.ts`.
- **Tipografía**: Plus Jakarta Sans (`@expo-google-fonts`), siempre vía `<AppText variant tone>`.
  Nunca `<Text>` suelto ni `fontWeight` (en RN el peso lo da la familia).
- **Primitivas** en `src/components/ui/`: `AppText`, `Button`, `Touchable` (toque con opacidad +
  háptico), `Chip`, `IconBubble`, `GradientHeader`, `IconButton` (con contador), `SegmentedTabs`,
  `TabBar`, `Skeleton`, `ProgressRing`, `EmptyState`, `Illustration`, `TextField`. Úsalas antes de
  crear algo nuevo.
- **Colores de Firestore** (status, equipo) pasan por `src/utils/color.ts` (`withAlpha`,
  `safeColor`): la oficina puede escribir formatos que RN no pinta.
- Encabezados con degradado + `StatusScrim` (franja azul tras la barra de estado).
  La barra inferior es flotante: deja `TAB_BAR_SPACE` al final de cada lista.


## Movimiento: solo carga y campana

Decisión del dueño: la app NO lleva animaciones, salvo:
- `AnimatedSplash` (al abrir la app; continúa la pantalla nativa azul + logo blanco),
- `LoadingScreen` al iniciar sesión (mínimo 1,2 s) y al cerrar sesión (estado `signingOut`),
- `IconButton` con contador: la campana se balancea y el número rebota cuando llega un aviso.

Todo lo demás es estático: sin `entering`/`exiting`, sin transiciones entre pantallas
(`animation: 'none'`), sin `animationType` en modales ni `transition` en imágenes.
Reanimated 4: escribir shared values con `.set()`; desde worklets a JS, `scheduleOnRN`.


## Notificaciones

`src/context/NotificationsContext.tsx` + `src/utils/notificationDiff.ts` (lógica pura) comparan lo visto con lo que llega en vivo y avisa:
casa asignada / retirada, cambio de horario, de status, nota de la oficina, pago registrado,
pago marcado Paid. Solo compara con señal y cuando `useJobs().settled` es true (asignadas + equipo +
catálogos + roles + Field Visibility + clientes ya respondieron), para no dar falsos avisos.
La primera vez solo toma la foto inicial. Con la app cerrada NO hay push (requiere Cloud
Function + FCM).

## Estilos (equivalente RN de las reglas de la web)

- Nada de estilos inline con valores fijos. Cada componente tiene su `Componente.styles.ts`
  hermano con `StyleSheet.create`; los de las pantallas viven en `src/styles/`
  (`src/screens/HomeScreen.tsx` → `src/styles/HomeScreen.styles.ts`). Todo valor sale de
  `src/theme/tokens.ts`.
- Inline solo para valores de **tiempo de ejecución** (color de un status que viene de
  Firestore, medidas de `useWindowDimensions`, insets del área segura).
- Estados finitos → variantes en el StyleSheet, no ternarios con colores sueltos.
- `pointerEvents` va en el estilo, no como prop (deprecado).
- No hay `:hover` en móvil: usa `Touchable`.

## Áreas seguras (notch, barra de estado, barra de gestos)

- Un solo `SafeAreaProvider`, en `App.tsx`, con `initialMetrics={initialWindowMetrics}` (sin salto
  en el primer cuadro). Nunca otro dentro de pantallas o componentes.
- Nunca el `SafeAreaView` de `react-native`: solo el de `react-native-safe-area-context`.
- Nunca envolver un Navigator con `SafeAreaView`.
- Preferir `useSafeAreaInsets()` y aplicar el inset solo donde hace falta:
  `GradientHeader` (arriba), `StatusScrim` (franja de la barra de estado), `TabBar` (abajo),
  `NotificationToast` y `OfflineBanner` (arriba), barra de acciones de `JobDetailScreen` (abajo).
- Listas sobre la barra de pestañas: `useTabBarSpace()` (altura real de la barra + inset inferior).
- `SafeAreaView` solo en pantallas completas sin encabezado propio (`OnboardingScreen`,
  `BlockedScreen`, `PhotoViewer`) y siempre con `edges` explícitos.
- La app es solo vertical (`orientation: portrait`, `supportsTablet: false`): los insets
  `left`/`right` valen 0. Si algún día se permite girar, hay que aplicarlos en esos mismos lugares.

## Código

- Sin comentarios en el código: lo que no sea obvio va en `code-notes.md`.
- `export default function Componente(props: Props)`, sin `React.FC` ni `forwardRef` (React 19:
  `ref` es una prop).
- **React Compiler activo** (`app.json → experiments.reactCompiler`): no agregues
  `useMemo`/`useCallback`/`memo`. Evita `try/finally` y `++` sobre variables capturadas dentro de
  componentes (el compilador se salta el componente): usa cadenas de promesas o funciones de módulo.
- Íconos: `lucide-react-native`.
- Sin `any`. Cada colección se tipa una vez con `typedCollection<T>()` (`src/services/firestore.ts`).
- **Los componentes y contexts no llaman a Firestore**: usan `src/services/*`
  (`sessionService`, `catalogService`, `customersService`, `propertiesService`, `payrollService`,
  `jobsService`, `photoService`, `activityLog`).
- `onSnapshot` solo para lo que cambia mientras se mira: perfil, casas asignadas/del equipo,
  payroll. Catálogos, roles y "Field & Button Visibility" → lectura única del servidor +
  `cached()` (`src/utils/memoryCache.ts`, 10 min), refrescada con `useWhenOnline`.
- Clientes: nunca la colección completa; solo los de las casas del empleado
  (`customersService`, por id, id legacy o nombre, en tandas de 30).
- Fechas: `src/utils/dateFormat.ts` (`formatDate` MM/DD/AAAA, `formatTime` h:mm AM/PM,
  `formatDateTime`). Nunca `toLocaleDateString`/`toLocaleTimeString`.
- "Hoy" y la hora en pantalla salen de `useNow()` (se actualiza cada minuto y al volver la app).
- La app es solo en español. Los textos de UI están en `src/constants/texts.ts` (`texts.x`,
  `fmt()` para variables), nunca escritos en el JSX.
- Formato: Prettier con `.prettierrc` (comillas simples, 180 columnas).


## Verificación

```bash
grep -rn "style={{" src            # solo medidas de pantalla calculadas en runtime
npx tsc --noEmit
npx eslint .
npx knip                           # código sin uso (expo-updates/expo-system-ui: falso positivo)
npx expo export --platform android # y --platform ios: confirma que Metro empaqueta
```
`tsc`/`eslint`/`export` prueban que compila, no que funciona: lo que toque cámara, fotos o
conexión hay que probarlo en un teléfono (Expo Go o development build).
