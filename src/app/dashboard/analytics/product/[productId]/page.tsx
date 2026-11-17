import ProductBuyersView from '@/app/dashboard/_components/ProductBuyersView';

type Props = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ from?: string; to?: string; year?: string; month?: string }>;
};

export default async function DashboardProductBuyersPage({ params, searchParams }: Props) {
  const { productId: raw } = await params;
  const sp = await searchParams;
  const productId = decodeURIComponent(raw);

  const initialYear =
    sp.year !== undefined && sp.year !== ''
      ? Number(sp.year)
      : undefined;
  const initialMonth =
    sp.month !== undefined && sp.month !== ''
      ? Number(sp.month)
      : undefined;

  return (
    <ProductBuyersView
      productId={productId}
      initialFrom={sp.from}
      initialYear={Number.isFinite(initialYear) ? initialYear : undefined}
      initialMonth={Number.isFinite(initialMonth) ? initialMonth : undefined}
    />
  );
}
