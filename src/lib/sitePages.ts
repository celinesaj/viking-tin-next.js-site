// import type { SitePage } from '@/types/sitePages';

// type SitePagesApiResponse = {
//   data: SitePage[];
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//   };
// };

// const SITE_PAGES_API =
//   'https://viking-tin-nestjsbackend-production.up.railway.app/pages';

// export async function getAllSitePages(): Promise<SitePage[]> {
//   try {
//     const res = await fetch(SITE_PAGES_API, {
//       next: { revalidate: 60 },
//     });

//     if (!res.ok) {
//       throw new Error(`Failed to fetch site pages: ${res.status}`);
//     }

//     const json: SitePagesApiResponse = await res.json();
//     return json.data ?? [];
//   } catch (error) {
//     console.error('getAllSitePages error:', error);
//     return [];
//   }
// }

// export async function getSitePageBySlug(slug: string): Promise<SitePage | null> {
//   const pages = await getAllSitePages();
//   return pages.find((item) => item.slug === slug) ?? null;
// }

// export async function getAllActiveSitePages(): Promise<SitePage[]> {
//   const pages = await getAllSitePages();

//   return pages.filter(
//     (item) => item.slug !== 'faq' && item.slug !== 'our-story'
//   );
// }