'use client';

import Container from '@/components/common/Container';
import { contactPageData } from '@/mock/contact';
import ContactHeroBanner from './ContactHeroBanner';
import ContactInfoSection from './ContactInfoSection';
import ContactFormSection from './ContactFormSection';
import ContactBreadcrumb from './ContactBreadCrumb';
import {
  useGetContactInfoQuery,
  useGetContactSocialLinksQuery,
} from '@/features/contact/contactApi';

export default function ContactPageContent() {
  const {
    data: infoItems = [],
    isLoading: isInfoLoading,
    isFetching: isInfoFetching,
    isError: isInfoError,
  } = useGetContactInfoQuery({
    page: 1,
    limit: 20,
  });

  const {
    data: socialLinks = [],
    isLoading: isSocialLoading,
    isFetching: isSocialFetching,
    isError: isSocialError,
  } = useGetContactSocialLinksQuery({
    page: 1,
    limit: 20,
    is_active: true,
  });

  const isLoading =
    isInfoLoading || isInfoFetching || isSocialLoading || isSocialFetching;

  const isError = isInfoError || isSocialError;

  return (
    <main className=" pb-24 pt-10 md:pt-14">
      <Container>
        <div className="mx-auto max-w-[1220px]">
          <ContactHeroBanner hero={contactPageData.hero} />
          <ContactBreadcrumb label={contactPageData.breadcrumbLabel} />

          {isLoading ? (
            <section className="py-4 md:py-8">
              <div className="grid gap-10 lg:grid-cols-[1fr_520px] lg:gap-14">
                <div>
                  <div className="space-y-10">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex gap-5">
                        <div className="h-[40px] w-[40px] animate-pulse rounded-full bg-black/10" />
                        <div className="flex-1">
                          <div className="h-5 w-[180px] animate-pulse rounded bg-black/10" />
                          <div className="mt-4 space-y-2">
                            <div className="h-4 w-[220px] animate-pulse rounded bg-black/10" />
                            <div className="h-4 w-[180px] animate-pulse rounded bg-black/10" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10">
                    <div className="h-5 w-[140px] animate-pulse rounded bg-black/10" />
                    <div className="mt-6 flex items-center gap-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-[40px] w-[40px] animate-pulse rounded-full bg-black/10"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-[360px] animate-pulse rounded-[28px] bg-black/10" />
              </div>
            </section>
          ) : isError ? (
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-600">
              Failed to load contact information.
            </div>
          ) : (
            <ContactInfoSection
              infoItems={infoItems}
              socialLinks={socialLinks}
              map={contactPageData.map}
            />
          )}

          <ContactFormSection form={contactPageData.form} />
        </div>
      </Container>
    </main>
  );
}