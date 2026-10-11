// Everything a manager might want to change about the site's fixed text lives here.
export const site = {
  shortName: "مجمع ابن تيمية",
  name: "مجمع ابن تيمية القرآني",
  description:
    "حلقات تحفيظ القرآن الكريم للأبناء تجمع بين إتقان الحفظ وحسن التلاوة والتربية على أخلاق القرآن.",
  // WhatsApp number in international format, digits only.
  whatsapp: "966534959517",
  location: "ابن تيمية الظهران الدانة الشمالية الخبر",
  registerMessage: "السلام عليكم، أرغب في تسجيل ابني في مجمع ابن تيمية القرآني.",
};

export const whatsappLink = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.registerMessage)}`;

export const navLinks = [
  { href: "/#program", label: "البرنامج" },
  { href: "/#journey", label: "طريقة التسجيل" },
  { href: "/gallery", label: "المعرض" },
  { href: "/blog", label: "المدونة" },
];
