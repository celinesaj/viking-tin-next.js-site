// import { notFound } from 'next/navigation';
// import TopMarquee from '@/components/layout/topMarquee';
// import Header from '@/components/layout/Header';
// import Footer from '@/components/layout/Footer';
// import SitePageContent from '@/components/site-pages/SitePageContent';
// import { store } from '@/store';
// import { sitePagesApi } from '@/features/site-pages/sitePagesApi';

// type PolicyPageProps = {
//   params: Promise<{
//     slug: string;
//   }>;
// };

// export async function generateStaticParams() {
//   const result = await store.dispatch(
//     sitePagesApi.endpoints.getSitePages.initiate()
//   );

//   const pages = result.data ?? [];

//   return pages.map((page) => ({
//     slug: page.slug,
//   }));
// }

// export default async function PolicyPage({ params }: PolicyPageProps) {
//   const { slug } = await params;

//   const result = await store.dispatch(
//     sitePagesApi.endpoints.getSitePageBySlug.initiate(slug)
//   );

//   const page = result.data;

//   if (!page) {
//     notFound();
//   }

//   return (
//     <>
//       <TopMarquee />
//       <Header />
//       <SitePageContent page={page} />
//       <Footer />
//     </>
//   );
// }

import { notFound } from 'next/navigation';
import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SitePageContent from '@/components/site-pages/SitePageContent';
import { localPages } from '@/data/localCatalog';

export const revalidate = 3600;

type PolicyPageProps = {
  params: Promise<{ slug: string }>;
};

async function getSitePage(slug: string) {
  return localPages.find((page) => page.slug === slug) ?? null;
}

export async function generateStaticParams() {
  return localPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PolicyPageProps) {
  const { slug } = await params;
  const page = await getSitePage(slug);

  const title =
    page?.metaTitle ||
    page?.title ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

  const description =
    page?.metaDescription ||
    page?.content?.replace(/<[^>]*>/g, '').slice(0, 155) ||
    'Viking Tin – Premium nicotine pouches in UAE.';

  return {
    title,
    description,
    alternates: {
      canonical: `/${slug}`,
    },
  };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const page = await getSitePage(slug);

  if (!page) notFound();

  return (
    <>
      <TopMarquee />
      <Header />
      <SitePageContent page={page} />
      <Footer />
    </>
  );
}