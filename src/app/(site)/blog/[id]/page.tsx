import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import { getPost } from "@/lib/data";
import { formatDate, readingTime } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/blog/[id]">): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: "المقال غير موجود" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: { title: post.title, description: post.excerpt || undefined, images: post.coverUrl ? [post.coverUrl] : [] },
  };
}

export default function PostPage(props: PageProps<"/blog/[id]">) {
  return (
    <article className="px-4 pt-32 pb-24 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink">
          <ArrowRight size={16} />
          كل المقالات
        </Link>
        <Suspense fallback={<PostSkeleton />}>
          <PostContent params={props.params} />
        </Suspense>
      </div>
    </article>
  );
}

async function PostContent({ params }: Pick<PageProps<"/blog/[id]">, "params">) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const blocks = post.body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <>
      <header className="mt-8">
        <p className="text-sm text-ink-muted">
          {formatDate(post.createdAt)} <span aria-hidden>·</span> {readingTime(post.body)}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.35] font-semibold md:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="mt-5 text-xl leading-relaxed text-ink-muted">{post.excerpt}</p>}
      </header>

      {post.coverUrl && (
        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[2rem] bg-accent-soft">
          <Image src={post.coverUrl} alt={post.title} fill priority sizes="(min-width: 768px) 768px, 100vw" className="media-outline object-cover" />
        </div>
      )}

      <div className="prose-ar mt-12">
        {blocks.map((block, i) =>
          block.startsWith("## ") ? (
            <h2 key={i}>{block.slice(3)}</h2>
          ) : (
            <p key={i} className="whitespace-pre-line">
              {block}
            </p>
          ),
        )}
      </div>
    </>
  );
}

function PostSkeleton() {
  return (
    <div className="mt-8 animate-pulse" aria-hidden>
      <div className="h-4 w-40 rounded-full bg-surface-2" />
      <div className="mt-5 h-12 w-4/5 rounded-2xl bg-surface-2" />
      <div className="mt-10 aspect-[16/9] rounded-[2rem] bg-surface-2" />
      <div className="mt-12 space-y-4">
        <div className="h-4 rounded-full bg-surface-2" />
        <div className="h-4 w-11/12 rounded-full bg-surface-2" />
        <div className="h-4 w-4/5 rounded-full bg-surface-2" />
      </div>
    </div>
  );
}
