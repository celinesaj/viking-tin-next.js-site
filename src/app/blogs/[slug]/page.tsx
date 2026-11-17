import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import TopMarquee from '@/components/layout/topMarquee';
import BlogSingleSection from '@/components/blogs/BlogDetailsSection';
import { localBlogs } from '@/data/localCatalog';

export const revalidate = 3600;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getBlogPost(slug: string) {
  return localBlogs.find((post) => post.slug === slug) ?? null;
}

export async function generateStaticParams() {
  return localBlogs.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  const title =
    post?.metaTitle ||
    post?.title ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const description =
    post?.metaDescription ||
    post?.content?.replace(/<[^>]*>/g, '').slice(0, 155) ||
    'Read the latest news and updates from Viking Tin.';

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return (
    <>
      <TopMarquee />
      <Header />
      <main>
        <BlogSingleSection slug={slug} />
      </main>
      <Footer />
    </>
  );
}