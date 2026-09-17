import { redirect } from "next/navigation";

export default async function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  redirect(`/repository/${resolvedParams.id}/overview`);
}
