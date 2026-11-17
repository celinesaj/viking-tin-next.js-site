import Link from 'next/link';

export default function BlogSingleError() {
  return (
    <section className="mx-auto max-w-[1720px] px-6 py-16 text-center md:px-10 xl:px-14">
      <h1 className="text-3xl font-semibold uppercase text-black">
        Blog post not found
      </h1>

      <p className="mt-4 text-[16px] text-[#6f6f6f]">
        The requested article could not be loaded.
      </p>

      <Link
        href="/blogs"
        className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase text-white"
      >
        Back to blogs
      </Link>
    </section>
  );
}