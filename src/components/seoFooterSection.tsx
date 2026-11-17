import { IMAGES } from '@/constants/images';

const SeoFooterSection = () => {
  return (
    <section
      className="relative w-full overflow-hidden py-12 sm:py-16 md:py-20"
      style={{
        backgroundImage: `url(${IMAGES.flavour.bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/40" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 md:px-14 lg:px-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">

          {/* LEFT — text */}
          <div>
            <h1 className=" text-black text-[22px] font-bold uppercase leading-[1.1] tracking-[-0.01em]  sm:text-[28px] md:text-[34px] lg:text-[40px]">
              Your Trusted Destination for Nicotine Pouches in Dubai &amp; UAE
            </h1>

            <p className="mt-4 text-[13px] leading-[1.7] text-black sm:mt-5 sm:text-[14px] md:text-[15px]">
              Looking for a premium, smoke-free alternative? Viking Tin is your curated
              destination for the best nicotine pouches online. Whether you are looking
              for a gentle mint flavor to start your journey or an extra-strong kick for
              experienced users, our selection of brands like NIQS and VOX guarantees
              quality and consistency. Experience the modern way to enjoy nicotine with
              fast, reliable delivery anywhere in the UAE.
            </p>
          </div>

          {/* RIGHT — product image */}
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <div className="relative h-[340px] w-[440px] overflow-hidden rounded-2xl">
              <img
                src={IMAGES.seo.img}
                alt="Premium nicotine pouches Dubai UAE"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default SeoFooterSection