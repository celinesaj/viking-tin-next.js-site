import AddBlogPostDrawer from '@/app/dashboard/_components/AddBlogPostDrawer';
import BlogPostsTable from '@/app/dashboard/_components/BlogPostsTable';

export default function BlogPostsPage() {
  return (
    <div className="space-y-5">
      <AddBlogPostDrawer />
      <BlogPostsTable />
    </div>
  );
}
