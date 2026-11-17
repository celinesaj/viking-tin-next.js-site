'use client';

import { useGetProductWhyChooseQuery } from '@/features/products/productsApi';

type Props = {
  productId: string;
};

export default function WhyChooseSection({ productId }: Props) {
  const { data, isLoading, isError } =
    useGetProductWhyChooseQuery(productId);

  if (isLoading) return null;
  if (isError || !data?.length) return null;

  return (
   <div className="mt-5 xl:mt-7">
            <h2 className="text-[20px] font-bold leading-none text-bold xl:text-[26px] 2xl:text-[30px]">
        Why Choose This Product
      </h2>

     <ul className="mt-3 space-y-2 text-[13px] text-[#444] xl:text-[15px]">
  {data.map((item) => (
    <li key={item.id} className="flex gap-2">
      <span className="text-black">–</span>
      <span>{item.reason}</span>
    </li>
  ))}
</ul>
    </div>
  );
}