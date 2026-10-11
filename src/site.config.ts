// Everything a manager might want to change about the site's fixed text lives here.
export const site = {
  shortName: "ابن تيمية",
  name: "حلقات ابن تيمية لتحفيظ القرآن الكريم",
  description:
    "حلقات تحفيظ القرآن الكريم للأبناء تجمع بين إتقان الحفظ وحسن التلاوة والتربية على أخلاق القرآن.",
  // TODO: replace with the real WhatsApp number in international format, digits only (e.g. 9665XXXXXXXX).
  whatsapp: "966500000000",
  // TODO: replace with the real location of the halaqat.
  location: "المسجد، الحي، المدينة",
  registerMessage: "السلام عليكم، أرغب في تسجيل ابني في حلقات ابن تيمية.",
};

export const whatsappLink = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.registerMessage)}`;

export const navLinks = [
  { href: "/#program", label: "البرنامج" },
  { href: "/#journey", label: "طريقة التسجيل" },
  { href: "/gallery", label: "المعرض" },
  { href: "/blog", label: "المدونة" },
];
