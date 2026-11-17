import Image from 'next/image';

type Props = {
  title: string;
  description: string;
  bannerImage: string;
};

export default function PointOfSaleHero({
  title,
  description,
  bannerImage,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[42px]">
      <div className="relative min-h-[260px] md:min-h-[360px]">
        <Image
          src={bannerImage}
          alt={title}
          fill
          className="object-cover"
          priority
        />

        <div className="absolute inset-0 bg-black/10" />

        <div className="absolute inset-0 z-10 hidden md:flex md:items-center">
          <div className="max-w-[520px] px-8 md:px-12">
            <h1 className="text-[35px] font-bold uppercase leading-none text-white md:text-[55px]">
              {title}
            </h1>
            <p className="mt-4 max-w-[360px] text-[15px] leading-[1.45] text-white/85 md:text-[16px]">
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}