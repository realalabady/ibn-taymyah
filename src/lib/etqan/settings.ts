// Default settings from etqan db/migrations/0007_tenant_provisioning.sql (seed_tenant_defaults).

export interface SettingDef { key: string; label: string; description: string; value: unknown; reason: string }

export const DEFAULT_SETTINGS: SettingDef[] = [
  {
    key: "freeze_after_days",
    label: "تجميد السجلات",
    description: "عدد الأيام التي يبقى فيها سجل المعلم قابلًا للتعديل بعد اليوم الدراسي. يفتحه المشرف والإدارة.",
    value: { days: 4 },
    reason: "D-09: 4 أيام للمعلم",
  },
  {
    key: "recitation_warn_pages",
    label: "تنبيه مقدار التسميع",
    description: "تنبيه (لا منع) إذا تجاوز مقطع التسميع هذا العدد من الأوجه في اليوم.",
    value: { pages: 5 },
    reason: "ملف الشرح: تنبيه فوق 5 أوجه في اليوم",
  },
  {
    key: "offline_session_max_days",
    label: "مدة الجلسة دون اتصال",
    description: "أقصى عدد أيام يعمل فيها المعلم دون اتصال قبل أن يُطلب منه الدخول مجددًا.",
    value: { days: 7 },
    reason: "قيمة مقترحة قابلة للضبط",
  },
  {
    key: "password_rules",
    label: "قواعد كلمة المرور",
    description: "الحد الأدنى لطول كلمة المرور الجديدة عند تغييرها.",
    value: { min_length: 6 },
    reason: "قيمة مقترحة قابلة للضبط",
  },
  {
    key: "short_surah_factors",
    label: "معامل سهولة السور القصيرة",
    description: "×6 من الزلزلة إلى الناس · ×3 من الأعلى إلى البينة · ×1.5 من النبأ إلى الطارق · ×1 قبلها.",
    value: { default: 1, ranges: [{ from: 99, to: 114, factor: 6 }, { from: 87, to: 98, factor: 3 }, { from: 78, to: 86, factor: 1.5 }] },
    reason: "D-13: معامل سهولة السور القصيرة",
  },
  {
    key: "exam_scoring",
    label: "درجات الاختبار والخصومات",
    description: "الدرجة من 100، وخصومات الحفظ والتجويد والتردد والتغيير، وسقف السؤال، وحدود التقديرات.",
    value: {
      max_score: 100, hifz: 1, tajweed: 0.5, hesitation: 0.25, change: 1, question_cap: 4, unheard_rule: "zero_question",
      unheard_cancel_ratio: 0.5, on_cancel_label: "يحتاج للمتابعة والإعادة",
      grade_bands: [{ min: 90, label: "ممتاز" }, { min: 80, label: "جيد جدًا" }, { min: 0, label: "يحتاج إلى إعادة ومتابعة" }],
    },
    reason: "D-08: قيم العميل",
  },
];

export const SETTING_KEY_PATTERN = /^[a-z][a-z0-9_.]{1,80}$/;
/** تاريخ سريان الإعدادات الافتراضية، كما في ملف الترحيل. */
export const DEFAULTS_EFFECTIVE_FROM = "2000-01-01";
