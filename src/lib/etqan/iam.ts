// Ported from etqan packages/core (iam/matrix.ts + iam/scope.ts + iam/evaluate.ts).
// مصفوفة الأدوار والصلاحيات (القسم 3 من الوثيقة).

export type Role = "SA" | "OA" | "CA" | "MA" | "SV" | "TC" | "ST" | "AC" | "PA" | "SD" | "VW" | "GU";
export const ROLES: Role[] = ["SA", "OA", "CA", "MA", "SV", "TC", "ST", "AC", "PA", "SD", "VW", "GU"];

export const ROLE_INFO: Record<Role, { nameAr: string; rank: number }> = {
  SA: { nameAr: "مدير النظام", rank: 100 }, OA: { nameAr: "مدير الجمعية", rank: 90 },
  CA: { nameAr: "مدير المركز", rank: 80 }, MA: { nameAr: "مدير المجمع/المسجد", rank: 70 },
  SV: { nameAr: "مشرف", rank: 60 }, TC: { nameAr: "معلم", rank: 50 },
  ST: { nameAr: "موظف إداري", rank: 50 }, AC: { nameAr: "محاسب", rank: 50 },
  PA: { nameAr: "ولي أمر (وضع العائلة)", rank: 20 }, SD: { nameAr: "طالب", rank: 20 },
  VW: { nameAr: "متابع", rank: 10 }, GU: { nameAr: "زائر", rank: 0 },
};

/** scoped = تُقيَّد بمسار تنظيمي · related = بعلاقة بالطالب · public = بلا نطاق · platform = على مستوى المنصة */
export type PermKind = "scoped" | "related" | "public" | "platform";
export const PERMISSIONS: Record<string, PermKind> = {
  "tenants.manage": "platform",
  "org.manage": "scoped", "org.manage_circles": "scoped",
  "iam.manage": "scoped", "iam.manage_lower": "scoped", "users.reset_password": "scoped", "settings.manage": "scoped",
  "students.read": "scoped", "students.read_admin": "scoped", "students.read_finance": "scoped", "students.create": "scoped", "students.update": "scoped",
  "students.approve": "scoped", "students.transfer": "scoped", "students.recommend": "scoped", "students.request": "public", "archive.manage": "scoped",
  "attendance.read": "scoped", "attendance.write": "scoped", "attendance.approve": "scoped", "attendance.cancel_day": "scoped",
  "recitations.read": "scoped", "recitations.write": "scoped", "recitations.correct": "scoped",
  "plans.read": "scoped", "plans.write": "scoped",
  "exams.read": "scoped", "exams.setup": "scoped", "exams.run": "scoped", "exams.assign": "scoped", "exams.approve": "scoped",
  "behavior.read": "scoped", "behavior.write": "scoped", "points.grant": "scoped",
  "leaves.request": "scoped", "leaves.recommend": "scoped", "leaves.approve": "scoped",
  "notify.send": "scoped", "notify.send_own": "scoped",
  "reports.read": "scoped", "reports.read_own": "scoped",
  "export.pdf": "scoped", "export.excel": "scoped", "export.md": "scoped", "export.own": "related",
  "pii.unmask": "scoped", "pii.view_own": "related",
  "finance.read": "scoped", "finance.write": "scoped", "finance.report": "scoped", "finance.read_related": "related",
  "certs.issue": "scoped", "certs.request": "scoped", "certs.read_related": "related", "certs.verify": "public",
  "tv.manage": "scoped", "ai.request": "scoped", "audit.read": "scoped", "audit.read_scope": "scoped", "records.unfreeze": "scoped",
  "students.read_related": "related", "attendance.read_related": "related", "recitations.read_related": "related",
  "behavior.read_related": "related", "reports.read_related": "related", "requests.create": "related",
};

const EXPORTS = ["export.pdf", "export.excel", "export.md"];
const MGR_COMMON = [
  "students.read", "students.create", "students.update", "students.approve", "students.transfer", "archive.manage",
  "attendance.read", "attendance.write", "attendance.cancel_day", "recitations.read", "plans.read", "plans.write",
  "exams.read", "exams.approve", "behavior.read", "behavior.write", "points.grant", "leaves.approve", "notify.send",
  "reports.read", ...EXPORTS, "pii.unmask", "finance.report", "certs.issue", "tv.manage", "ai.request",
  "records.unfreeze", "users.reset_password",
];

/** صلاحيات كل دور افتراضيًا (خلايا ✔). */
export const ROLE_DEFAULTS: Record<Role, string[]> = {
  SA: ["tenants.manage"],
  OA: [...MGR_COMMON, "org.manage", "org.manage_circles", "iam.manage", "iam.manage_lower", "audit.read", "audit.read_scope", "settings.manage"],
  CA: [...MGR_COMMON, "org.manage", "org.manage_circles", "iam.manage_lower", "audit.read_scope"],
  MA: [...MGR_COMMON, "org.manage_circles", "iam.manage_lower", "audit.read_scope", "recitations.correct", "exams.assign"],
  SV: ["students.read", "students.recommend", "attendance.read", "attendance.approve", "recitations.read", "recitations.correct",
    "plans.read", "plans.write", "exams.read", "exams.setup", "exams.run", "exams.approve", "behavior.read", "behavior.write",
    "points.grant", "leaves.recommend", "notify.send", "reports.read", "ai.request", "records.unfreeze", "users.reset_password"],
  TC: ["students.read", "attendance.read", "attendance.write", "recitations.read", "recitations.write", "plans.read", "plans.write",
    "exams.read", "exams.setup", "exams.run", "behavior.read", "behavior.write", "points.grant", "leaves.request",
    "notify.send_own", "reports.read_own", "ai.request", "certs.request"],
  ST: ["pii.unmask", "students.read_admin"],
  AC: ["finance.read", "finance.write", "students.read_finance"],
  PA: ["students.read_related", "attendance.read_related", "recitations.read_related", "behavior.read_related", "reports.read_related",
    "certs.read_related", "finance.read_related", "export.own", "pii.view_own", "requests.create", "students.request"],
  SD: ["students.read_related", "attendance.read_related", "recitations.read_related", "behavior.read_related", "reports.read_related",
    "certs.read_related", "export.own", "pii.view_own", "requests.create"],
  VW: [],
  GU: ["students.request", "certs.verify"],
};

/** ما يجوز منحه لدور بتفويض صريح (خلايا ◐). ما عداه ممنوع منحه. */
export const GRANTABLE: Record<Role, string[]> = {
  SA: [], OA: [], CA: [], MA: [],
  SV: [...EXPORTS, "pii.unmask", "certs.issue"],
  TC: [...EXPORTS, "pii.unmask", "certs.issue", "reports.read"],
  ST: ["students.read", "students.create", "students.update", "attendance.read", "attendance.write", "notify.send", "reports.read", ...EXPORTS, "archive.manage"],
  AC: [...EXPORTS, "pii.unmask"],
  PA: [], SD: [],
  VW: ["students.read_related", "attendance.read_related", "recitations.read_related", "behavior.read_related", "reports.read_related"],
  GU: [],
};

export function canGrant(role: Role, perm: string): boolean { return GRANTABLE[role].includes(perm); }

/** إنشاء حسابات لأدوار أدنى فقط (لا ترقية فوق دور المانح). */
export function canAssignRole(actorRoles: Role[], target: Role): boolean {
  const perms = new Set(actorRoles.flatMap((r) => ROLE_DEFAULTS[r]));
  if (!perms.has("iam.manage") && !perms.has("iam.manage_lower")) return false;
  const actorRank = Math.max(...actorRoles.map((r) => ROLE_INFO[r].rank));
  return ROLE_INFO[target].rank < actorRank;
}

/** هل المسار يقع ضمن النطاق (مساوٍ له أو أحد أبنائه)؟ المسار: معرّفات العقد مفصولة بنقطة. */
export function isWithin(path: string, scope: string): boolean {
  return path === scope || path.startsWith(scope + ".");
}
export function isActive(g: { validFrom?: string | null; validTo?: string | null }, today: string): boolean {
  return (!g.validFrom || g.validFrom <= today) && (!g.validTo || today < g.validTo);
}

/** أسماء الصلاحيات بالعربية لشاشة التفويض. */
export const PERM_LABELS: Record<string, string> = {
  "export.pdf": "تصدير PDF", "export.excel": "تصدير Excel", "export.md": "تصدير MD",
  "pii.unmask": "رؤية الهوية والجوال دون إخفاء", "certs.issue": "إصدار الشهادات", "reports.read": "التقارير التشغيلية",
  "students.read": "عرض الطلاب", "students.create": "تسجيل الطلاب", "students.update": "تعديل الطلاب",
  "attendance.read": "عرض الحضور", "attendance.write": "إدخال الحضور", "notify.send": "إرسال الإشعارات",
  "archive.manage": "الأرشفة والاستعادة",
  "students.read_related": "عرض الطالب المرتبط", "attendance.read_related": "عرض حضور الطالب المرتبط",
  "recitations.read_related": "عرض تسميع الطالب المرتبط", "behavior.read_related": "عرض سلوك الطالب المرتبط",
  "reports.read_related": "تقارير الطالب المرتبط",
};
