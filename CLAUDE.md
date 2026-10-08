# CLAUDE.md — Precise Cleaning · app del equipo (móvil)

App React Native + Expo (SDK 57, TypeScript) para los empleados de Precise Cleaning.
Comparte el **mismo proyecto de Firebase** (`bdprecise-2d4bc`) que la app web
`Precise-Cleaning-Services-App`. No hay backend propio: las dos apps leen y escriben
los mismos documentos.

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
  + AsyncStorage. Se guarda solo el NOMBRE del archivo (en iOS la ruta de la app cambia con
  cada actualización). Errores de conexión no cuentan como intento; backoff exponencial.
- **Start/Finish y notas**: `src/context/OutboxContext.tsx` — Firestore en RN no tiene caché
  persistente, así que los cambios se guardan en AsyncStorage hasta que el servidor confirma.
  Las notas son idempotentes (no se duplican al reintentar).
- Ambas colas guardan el `userId`: nunca se sube nada de otro empleado que usó el mismo teléfono.

## Diseño (sistema visual)

- **Tokens** en `src/theme/tokens.ts`: azul de la marca + degradado azul→índigo en
  encabezados, y acentos con SIGNIFICADO fijo — no usarlos como decoración:
  `sky` por hacer/agenda · `violet` en curso · `mint` terminado/pagado ·
  `amber` fotos y pendientes · `coral` atrasado/alertas · `teal` notas.
- **Tipografía**: Plus Jakarta Sans (`@expo-google-fonts`), siempre vía `<AppText variant tone>`.
  Nunca `<Text>` suelto ni `fontWeight` (en RN el peso lo da la familia).
- **Primitivas** en `src/components/ui/`: `AppText`, `Button`, `PressableScale` (resorte +
  háptico), `Chip`, `IconBubble`, `GradientHeader`, `IconButton` (con contador),
  `SegmentedTabs`, `TabBar`, `Skeleton`, `AnimatedNumber`, `ProgressRing`, `EmptyState`,
  `FloatingIllustration`, `TextField`. Úsalas antes de crear algo nuevo.
- **Colores de Firestore** (status, equipo) pasan por `src/utils/color.ts` (`withAlpha`,
  `safeColor`): la oficina puede escribir formatos que RN no pinta.
- Encabezados con degradado + `StatusScrim` (franja azul tras la barra de estado).
  La barra inferior es flotante: deja `TAB_BAR_SPACE` al final de cada lista.

## Movimiento (Reanimated 4)

- Animaciones en el hilo de UI con `react-native-reanimated`; escribir shared values con
  `.set()` (no `.value =`, lo marca el lint del React Compiler). Desde worklets hacia JS:
  `scheduleOnRN` de `react-native-worklets`.
- Duraciones y resortes de `motion` en tokens; listas entran en cascada (`motion.stagger`).
- Respetar "reducir movimiento" (`useReducedMotion`) en loops y efectos decorativos.
- Apertura: `AnimatedSplash` (continúa la pantalla nativa azul + logo blanco).
  Bienvenida de 3 pasos solo la primera vez (`pc_crew_onboarded_v1`).

## Notificaciones

`src/context/NotificationsContext.tsx` compara lo visto con lo que llega en vivo y avisa:
casa asignada / retirada, cambio de horario, de status, nota de la oficina, pago registrado,
pago marcado Paid. Solo compara cuando `useJobs().settled` es true (asignadas + equipo +
statuses + roles + Field Visibility + clientes ya respondieron), para no dar falsos avisos.
La primera vez solo toma la foto inicial. Con la app cerrada NO hay push (requiere Cloud
Function + FCM).

## Estilos (equivalente RN de las reglas de la web)

- Nada de estilos inline con valores fijos. Cada componente tiene su `Componente.styles.ts`
  hermano con `StyleSheet.create`; todo valor sale de `src/theme/tokens.ts`.
- Inline solo para valores de **tiempo de ejecución** (color de un status que viene de
  Firestore, medidas de `useWindowDimensions`, insets del área segura).
- Estados finitos → variantes en el StyleSheet, no ternarios con colores sueltos.
- `pointerEvents` va en el estilo, no como prop (deprecado).
- No hay `:hover` en móvil: usa `PressableScale`.

## Código

- `export default function Componente(props: Props)`, sin `React.FC`.
- Íconos: `lucide-react-native`.
- Sin `any`; los datos de Firestore se castean al tipo real donde se leen.
- Los datos vienen de listeners `onSnapshot` en los contexts (`Session`, `Catalogs`, `Jobs`):
  no hagas `getDocs` de esas colecciones dentro de una pantalla.
- Textos de UI en `src/i18n/strings.ts` (español e inglés), nunca escritos en el JSX.

## Verificación

```bash
npx tsc --noEmit
npx eslint .
npx expo export --platform android   # y --platform ios: confirma que Metro empaqueta
```
`tsc`/`eslint`/`export` prueban que compila, no que funciona: lo que toque cámara, fotos o
conexión hay que probarlo en un teléfono (Expo Go o development build).
