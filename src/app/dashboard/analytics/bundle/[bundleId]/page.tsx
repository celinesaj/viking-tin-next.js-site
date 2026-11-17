import BundleBuyersView from '@/app/dashboard/_components/BundleBuyersView';

type Props = {
  params: Promise<{ bundleId: string }>;
  searchParams: Promise<{ from?: string; to?: string; year?: string; month?: string }>;
};

export default async function DashboardBundleBuyersPage({ params, searchParams }: Props) {
  const { bundleId: raw } = await params;
  const sp = await searchParams;
  const bundleId = decodeURIComponent(raw);

  const initialYear =
    sp.year !== undefined && sp.year !== '' ? Number(sp.year) : undefined;
  const initialMonth =
    sp.month !== undefined && sp.month !== '' ? Number(sp.month) : undefined;

  return (
    <BundleBuyersView
      bundleId={bundleId}
      initialFrom={sp.from}
      initialYear={Number.isFinite(initialYear) ? initialYear : undefined}
      initialMonth={Number.isFinite(initialMonth) ? initialMonth : undefined}
    />
  );
}
