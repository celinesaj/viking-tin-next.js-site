export default function BlogSingleSkeleton() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-12 pt-6 md:px-10 lg:pb-20 lg:pt-10 xl:px-14 xl:pb-24">
      {/* Featured image */}
      <div className="mb-10 aspect-[16/9] w-full animate-pulse rounded-2xl bg-[#d9d9d9]" />

      <article className="min-w-0 pt-2">
        {/* Title */}
        <div className="h-10 w-3/4 animate-pulse rounded bg-[#d9d9d9]" />
        <div className="mt-3 h-10 w-1/2 animate-pulse rounded bg-[#d9d9d9]" />

        {/* Date · Author */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-4 w-24 animate-pulse rounded bg-[#d9d9d9]" />
          <div className="h-3 w-3 animate-pulse rounded-full bg-[#d9d9d9]" />
          <div className="h-4 w-36 animate-pulse rounded bg-[#d9d9d9]" />
        </div>

        {/* Divider */}
        <div className="mb-8 mt-6 h-px w-full max-w-[700px] bg-[#e0e0e0]" />

        {/* Body lines */}
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`mb-4 h-5 animate-pulse rounded bg-[#d9d9d9] ${i % 5 === 4 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
      </article>
    </section>
  );
}
