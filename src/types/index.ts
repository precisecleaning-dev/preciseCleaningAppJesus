// src/types/index.ts
// ⭐ Subconjunto de src/types/index.ts de la app WEB. Los nombres de campos y
//    colecciones son EXACTAMENTE los mismos: ambas apps leen y escriben los
//    mismos documentos de Firestore. Si la web agrega o renombra un campo que
//    usa el empleado, hay que reflejarlo aquí.

export interface Permission {
  module: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  scope: 'All' | 'Own';
  /** Solo en el módulo "Houses": statuses que el rol puede ver (vacío = todos). */
  allowedStatusIds?: string[];
  /** Solo en el módulo "Houses": campos de solo lectura para el rol. */
  readOnlyFields?: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone: string;
  altEmail?: string;
  roleId: string;
  status: 'Active' | 'Pending Invite' | 'Inactive';
  teamId?: string;
}

export interface NoteHistoryEntry {
  field: 'note' | 'officeNote' | 'employeeNote';
  text: string;
  user: string;
  at: string;
  action: 'created' | 'edited';
}

export interface Property {
  id: string;
  statusId: string;
  invoiceStatus: string;
  receiveDate: string;
  scheduleDate: string;
  client: string;
  note: string;
  notesHistory?: NoteHistoryEntry[];
  address: string;
  employeeNote: string;
  officeNote?: string;
  serviceId: string;
  rooms: string;
  bathrooms: string;
  priorityId: string;
  teamId: string;
  timeIn: string;
  timeOut: string;
  assignedWorkers?: string[];
  beforePhotos?: string[];
  afterPhotos?: string[];
  city?: string;
  employeeStartedBy?: string | null;
  employeeStartedAt?: string | null;
  employeeStartedById?: string | null;
  employeeFinishedBy?: string | null;
  employeeFinishedAt?: string | null;
  employeeFinishedById?: string | null;
}

export interface CatalogItem {
  id: string;
  name: string;
  color?: string;
}

export interface Status extends CatalogItem {
  order?: number | string;
}

export interface Customer {
  id: string;
  legacyId?: string;
  name: string;
}

/** Registro de nómina — colección `payroll` (la misma que lee PayrollView en la web). */
export interface PayrollRecord {
  id: string;
  propertyId: string;
  date: string;
  employeeId: string;
  baseAmount: number;
  extraAmount: number;
  extraNote: string;
  discountAmount: number;
  discountNote: string;
  totalAmount: number;
  status?: 'Pending' | 'Paid';
  paidAt?: string | null;
  paidBy?: string | null;
  batchId?: string | null;
  paymentDate?: string | null;
}

/** app_settings/photo_config — misma configuración que PhotoSettingsView en la web. */
export interface PhotoConfig {
  allowTakePhoto: boolean;
  allowUploadFromDevice: boolean;
  compressionQuality: number;
  maxImageWidth: number;
  maxSizeMB: number;
}

/** app_settings/houses_form_config — "Field & Button Visibility" de HousesView. */
export interface FormVisibilityConfig {
  visibility?: Record<string, string[]>;
  readOnly?: Record<string, string[]>;
}

export type PhotoKind = 'before' | 'after';
