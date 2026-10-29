# Contrato de datos: Tareas y Proyectos (Task list)

> Documento para el agente del proyecto **móvil** (React Native + Firebase). Lo escribió el agente de la app **web** después de analizar su código (10/2026). Guárdalo en este repo (por ejemplo `docs/tasks-firestore-contract.md`) y **léelo antes de trabajar en Tareas o Proyectos**.

> **Nota del equipo móvil (20/10/2026):** la colección `user_access` que proponía este documento
> **no existe en producción** (no la llena ninguna Cloud Function). Por decisión del desarrollador,
> los permisos de Tareas y Proyectos salen de **`settings_roles`**, igual que en el resto de la app.
> Las secciones §2, §3, §6 y §10 ya están corregidas; donde la web hablaba de `user_access`, usa esto.

---

## 1. Contexto

- El módulo **Task list** existe en la app web: tareas de gerentes (asignadas a una o varias personas), agrupadas opcionalmente en **proyectos**, con comentarios, archivos adjuntos, repetición y un flujo de **visto bueno** (aprobación).
- **La app web y la app móvil usan la misma base de datos de Firestore y el mismo Storage.** Lo que una app escribe, la otra lo lee. Por eso:
  - **Lo que se guarda es un contrato**: nombres de colecciones, nombres y tipos de campos, valores permitidos, y las reglas que mantienen los datos consistentes (contadores, formatos). No lo cambies sin coordinarlo con la web.
  - **Cómo está escrito el código de la web no es un contrato.** Los services de la web los hizo un desarrollador junior; no los copies. Puedes escribir mejor código mientras el resultado en Firestore sea idéntico.
- **No crees todos los services de golpe.** El desarrollador te va a guiar módulo por módulo. Antes de cambiar la forma de cualquier dato, pregunta.

---

## 2. Colecciones

| Colección | Documento | Qué guarda |
|---|---|---|
| `user_tasks` | `user_tasks/{taskId}` (id automático) | Una tarea. Comentarios y adjuntos van **dentro** del documento (arreglos). |
| `task_projects` | `task_projects/{projectId}` (id automático) | Un proyecto. **No** guarda la lista de sus tareas. |
| `system_users` | `system_users/{userId}` | Usuarios de la app. **Su id NO es el uid de Firebase Auth.** |
| `settings_roles` | `settings_roles/{roleId}` | Roles y permisos por módulo (`Task List`, y `Projects` cuando exista). Lo escribe la web; las apps solo leen. El rol del usuario es `system_users.roleId`. |
| `settings_priorities` | `settings_priorities/{priorityId}` | Catálogo de prioridades (High, Medium…). |
| `settings_teams` | `settings_teams/{teamId}` | Catálogo de equipos (para `teamId` de un proyecto). |
| `app_settings` | `app_settings/task_list_tabs` | Orden de las pestañas del Task list (igual para todos). |
| `user_priorities` | `user_priorities/{userId}` | "Top 3" de proyectos por gerente. **Ya no tiene pantalla en la web**; no lo implementes. |

No hay subcolecciones en este módulo.

**Relaciones:**
- Tarea → proyecto: `user_tasks.projectId` (o `null`). Las tareas de un proyecto se piden con `where('projectId', '==', id)`.
- Tarea → usuarios: `assignees[].userId` (asignados), `createdByUserId` (quién la asignó; **nunca se edita**), `doneByUserId`, `approval.approverUserId`, `approval.requestedByUserId`, `comments[].userId`. Todos son ids de `system_users`.
- Proyecto → usuario: `ownerUserId` (responsable), `createdByUserId`.
- Se guardan **copias de nombres** junto a los ids (`userName`, `projectTitle`, `ownerUserName`…) para mostrar sin otra lectura. Al mostrar, si tienes el dato en vivo (el usuario o el proyecto), usa el vivo; la copia es el respaldo.

**Quién es el usuario actual:** el usuario inicia sesión con Firebase Auth (email). Su documento se busca con `system_users` `where('email', '==', authEmail.toLowerCase().trim())`. Su `id` de `system_users` es el que se usa en todos los campos `…UserId`.

---

## 3. Tipos

Convenciones:
- Fechas como **texto**. `YmdDate` = día `"AAAA-MM-DD"` (`""` = sin fecha). `IsoDateTime` = instante ISO de `new Date().toISOString()`.
- Todo campo que guarda un usuario termina en `UserId` / `UserName`.
- En pantalla las fechas se muestran **MM/DD/AAAA** y las horas **h:mm AM/PM** (regla del negocio). "Hoy" se calcula con la fecha **local** del dispositivo, no con `toISOString()` (en Texas cambia de día a las 6–7 p. m. en UTC).

```ts
export type YmdDate = string;      // "2026-10-20" ("" = sin fecha)
export type IsoDateTime = string;  // "2026-10-20T15:04:05.123Z"

// ---------------------------------------------------------------- user_tasks

export type UserTaskStatus = 'open' | 'done';

/** Cada cuánto se repite. */
export type RepeatFreq =
  | 'daily'     // "Every day"
  | 'weekdays'  // lunes a viernes (formato viejo; ya no se elige al crear)
  | 'weekly'    // "Every day except…": `days` = los días que SÍ tocan
  | 'monthly';  // mismo día de cada mes (formato viejo; ya no se elige)

/** Map `repeat` de una tarea (null = no se repite). */
export interface Repeat {
  freq: RepeatFreq;
  days?: number[];            // solo con 'weekly': 0 = domingo … 6 = sábado
  timesLeft?: number | null;  // formato viejo "After N times": veces que faltan, contando esta (1..365). null/ausente = siempre
}

/** draft = necesita OK pero aún no se envía · pending = esperando respuesta ·
 *  approved = aprobada · changes_requested = pidieron cambios. */
export type UserTaskApprovalStatus = 'draft' | 'pending' | 'approved' | 'changes_requested';
export type ApprovalDecision = 'approved' | 'changes_requested';

/** Map `approval` (null = no necesita visto bueno). */
export interface UserTaskApproval {
  status: UserTaskApprovalStatus;
  approverUserId: string;          // obligatorio · quién da el OK
  approverUserName: string;        // copia del nombre
  requestedByUserId: string | null;// quién la envió (null mientras es 'draft')
  requestedAt: IsoDateTime | null; // última vez que se envió
  decidedAt: IsoDateTime | null;   // cuándo aprobó o pidió cambios
  note: string;                    // cambios pedidos ("" si no hay)
}

/** Elemento de `attachments[]`. El archivo vive en Storage. */
export interface TaskAttachment {
  name: string;  // nombre original que se muestra
  url: string;   // URL de descarga (getDownloadURL)
  path: string;  // ruta en Storage (para borrarlo): user_tasks/{taskId}/{ms}-{nombreSeguro}
  type: string;  // MIME: image/jpeg, application/pdf… ('application/octet-stream' si no se sabe)
  size: number;  // bytes (del archivo ya comprimido, si es imagen)
}

/** Elemento de `comments[]` (tareas y proyectos). Sin id propio: se identifica por autor + hora. */
export interface TaskComment {
  userId: string;        // quién comentó
  userName: string;      // copia de su nombre
  text: string;
  createdAt: IsoDateTime; // texto ISO: dentro de un arreglo Firestore no acepta serverTimestamp()
}

/** Elemento de `assignees[]`. */
export interface TaskAssignee {
  userId: string;   // persona asignada
  userName: string; // copia de su nombre
}

/** user_tasks/{taskId} — como la usa la app (el id es el del documento, no un campo). */
export interface UserTask {
  id: string;                        // id del documento
  title: string;                     // obligatorio, 1..200 caracteres (sin espacios a los lados)
  assignees: TaskAssignee[];         // una o más personas (nunca vacío)
  dueDate: YmdDate;                  // "" = sin fecha
  dueTime: string;                   // "HH:mm" 24 h, o "" sin hora
  durationMinutes: number;           // entero >= 0 (0 = no aplica). Por defecto 30
  priorityId: string | null;         // → settings_priorities
  projectId: string | null;          // → task_projects (null = sin proyecto)
  projectTitle: string | null;       // copia del título del proyecto
  repeat: Repeat | null;
  repeatOfTaskId?: string;           // solo en la tarea que crea una repetición: id de la que se completó (desde el 28/10/2026, ver §9 correos)
  approval: UserTaskApproval | null;
  status: UserTaskStatus;
  doneAt: IsoDateTime | null;        // cuándo se marcó hecha
  doneByUserId: string | null;       // quién la marcó hecha
  comments: TaskComment[];           // del más viejo al más nuevo
  attachments: TaskAttachment[];
  createdByUserId: string;           // quién la asignó · NUNCA se edita
  createdByUserName: string;
  createdAt: IsoDateTime;            // NUNCA se edita
}

/** Formato viejo del asignado (hasta 10/2026 había una sola persona). Solo se LEE. */
export interface LegacyTaskAssignee {
  assigneeUserId?: string;
  assigneeUserName?: string;
}

/** Cómo está GUARDADA una tarea en Firestore. */
export type StoredUserTask =
  Omit<UserTask, 'id' | 'assignees' | 'approval'>
  & { assignees?: TaskAssignee[] }
  & { assigneeUserIds?: string[] }   // = assignees.map(a => a.userId). Solo para la consulta array-contains
  & { approval: (Omit<UserTaskApproval, 'status'> & { status: UserTaskApprovalStatus | 'changes' }) | null }
  & LegacyTaskAssignee;

// ------------------------------------------------------------- task_projects

export type TaskProjectStatus = 'active' | 'done' | 'archived';

/** task_projects/{projectId} */
export interface TaskProject {
  id: string;                  // id del documento
  title: string;               // nombre (la web limita a 80 caracteres)
  description: string;         // objetivo (la web limita a 160)
  ownerUserId: string;         // responsable → system_users
  ownerUserName: string;       // copia del nombre
  teamId: string | null;       // → settings_teams
  startDate: YmdDate;          // "" = sin fecha
  dueDate: YmdDate;            // "" = sin fecha
  repeat: RepeatFreq | null;   // hoy siempre null (no hay pantalla que lo use)
  color: string | null;        // id de color: 'blue' | 'green' | 'amber' | 'purple' | 'pink' | 'teal' | 'olive'; null = automático
  status: TaskProjectStatus;
  taskCount: number;           // tareas del proyecto (solo con increment)
  doneCount: number;           // tareas hechas (solo con increment)
  openMinutes: number;         // suma de durationMinutes de las ABIERTAS (solo con increment)
  comments: TaskComment[];     // existe y las reglas lo permiten, pero hoy ninguna pantalla lo escribe
  doneAt: IsoDateTime | null;  // cuándo pasó a 'done' (null si no está en done)
  createdByUserId: string;
  createdAt: IsoDateTime;
}

// --------------------------------------------------------------- permisos

/** Elemento de settings_roles/{roleId}.permissions[] (lo escribe la web). */
export interface Permission {
  module: string;          // 'Task List', 'Projects', 'Houses'…
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  scope: 'All' | 'Own';    // 'Own' = solo sus tareas
}

/** settings_roles/{roleId} */
export interface Role {
  id: string;
  name: string;            // Admin, Owner, Manager, System, Employee… (sin trato especial por nombre)
  description: string;
  permissions: Permission[];
}

/** app_settings/task_list_tabs */
export type TaskListTabId = 'overdue' | 'daily' | 'approval' | 'week' | 'later' | 'nodate' | 'all' | 'done';
export interface TaskListTabsSettings {
  tabOrder: TaskListTabId[];
  updatedAt: IsoDateTime;
  updatedByUserId: string;
  updatedByUserName: string;
}

/** Lo mínimo de system_users que usa este módulo. */
export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;      // en minúsculas
  roleId: string;
  status: 'Active' | 'Pending Invite' | 'Inactive';
}
```

**Al leer una tarea, normaliza así** (lo que hace el converter de la web):
- `assignees`: si el documento tiene `assignees`, úsalo. Si no, y tiene `assigneeUserId`, conviértelo en `[{ userId: assigneeUserId, userName: assigneeUserName ?? '' }]`.
- `approval.status === 'changes'` (formato viejo) se lee como `'changes_requested'`.
- `assigneeUserIds`, `assigneeUserId` y `assigneeUserName` no se exponen al resto de la app.

**Al escribir una tarea:** escribe siempre `assignees` **y** `assigneeUserIds` juntos (generados en un solo lugar), nunca `assigneeUserId`, y nunca guardes `id` como campo.

---

## 4. Contrato de escritura

**Invariantes que toda escritura debe mantener:**

1. **Contadores del proyecto.** `taskCount`, `doneCount` y `openMinutes` de `task_projects` reflejan sus tareas y se cambian **solo con `increment()` en el mismo batch o transacción que la tarea**. Lo que aporta una tarea:
   - `taskCount`: 1
   - `doneCount`: 1 si `status === 'done'`, si no 0
   - `openMinutes`: `durationMinutes` si `status === 'open'`, si no 0
2. **Solo se ajusta un proyecto que existe.** La web solo hace `update` de contadores si el `projectId` está en la lista de proyectos que conoce; un `update` sobre un documento borrado hace fallar el batch completo.
3. **`assigneeUserIds` = ids de `assignees`**, siempre juntos. Cuando cambian las personas de una tarea vieja, se borran `assigneeUserId` y `assigneeUserName` con `deleteField()` en la misma escritura.
4. **`createdByUserId`, `createdByUserName` y `createdAt` nunca cambian** después de crear.
5. **Comentarios y adjuntos se agregan con `arrayUnion`** y se quitan con `arrayRemove`; nunca se reescribe el arreglo completo.
6. **Una tarea con `approval` no se marca hecha hasta que `approval.status === 'approved'`.** Hoy lo valida **solo la app** (las reglas no lo impiden): el móvil también debe validarlo.
7. Validación antes de escribir: título no vacío y de máximo 200 caracteres; `durationMinutes` entero >= 0; `repeat.timesLeft`, si existe, entero de 1 a 365.

### Tareas

| Operación | Documentos | Qué escribe | Notas |
|---|---|---|---|
| **Crear** | `user_tasks/{nuevo}` + (si tiene proyecto) `task_projects/{projectId}` | Tarea completa: los campos del formulario + `status: 'open'`, `doneAt: null`, `doneByUserId: null`, `comments` (los escritos en el formulario, con autor = quien crea y `createdAt` = hora en que se escribieron), `attachments: []`, `createdBy*`, `createdAt: now`, `assigneeUserIds`. Proyecto: `taskCount +1`, `openMinutes + durationMinutes`. | **Un batch.** Los archivos se suben **después** (Storage necesita el id). Si un archivo falla, la tarea queda creada y se avisa qué archivos faltaron. |
| **Actualizar** | Tarea + proyecto(s) | Solo los campos que cambiaron (`title`, `assignees`, `dueDate`, `dueTime`, `durationMinutes`, `priorityId`, `projectId`, `projectTitle`, `repeat`). Si cambia de proyecto: al viejo se le resta lo que aportaba y al nuevo se le suma. Si solo cambia la duración: `openMinutes += nueva − vieja` en su proyecto. | **Un batch.** Si cambian `assignees`: `assigneeUserIds` + borrar formato viejo. |
| **Completar** | Tarea + proyecto + (si se repite) tarea nueva | Tarea: `status: 'done'`, `doneAt: now`, `doneByUserId`. Proyecto: `doneCount +1`, `openMinutes − duración`. Si `repeat` y le quedan veces: **crea la siguiente** en el mismo batch (mismos campos, `dueDate = nextOccurrence(...)`, `repeat.timesLeft − 1` si tenía; si la original tenía `approval`, la nueva lleva `approval` en `'draft'` con el mismo aprobador; comentarios y adjuntos vacíos) y al proyecto `taskCount +1`, `openMinutes + duración`. | **Un batch.** La web devuelve el id de la repetición para poder deshacer durante 6 s. |
| **Reabrir** | Tarea + proyecto (+ repetición) | `status: 'open'`, `doneAt: null`, `doneByUserId: null`. Proyecto: `doneCount −1`, `openMinutes + duración`. Si es "deshacer" justo después de completar: borra la repetición creada y le resta su aporte al proyecto. | **Un batch.** |
| **Borrar** | Tarea + proyecto + Storage | Borra el documento; al proyecto le resta lo que aportaba. Después borra los archivos de Storage de `attachments[].path` (si alguno falla, se ignora). | Batch para Firestore; Storage aparte. Pedir confirmación. |
| **Comentar** | Tarea | `comments: arrayUnion({ userId, userName, text, createdAt: now })` | |
| **Adjuntar** | Storage + tarea | Sube a `user_tasks/{taskId}/{Date.now()}-{nombreSeguro}` (ver §7) y luego `attachments: arrayUnion(attachment)`. | Una escritura por archivo. |
| **Quitar adjunto** | Tarea + Storage | `attachments: arrayRemove(attachment)` (el objeto exacto) y luego borra el archivo. | |
| **Poner visto bueno** (sin enviar) | Tarea | `approval: { status: 'draft', approverUserId, approverUserName, requestedByUserId: null, requestedAt: null, decidedAt: null, note: '' }` | También se puede crear la tarea ya con esto. |
| **Quitar el requisito** | Tarea | `approval: null` | Solo desde `'draft'`. |
| **Enviar a aprobar** | Tarea | `approval: { status: 'pending', approverUserId, approverUserName, requestedByUserId: actor, requestedAt: now, decidedAt: null, note: '' }` + `comments: arrayUnion("Sent for approval to {nombre}.")` | **Una escritura** (mismo `updateDoc`). También sirve para reenviar después de `'changes_requested'`. |
| **Cancelar solicitud** | Tarea | `approval: { ...actual, status: 'draft', requestedAt: null, requestedByUserId: null }` | Desde `'pending'`, quien gestiona la tarea (no el aprobador). |
| **Decidir** (aprobador) | Tarea | `approval: { ...actual, status: decision, decidedAt: now, note: decision === 'changes_requested' ? nota : '' }` + `comments: arrayUnion("Approved." \| "Asked for changes: {nota}")` | Solo el `approverUserId`, desde `'pending'`. |

**Siguiente fecha de una tarea que se repite (`nextOccurrence`):** se cuenta desde la fecha de vencimiento o desde hoy, **la que sea más tarde** (una diaria atrasada que se completa hoy vuelve mañana).
- `daily`: base + 1 día.
- `weekdays`: el siguiente día de lunes a viernes.
- `weekly`: el siguiente día que esté en `days` (si no hay `days`, el mismo día de la semana de `dueDate`).
- `monthly`: el mismo día del mes (o el último día si el mes es más corto), en este mes si todavía no pasó, si no en el siguiente.

Las fechas se manejan al mediodía local para evitar saltos por horario de verano.

### Proyectos

| Operación | Documentos | Qué escribe | Notas |
|---|---|---|---|
| **Crear** | `task_projects/{nuevo}` | Campos del formulario (`title`, `description`, `ownerUserId`, `ownerUserName`, `teamId`, `startDate`, `dueDate`, `color`, `status`) + `repeat: null`, `taskCount: 0`, `doneCount: 0`, `openMinutes: 0`, `comments: []`, `doneAt` (now si nace en `'done'`, si no null), `createdByUserId`, `createdAt: now` | Sin `id` como campo. |
| **Crear con tareas** | Proyecto + hasta **50** tareas | El proyecto nace **con los contadores ya sumados** (`taskCount` = número de tareas, `openMinutes` = suma de duraciones), y cada tarea con `projectId` y `projectTitle` del proyecto nuevo. | **Un batch** (todo o nada). Las tareas: sin fecha, duración 30, sin prioridad, sin repetición, sin aprobación. |
| **Editar** | Proyecto | Los campos del formulario. Si cambia `status`: al **entrar** a `'done'` → `doneAt: now`; al **salir** de `'done'` → `doneAt: null`. | **Nunca** tocar `taskCount`, `doneCount` ni `openMinutes` desde aquí. Cambiar el título **no** actualiza el `projectTitle` de las tareas (mostrar el título vivo). |
| **Cambiar estado** | Proyecto | `status` + `doneAt` como arriba. | |
| **Borrar sin tareas** | Proyecto | `delete` (solo si `taskCount === 0`). | |
| **Borrar con tareas** | Tareas + proyecto | A cada tarea del proyecto (abiertas y hechas): `projectId: null`, `projectTitle: null`, en tandas de 450. El proyecto se borra **en la última tanda**. Las tareas se conservan (decisión de negocio). | Si una tanda falla, el proyecto sigue existiendo y se puede reintentar. Requiere poder leer todas las tareas del proyecto (Scope "All"). |

### Orden de pestañas

`app_settings/task_list_tabs`: `setDoc` completo con `tabOrder`, `updatedAt`, `updatedByUserId`, `updatedByUserName`. Al leer: si no existe, el orden de fábrica es `['all', 'overdue', 'daily', 'approval', 'week', 'later', 'nodate', 'done']`; `'all'` va siempre primero; se descartan valores desconocidos y repetidos, y se agregan al final las pestañas que falten.

---

## 5. Consultas

Las tareas **abiertas** se escuchan en vivo (`onSnapshot`); las **hechas** crecen sin fin, así que se piden por páginas.

| Para qué | Consulta | Índice |
|---|---|---|
| Abiertas asignadas a una persona | `where('assigneeUserIds', 'array-contains', userId)`, `where('status', '==', 'open')` **y además** `where('assigneeUserId', '==', userId)`, `where('status', '==', 'open')` (formato viejo). Se juntan las dos respuestas sin repetir por id. | No (solo igualdades + array-contains) |
| Abiertas que una persona asignó ("Assigned by") | `where('createdByUserId', '==', userId)`, `where('status', '==', 'open')`. En pantalla se quitan las que la persona se asignó **solo a sí misma**. | No |
| Abiertas de todos ("Everyone") | `where('status', '==', 'open')` | No · sin límite (vigilar el tamaño) |
| Abiertas de un proyecto | `where('projectId', '==', id)`, `where('status', '==', 'open')` | No · **solo con Scope "All"** (con "Own" las reglas la rechazan) |
| Esperando MI visto bueno | `where('approval.approverUserId', '==', userId)`, `where('approval.status', '==', 'pending')`. La web luego descarta las que no están abiertas (convendría agregar `where('status', '==', 'open')`). | No |
| Una tarea (detalle) | `onSnapshot(doc('user_tasks', id))` | — |
| Hechas por página | Filtro de persona (`assigneeUserIds array-contains` o `createdByUserId ==`, o ninguno para "todas") + `where('status', '==', 'done')` + `orderBy('doneAt', 'desc')` + `startAfter(cursor)` + `limit(21)` (20 por página; la 21 indica si hay más). | **Sí, compuesto** (uno por cada variante: con `assigneeUserIds`, con `createdByUserId`, sin filtro de persona) |
| Proyectos | Scope "All": toda la colección `task_projects` en vivo (son pocos). Scope "Own" (móvil, decisión del 26/10/2026): solo los relacionados, juntando sin repetir `where('ownerUserId', '==', yo)`, `where('createdByUserId', '==', yo)`, `where('teamId', 'in', [id y nombre de mi equipo])` y `where(documentId(), 'in', projectId de mis tareas abiertas)` en tandas de 30. Es orden de pantalla, no seguridad: las reglas dejan leer todo con Task List. | No |

**Las tareas hechas con el formato viejo** (`assigneeUserId`, sin `assigneeUserIds`) **no salen** en la consulta de hechas.

**Agrupación en pestañas** (sobre las abiertas cargadas, con "hoy" = fecha local):
- `overdue`: `dueDate < hoy`
- `daily`: `dueDate === hoy`, o diarias sin fecha
- `week`: hasta el domingo de esta semana (la semana va de lunes a domingo)
- `later`: después de esta semana
- `nodate`: sin fecha
- `approval`: las que tienen `approval` sin aprobar + las que esperan MI OK (estas últimas solo para revisar, **sin casilla de completar**)
- `all`: todas las abiertas
- `done`: las hechas, por páginas

Una tarea **diaria** (repetición distinta de `monthly`) con fecha futura no se muestra en las pendientes hasta su día (sí en `all`). Cada pestaña se ordena de la más reciente a la más vieja (`createdAt` desc). Las pestañas vacías se ocultan, salvo `all` y `done`.

---

## 6. Permisos y Security Rules

**Importante:** las reglas de esta sección son la **propuesta** del repo web (`security/firestore.rules`), **todavía no publicadas** en Firebase. Las reglas activas se administran en la consola. Esa propuesta dependía de `user_access`, que no existe: antes de publicarla, la web tiene que reescribirla. Usa sus reglas de negocio (qué es "tarea propia", quién puede reasignar…) pero no supongas que ya están activas.

**Cómo saber qué puede hacer el usuario:** su rol es `settings_roles/{system_users.roleId}` (la app ya lo carga en la sesión). En el móvil, todo pasa por `taskListPermissionsOf()` (`src/utils/taskPermissions.ts`).
- **Sin super admin por nombre** (decisión del 23/10/2026): todo sale de los flags; ningún rol se llama `Administrator`.
- Módulo `Task List` del rol:
  - `canView`: puede abrir el Task list.
  - `canAdd`: crear tareas.
  - `canEdit`: Edit (editar tareas ajenas, reasignar tareas de otros, cambiar el orden de pestañas).
  - `canDelete`: borrar tareas.
  - `scope: 'Own'`: solo sus tareas. `scope: 'All'`: ve las de todos y puede elegir otra persona o "Everyone".
- Sin módulo `Task List` en el rol: sin acceso.
- Módulo `Projects` (`canView` ver proyectos, `canAdd` crear, `canEdit` editar y cambiar estado, `canDelete` borrar): **hoy no existe en `settings_roles`**; definirlo con la web antes del módulo de proyectos.

**Reglas de `user_tasks`:**
- **Leer y borrar:** Task List + (Scope "All" **o** tarea propia). *Tarea propia* = estoy en `assigneeUserIds`, o `assigneeUserId == yo` (formato viejo), o la creé, o soy su `approval.approverUserId`.
- **Crear:** solo Task List. **Las reglas no validan los campos**: la forma correcta depende de la app.
- **Actualizar:** Task List + (Scope "All" o tarea propia) + **nunca** cambiar `createdByUserId`, `createdByUserName` ni `createdAt` + cambiar personas (`assignees`, `assigneeUserIds`, `assigneeUserId`, `assigneeUserName`) solo si **yo la creé**, o si tengo Edit **y la tarea no está asignada a mí**.
- Con Scope "Own", **toda consulta debe filtrar** por algo que pruebe que las tareas son propias (`assigneeUserIds array-contains yo`, `assigneeUserId == yo`, `createdByUserId == yo` o `approval.approverUserId == yo`). Una consulta sin ese filtro se rechaza completa.

**Reglas de `task_projects`:**
- **Leer:** Task List.
- **Actualizar:** Projects Edit, **o** cualquiera con Task List si **solo** cambia `taskCount`, `doneCount`, `openMinutes` o `comments` (por eso los contadores viajan en el batch de cada tarea).
- **Crear:** Projects Add. **Borrar:** Projects Delete.

**Visto bueno en el móvil (decisiones del 28/10/2026, igual que `TaskApproval.tsx` de la web):**
- Al crear: campo "Approval" (por defecto sin aprobación) → `approval` en `'draft'`.
- En el detalle (tarjeta "Approval"): enviar / reenviar, "Cancel request" y "Doesn't need approval" para quien puede editar la tarea (Edit de Task List, asignado o creador) mientras está abierta. El aprobador propuesto es el usuario cuyo rol tiene el módulo `Owner`; si no hay, el primero de la lista (sin la regla de rol "Administrator": ese rol no existe).
- Enviar, cancelar y quitar van en **transacción** que valida el estado (riesgo 2); si cambió, se avisa y no se escribe.
- **Aprobador:** en "My tasks" ve también las que esperan su OK (misma consulta que la web, descartando en el cliente las
  que no están abiertas y aquellas en las que ya está asignado); van **solo** en la pestaña Approval y sin casilla de
  completar. En el detalle: **Approve** o **Request changes** (nota obligatoria), en transacción que valida
  `status === 'pending'` y que el aprobador sea quien responde. Comentarios: "Approved." / "Asked for changes: {nota}".

**Reglas de la pantalla que el móvil debe replicar** (las reglas no siempre las cubren):
- Ver el Task list: `Task List.canView`.
- Editar una tarea: Edit de Task List **o** estar asignado **o** haberla creado.
- Reasignar: haberla creado, **o** tener Edit y no estar asignado a ella.
- Completar: **no** si tiene `approval` sin `'approved'` (avisar "waiting for X's OK").
- Decidir una aprobación: solo `approval.approverUserId === yo` y `status === 'pending'`.
- "Assign to" (personas asignables): usuarios activos de `system_users` cuyo rol puede ver Task List, más uno mismo.
- Aprobadores: los mismos menos uno mismo.

---

## 7. Storage (adjuntos)

- **Ruta:** `user_tasks/{taskId}/{Date.now()}-{nombreSeguro}`, donde `nombreSeguro` = nombre original con todo lo que no sea letra, número, `.`, `_` o `-` reemplazado por `_` (o `'file'` si queda vacío). La hora al inicio evita que dos archivos con el mismo nombre se pisen.
- **Metadata:** `contentType` (el MIME, o `'application/octet-stream'`) y `cacheControl: 'public, max-age=31536000'`. Un archivo **nunca se sobrescribe**: siempre nombre nuevo.
- **Imágenes:** se comprimen antes de subir (lado mayor 1920 px, calidad 0.85, máximo ~1 MB). Si la compresión falla, se sube el original.
- **Límite:** las reglas propuestas de Storage aceptan hasta **25 MB** por archivo y solo a usuarios activos. Borrar archivos: con Task List (o Quality Check).
- **Orden:** primero existe la tarea, luego se sube el archivo, luego `attachments: arrayUnion(...)`. El objeto que se guarda es `{ name: original, url: getDownloadURL, path, type, size }`; para quitarlo con `arrayRemove` hay que pasar **el mismo objeto exacto**.

---

## 8. Riesgos de la implementación web

### Mejora de código (libre en el móvil: el resultado en Firestore es el mismo)

1. **Completar dos veces la misma tarea.** La web no verifica que la tarea siga `'open'` antes de completarla. Dos dispositivos que la completan a la vez suman `doneCount` dos veces y crean **dos** repeticiones. En el móvil, usa `runTransaction` y verifica `status === 'open'` (y al reabrir, `'done'`).
2. **Aprobación con datos viejos.** "Decidir" y "Cancelar solicitud" escriben el `approval` completo a partir de la copia de la pantalla; si el otro lado cambió algo segundos antes, gana el último. En el móvil, usa una transacción que verifique `status === 'pending'` y el aprobador antes de escribir.
3. **Contadores que se saltan.** Si el `projectId` no está en la lista local de proyectos (lista desactualizada o todavía cargando), la web **no ajusta los contadores** y no avisa. En el móvil, no escribas tareas de proyecto hasta tener la lista de proyectos cargada, o lee el proyecto dentro de una transacción.
4. **Mensajes de error en español** con la interfaz en inglés. En el móvil, mensajes en inglés.
5. **Archivos huérfanos.** Al borrar una tarea, si falla el borrado en Storage se ignora. Acéptalo o regístralo; no bloquees el borrado.
6. **Consultas sin límite** ("Everyone", todos los proyectos) y la cola de aprobación que filtra en el cliente. Agrega `where('status', '==', 'open')` a la cola de aprobación.

### Cambia los datos (hay que coordinarlo con la web)

1. **Formato viejo de asignados** (`assigneeUserId`). Mientras existan tareas viejas, hay que leer los dos formatos y escuchar dos consultas. Una migración única (agregar `assignees` y `assigneeUserIds` a las tareas viejas) permitiría quitar la segunda consulta y haría que las hechas viejas aparezcan en Done.
2. **La regla "no completar sin aprobación" solo vive en las apps.** Las reglas de Firestore no la imponen. Agregarla a las reglas protegería contra un cliente con errores.
3. **`create` de tareas no valida campos en las reglas.** Un cliente puede crear tareas con cualquier forma o con contadores inventados. Endurecer las reglas es una decisión compartida.
4. **Contadores mantenidos por el cliente.** Si alguna app falla a mitad o se salta un ajuste, los contadores se desvían para siempre (no hay recálculo). Una Cloud Function que los mantenga, o una función de recálculo, eliminaría el riesgo; cambia quién escribe esos campos, así que hay que coordinarlo.
5. **Comentarios dentro del documento.** Un documento de Firestore tiene un límite de 1 MB; una tarea con muchísimos comentarios lo alcanzaría. Pasarlos a subcolección cambiaría el modelo para las dos apps.
6. **Horas del cliente.** `createdAt`, `doneAt` y las horas de comentarios salen del reloj del dispositivo (texto ISO), no del servidor. Un teléfono con la hora mal guarda fechas mal. Cambiarlo a `serverTimestamp()` cambiaría el tipo del campo para las dos apps.
7. **`user_priorities` y `task_projects.comments` / `repeat`** existen pero ninguna pantalla los usa. No los implementes sin preguntar.

---

## 9. Específico del móvil

- **Offline.** La web **bloquea** las escrituras sin conexión (revisa `navigator.onLine`) para no dejar formularios colgados, porque con caché persistente un `await batch.commit()` no termina hasta que vuelve la red. En el móvil hay dos caminos, y es una decisión de producto que debe tomar el desarrollador:
  - **Bloquear como la web**, con `@react-native-community/netinfo`.
  - **Permitir escrituras offline:** el SDK las encola y las envía al reconectar (`increment()` y `arrayUnion` funcionan bien así), pero la pantalla **no debe esperar** el `await` del commit: actualiza la interfaz con el listener y avisa "se sincronizará".
- **Distinguir "vacío" de "sin red".** Sin red, un listener responde desde la caché (`metadata.fromCache`) sin error. Si la respuesta es vacía y viene de caché sin conexión, muestra "sin conexión", no "no hay tareas".
- **Fotos desde la cámara.** Comprime antes de subir (como la web: lado mayor 1920 px, ~1 MB). Con React Native Firebase, `putFile` sube desde la ruta local y tolera mejor conexiones malas. Respeta la ruta y la metadata de §7. Si el usuario adjunta fotos al **crear** una tarea, súbelas después de crearla e informa cuáles fallaron.
- **"Hoy" y zona horaria.** Usa la fecha local del dispositivo para `dueDate`, las pestañas y `nextOccurrence`.
- **Notificaciones push** (tarea asignada, solicitud de aprobación) no existen en la web. Requieren guardar tokens y una Cloud Function: es una función nueva que hay que coordinar.
- **Correos (Cloud Functions del codebase `mobile`, en `app-jesus/functions`, 28/10/2026).** Se disparan solas con cada escritura en `user_tasks` (y luego `task_projects`), de la web o del móvil; ninguna app manda correos.
  - **Tarea asignada:** a cada persona en `assignees` / `assigneeUserIds` / `assigneeUserId` de una tarea **abierta** nueva, o a las que se **agregan** al editarla. Nunca al creador, ni en tareas con `repeatOfTaskId`.
  - **`repeatOfTaskId` (campo nuevo, aprobado por Antonio):** la tarea que genera una repetición al completar guarda el id de la que se completó. El móvil ya lo escribe (`buildRepeatTaskDocument`). **La web debe agregarlo** en su `completeTask`; mientras no lo haga, las repeticiones generadas desde la web mandan correo de "tarea asignada".
  - Registro en `task_notifications/{eventId}_{tipo}_{userId}` (`kind`, `taskId`, `recipientUserId`, `to`, `subject`, `state`, fechas, `error`). Solo lo escribe la función; los clientes no deberían leerlo ni escribirlo (Security Rules).

---

## 10. Cómo trabajar con el desarrollador

- **No escribas todos los services de una vez.** Espera instrucciones módulo por módulo.
- **Pregunta antes de cambiar la forma de cualquier dato** (campo nuevo, nombre distinto, otro tipo, otra colección). Todo lo de §8 "Cambia los datos" se decide con la web.
- Puedes proponer mejor código que el de la web (transacciones, validaciones, mejores estados de error) siempre que lo que quede en Firestore sea idéntico a §3 y §4.
- Si algo de este documento no coincide con lo que ves en Firestore, avisa: este documento describe la web a 10/2026.

**Orden recomendado para construir:**
1. **Sesión y permisos:** usuario actual (`system_users` por email) y su rol de `settings_roles` (módulo `Task List`). Todo lo demás depende de esto.
2. **"Mis tareas" en solo lectura:** abiertas asignadas a mí (las dos consultas) y agrupación en pestañas. Es lo que más se usa y no escribe nada, así que se valida el modelo sin riesgo de dañar datos.
3. **Detalle de la tarea en vivo**, con comentarios y adjuntos (solo ver).
4. **Completar y reabrir** (contadores + repetición + regla de aprobación): la primera escritura, la más usada y la que más invariantes toca.
5. **Comentar y adjuntar fotos** (cámara).
6. **Crear y editar tareas.**
7. **Aprobaciones** (enviar, decidir, cancelar).
8. **Proyectos** (lista, detalle con sus tareas, crear, editar y borrar).
9. **Done por páginas** y "Assigned by".
