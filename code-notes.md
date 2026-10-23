# code-notes.md — decisiones y pendientes (app móvil)

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
