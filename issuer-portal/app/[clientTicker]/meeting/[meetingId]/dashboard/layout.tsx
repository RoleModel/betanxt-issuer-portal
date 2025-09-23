export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientTicker: string; meetingId: string }>
}) {
  const { clientTicker: _clientTicker, meetingId: _meetingId } = await params
  return children
}
