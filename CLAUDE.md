# CLAUDE.md — Precise Cleaning · app del equipo (móvil)

## Rol

Eres un desarrollador senior de React Native y Expo. Este proyecto no lo escribimos nosotros:
lo heredamos de un desarrollador junior que lo generó en gran parte con IA. Trátalo con
escepticismo: antes de copiar un patrón existente, comprueba que sea correcto. Si encuentras una
mala práctica, señálala y propón la corrección; no la repliques.

## Contexto

- App de empleados de Precise Cleaning: React Native + Expo SDK 57, TypeScript, React Navigation 7.
- Sin backend propio: lee y escribe directo en **Firebase** (`bdprecise-2d4bc`, Firestore + Storage +
  Auth), el **mismo proyecto que usa la app web en producción**. No hay entorno de desarrollo:
  cualquier prueba toca datos reales.
- Se reemplazará a futuro por una app nueva con backend NestJS. Prioriza correcciones de
  estabilidad y seguridad sobre funciones nuevas o refactors grandes.
- Idioma de la interfaz: **solo inglés** (decisión del dueño).

## Forma de trabajar

- Cambios pequeños y verificables, un tema por commit o PR.
- Pregunta antes de: instalar o quitar dependencias, cambiar Security Rules o índices, cambiar
  campos de Firestore, publicar en las tiendas. No se despliega desde Claude.
- No afirmes nada (en código, docs o commits) que no hayas comprobado. Si algo solo se puede
  probar en un teléfono (cámara, fotos, sin señal), dilo explícitamente.
- Decisiones no obvias y pendientes → `code-notes.md`.

## Expo

- Expo cambia mucho entre versiones. Antes de usar una API de Expo, EAS o React Native, consulta
  la documentación de la versión del proyecto (`https://docs.expo.dev/versions/v57.0.0/`), no
  la memoria.
- Dependencias con `npx expo install <paquete>` (elige la versión compatible con el SDK), nunca
  `npm install` directo.
- `ios/` y `android/` se generan (Continuous Native Generation): no se crean ni se editan a mano.
  La configuración nativa va en `app.json` y en config plugins.
- Expo Go solo trae sus módulos nativos. Una librería con código nativo nuevo requiere un
  development build (`npx expo run:ios|android` o `eas build --profile development`).
- Navegación con React Navigation (`src/navigation/RootNavigator.tsx`), no Expo Router. No migrar.

## Código

### TypeScript y nombres

- TypeScript estricto (`strict: true`) con sintaxis moderna: `async/await`, desestructuración,
  optional chaining (`?.`), nullish coalescing (`??`), módulos ES.
- Nombres:
    - `camelCase` para variables, funciones, hooks y props.
    - `PascalCase` para componentes, tipos e interfaces.
    - `UPPER_SNAKE_CASE` para constantes de módulo (`MAX_ATTEMPTS`).
- **Nombres claros, sin abreviaciones (clean code).** El nombre dice qué es o qué hace, sin
  tener que leer el código alrededor:

    | En vez de…                    | Usa…                                                           |
    | ----------------------------- | -------------------------------------------------------------- |
    | `p`, `j`, `q`, `r`            | `property`, `job`, `queuedPhoto`, `record`                     |
    | `v`, `st`, `agg`, `idx`       | `visual`, `status`, `photoCount`, `photoIndex`                 |
    | `cfg`, `ctx`, `snap`, `err`   | `photoConfig`, `context`, `snapshot`, `error`                  |
    | `data`, `info`, `item`, `tmp` | el nombre del dominio: `jobs`, `payrollRecords`, `pendingNote` |
    - Funciones con verbo: `formatDate`, `loadCatalogs`, `canUndoMark`.
    - Booleanos como pregunta: `isOverdue`, `hasPhotos`, `canEdit`, `shouldRetry`.
    - Handlers con `handle` + evento: `handleStartPress`; sus props con `on`: `onStart`.
    - Excepciones aceptadas: `i` en un `for` corto, `_` para un parámetro que no se usa, y `t` /
      `fmt` de `src/constants/strings.ts`, que se usan en todas las vistas.
    - Igual que con las funciones flecha: renombra en los archivos que ya estés modificando.

- Archivos: componentes y pantallas `PascalCase.tsx`; hooks `useAlgo.ts`; servicios y utilidades
  `camelCase.ts`.
- Sin `any`. Evita `as` para "convencer" al compilador; si un dato externo puede faltar, tipéalo
  como opcional.
- **Funciones flecha** en lugar de `function`: componentes, hooks, servicios y utilidades.

    ```tsx
    const JobCard = ({ job, onOpen }: Props) => { … };
    export default JobCard;

    export const useNow = () => { … };
    export const formatDate = (value: string) => …;
    ```

    El código heredado usa `function`. Conviértelo solo en los archivos que ya estés modificando;
    no hagas cambios masivos de estilo en un PR aparte de su tarea.

- Tipos de props con `interface Props`, nunca en línea en la firma.
- Tipos del dominio en `src/types/index.ts`; los de un módulo grande en su propio archivo
  (`src/types/tasks.ts`). Uniones de literales para estados finitos
  (`'pending' | 'paid'`), no strings libres.

### Componentes

- Solo componentes de función escritos como flecha (ver arriba).
  Sin clases, sin HOC, sin `React.FC` ni `forwardRef` (React 19: `ref` es una prop).
- **Reutiliza antes de crear.** Revisa `src/components/ui/` y `src/components/` antes de escribir
  un componente nuevo. Si dos pantallas repiten la misma estructura, extráela.
  Primitivas disponibles en `src/components/ui/`: `AppText`, `Button`, `Touchable` (opacidad +
  háptico), `Chip`, `SelectableChip`, `IconBubble`, `GradientHeader`, `IconButton` (con contador),
  `GlassPillButton` (botón translúcido sobre el degradado), `SegmentedTabs` (`scrollable` si no
  caben), `TabBar`, `Card`, `InfoRow`, `FormSection`, `StripeCard` (tarjeta de lista con franja de color), `BottomActionBar`,
  `FieldButton` (campo que abre un selector), `TextField`, `Skeleton` (`JobCardSkeleton`,
  `CardSkeletonList`), `ProgressRing`, `EmptyState`, `Illustration`. En `src/components/`:
  `OptionPicker` (lista con búsqueda, selección simple o múltiple), `DueDateField` (con o sin hora),
  `TaskStateView` (estados de tareas y proyectos), `TaskCard`, `ProjectCard`, `ProjectsList`,
  `MessageThread` (hilo de mensajes con campo para escribir: notas de casas y comentarios de tareas),
  `TaskApprovalCard` (visto bueno de una tarea) y `ApproverField` (elegir quién aprueba; hook `useApprovers`),
  `AttachmentsSection` (ver, subir y quitar adjuntos; hook `useAttachments`, servicio genérico
  `attachmentsService`; solo tareas: los proyectos no llevan adjuntos). Toda subida a Storage pasa por
  `src/services/storageService.ts`.
  Hook `useKeyboardVisible` para ocultar barras fijas mientras se escribe.
- Las vistas se escriben con las primitivas del sistema de diseño, no con piezas básicas de
  React Native:

    | En vez de…                         | Usa…                     |
    | ---------------------------------- | ------------------------ |
    | `<Text>`                           | `<AppText variant tone>` |
    | `<Pressable>` / `TouchableOpacity` | `<Touchable>`            |
    | botón armado a mano                | `<Button>`               |
    | `<TextInput>`                      | `<TextField>`            |
    | lista vacía armada a mano          | `<EmptyState>`           |
    | spinner como placeholder           | `<Skeleton>`             |
    | `View` con fondo blanco y sombra   | `<Card>`                 |
    | barra fija de botones abajo        | `<BottomActionBar>`      |

    Si una primitiva no cubre un caso, extiéndela; no la saltes.

- Componentes pequeños y con una sola responsabilidad. Si un componente mezcla datos, lógica y
  presentación, mueve la lógica a un hook.

### Hooks

- La lógica con estado o efectos va en hooks propios (`src/hooks/useAlgo.ts`), no dentro de
  pantallas ni de archivos de navegación.
- **React Compiler activo**: no agregues `useMemo`, `useCallback` ni `memo`. Evita `try/finally`
  y `++` sobre variables capturadas dentro de componentes (el compilador se salta el componente).
- Cada `useEffect` que se suscribe a algo devuelve su función de limpieza.
- **Suscripciones en vivo:** toda lectura con `onSnapshot` en un hook o context usa
  `useLiveSubscription` (`src/hooks/useLiveSubscription.ts`): da `status` (`LoadStatus`), `value`,
  `hasFailed` y `retry`, y reintenta solo al volver la señal o la app al frente. No copies a mano
  el patrón de "clave + error + intento".
- **Escrituras desde la UI:** pasan por `useGuardedWrite` (`warnIfOffline`, `runWrite` con el mensaje
  de error de cada módulo). El autor de una escritura sale de `useCurrentActor`.
- Cada context expone un hook `useAlgo()` que lanza un error claro si se usa fuera de su provider.

### Datos (Firestore)

- **Los componentes y contexts no llaman a Firebase**: todo pasa por `src/services/*`.
- Cada colección se tipa una vez con `typedCollection<T>()` (`src/services/firestore.ts`).
- `onSnapshot` solo para lo que cambia mientras se mira (perfil, **rol del usuario**, casas,
  tareas, payroll). Catálogos y configuración: lectura única + `cached()` (`src/utils/memoryCache.ts`).
- **Permisos:** salen siempre de `settings_roles`. Se escucha en vivo **solo el rol del usuario**
  (`settings_roles/{system_users.roleId}`, `subscribeRole` en `sessionService`), nunca la colección
  completa. Única excepción: la lista de personas asignables de Tasks (`assignableUsersService`,
  solo para quien puede asignar o enviar a aprobar), que necesita saber qué roles ven el Task list. **No hay super admin por nombre de rol**: cada permiso
  sale de los flags del módulo correspondiente (los roles reales son Admin, Owner, Manager, System,
  Employee). **Fallar cerrado:** sin rol (ni del
  servidor ni guardado en el teléfono) la app no entra (`BlockedScreen` "noRole" / "roleError");
  nunca se supone un rol vacío con todo permitido.
- **Un error nunca se convierte en una lista vacía**: distingue "cargando", "vacío" y "error".
  `listen()` exige `onError`; un listener que falla se reintenta al volver la señal o la app al
  frente (`useForegroundRetry`, nunca en bucle) y la pantalla ofrece "Try again".
- **Permisos de Casas fallan cerrado**: sin `Houses.canView` no hay casas (ni consulta); sin
  `houses_form_config` (ni copia en el teléfono) la sesión muestra "Couldn't load your permissions".
- Las escrituras que dependen del estado actual del documento (Start/Finish, deshacer) van en
  `runTransaction` y validan ese estado.
- **La interfaz no es la seguridad.** Ocultar un botón no impide la acción: toda regla de
  permisos o de negocio tiene que existir también en las Security Rules.
- **Proyectos:** scope `All` de Task List ve todos; scope `Own` solo los relacionados (responsable, creador,
  su equipo o con una tarea abierta suya). Lo decide `useProjects`.
- Nunca descargues colecciones completas; filtra por empleado, equipo o ids. Clientes: solo los de
  las casas del empleado (`customersService`, por id, id legacy o nombre, en tandas de 30).
- Sin señal, Firestore entrega primero un resultado vacío "desde caché". `listen()` lo ignora a
  propósito: si no, la app avisaría "casa retirada" de todas. No quites esa protección.

### Estilos

- Nada de estilos en línea con valores fijos: `StyleSheet.create` en `Componente.styles.ts`,
  junto al componente. Todo valor sale de `src/theme/tokens.ts`.
- En línea solo valores calculados en tiempo de ejecución (color de un status de Firestore,
  `useSafeAreaInsets`, `useWindowDimensions`).
- Estados finitos → variantes en el StyleSheet, no ternarios con colores sueltos.
- Colores que vienen de Firestore pasan por `withAlpha` / `safeColor` (`src/utils/color.ts`):
  la oficina puede escribir formatos que React Native no pinta.
- `pointerEvents` va en el estilo, no como prop (deprecado).

### Textos, fechas e íconos

- Textos de interfaz en inglés, centralizados en `src/constants/strings.ts` (`import { t, fmt }`);
  nunca escritos en el JSX. Sin i18n ni context de idioma: si algún día vuelve otro idioma, se
  reintroduce a partir de este archivo.
- Fechas con `src/utils/dateFormat.ts` (`formatDate` MM/DD/YYYY, `formatTime` h:mm AM/PM).
  Nunca `toLocaleDateString` / `toLocaleTimeString`. "Hoy" sale de `useNow()`.
- Íconos: `lucide-react-native`.

### Formato

- Prettier con `.prettierrc` (comillas simples, 180 columnas, indentación de 4 espacios).
  VS Code formatea al guardar (`.vscode/settings.json`).

## Estilo visual (al cliente le gusta: no cambiarlo)

- **Tokens** en `src/theme/tokens.ts`: azul de la marca y degradado azul→índigo en encabezados.
- Acentos con significado fijo, nunca decorativos:
  `sky` por hacer/agenda · `violet` en curso · `mint` terminado/pagado ·
  `amber` fotos y pendientes · `coral` atrasado/alertas · `teal` notas.
  Fondo y texto de un acento → `solidBg`, `softBg`, `inkText` (`src/theme/accentStyles.ts`).
- Tipografía Plus Jakarta Sans, siempre vía `<AppText>`; nunca `fontWeight` (el peso lo da la familia).
- Encabezados con `GradientHeader` + `StatusScrim`. La barra inferior es flotante: deja
  `TAB_BAR_SPACE` al final de cada lista.
- **Sin animaciones**, salvo `AnimatedSplash`, `LoadingScreen` y la campana de `IconButton`.
  Sin transiciones entre pantallas (`animation: 'none'`) ni `animationType` en modales.
  Reanimated 4: shared values con `.set()`; de worklets a JS, `scheduleOnRN`.
- Pantallas nuevas: copia la estructura visual de una existente parecida antes de inventar una.

## Contrato con la app web (no romper)

Las dos apps escriben los mismos documentos. Si cambias uno de estos campos, la web se rompe.

**Tareas y Proyectos** (`user_tasks`, `task_projects`, `app_settings/task_list_tabs`) tienen su propio
contrato: lee **`tasks-contract.md`** completo antes de tocar ese módulo. Sus permisos salen de
`settings_roles` (módulo `Task List`) con `taskListPermissionsOf()`, como el resto de la app; la
colección `user_access` que proponía la web no existe y no se usa.

| Qué                 | Dónde                                                                                                                                                                                                                                                                           | Quién escribe        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Perfil del empleado | `system_users` (match por `email` en minúsculas)                                                                                                                                                                                                                                | Web                  |
| Rol / permisos      | `settings_roles` (todo por flags, sin super admin; `Houses`: `canView`, `allowedStatusIds`, `readOnlyFields`, `canEdit`; `Payroll.canView` muestra la pestaña)                                                                                                                                                     | Web                  |
| Visibilidad por rol | `app_settings/houses_form_config` (`visibility[elementId] = roleId[]`, `readOnly`) — mismos ids que `HousesView.tsx` de la web: `btn_startJob`, `btn_markFinished`, `btn_takePhoto`, `btn_uploadPhoto`, `card_photos`, `btn_tabMedia`, `employeeNote`, `note`, `status_<id>`, … | Web                  |
| Config de fotos     | `app_settings/photo_config`                                                                                                                                                                                                                                                     | Web                  |
| Casas asignadas     | `properties` donde `assignedWorkers` contiene el id del usuario **o** `teamId` = su equipo                                                                                                                                                                                      | Web                  |
| Start / Finish      | `employeeStartedAt/By/ById`, `employeeFinishedAt/By/ById` (ISO, nombre completo, id)                                                                                                                                                                                            | Móvil y web          |
| Fotos               | Storage `{Cliente}/BeforePhotos\|AfterPhotos/{dirección}_{marca única}.jpg`; URL agregada con `arrayUnion` a `beforePhotos` / `afterPhotos`                                                                                                                                     | Móvil y web          |
| Notas               | `employeeNote` (texto concatenado con `\n`) + entrada en `notesHistory` `{field, text, user: email, at, action}`                                                                                                                                                                | Móvil y web          |
| Payroll             | `payroll` filtrado por `employeeId`; total = `totalAmount` o `base + extra − discount`                                                                                                                                                                                          | Web (móvil solo lee) |
| Bitácora            | `activity_logs`; `detail` termina en `"(app móvil)"` — no cambiar sin confirmar con la web                                                                                                                                                                                      | Ambas                |

Si la web cambia uno de estos campos, actualiza `src/types/index.ts` y el servicio correspondiente.
Reglas de negocio portadas de la web: fotos bloqueadas hasta Start Job para roles sin Edit;
Finish exige Start + ≥1 foto Before y ≥1 After; solo quien marcó o un admin puede deshacer.

## Sin conexión

- Fotos: `src/context/PhotoQueueContext.tsx` (cola en disco en `Paths.document/pending-photos`;
  se guarda solo el nombre del archivo, porque en iOS la ruta de la app cambia con cada
  actualización). Los errores de conexión no cuentan como intento; espera creciente (30 s → 10 min).
  Cada foto se comprime **al agregarla** (`compressPhoto`, reglas en `src/utils/photoCompression.ts`
  según `photo_config`, con límites para valores inválidos) y se borra la copia del picker. La subida
  tiene dos pasos: Storage (guarda `uploadedUrl` en la cola) y `addPhotoUrl` (`arrayUnion`); un
  reintento nunca vuelve a subir un archivo que ya está en Storage.
- Start/Finish y notas: `src/context/OutboxContext.tsx` (Firestore en RN no tiene caché
  persistente). Las notas son idempotentes: no se duplican al reintentar. Start/Finish guarda el
  valor que vio el empleado (`guard`) y se aplica en transacción (`decideMark`): si alguien más
  cambió la casa antes, no se pisa y se avisa. Mientras está en cola, `withPendingMarks` lo muestra.
  La bitácora (`activity_logs`) de Start/Finish se escribe solo después de que el servidor confirma.
- Las dos colas usan `src/hooks/usePersistentList.ts` y `src/hooks/useWhenOnline.ts` (envían al
  volver la señal y al volver la app al frente) y guardan el `userId`: nunca se sube nada de otro
  empleado que usó el mismo teléfono.
- Limitaciones conocidas: al abrir la app sin señal no hay casas en caché, y Finish no cuenta
  las fotos en cola. Cualquier cambio aquí se prueba en un teléfono en modo avión.

## Notificaciones

- `src/context/NotificationsContext.tsx` + `src/utils/notificationDiff.ts` (lógica pura) comparan
  lo visto con lo que llega en vivo: casa asignada o retirada, cambio de horario o de status, nota
  de la oficina, pago registrado o marcado Paid.
- Solo comparan con señal y cuando `useJobs().settled` es `true`, para no dar avisos falsos.
  La primera vez solo toman la foto inicial.
- Con la app cerrada no hay push (requeriría Cloud Function + FCM).

## Cloud Functions (`functions/`, correos)

- Codebase **`mobile`** del mismo proyecto de Firebase (`firebase.json` en la raíz). Corren en Firebase,
  no en el teléfono: la app publicada no las llama; Firestore las dispara en cada escritura, venga de la web
  o del móvil. No tocan las funciones de la web (codebase `default`, repo `web-jesus`).
- **Correos de Tasks:** `notifyontaskwrite` (`user_tasks/{taskId}`). Lógica pura y probada en
  `functions/src/taskEvents.ts` (a quién avisar) y `functions/src/emails.ts` (plantillas en inglés, todo lo de
  Firestore escapado). Cada aviso se registra en `task_notifications` con id fijo por evento y persona:
  un reintento no duplica el correo, y el estado (`SENT` / `ERROR` + motivo) queda visible.
- SMTP con `nodemailer` y **secretos propios** en Secret Manager: `CREW_SMTP_HOST`, `CREW_SMTP_PORT`,
  `CREW_SMTP_USER`, `CREW_SMTP_PASS`, `CREW_SMTP_FROM`. **No** se usan ni se modifican los `SMTP_*` de la web.
  **Nunca** credenciales en el repo; `functions/.secret.local` (solo emulador) está en `.gitignore`.
- Es un proyecto Node aparte (`functions/package.json`, `npm install` ahí, no `expo install`). Excluido de
  TypeScript, ESLint y Metro de la app.
- **Despliegue (lo hace Antonio, nunca Claude):** `firebase deploy --only functions:mobile` desde la raíz.
- Probar sin producción: `npm test` en `functions/` (lógica pura) y emuladores con un proyecto `demo-`
  (`firebase emulators:exec --project demo-precise --only functions,firestore ...`).

## Verificación

```bash
npx tsc --noEmit
npx expo lint
npm run format:check                 # formato Prettier (npm run format lo corrige)
npx expo-doctor
npx expo export --platform android   # y --platform ios: confirma que Metro empaqueta
grep -rn "style={{" src              # solo valores de runtime
(cd functions && npm test)           # si cambiaste functions/: compila y corre las pruebas
```

Compilar no prueba que funcione: cámara, fotos y conexión se prueban en un teléfono
(Expo Go o development build).
