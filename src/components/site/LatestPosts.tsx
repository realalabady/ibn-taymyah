import Image from "next/image";
import Link from "next/link";
import { Article } from "@phosphor-icons/react/ssr";
import { getPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";

export async function LatestPosts() {
  const posts = await getPosts();
  const [lead, ...rest] = posts;

  return (
    <section id="blog" className="bg-surface px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl leading-snug font-semibold md:text-5xl md:leading-tight">
            أخبار الحلقات
          </h2>
          <p className="mt-4 text-lg text-ink-muted">أخبار الحلقات ونصائح لأولياء الأمور في رحلة الحفظ.</p>
        </Reveal>

        {!lead ? (
          <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-bg px-6 py-20 text-center ring-1 ring-line">
            <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
              <Article size={30} weight="light" />
            </span>
            <p className="font-display text-xl font-semibold">لا توجد مقالات بعد</p>
            <p className="text-ink-muted">ستظهر هنا أخبار الحلقات فور نشرها.</p>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-14">
            <Reveal>
              <Link href={`/blog/${lead.id}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-accent-soft">
                  {lead.coverUrl ? (
                    <Image
                      src={lead.coverUrl}
                      alt={lead.title}
                      fill
                      sizes="(min-width: 768px) 55vw, 100vw"
                      className="media-outline object-cover transition-transform duration-700 ease-spring group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-10">
                      <span className="font-display text-3xl font-semibold text-accent">{lead.title}</span>
                    </div>
                  )}
                </div>
                <p className="mt-6 text-sm text-ink-muted">{formatDate(lead.createdAt)}</p>
                <h3 className="mt-2 font-display text-2xl leading-snug font-semibold transition-colors group-hover:text-accent md:text-3xl">
                  {lead.title}
                </h3>
                {lead.excerpt && <p className="mt-3 max-w-[60ch] leading-relaxed text-ink-muted">{lead.excerpt}</p>}
              </Link>
            </Reveal>

            {rest.length > 0 && (
              <div className="flex flex-col gap-8 md:pt-2">
                {rest.map((post, i) => (
                  <Reveal key={post.id} delay={0.08 * Math.min(i + 1, 3)}>
                    <Link href={`/blog/${post.id}`} className="group flex gap-5">
                      {post.coverUrl && (
                        <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[1.25rem] bg-accent-soft">
                          <Image src={post.coverUrl} alt="" fill sizes="112px" className="media-outline object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-ink-muted">{formatDate(post.createdAt)}</p>
                        <h3 className="mt-1 font-display text-xl leading-snug font-semibold transition-colors group-hover:text-accent">
                          {post.title}
                        </h3>
                        {post.excerpt && <p className="mt-2 line-clamp-2 leading-relaxed text-ink-muted">{post.excerpt}</p>}
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
