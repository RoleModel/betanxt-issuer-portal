export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientTicker: string; meetingId: string }>
}) {
  await params
  return children
}
