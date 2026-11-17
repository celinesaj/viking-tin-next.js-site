'use client';

import { useGetBlogPostBySlugQuery } from '@/features/blogs/blogsApi';
import BlogSingleContent from './blogDetails';
import BlogSingleImage from './blogDetailsImg';
import BlogSingleSkeleton from './BlogSingleSkeleton';
import BlogSingleError from './BlogSingleError';

type Props = {
  slug: string;
};

export default function BlogSingleSection({ slug }: Props) {
  const { data: post, isLoading, isError } = useGetBlogPostBySlugQuery(slug, {
    skip: !slug,
  });

  if (isLoading || !slug) {
    return <BlogSingleSkeleton />;
  }

  if (isError || !post) {
    return <BlogSingleError />;
  }

  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-12 pt-6 md:px-10 lg:pb-20 lg:pt-10 xl:px-14 xl:pb-24">
      {/* Banner image – full width above content */}
      <div className="mb-10">
        <BlogSingleImage image={post.featuredImage} title={post.featuredImageAlt} />
      </div>

      {/* Content (title, date, author, body) – no image inside */}
      <BlogSingleContent post={post} />
    </section>
  );
}