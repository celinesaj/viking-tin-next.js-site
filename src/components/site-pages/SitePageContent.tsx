'use client';

import Container from '@/components/common/Container';
import type { SitePage } from '@/types/sitePages';
import SitePageHero from './SitePageHero';
import SitePageBody from './SitePageBody';

type SitePageContentProps = {
  page: SitePage;
};

export default function SitePageContent({ page }: SitePageContentProps) {
  return (
    <main className="pb-24 pt-10 md:pt-14">
      <Container>
        <div className="mx-auto max-w-[1220px]">
          <SitePageHero
            title={page.title}
            imageUrl={page.imageUrl1}
          />

          <div className="mt-10 md:mt-16">
            <SitePageBody
              content={page.content ?? ''}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}