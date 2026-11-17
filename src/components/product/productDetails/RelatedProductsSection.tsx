'use client';

import { useGetProductsQuery } from '@/features/products/productsApi';
// import SpecialOfferCard from './ProductCard';
import { COLORS } from '@/constants/colors';
import ProductCard from '../ProductCard';
import Skeleton from '@/components/common/Skeleton';

export default function RelatedProductsSection() {
   const { data, isLoading, isError } = useGetProductsQuery({
     page: 1,
     limit: 4,
     is_active: true,
   });
 
   const products = data?.data ?? [];

  console.log('API:', data);
  console.log('products:', products);

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 grid md:grid-cols-2">
            <Skeleton className="h-10 w-60" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <Skeleton className="h-[220px] w-full rounded-[24px]" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return <div className="py-20 text-center">Error loading products</div>;
  }

  if (!products.length) {
    return <div className="py-20 text-center">No offers available</div>;
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="mb-10 grid md:grid-cols-2">
          <h2 className="text-4xl font-semibold">RELATED PRODUCTS</h2>

          <p className="text-sm text-gray-500 md:text-right">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}