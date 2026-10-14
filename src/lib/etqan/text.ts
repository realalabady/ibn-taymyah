// Ported from etqan packages/core (common/arabic.ts + auth/identity.ts).

const AR_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

/** يحوّل الأرقام العربية/الفارسية إلى لاتينية. */
export function normalizeDigits(s: string): string {
  let out = "";
  for (const ch of s) {
    const a = AR_INDIC.indexOf(ch); if (a >= 0) { out += String(a); continue; }
    const p = PERSIAN.indexOf(ch); if (p >= 0) { out += String(p); continue; }
    out += ch;
  }
  return out;
}

/** تطبيع البحث العربي: أ/إ/آ/ٱ→ا، ة→ه، ى→ي، إزالة التشكيل والتطويل، وتوحيد المسافات والأرقام. */
export function normalizeArabic(s: string): string {
  return normalizeDigits(s)
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** كل كلمات الاستعلام (بعد التطبيع) يجب أن تظهر في النص المستهدف. */
export function matchesSearch(query: string, target: string): boolean {
  const t = normalizeArabic(target);
  const tokens = normalizeArabic(query).split(" ").filter(Boolean);
  return tokens.length > 0 && tokens.every((k) => t.includes(k));
}

/** رقم الهوية/الإقامة: أرقام لاتينية فقط، دون مسافات أو فواصل. */
export function normalizeNationalId(input: string): string {
  return normalizeDigits(input).replace(/[\s\-_.]/g, "");
}
/** الافتراضي مرن (6–20 رقمًا) إلى أن تُحدَّد الصيغة. */
export function isValidNationalId(id: string, pattern: RegExp = /^\d{6,20}$/): boolean { return pattern.test(id); }

/**
 * يوحّد رقم الجوال إلى صيغة دولية بلا «+» (E.164 digits).
 * 05XXXXXXXX / 5XXXXXXXX / +9665XXXXXXXX / 009665XXXXXXXX → 9665XXXXXXXX
 */
export function normalizePhone(input: string, defaultCountry = "966"): string {
  let d = normalizeDigits(input).replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = defaultCountry + d.slice(1);
  else if (/^5\d{8}$/.test(d)) d = defaultCountry + d;
  return d.replace(/\D/g, "");
}
export function isValidSaudiMobile(e164: string): boolean { return /^9665\d{8}$/.test(e164); }

/** يُظهر آخر 3 أرقام فقط (إخفاء افتراضي للهوية والجوال). */
export function mask(value: string): string {
  return value.length <= 3 ? "***" : `${"*".repeat(value.length - 3)}${value.slice(-3)}`;
}
