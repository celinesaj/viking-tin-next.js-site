'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BlogPost } from '@/types/blogs';
import MediaFallback from '@/components/common/MediaFallback';

type Props = {
  post: BlogPost;
  compact?: boolean;
};

function formatDate(date: string | null) {
  if (!date) return '';
  const parsed = new Date(date);
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BlogCard({ post, compact = false }: Props) {
  const router = useRouter();
  const [mediaError, setMediaError] = useState(false);
  const imageSrc = post.featuredImage?.trim() ?? '';
  const showFallback = mediaError || !imageSrc;

  const imageAlt =
    post.featuredImageAlt?.trim() ||
    (post.title ? `${post.title} blog image` : 'Blog post image');

  const handleCardClick = () => {
    router.push(`/blogs/${post.slug}`);
  };

  return (
    <article className="w-full">
      <Link href={`/blogs/${post.slug}`} className="block">
        <div className="relative overflow-hidden rounded-[10px]">
          <div className="relative aspect-[4/3] w-full">
            {showFallback ? (
              <MediaFallback label="Blog image unavailable" />
            ) : (
              <img
                src={imageSrc}
                alt={imageAlt}
                className="h-full w-full object-cover object-top"
                onError={() => setMediaError(true)}
              />
            )}
          </div>
        </div>
      </Link>

      <div
        className={`
          mt-2 cursor-pointer rounded-[16px] bg-white
          ${compact ? 'p-2 sm:p-3 md:p-4' : 'p-3 sm:p-4 md:p-5'}
        `}
        onClick={handleCardClick}
      >
        <div
          className={`
            flex items-center justify-between gap-3 border-b pb-2 text-[#9a9a9a]
            ${compact ? 'text-[10px] sm:text-[11px] md:text-[12px]' : 'text-[11px] sm:text-[12px] md:text-[13px]'}
          `}
        >
          <span className="min-w-0 truncate">
            {post.category?.name || post.author || 'Admin'}
          </span>
          <span className="shrink-0">{formatDate(post.publishedAt)}</span>
        </div>

        <div className="mt-4">
          <h3
            className={`
              overflow-hidden line-clamp-2 font-semibold uppercase text-black
              ${compact ? 'text-[13px] sm:text-[14px] md:text-[15px]' : 'text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px]'}
            `}
            title={post.title}
          >
            {post.title}
          </h3>

          <p
            className={`
              mt-2 line-clamp-1 text-[#9b9b9b]
              ${compact ? 'text-[10px] sm:text-[11px] md:text-[12px]' : 'text-[11px] sm:text-[12px] md:text-[13px]'}
            `}
            title={post.metaDescription || post.content || ''}
          >
            {post.metaDescription || post.content || ''}
          </p>
        </div>
      </div>
    </article>
  );
}