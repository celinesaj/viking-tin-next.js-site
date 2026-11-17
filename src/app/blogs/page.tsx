
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TopMarquee from '@/components/layout/topMarquee';
import BlogsPageContent from '@/components/blogs/blogsPage';
;

export const metadata = {
  title: 'Blog - Latest News & Articles',
  description: 'Stay informed with the latest news, articles, and insights about nicotine pouches, health, and lifestyle from Viking Tin.',
  keywords: ['nicotine pouch blog', 'nicotine news', 'health articles', 'lifestyle blog', 'nicotine education'],
  openGraph: {
    title: 'Viking Tin Blog - Latest News & Articles',
    description: 'Stay informed with the latest news and articles about nicotine pouches and lifestyle.',

  },
};

export default function BlogsPage() {
  return (
    <>
      <TopMarquee />
      <Header />
      <BlogsPageContent />
      <Footer />
    </>
  );
}