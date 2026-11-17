import SingleOrderDetails from "@/components/account/SingleOrderDetails";


type Props = {
  params: Promise<{ id: string }>;
};

export default async function SingleOrderPage({ params }: Props) {
  const { id } = await params;

  return <SingleOrderDetails orderId={id} />;
}