import type { BlogPost } from '@/types/blogs';
import BlogCard from './BlogCard';

type BlogsGridProps = {
  blogs: BlogPost[];
};

export default function BlogsGrid({ blogs }: BlogsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {blogs.map((blog) => (
        <BlogCard key={blog.id} post={blog} />
      ))}
    </div>
  );
}