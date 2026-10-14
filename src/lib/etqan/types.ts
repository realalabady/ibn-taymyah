import type { Role } from "./iam";

// Firestore collections, one per Etqan table (db/migrations 0003–0005). Single tenant: this site is one complex.
export const COLLECTIONS = {
  organization: "etqan_organizations",
  center: "etqan_centers",
  mosque: "etqan_mosques",
  circle: "etqan_circles",
  period: "etqan_periods",
  program: "etqan_programs",
  curriculum: "etqan_curricula",
  course: "etqan_courses",
  account: "etqan_users",
  setting: "etqan_settings",
  audit: "etqan_audit",
  meta: "etqan_meta",
} as const;

export type Entity = Exclude<keyof typeof COLLECTIONS, "setting" | "audit" | "meta">;

export const ENTITY_LABELS: Record<Entity, string> = {
  organization: "جهة",
  center: "مركز",
  mosque: "مسجد/مدرسة",
  circle: "حلقة",
  period: "فترة",
  program: "برنامج",
  curriculum: "منهج",
  course: "مقرر",
  account: "مستخدم",
};

/** أعمدة مشتركة لكل سجل (4.2): الإصدار للقفل المتفائل، والأرشفة بدل الحذف. */
export interface Base {
  id: string;
  version: number;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  archivedAt: number | null;
  archivedBy: string | null;
  archiveReason: string | null;
}

export type ActiveStatus = "active" | "suspended";

export interface Organization extends Base { name: string; status: ActiveStatus; region: string; path: string }
export interface Center extends Base { organizationId: string; name: string; region: string; path: string }
export interface Mosque extends Base { centerId: string; name: string; type: "mosque" | "school"; address: string; region: string; path: string }
export interface Circle extends Base {
  mosqueId: string;
  periodId: string;
  programId: string | null;
  curriculumId: string | null;
  name: string;
  type: string;
  weekdays: number[];
  capacity: number;
  status: ActiveStatus;
  path: string;
}
export interface Period extends Base { organizationId: string; name: string; startTime: string; endTime: string }
export interface Program extends Base { organizationId: string; name: string; targets: string }
export interface Curriculum extends Base { programId: string; name: string; level: number | null }
export interface Course extends Base { curriculumId: string; name: string; level: number | null }

export interface RoleAssignment { role: Role; scopePath: string; validFrom: string; validTo: string | null }
export interface Grant { perm: string; validFrom: string; validTo: string | null; reason: string }

export interface Account extends Base {
  nationalId: string;
  phone: string;
  email: string;
  fullName: string;
  nameSearch: string;
  accountType: "staff" | "student";
  status: ActiveStatus;
  roles: RoleAssignment[];
  grants: Grant[];
}

export interface EntityMap {
  organization: Organization;
  center: Center;
  mosque: Mosque;
  circle: Circle;
  period: Period;
  program: Program;
  curriculum: Curriculum;
  course: Course;
  account: Account;
}

export interface SettingVersion {
  id: string;
  key: string;
  version: number;
  effectiveFrom: string;
  value: unknown;
  reason: string;
  createdAt: number;
  createdBy: string;
}

export interface AuditRow {
  id: string;
  chainNo: number;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeText: string | null;
  afterText: string | null;
  reason: string | null;
  atMs: number;
  prevHash: string;
  hash: string;
}

export const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
