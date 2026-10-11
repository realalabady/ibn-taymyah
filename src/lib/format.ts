const dateFormat = new Intl.DateTimeFormat("ar", { day: "numeric", month: "long", year: "numeric" });

export function formatDate(ms: number) {
  return ms ? dateFormat.format(new Date(ms)) : "";
}

// Arabic counted nouns change form with the number, so build the whole label here.
export function readingTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const n = Math.max(1, Math.round(words / 180));
  if (n === 1) return "دقيقة قراءة";
  if (n === 2) return "دقيقتان للقراءة";
  if (n <= 10) return `${n} دقائق قراءة`;
  return `${n} دقيقة قراءة`;
}
