import AddBlogCategoryDrawer from '@/app/dashboard/_components/AddBlogCategoryDrawer';
import BlogCategoriesTable from '@/app/dashboard/_components/BlogCategoriesTable';

export default function BlogCategoriesPage() {
  return (
    <div className="space-y-5">
      <AddBlogCategoryDrawer />
      <BlogCategoriesTable />
    </div>
  );
}
