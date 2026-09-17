import { redirect } from "next/navigation";

export default async function RepositoryRootPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/repository/${id}/overview`);
}
