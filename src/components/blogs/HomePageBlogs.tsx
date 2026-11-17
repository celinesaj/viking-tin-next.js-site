'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { COLORS } from '@/constants/colors';
import BlogCard from '@/components/blogs/BlogCard';
import { useGetBlogPostsQuery } from '@/features/blogs/blogsApi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

export default function HomePageBlogs() {
  const { data, isLoading, isError } = useGetBlogPostsQuery({
    page: 1,
    limit: 9,
  });

  const posts = (data?.data ?? [])
    .filter((post) => post.isPublished)
    .slice(0, 4); // ✅ Show up to 4 cards

  if (isLoading) {
    return (
      <section className="relative overflow-hidden py-16 md:py-20 lg:py-15">
        <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-12">
          <h2
            className="max-w-[500px] text-[24px] font-bold uppercase leading-[1.05] text-[#111111] sm:text-[30px] md:text-[40px]"
            style={{ color: COLORS.textPrimary }}
          >
            Our
            <br />
            Blogs
          </h2>

          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-[220px] w-full rounded-[28px] bg-[#ebebeb] sm:h-[250px] lg:h-[280px]" />
                <div className="mt-4 h-3 w-1/3 rounded bg-[#ebebeb]" />
                <div className="mt-3 h-5 w-3/4 rounded bg-[#ebebeb]" />
                <div className="mt-2 h-4 w-full rounded bg-[#ebebeb]" />
                <div className="mt-1 h-4 w-2/3 rounded bg-[#ebebeb]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError || !posts.length) return null;

  const slidesPerViewDesktop = 4; // Tablet & desktop

  return (
    <section className="relative overflow-hidden py-16 md:py-20 lg:py-15">
      <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-12">
        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          <h2
            className="max-w-[500px] text-[24px] font-bold uppercase leading-[1.05] text-[#111111] sm:text-[30px] md:text-[40px]"
            style={{ color: COLORS.textPrimary }}
          >
            Our
            <br />
            Blogs
          </h2>
        </div>

        <div className="home-blogs-swiper mt-10 lg:mt-14">
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{
              clickable: true,
              el: '.home-blogs-pagination',
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={posts.length >= slidesPerViewDesktop} // Only loop when enough slides
            speed={800}
            spaceBetween={24}
            slidesPerView={2} // Mobile
            breakpoints={{
              768: {
                slidesPerView: slidesPerViewDesktop, // Tablet & up → 4
                spaceBetween: 24,
              },
            }}
          >
            {posts.map((post) => (
              <SwiperSlide key={post.id}>
                <BlogCard post={post} compact /> {/* ✅ Compact prop for smaller cards */}
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="home-blogs-pagination mt-5 flex justify-center" />
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/blogs"
            className="group inline-flex h-[58px] items-center rounded-full border border-black bg-black pl-7 pr-[8px] text-[16px] font-medium text-white transition-all duration-300 hover:bg-white hover:text-black md:h-[64px] md:pl-8 md:pr-[9px] md:text-[17px]"
          >
            <span className="mr-5 md:mr-6">View Blogs</span>

            <span className="relative flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full bg-white text-black transition-all duration-300 group-hover:bg-black group-hover:text-white md:h-[46px] md:w-[46px]">
              {/* Diagonal arrow (default) */}
              <ArrowUpRight
                size={22}
                strokeWidth={2.4}
                className="absolute transition-all duration-300 group-hover:translate-x-3 group-hover:-translate-y-3 group-hover:opacity-0"
              />

              {/* Straight arrow (on hover) */}
              <span className="absolute translate-x-[-14px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </span>
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .home-blogs-swiper .swiper {
          width: 100%;
          overflow: hidden;
        }

        .home-blogs-swiper .swiper-slide {
          height: auto;
          min-width: 0;
        }

        .home-blogs-pagination.swiper-pagination-horizontal {
          position: static;
        }

        .home-blogs-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          margin: 0 5px !important;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.25);
          opacity: 1;
          transition: all 0.3s ease;
        }

        .home-blogs-pagination .swiper-pagination-bullet-active {
          width: 22px;
          background: #000;
        }

        @media (min-width: 1280px) {
          .home-blogs-pagination .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
          }

          .home-blogs-pagination .swiper-pagination-bullet-active {
            width: 28px;
          }
        }
      `}</style>
    </section>
  );
}