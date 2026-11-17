import SpecialOfferBuyersView from '@/app/dashboard/_components/SpecialOfferBuyersView';

type Props = {
  params: Promise<{ specialOfferId: string }>;
  searchParams: Promise<{ from?: string; to?: string; year?: string; month?: string }>;
};

export default async function DashboardSpecialOfferBuyersPage({
  params,
  searchParams,
}: Props) {
  const { specialOfferId: raw } = await params;
  const sp = await searchParams;
  const specialOfferId = decodeURIComponent(raw);

  const initialYear =
    sp.year !== undefined && sp.year !== '' ? Number(sp.year) : undefined;
  const initialMonth =
    sp.month !== undefined && sp.month !== '' ? Number(sp.month) : undefined;

  return (
    <SpecialOfferBuyersView
      specialOfferId={specialOfferId}
      initialFrom={sp.from}
      initialYear={Number.isFinite(initialYear) ? initialYear : undefined}
      initialMonth={Number.isFinite(initialMonth) ? initialMonth : undefined}
    />
  );
}
