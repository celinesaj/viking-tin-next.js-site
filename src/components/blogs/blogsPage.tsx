'use client';

import { useState } from 'react';
import type { BlogPost, BlogSortOption } from '@/types/blogs';
import BlogsFilters from './BlogFilter';
import BlogsGrid from './BlogsGrid';
import { useGetBlogPostsQuery } from '@/features/blogs/blogsApi';
import Pagination from '../common/pagination';

const BLOGS_PER_PAGE = 9;

function BlogsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: BLOGS_PER_PAGE }).map((_, index) => (
        <div
          key={index}
          className="h-[460px] animate-pulse rounded-[28px] bg-gray-200"
        />
      ))}
    </div>
  );
}

export default function BlogsPageContent() {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSort, setSelectedSort] = useState<BlogSortOption | ''>('newest');
  const [appliedCategoryId, setAppliedCategoryId] = useState('');
  const [appliedSort, setAppliedSort] = useState<BlogSortOption | ''>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isFetching, isError } = useGetBlogPostsQuery({
    page: currentPage,
    limit: BLOGS_PER_PAGE,
    category_id: appliedCategoryId || undefined,
    sort: appliedSort || undefined,
  });

  const blogs: BlogPost[] = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalBlogs = data?.pagination?.total ?? 0;

  const handleApply = () => {
    setAppliedCategoryId(selectedCategoryId);
    setAppliedSort(selectedSort);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSelectedCategoryId('');
    setSelectedSort('newest');
    setAppliedCategoryId('');
    setAppliedSort('newest');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showingFrom =
    totalBlogs === 0 ? 0 : (currentPage - 1) * BLOGS_PER_PAGE + 1;

  const showingTo = Math.min(currentPage * BLOGS_PER_PAGE, totalBlogs);

  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-10 md:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[270px_minmax(0,1fr)] lg:items-start">
          <BlogsFilters
            selectedCategoryId={selectedCategoryId}
            selectedSort={selectedSort}
            onCategoryChange={setSelectedCategoryId}
            onSortChange={setSelectedSort}
            onApply={handleApply}
            onClear={handleClear}
          />

          <section>
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h1 className="text-4xl font-bold tracking-[-0.03em] text-bold md:text-6xl uppercase">
                Blogs
              </h1>

              <p className="text-sm text-bold/70 md:text-base">
                Showing {showingFrom}-{showingTo} of {totalBlogs} Blogs
              </p>
            </div>

            {isLoading || isFetching ? (
              <BlogsGridSkeleton />
            ) : isError ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-600">
                Failed to load blogs.
              </div>
            ) : blogs.length === 0 ? (
              <div className="rounded-[28px] border border-black/10  p-10 text-center">
                <h2 className="text-2xl font-semibold text-bold">
                  No blogs found
                </h2>
                <p className="mt-2 text-bold/60">
                  Try changing your filters.
                </p>
              </div>
            ) : (
              <BlogsGrid blogs={blogs} />
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </section>
        </div>
      </div>
    </main>
  );
}