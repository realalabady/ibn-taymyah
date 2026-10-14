// Ported from etqan packages/core (quran/index.ts + common/ratio.ts). Same math, browser-safe.

/** كسر دقيق (BigInt) لحساب الأوجه دون أي خطأ تقريب. */
export interface Ratio { num: bigint; den: bigint }

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while (b) { [a, b] = [b, a % b]; }
  return a;
}
function lcm(a: bigint, b: bigint): bigint { return (a / gcd(a, b)) * b; }

export function ratio(num: bigint, den: bigint): Ratio {
  if (den === 0n) throw new RangeError("zero denominator");
  if (den < 0n) { num = -num; den = -den; }
  const g = gcd(num, den) || 1n;
  return { num: num / g, den: den / g };
}

/** تقريب «نصف للأعلى» إلى digits منزلة عشرية، ويُرجع نصًا دقيقًا (للعرض). */
export function toFixed(r: Ratio, digits = 2): string {
  const neg = r.num < 0n;
  const n = neg ? -r.num : r.num;
  const scale = 10n ** BigInt(digits);
  const scaled = (n * scale * 2n + r.den) / (r.den * 2n);
  const intPart = scaled / scale;
  const frac = (scaled % scale).toString().padStart(digits, "0");
  const s = digits > 0 ? `${intPart}.${frac}` : `${intPart}`;
  return neg && scaled !== 0n ? `-${s}` : s;
}

const QUARTER_WORDS = ["", "ربع", "نصف", "ثلاثة أرباع"];

/**
 * عرض الأوجه بوحدة المقياس عند المعلمين: أقرب ربع وجه (ربع، نصف، ثلاثة أرباع، وجه…).
 * الحساب نفسه يبقى كسريًا دقيقًا؛ هذا للعرض فقط.
 */
export function formatPages(r: Ratio): string {
  const quarters = Number((r.num * 8n + r.den) / (r.den * 2n)); // round(pages × 4), half up
  if (quarters === 0) return r.num > 0n ? "أقل من ربع وجه" : "0 وجه";
  const whole = Math.floor(quarters / 4);
  const rest = QUARTER_WORDS[quarters % 4];
  if (whole === 0) return `${rest} وجه`;
  const wholeText = whole === 1 ? "وجه" : whole === 2 ? "وجهان" : whole <= 10 ? `${whole} أوجه` : `${whole} وجهًا`;
  return rest ? `${wholeText} و${rest}` : wholeText;
}

export class QuranError extends Error {
  code: "INVALID_SURAH" | "AYAH_OUT_OF_SURAH" | "RANGE_INVERTED";
  constructor(code: QuranError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export const quranErrorText: Record<QuranError["code"], string> = {
  INVALID_SURAH: "رقم السورة غير صحيح.",
  AYAH_OUT_OF_SURAH: "الآية خارج حدود السورة.",
  RANGE_INVERTED: "آية البداية بعد آية النهاية في السورة نفسها.",
};

export interface SurahRow { surah: number; name: string; ayahCount: number }
export interface AyahRow { abs: number; surah: number; ayah: number; page: number; pageCount: number }
export interface AyahRef { surah: number; ayah: number }
export interface Part { fromAbs: number; toAbs: number; from: AyahRef; to: AyahRef; pages: Ratio; ayahCount: number }
export interface RangeResult { direction: "forward" | "reverse"; parts: Part[]; pages: Ratio; ayahCount: number }

/**
 * فهرس المصحف: وزن الآية = 1 ÷ عدد آيات صفحتها، والأوجه = فرق التراكمي.
 * الحساب بأعداد صحيحة (BigInt) على مقام مشترك فلا يوجد أي خطأ تقريب.
 */
export class QuranIndex {
  readonly surahs: SurahRow[];
  readonly ayahs: AyahRow[];
  private readonly L: bigint;
  private readonly cum: bigint[];
  private readonly starts: number[];

  constructor(surahs: SurahRow[], ayahs: AyahRow[]) {
    this.surahs = surahs;
    this.ayahs = ayahs;
    this.starts = [0];
    let expect = 1;
    for (const s of surahs) {
      this.starts[s.surah] = expect;
      expect += s.ayahCount;
    }
    if (ayahs.length !== expect - 1) throw new Error(`ayah count mismatch: ${ayahs.length} vs ${expect - 1}`);
    ayahs.forEach((a, i) => {
      if (a.abs !== i + 1) throw new Error(`abs_no not sequential at ${i + 1}`);
      const s = surahs[a.surah - 1];
      if (!s || a.ayah < 1 || a.ayah > s.ayahCount || this.starts[a.surah] + a.ayah - 1 !== a.abs) throw new Error(`bad ayah row ${a.abs}`);
    });
    let L = 1n;
    for (const c of new Set(ayahs.map((a) => a.pageCount))) L = lcm(L, BigInt(c));
    this.L = L;
    this.cum = [0n];
    for (const a of ayahs) this.cum.push(this.cum[this.cum.length - 1] + L / BigInt(a.pageCount));
  }

  static fromCsv(surahsCsv: string, ayahsCsv: string): QuranIndex {
    const rows = (t: string) => t.replace(/^﻿/, "").trim().split(/\r?\n/).slice(1).map((l) => l.split(","));
    const surahs = rows(surahsCsv).map((r) => ({ surah: +r[0], name: r[1], ayahCount: +r[2] }));
    const ayahs = rows(ayahsCsv).map((r) => ({ abs: +r[0], surah: +r[1], ayah: +r[2], page: +r[3], pageCount: +r[4] }));
    return new QuranIndex(surahs, ayahs);
  }

  get totalAyahs(): number { return this.ayahs.length; }
  get totalPages(): Ratio { return ratio(this.cum[this.cum.length - 1], this.L); }

  surahStart(s: number): number { this.checkSurah(s); return this.starts[s]; }
  surahEnd(s: number): number { this.checkSurah(s); return this.starts[s] + this.surahs[s - 1].ayahCount - 1; }

  private checkSurah(s: number): void {
    if (!Number.isInteger(s) || s < 1 || s > this.surahs.length) throw new QuranError("INVALID_SURAH", `surah ${s}`);
  }

  absOf(surah: number, ayah: number): number {
    this.checkSurah(surah);
    if (!Number.isInteger(ayah) || ayah < 1 || ayah > this.surahs[surah - 1].ayahCount)
      throw new QuranError("AYAH_OUT_OF_SURAH", `ayah ${ayah} not in surah ${surah}`);
    return this.starts[surah] + ayah - 1;
  }

  refOf(abs: number): AyahRef {
    const a = this.ayahs[abs - 1];
    if (!a) throw new RangeError(`abs ${abs}`);
    return { surah: a.surah, ayah: a.ayah };
  }

  /** أوجه مقطع تصاعدي [a..b] بالترتيب المطلق: cum[b] − cum[a−1]. */
  pagesBetween(a: number, b: number): Ratio {
    if (!(a >= 1 && b <= this.ayahs.length && a <= b)) throw new RangeError(`bad abs range ${a}..${b}`);
    return ratio(this.cum[b] - this.cum[a - 1], this.L);
  }

  private part(a: number, b: number): Part {
    return { fromAbs: a, toAbs: b, from: this.refOf(a), to: this.refOf(b), pages: this.pagesBetween(a, b), ayahCount: b - a + 1 };
  }

  /**
   * مقاطع المدى. إذا كانت سورة «من» بعد سورة «إلى» فالحفظ من آخر المصحف:
   * بقية سورة البداية + السور الكاملة بينهما + أول سورة النهاية حتى آيتها.
   */
  calc(fromSurah: number, fromAyah: number, toSurah: number, toAyah: number): RangeResult {
    const a = this.absOf(fromSurah, fromAyah);
    const b = this.absOf(toSurah, toAyah);
    let parts: Part[];
    let direction: "forward" | "reverse";
    if (fromSurah <= toSurah) {
      if (a > b) throw new QuranError("RANGE_INVERTED", "from ayah is after to ayah");
      direction = "forward";
      parts = [this.part(a, b)];
    } else {
      direction = "reverse";
      parts = [this.part(a, this.surahEnd(fromSurah))];
      for (let s = fromSurah - 1; s > toSurah; s--) parts.push(this.part(this.surahStart(s), this.surahEnd(s)));
      parts.push(this.part(this.surahStart(toSurah), b));
    }
    const total = parts.reduce((acc, p) => acc + p.pages.num * (this.L / p.pages.den), 0n);
    return { direction, parts, pages: ratio(total, this.L), ayahCount: parts.reduce((n, p) => n + p.ayahCount, 0) };
  }

  /** نص سطر المعاينة، مثل «= وجهان: المطففين ثم الانفطار» (بأقرب ربع وجه). */
  previewLine(r: RangeResult): string {
    const names: string[] = [];
    for (const p of r.parts) {
      const first = this.surahs[p.from.surah - 1].name;
      if (names[names.length - 1] !== first) names.push(first);
    }
    return `= ${formatPages(r.pages)}: ${names.join(" ثم ")}`;
  }

  // ----- الأجزاء (من رقم الصفحة، كما في مصحف المدينة) -----
  juzOfPage(page: number): number {
    if (page < 1 || page > 604) throw new RangeError(`page ${page}`);
    return page < 22 ? 1 : Math.min(30, Math.floor((page - 2) / 20) + 1);
  }
  juzPages(juz: number): { from: number; to: number } {
    if (juz < 1 || juz > 30) throw new RangeError(`juz ${juz}`);
    return { from: juz === 1 ? 1 : 2 + 20 * (juz - 1), to: juz === 30 ? 604 : 1 + 20 * juz };
  }
}

let cached: Promise<QuranIndex> | null = null;

/** يحمّل الفهرس مرة واحدة من public/etqan (ملف العميل، انظر etqan SOURCE.txt). */
export function loadQuranIndex(): Promise<QuranIndex> {
  cached ??= Promise.all([
    fetch("/etqan/surahs.csv").then((r) => r.text()),
    fetch("/etqan/ayahs.csv").then((r) => r.text()),
  ]).then(([s, a]) => QuranIndex.fromCsv(s, a));
  cached.catch(() => (cached = null));
  return cached;
}
