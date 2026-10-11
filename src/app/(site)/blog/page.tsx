import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Article } from "@phosphor-icons/react/ssr";
import { getPosts } from "@/lib/data";
import { formatDate, readingTime } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = { title: "المدونة" };

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <section className="px-4 pt-32 pb-24 md:pt-40">
      <div className="mx-auto max-w-4xl">
        <Reveal className="mb-14">
          <h1 className="font-display text-4xl leading-snug font-semibold md:text-6xl md:leading-tight">المدونة</h1>
          <p className="mt-4 text-lg text-ink-muted">أخبار الحلقات ونصائح لأولياء الأمور في رحلة الحفظ.</p>
        </Reveal>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-surface px-6 py-20 text-center ring-1 ring-line">
            <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
              <Article size={30} weight="light" />
            </span>
            <p className="font-display text-xl font-semibold">لا توجد مقالات بعد</p>
            <p className="text-ink-muted">ستظهر هنا أخبار الحلقات فور نشرها.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {posts.map((post, i) => (
              <Reveal as="li" key={post.id} delay={Math.min(i, 4) * 0.05}>
                <Link
                  href={`/blog/${post.id}`}
                  className="group grid gap-6 rounded-[2rem] p-3 transition-colors duration-300 hover:bg-surface sm:grid-cols-[14rem_1fr] sm:items-center"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-accent-soft">
                    {post.coverUrl && (
                      <Image src={post.coverUrl} alt="" fill sizes="(min-width: 640px) 224px, 100vw" className="media-outline object-cover" />
                    )}
                  </div>
                  <div className="px-2 pb-3 sm:px-0 sm:pb-0">
                    <p className="text-sm text-ink-muted">
                      {formatDate(post.createdAt)} <span aria-hidden>·</span> {readingTime(post.body)}
                    </p>
                    <h2 className="mt-2 font-display text-2xl leading-snug font-semibold transition-colors group-hover:text-accent">
                      {post.title}
                    </h2>
                    {post.excerpt && <p className="mt-2 line-clamp-2 leading-relaxed text-ink-muted">{post.excerpt}</p>}
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
