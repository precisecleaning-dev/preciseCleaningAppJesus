# code-notes.md — decisiones y pendientes (app móvil)

## 2026-10-28 · Refactors de revisión (datos de Firestore, Auth, Touchable)

- **Bug arreglado:** el historial de aprobación hacía `comment.text.trim()`; un comentario sin `text` en
  Firestore tiraba el detalle de la tarea. Causa de fondo: los normalizadores usaban `as` sobre datos externos.
- **`src/utils/taskValues.ts`** (puro, probado con datos rotos): comentarios, asignados, adjuntos, `approval` y
  `repeat` se validan al leer (`tasksService`, `projectsService`). Decisiones:
  - adjuntos incompletos se descartan, los válidos se conservan **idénticos** (`arrayRemove` necesita el mismo objeto);
  - `approval` con status desconocido se lee como `'draft'` (sigue bloqueando completar: falla cerrado);
  - `repeat` con frecuencia desconocida se ignora (no se genera la siguiente); `timesLeft` ausente sigue ausente;
  - `approval` y `repeat` conservan campos desconocidos porque se reescriben a partir de lo leído;
  - `durationMinutes` igual que antes (sin redondear: cambiarlo desajustaría los contadores del proyecto).
- **Auth:** `onAuthStateChanged` pasó de `SessionContext` a `sessionService.subscribeAuthUser`; ya no hay imports
  de Firebase fuera de `services/` y `config/`.
- **`Touchable`** en vez de `Pressable` en `LoginScreen`, `NotificationToast` y `PhotoViewer` (y esos archivos a
  funciones flecha y nombres claros). Efecto visible: esos botones ahora dan vibración ligera y opacidad al tocar.
- **Pendiente (fuera de este alcance):** quedan `as` en `firestore.ts` (convertidor genérico de las demás
  colecciones), `houses_form_config`, `photo_config` (mitigado por `compressionSettingsOf`) y `jobsService`.

## 2026-10-28 · Correos de Tasks (parte 1 de 4: tarea asignada)

- **Dónde:** Cloud Functions en `app-jesus/functions`, codebase `mobile` (decisión de Antonio: que la app no
  dependa del repo de la web). Mandan el correo directo por SMTP (no usan `sendmailqueue` de la web) con
  **secretos propios `CREW_SMTP_*`** (decisión del 28/10/2026: no tocar los `SMTP_*` de la web).
- **Hallazgo:** los `SMTP_*` de la web están mal cargados (`SMTP_HOST` guardó el texto del prompt del CLI y
  `SMTP_USER` tiene el correo dos veces), así que los correos de Quality Check (`sendmailqueue`) no pueden
  salir. Recuperar contraseña e invitaciones no dependen de eso (usan Firebase Auth). Avisar a la web.
- **Parte 1:** `notifyontaskwrite` avisa "You have a new task" a quien se asigna (tarea nueva abierta o personas
  agregadas al editar). No al creador, no a usuarios `Inactive` o sin email válido, no en repeticiones.
- **`repeatOfTaskId`** (aprobado): el móvil lo escribe en la tarea que genera una repetición. **Pendiente en la
  web** (`completeTask` de `userTasksService`); hasta entonces sus repeticiones sí mandan correo.
- **Versiones:** firebase-functions 7.4, firebase-admin 14.5, nodemailer 10.2.1 (0 vulnerabilidades). La web
  usa nodemailer 6.10.1, que tiene vulnerabilidades altas (análisis de direcciones: puede entregar a otro
  dominio): **conviene actualizarla también en `web-jesus/functions`.**
- **Probado:** 10 pruebas unitarias (`npm test` en `functions/`) y escenario completo en emuladores (proyecto
  `demo-precise`, SMTP falso local): tarea nueva → correo a Ana (no a Luis inactivo ni al creador); agregar a
  Pepe → correo a Pepe; cambiar el título → nada; repetición → nada. Correo revisado: título escapado en el
  HTML, asunto en una línea, fecha MM/DD/YYYY. **No probado con Gmail real ni en producción.**
- Para los emuladores, `firebase-tools` 15 pide Java 21 (aquí hay 17): se usó `npx firebase-tools@14`.
- **Para desplegar (Antonio):**
  1. `npm i -g firebase-tools` y `firebase login` con una cuenta del proyecto `bdprecise-2d4bc`.
  2. Cargar los secretos propios con `firebase functions:secrets:set CREW_SMTP_HOST` (y `CREW_SMTP_PORT`,
     `CREW_SMTP_USER`, `CREW_SMTP_PASS`, `CREW_SMTP_FROM`), escribiendo **solo el valor** en el prompt.
     Valores: host `smtp.gmail.com`, puerto `587`, usuario `no-reply@precisecleaningtx.com`, from
     `Precise Cleaning <no-reply@precisecleaningtx.com>` (la contraseña de aplicación no se anota aquí).
     Verificar con `firebase functions:secrets:access` (no para la contraseña).
  3. `cd functions && npm install && npm test`, luego desde la raíz `firebase deploy --only functions:mobile`.
  4. Probar con una tarea de prueba asignada a un usuario de prueba y revisar `task_notifications`.
- **Opcional:** `functions/.env` con `APP_URL=https://…` agrega el botón "Open Precise Cleaning" en el correo.
- **Security Rules:** `task_notifications` solo lo escribe la función (Admin SDK); los clientes no deberían
  poder leerlo (tiene correos de los usuarios). Revisar que no haya una regla general que lo abra.
- Siguientes partes: 2) proyecto asignado (responsable), 3) aprobación pedida (aprobador), 4) aprobado o
  cambios pedidos (a quien la envió).

## 2026-10-28 · Tasks: historial de la aprobación

- La tarjeta "Approval" muestra **Approval history**: cada envío, pedido de cambios y aprobación, en orden, con
  autor ("You" si fuiste tú) y fecha; las notas de cambios van en burbujas como los comentarios, y la que
  sigue pendiente se marca con borde coral.
- Se lee de los **comentarios** de la tarea (`approvalHistoryOf`, `src/utils/approvalComments.ts`), porque
  `approval.note` solo guarda la última nota. Los textos que se escriben y se leen están en ese mismo archivo
  (iguales a la web). Si la web cambia esos textos, el historial deja de reconocerlos: avisar a la web.
- Si el pedido de cambios actual no tiene comentario (datos viejos), se agrega desde `approval.note`.
- Un comentario normal que diga exactamente "Approved." se tomaría como aprobación: riesgo aceptado (solo se
  lee si la tarea tiene `approval`).
- Los mismos eventos siguen apareciendo en "Comments" (son comentarios en los datos, como en la web).
  Decisión de Antonio (28/10/2026): se quedan ahí, no se ocultan.

## 2026-10-28 · Tasks: visto bueno (paso 2 de 2: el aprobador responde)

- **"My tasks"** suma las tareas que esperan MI OK (`useTasksToApprove`, `subscribeTasksToApprove`): misma
  consulta que la web (`approval.approverUserId == yo` + `approval.status == 'pending'`, sin índice compuesto);
  las que no están abiertas se descartan en el cliente en vez de agregar un tercer filtro. Se quitan las que ya
  me asignaron (ya vienen en la lista). Van **solo** en la pestaña Approval y **sin círculo de completar**.
  Solo con el filtro "My tasks" (como la web). Si esa consulta falla, la lista se ve igual y aparece un aviso
  con "Try again".
- **Detalle:** el aprobador ve "Waiting for your OK · sent {fecha}", **Approve** y **Request changes** (nota
  obligatoria; si no se guarda, la nota queda escrita). Transacción que valida `pending` y que yo sea el
  aprobador (`canDecideApproval`); comentarios iguales a la web.
- No hay contador en la barra de pestañas (la web tiene uno en el menú): queda pendiente si se quiere.

## 2026-10-28 · Tasks: visto bueno (paso 1 de 2: asignar aprobador y enviar)

- Igual que la web (`TaskApproval.tsx`, `userTasksService.requestApproval`), con los mismos textos en los
  comentarios ("Sent for approval to {nombre}.").
  - **Crear tarea:** campo "Approval" ("No approval needed" o una persona) → `approval` en `'draft'`.
  - **Detalle:** `TaskApprovalCard` muestra el estado y permite **Send for approval / Send again** (eligiendo
    quién aprueba), **Cancel request** (desde `pending`, si no eres el aprobador) y **Doesn't need approval**
    (desde `draft`).
- **Quién gestiona:** quien puede editar la tarea según la web: Edit de Task List, asignado o creador, con la
  tarea abierta (`canManageApproval`). Ojo: incluye a empleados asignados (es el caso de uso: mandan a
  aprobar su trabajo), aunque el formulario de edición siga siendo solo para Edit.
- **Aprobador propuesto:** rol con módulo `Owner`; si no hay, el primero. Lista = personas asignables menos
  uno mismo; el aprobador actual se conserva aunque ya no esté en la lista.
- **Transacciones:** enviar, cancelar y quitar validan el estado (`canRequestApproval`, etc.). Si la web lo
  cambió, aviso "The approval of this task just changed" (`approvalChanged`).
- El aviso al completar distingue "waiting for X's OK" (pendiente) de "needs X's OK … send it first".
- **Riesgo sin probar:** para enviar, un empleado carga `system_users` activos y `settings_roles` completos
  (`assignableUsersService`). Si las Security Rules no se lo permiten, verá "Couldn't load the people list" y no
  podrá elegir aprobador. La web hace las mismas lecturas, así que debería funcionar.

## 2026-10-27 · Fotos de casas: compresión y cola

- **Compresión** (`compressPhoto`, `src/utils/photoCompression.ts`): sigue `app_settings/photo_config`
  (lado mayor ≤ `maxImageWidth`, calidad `compressionQuality`, bajando de 0.1 en 0.1 hasta pesar ≤
  `maxSizeMB`, mínimo 0.5 como el slider de la web). Si a calidad 0.5 sigue pesando más, reduce la
  foto (nunca a menos de 960 px). Valores inválidos o en 0 usan los de la web (1920 px · 0.85 · 1 MB)
  y se limitan a sus rangos (640–3840 px, 0.5–1, 0.3–5 MB).
  - **Arreglado:** el tamaño se lee de la imagen decodificada. Antes se usaba el que reporta el picker,
    que según la documentación de SDK 57 "puede ser 0": en ese caso la foto **no se redimensionaba**.
  - La copia que el picker deja en caché se borra después de comprimir (solo si está en `Paths.cache`;
    nunca se toca la galería).
- **Cola** (`PhotoQueueContext`):
  - Subida en dos pasos: Storage → `uploadedUrl` guardado en la cola → `addPhotoUrl` (`arrayUnion`). Si
    falla el segundo paso, el reintento no vuelve a subir el archivo (antes quedaba un archivo huérfano
    en Storage por cada reintento).
  - **Arreglado:** un error que no era de red se reintentaba en seguida hasta 5 veces seguidas y la
    foto quedaba trabada. Ahora cada foto se intenta una vez por pasada y se reintenta con espera
    creciente.
  - Las fotos trabadas (5 intentos o error permanente) muestran "N not uploaded" y un botón "Retry" en
    la misma sección de la casa (antes solo desde Profile).
- `PhotoSection`, `photoService` y `PhotoQueueContext` pasaron a funciones flecha, `async/await`,
  nombres claros y `Touchable` en las miniaturas. El texto de la bitácora (`N foto(s) Before…`) no cambió.
- Adjuntos de tareas: `compressPhoto` ya lee el tamaño real, así que se quitó `Image.getSize`.
- **Sin probar en teléfono.** Probar: foto de cámara y de galería (varias), foto vertical (orientación),
  peso final en Storage, modo avión con fotos en cola, y borrar una casa con fotos en cola.

## 2026-10-26 · Proyectos visibles según el scope

- **Decisión de Antonio:** scope `All` de Task List (hoy Admin y Owner) ve todos los proyectos; scope `Own`
  solo los relacionados: responsable (`ownerUserId`), creador (`createdByUserId`), su equipo (`teamId`) o
  con una tarea abierta asignada a él. Aplica a la lista de proyectos, a los títulos en Tasks y al
  selector "Project" del formulario de tarea. El detalle de un proyecto se sigue abriendo por id.
- El equipo se compara por id **y por nombre** (`teamKeysOf`, igual que las casas), por si hay documentos
  viejos con el nombre. Pendiente: al revisar Firestore, si ningún `task_projects.teamId` tiene un
  nombre, dejarlo solo por id.
- **No es seguridad:** las reglas dejan leer `task_projects` a cualquiera con Task List. Si los proyectos
  ajenos no se deben leer, hay que cambiar las reglas (con la web).
- Limitación aceptada: un proyecto donde el empleado solo tenía tareas, y ya están todas hechas, deja de
  salirle (solo se escuchan tareas abiertas).
- Al asignarle una tarea de un proyecto nuevo, la lista se vuelve a pedir y muestra el esqueleto un momento.
- `subscribeMerged` (`src/services/firestore.ts`) junta varias consultas en vivo sin repetir por id; lo usan
  tareas y proyectos.

## 2026-10-26 · Revisión de código: #21 y #22 (cierre)

- **#21:** el campo para escribir de `MessageThread` usa `TextField` (antes un `TextInput` suelto).
  `TextField` acepta `containerStyle` para el contenedor. Cambio visible: el campo de notas de casas
  y el de comentarios de tareas ahora marcan el borde azul al escribir, como el resto de los campos.
- **#22:** quitados los textos sin uso `projectsActiveCount` y `projectStatus`.
- **#11 sigue pendiente a propósito:** antes de limitar por fecha las casas del equipo hay que revisar
  qué estructura dejó el junior en Firestore (formato real de `scheduleDate`, índices existentes).

## 2026-10-26 · Revisión de código: paso 5 (#8–#10, #15–#19)

- **#8 Fotos:** `storage/unknown` ya no se trata como error de red: cuenta como intento (máximo 5), en
  vez de reintentarse para siempre.
- **#9 `usePersistentList`:** las actualizaciones que llegan antes de leer la lista guardada se aplican
  sobre lo leído, y no se escribe en el teléfono antes de cargar (antes podía borrar la cola).
- **#10 Clientes:** el caché de `customersService` vence a los 10 min (`CONFIG_TTL`), también los
  "no encontrado".
- **#15 Login:** mensajes según el código de Firebase Auth: credenciales, sin conexión, demasiados
  intentos, cuenta deshabilitada y error genérico. "Forgot password" ya no muestra el código crudo.
- **#16 Payroll:** "Paid this month" y las barras usan `useNow()`.
- **#17:** búsquedas con `Map` en `TasksScreen` (títulos de proyecto) y `PayrollScreen` (casas).
- **#18:** `asText`/`asNullableText` en `src/utils/firestoreValues.ts`; `chunkList` en
  `src/utils/chunkList.ts` (reemplaza `chunk` de `firestore.ts`; el límite de `in` es
  `FIRESTORE_IN_LIMIT`).
- **#19:** el formulario de tarea solo escucha `task_projects` (y muestra "Project") si el rol puede
  ver proyectos.
- **#11 pendiente:** limitar por fecha las casas del equipo necesita un índice compuesto (requiere
  aprobación).

## 2026-10-26 · Revisión de código: #13 y #14 (hooks unificados)

- **#13:** `useLiveSubscription` reemplaza la lógica copiada de suscripción en `useOpenTasks`,
  `useTask`, `useProjects`, `useProject`, `PayrollContext` y las dos suscripciones de `JobsContext`.
  Lee la función de suscripción desde una ref: el efecto solo se rehace cuando cambia la `key`.
  Efecto nuevo: tareas y proyectos también reintentan solos al volver la señal o la app al frente
  (antes solo con "Try again").
- **#14:** `useGuardedWrite` (aviso sin señal + alerta de error) reemplaza los `runWrite` de
  `useTaskWriteActions` y `useProjectWriteActions` y los avisos sin señal de `useAttachments`.
  `useCurrentActor` arma el autor de las escrituras.
- `LoadStatus` se movió a `src/types/index.ts` (antes vivía dentro de `useTaskAccess`; parte del #23).

## 2026-10-26 · Revisión de código: #6, #12 y #20 corregidos

- **#6 Borrar proyecto:** después de desvincular sus tareas y borrarlo (contrato §4), se hace una
  segunda consulta y se desvinculan las tareas que se hayan agregado mientras tanto. Si esa pasada
  falla, el proyecto ya está borrado: se registra en consola y no se muestra error.
- **#12 Adjuntos desde "Files":** si el selector no da dimensiones, se leen con `Image.getSize` antes de
  comprimir, para redimensionar a 1920 px como pide el contrato §7. Si no se pueden leer, se comprime
  sin redimensionar.
- **#20 Adjuntos pendientes:** cada archivo elegido tiene un `pickId` propio; la misma foto elegida dos
  veces ya no repite la `key` de React.

## 2026-10-26 · Revisión de código: #7 corregido (bitácora de Start/Finish)

- Antes, `OutboxContext.mark` escribía en `activity_logs` al tocar el botón, aunque el servidor después
  rechazara el cambio. Ahora se registra en `sendMark` **solo después** de que `applyMark` confirma
  (`'applied'` o `'alreadyApplied'`, que es un reintento tras una confirmación perdida). Un conflicto o
  un `permission-denied` no deja registro.
- Las marcas en cola de versiones anteriores (sin `kind`) no se registran de nuevo: la versión vieja ya
  las registró al crearlas.
- La bitácora se escribe con señal (justo después de confirmar), así que ya no se pierde por la caché
  en memoria si la app se cierra sin señal.

## 2026-10-23 · Permisos: solo lo que dice `settings_roles`

- **Decisión del dueño:** todos los permisos salen tal cual de los flags de `settings_roles`; el código
  no agrega reglas propias. Roles reales: Admin, Owner, Manager, System, Employee.
- Se quitó el super admin por nombre (`Administrator`): no existe ese rol. Admin con `Task List`
  scope `Own` ve solo sus tareas; para ver las de todos, la oficina cambia su scope a `All`.
- Deshacer el Start/Finish de otra persona (antes "solo un admin") ahora lo permite `Houses.canEdit`.
- La pestaña Payroll aparece solo con `Payroll.canView` (Manager no la tiene).
- Consecuencias que se resuelven en Roles & Permissions de la web, no en código:
  - Employee tiene `Task List` con `canAdd/canEdit/canDelete: true` → puede crear, editar y borrar
    tareas, y (sin módulo `Projects`) también proyectos.
  - Manager no tiene `Task List` → no ve tareas.
  - Nadie tiene módulo `Projects` → los proyectos usan los flags de `Task List`.

## 2026-10-23 · Revisión de código: hallazgos #1 a #5 corregidos

- **#1 Listeners:** `listen()` ya no convierte errores en `[]`; exige `onError`. `JobsContext` y
  `PayrollContext` tienen estado `error`, "Try again" y reintento automático al volver la señal o la
  app al frente (`useForegroundRetry`; nunca en bucle). Con error, `settled` es `false`: no hay
  avisos falsos de "casa retirada".
- **#2 Start/Finish:** cada marca guarda el valor que vio el empleado. Se aplica en `runTransaction`
  con `decideMark` (`src/utils/markGuard.ts`): igual al esperado → aplica; ya aplicado → nada;
  distinto (alguien más cambió) o Finish sin Start → se descarta y se avisa (`markConflict`). Las
  marcas viejas en cola (sin `guard`) se envían como antes. Como una transacción no aplica nada
  local sin señal, `withPendingMarks` (Outbox) muestra las marcas en cola en Home y en el detalle.
- **#3 `Houses.canView`:** sin él (y sin ser Administrator) Home muestra "Houses not available" y no
  se consulta Firestore. **Verificar antes de publicar** que el rol de los empleados tenga el módulo
  `Houses` con `canView: true`; si no, dejarían de ver sus casas.
- **#4 `houses_form_config`:** si no carga y no hay copia guardada, la sesión queda en
  "Couldn't load your permissions" (antes: todos los botones visibles).
- **#5 Perfil:** un error del listener ya no muestra "User without profile". Con perfil (del
  servidor o guardado) se conserva y se reintenta; sin perfil, "Couldn't load your profile".

## 2026-10-23 · Proyectos

### Decisiones
- **Dónde:** selector "Tasks | Projects" en la pestaña Tasks (solo si el rol puede ver proyectos).
  Proyectos en pestañas Active / Done / Archived, ordenados por vencimiento.
- **Permisos:** módulo `Projects` del rol si existe; si no, los flags de `Task List`
  (`projectPermissionsOf` en `src/utils/taskPermissions.ts`). `settings_roles` aún no tiene `Projects`.
- **Escrituras** (contrato §4, `src/services/projectWritesService.ts`):
  - Crear con tareas: un batch; el proyecto nace con `taskCount` = n.º de tareas y
    `openMinutes` = n × 30; cada tarea sin fecha, 30 min, sin prioridad/repetición/aprobación.
  - Editar y cambiar estado: transacción; `doneAt` = ahora al entrar a `done`, `null` al salir.
    Nunca toca los contadores.
  - Borrar: lee todas las tareas del proyecto y les pone `projectId/projectTitle = null` en tandas
    de 450; el proyecto se borra en la última tanda. Las tareas se conservan.
- **Tareas ↔ proyecto:** campo "Project" en el formulario de tarea (solo proyectos activos). Crear con
  proyecto o mover de proyecto ajusta los contadores del proyecto viejo y del nuevo en la misma
  transacción; si el proyecto ya no existe, error claro.
- **Título vivo:** las tarjetas y el detalle muestran el título actual del proyecto, no la copia
  `projectTitle` (renombrar un proyecto no actualiza sus tareas, contrato §4).
- **Tareas del proyecto:** con scope `All` (o admin) se consultan todas las abiertas del proyecto;
  con scope `Own`, solo las asignadas a mí o creadas por mí (las reglas propuestas rechazan lo demás).
- **Colores:** `projectColors` en `src/theme/tokens.ts`; sin color (`null` = automático) se elige uno
  estable a partir del id.
- **Adjuntos solo en tareas** (confirmado con la web).

### Supuestos a confirmar con la web
- Al crear un proyecto, cada tarea inicial tiene su propio selector de personas (una o varias). Si
  no se elige a nadie, se asigna al **responsable** del proyecto (el contrato no dice a quién).
- Los tonos exactos de cada color de proyecto en la web.

## 2026-10-21 · Tasks: filtro, completar, crear, editar, asignar y borrar

### Decisiones
- **Permisos por flags del módulo `Task List`** (no por nombre de rol): `canAdd` crea, `canEdit`
  edita y asigna/quita personas, `canDelete` borra. Completar/reabrir: asignado, creador o `canEdit`.
  Hoy Administrator y Owner tienen todo; si la oficina da permisos a otro rol, funciona sin código.
- **Filtro de vista:** "My tasks" por defecto; scope `All` (o admin) elige "Assigned by me",
  otra persona o "Everyone". Con solo `canAdd` se ve también "Assigned by me".
- **Escrituras en transacción** (`src/services/taskWritesService.ts`) que releen la tarea: completar
  verifica `open` y la aprobación; deshacer/reabrir verifica `done`; los contadores del proyecto se
  ajustan con `increment` solo si el proyecto existe (contrato §4 y riesgos §8.1–8.3). Crear usa
  `writeBatch` (sin proyecto). Sin señal no se escribe (aviso).
- **Comentarios:** se agregan desde el detalle con `arrayUnion({ userId, userName, text, createdAt })`
  (contrato §4), sin reescribir el arreglo. Puede comentar cualquiera que pueda ver la tarea; también
  en tareas hechas. Sin señal no se envía; el texto se conserva si falla. Límite de 2000 caracteres
  solo en la interfaz (el contrato no fija uno). El hilo (`MessageThread`) es el mismo de las notas
  de las casas.
- **Comentarios al crear** (pedido de Omar): en "New task" está el mismo hilo del detalle. Los
  comentarios quedan en el teléfono ("saved when you create the task") y se guardan dentro de la
  misma escritura que crea la tarea, cada uno con la hora en que se escribió (contrato §4 "Crear").
  Si quedó texto sin enviar en el campo, también se guarda. Al editar no aparece: en una tarea que
  ya existe los comentarios se envían al instante desde el detalle.
- **Adjuntos** (contrato §7): `AttachmentsSection` + `useAttachments` + `attachmentsService`, genéricos
  por dueño (hoy solo `user_tasks/{id}`). Ruta
  `{colección}/{id}/{Date.now()}-{nombreSeguro}`, metadata con `contentType` y caché de un año.
  Imágenes comprimidas a JPEG (1920 px, 0.85, ~1 MB) conservando el nombre original, como la web;
  si la compresión falla se sube el original. Límite 25 MB. Orden: subir → `arrayUnion`; si el
  `arrayUnion` falla se borra el archivo subido (no quedan huérfanos). Quitar: `arrayRemove` del
  objeto exacto y luego borrar el archivo. Agregar: cualquiera que vea la tarea; quitar: `canEdit`.
  En "New task" los archivos se suben justo después de crear la tarea; si alguno falla, la tarea
  queda creada y se avisa cuál. Sin señal no se sube ni se quita. Documentos con
  `expo-document-picker` (instalado el 23/10/2026, viene en Expo Go).
- La subida a Storage de las fotos de casas se movió a `src/services/storageService.ts` (misma
  lógica: progreso y cancelación si se traba 45 s), compartida con los adjuntos.
- **Adjuntos solo en tareas** (confirmado con la web el 23/10/2026): los proyectos no tienen adjuntos.
- **"Undo" de 6 s** al completar desde la lista; desde el detalle, "Reopen". Si la tarea se repetía,
  deshacer borra la repetición creada.
- **Fecha/hora:** `@react-native-community/datetimepicker` 9.1.0 (`npx expo install`, viene en Expo
  Go; su config plugin quedó en `app.json`).
- **Personas asignables:** `system_users` con status `Active` o `Pending Invite` cuyo rol ve Task
  List (o Administrator), más uno mismo; caché de 10 min.
- La lógica pura (validación, armado, `nextOccurrence`) está en `src/utils/taskWrites.ts`, probada
  con scripts (bordes de mes, fin de semana y cambio de horario del 01/11).

### Pendientes / fuera de alcance
- Proyectos, flujo de aprobación (enviar/decidir), escribir comentarios, adjuntos, editar
  repetición, pestaña Done.
- Las Security Rules propuestas por la web solo dejan cambiar personas a quien creó la tarea o a
  quien tiene Edit **y no está asignado**; el móvil deja a cualquier `canEdit`. Si publican esas
  reglas, reasignar una tarea propia fallaría con error de permisos.
- Ids `pending_<email>` (invitaciones pendientes) aparecen como personas: confirmar con la web qué
  pasa con esas tareas cuando el usuario acepta la invitación.

## 2026-10-20 · Permisos: rol en vivo y fallar cerrado

### Decisiones
- **Solo el rol del usuario, en vivo:** `subscribeRole` escucha `settings_roles/{roleId}` con
  `onSnapshot`. Antes se descargaba la colección completa con caché de 10 min: un permiso quitado
  en la web seguía activo hasta 10 min o hasta reiniciar.
- **Fallar cerrado:** antes, si fallaba la carga de roles se usaba `[]`, `housesPermission` quedaba
  vacío y se veían todas las casas. Ahora la sesión tiene dos estados nuevos: `noRole` (el usuario
  no tiene `roleId` o el documento no existe) y `roleError` (la lectura falló y no hay rol guardado
  en el teléfono). Los dos muestran `BlockedScreen`; `roleError` tiene "Try again".
- Sin señal, el `onSnapshot` del rol entrega primero "no existe" desde caché: se ignora (si no,
  bloquearía a todos sin conexión).
- El rol guardado en el teléfono (`pc_crew_session_cache_v1`) se sigue usando sin señal. Como ya no
  se descarga la colección, ahora ahí solo queda el rol del usuario.
- Si la oficina cambia el rol del usuario mientras usa la app, la app vuelve un momento a la
  pantalla de carga hasta tener el rol nuevo (no se mezclan permisos de dos roles).

### Pendientes
- `houses_form_config` todavía falla abierto (`{}` = todos los botones visibles si no carga).

## 2026-10-20 · Tasks & Projects (módulos 1 y 2: permisos y "Mis tareas", solo lectura)

### Decisiones
- **Sin conexión: leer sí, escribir no.** Firestore usa `memoryLocalCache()`: una escritura offline
  se pierde si la app se cierra, y `runTransaction` no funciona sin red. Las escrituras de tareas
  (módulos siguientes) se bloquean sin señal; completar/reabrir y aprobar irán en transacciones.
- **Permisos de Tasks desde `settings_roles`**, como el resto de la app
  (`taskListPermissionsOf()` en `src/utils/taskPermissions.ts`): rol `Administrator` = todo; si no,
  el módulo `Task List` del rol (`canView`/`canAdd`/`canEdit`/`canDelete`, `scope`). El contrato de
  la web proponía `user_access/{email}` (Cloud Functions), pero esa colección **no existe en
  producción**; por decisión del desarrollador se quitó del código y del contrato.
- **La pestaña Tasks la ven todos**; sin `Task List.canView` (ni Administrator) se muestra "sin acceso".
- Las tareas se leen con un converter propio (`src/services/tasksService.ts`) que normaliza el
  formato viejo (`assigneeUserId`, approval `'changes'`). No se usa `listen()`: los errores no se
  convierten en lista vacía; la pantalla ofrece "Try again".
- Agrupación (`src/utils/taskTabs.ts`): una tarea con aprobación pendiente sale en `approval` **y**
  en su pestaña de fecha; una repetitiva (no mensual) sin fecha va a `daily`. Confirmar con la web.

### Pendientes
- **Avisar a la web:** las Security Rules propuestas en su repo (`security/firestore.rules`) usan
  `user_access`, que no existe. Si las publican así, Tasks deja de funcionar en las dos apps: hay
  que reescribirlas con `settings_roles` antes.
- `settings_roles` no tiene módulo `Projects` (el contrato usa `m['Projects']`): definir con la web
  antes del módulo de proyectos.

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
- Push con la app cerrada: requiere Cloud Function + FCM.
- La consulta de casas del equipo no tiene ventana de fechas; en equipos con mucho historial,
  agregar un filtro por fecha necesita un índice compuesto en Firestore.
