import type { BlogPost } from '@/types/blogs';
import Image from 'next/image';
import { sanitizeHtml } from '@/lib/sanitize';   // 👈 import the lib

function formatDate(date: string | null) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  } catch {
    return '';
  }
}

export default function BlogSingleContent({ post }: { post: BlogPost }) {
  // 🛡️ Sanitize the HTML – this replaces the old decodeHtml approach
  const safeContent = sanitizeHtml(post.content);

  const bannerUrl = (post as any).coverImageUrl || (post as any).bannerUrl || null;

  return (
    <article className="min-w-0 pt-2">
      {bannerUrl && (
        <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl">
          <Image
            src={bannerUrl}
            alt={post.featuredImageAlt?.trim() || (post.title ? `${post.title} banner image` : 'Blog post banner')}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        </div>
      )}

      <h1 className="max-w-[880px] text-[40px] font-semibold leading-[1.08] md:text-[52px] xl:text-[66px]">
        {post.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[16px] text-[#6b6b6b]">
        {post.publishedAt && (
          <time dateTime={post.publishedAt} className="font-medium">
            {formatDate(post.publishedAt)}
          </time>
        )}
        <span className="text-[#bdbdbd]">•</span>
        <span>
          Author: <span className="font-medium text-[#2f2f2f]">{post.author || 'Viking Tin'}</span>
        </span>
      </div>

      <div className="mb-8 mt-6 h-px w-full max-w-[700px] bg-[#e0e0e0]" />

      {safeContent ? (
        <div
          className="blog-html max-w-[700px]"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
      ) : (
        <p className="mt-4 text-[18px] text-gray-500">No content available.</p>
      )}

      <style jsx global>{`
        .blog-html h2 {
          font-size: clamp(34px, 3vw, 58px);
          margin: 38px 0 18px;
          font-weight: 600;
          line-height: 1.2;
        }
        .blog-html h3 {
          font-size: clamp(28px, 2.5vw, 40px);
          margin: 30px 0 15px;
          font-weight: 500;
        }
        .blog-html p {
          font-size: 18px;
          color: #4a4a4a;
          margin-bottom: 18px;
          line-height: 1.6;
        }
        .blog-html a {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .blog-html a:hover {
          color: #1d4ed8;
        }
        .blog-html img {
          border-radius: 24px;
          margin: 24px 0;
          max-width: 100%;
          height: auto;
        }
        .blog-html ul, .blog-html ol {
          margin: 18px 0;
          padding-left: 1.8rem;
        }
        .blog-html li {
          font-size: 18px;
          color: #4a4a4a;
          margin-bottom: 8px;
          line-height: 1.5;
        }
        .blog-html blockquote {
          border-left: 4px solid #bdbdbd;
          padding-left: 20px;
          margin: 24px 0;
          font-style: italic;
          color: #6b6b6b;
        }
        .blog-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
        }
        .blog-html th, .blog-html td {
          border: 1px solid #e0e0e0;
          padding: 10px 12px;
          text-align: left;
        }
        .blog-html th {
          background: #f5f5f5;
          font-weight: 600;
        }
      `}</style>
    </article>
  );
}