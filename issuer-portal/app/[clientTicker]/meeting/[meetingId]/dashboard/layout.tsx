const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientTicker: string; meetingId: string }>;
}) => {
  await params;
  return await children;
};

export default Layout;
