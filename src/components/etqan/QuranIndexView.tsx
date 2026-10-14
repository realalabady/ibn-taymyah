"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Btn, Input, Notice } from "@/components/admin/ui";
import { loadQuranIndex, formatPages, QuranError, quranErrorText, type QuranIndex, type RangeResult } from "@/lib/etqan/quran";
import { matchesSearch } from "@/lib/etqan/text";
import { Badge, Card, PageHeader, Select, Skeleton } from "./kit";

export function QuranIndexView() {
  const [index, setIndex] = useState<QuranIndex | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQuranIndex().then(setIndex, () => setError("تعذّر تحميل فهرس المصحف. تحقق من الاتصال ثم أعد تحميل الصفحة."));
  }, []);

  return (
    <>
      <PageHeader
        title="فهرس المصحف"
        description="114 سورة · 6236 آية · 604 أوجه، من ملف الفهرس المعتمد. وزن الآية = 1 ÷ عدد آيات صفحتها، والحساب دقيق، ويُعرض المقدار بأقرب ربع وجه."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {!index ? (
        !error && <Skeleton rows={3} />
      ) : (
        <div className="flex flex-col gap-8">
          <Calculator index={index} />
          <SurahTable index={index} />
        </div>
      )}
    </>
  );
}

function AyahPicker({ index, label, surah, ayah, onChange }: {
  index: QuranIndex;
  label: string;
  surah: number;
  ayah: number;
  onChange: (surah: number, ayah: number) => void;
}) {
  const count = index.surahs[surah - 1].ayahCount;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[15px] font-medium">{label}</legend>
      <div className="grid grid-cols-[1fr_7rem] gap-2">
        <Select value={surah} onChange={(e) => onChange(Number(e.target.value), 1)} aria-label={`${label}: السورة`}>
          {index.surahs.map((s) => (
            <option key={s.surah} value={s.surah}>
              {s.surah}. {s.name}
            </option>
          ))}
        </Select>
        <Select value={ayah} onChange={(e) => onChange(surah, Number(e.target.value))} aria-label={`${label}: الآية`}>
          {Array.from({ length: count }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn type="button" variant="ghost" className="min-h-9 px-3" disabled={ayah <= 1} onClick={() => onChange(surah, ayah - 1)}>
          −1 آية
        </Btn>
        <Btn type="button" variant="ghost" className="min-h-9 px-3" disabled={ayah >= count} onClick={() => onChange(surah, ayah + 1)}>
          +1 آية
        </Btn>
        <Btn type="button" variant="ghost" className="min-h-9 px-3" disabled={ayah === count} onClick={() => onChange(surah, count)}>
          إلى نهاية السورة
        </Btn>
      </div>
    </fieldset>
  );
}

function Calculator({ index }: { index: QuranIndex }) {
  const [from, setFrom] = useState({ surah: 83, ayah: 1 });
  const [to, setTo] = useState({ surah: 82, ayah: 19 });

  const outcome = useMemo((): { result: RangeResult } | { error: string } => {
    try {
      return { result: index.calc(from.surah, from.ayah, to.surah, to.ayah) };
    } catch (err) {
      return { error: err instanceof QuranError ? quranErrorText[err.code] : "مدى غير صالح." };
    }
  }, [index, from, to]);

  const name = (s: number) => index.surahs[s - 1].name;

  return (
    <Card>
      <h2 className="mb-1 font-display text-xl font-semibold">حاسبة الأوجه</h2>
      <p className="mb-6 text-[15px] text-ink-muted">
        إذا كانت سورة البداية بعد سورة النهاية فالحفظ عكسي من آخر المصحف: بقية سورة البداية، ثم السور الكاملة بينهما، ثم أول سورة النهاية.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <AyahPicker index={index} label="من" surah={from.surah} ayah={from.ayah} onChange={(surah, ayah) => setFrom({ surah, ayah })} />
        <AyahPicker index={index} label="إلى" surah={to.surah} ayah={to.ayah} onChange={(surah, ayah) => setTo({ surah, ayah })} />
      </div>

      <div className="mt-6 rounded-2xl bg-accent-soft/60 p-5" aria-live="polite">
        {"error" in outcome ? (
          <p className="font-medium text-red-700">{outcome.error}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-2xl font-semibold text-accent">{index.previewLine(outcome.result)}</p>
              <Badge tone={outcome.result.direction === "reverse" ? "warn" : "accent"}>
                {outcome.result.direction === "reverse" ? "اتجاه عكسي" : "اتجاه تصاعدي"}
              </Badge>
            </div>
            <p className="mt-1 text-[15px] text-ink-muted">
              {outcome.result.ayahCount} آية · {formatPages(outcome.result.pages)}
            </p>
            {outcome.result.parts.length > 1 && (
              <ol className="mt-4 flex flex-col gap-1.5 text-[15px]">
                {outcome.result.parts.map((p, i) => (
                  <li key={i} className="flex flex-wrap justify-between gap-2 rounded-xl bg-surface/70 px-3 py-2">
                    <span>
                      {name(p.from.surah)} {p.from.ayah}
                      {p.from.surah === p.to.surah ? `–${p.to.ayah}` : ` ← ${name(p.to.surah)} ${p.to.ayah}`}
                    </span>
                    <span className="tabular-nums text-ink-muted">
                      {p.ayahCount} آية · {formatPages(p.pages)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function SurahTable({ index }: { index: QuranIndex }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () =>
      index.surahs
        .map((s) => {
          const startPage = index.ayahs[index.surahStart(s.surah) - 1].page;
          const endAbs = index.surahEnd(s.surah);
          return { ...s, startPage, juz: index.juzOfPage(startPage), pages: formatPages(index.pagesBetween(index.surahStart(s.surah), endAbs)) };
        })
        .filter((s) => !query.trim() || matchesSearch(query, s.name) || String(s.surah) === query.trim()),
    [index, query],
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">فهرس السور</h2>
        <div className="relative w-full max-w-xs">
          <MagnifyingGlass size={18} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث باسم السورة أو رقمها" className="ps-11" aria-label="بحث في السور" />
        </div>
      </div>
      <div className="overflow-x-auto rounded-[1.5rem] ring-1 ring-line">
        <table className="w-full min-w-[32rem] bg-surface text-[15px]">
          <thead className="bg-surface-2/70 text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-start font-medium">#</th>
              <th className="px-4 py-3 text-start font-medium">السورة</th>
              <th className="px-4 py-3 text-start font-medium">الآيات</th>
              <th className="px-4 py-3 text-start font-medium">الأوجه</th>
              <th className="px-4 py-3 text-start font-medium">تبدأ في الوجه</th>
              <th className="px-4 py-3 text-start font-medium">الجزء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular-nums">
            {rows.map((s) => (
              <tr key={s.surah}>
                <td className="px-4 py-2.5 text-ink-muted">{s.surah}</td>
                <td className="px-4 py-2.5 font-medium">{s.name}</td>
                <td className="px-4 py-2.5">{s.ayahCount}</td>
                <td className="px-4 py-2.5">{s.pages}</td>
                <td className="px-4 py-2.5">{s.startPage}</td>
                <td className="px-4 py-2.5">{s.juz}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
