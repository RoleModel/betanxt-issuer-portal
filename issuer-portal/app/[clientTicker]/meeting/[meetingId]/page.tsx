import { redirect } from "next/navigation";

interface MeetingPageProps {
  params: Promise<{ clientTicker: string; meetingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const buildSearchString = (
  searchParams: Record<string, string | string[] | undefined>
): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    } else if (typeof value === "string") {
      params.append(key, value);
    }
  }
  return params.toString();
};

// This page handles the base meeting route and redirects to the dashboard
const MeetingPage = async ({
  params,
  searchParams,
}: MeetingPageProps): Promise<never> => {
  const { clientTicker, meetingId } = await params;
  const resolvedSearchParams = await searchParams;
  const search = buildSearchString(resolvedSearchParams);
  const targetPath = `/${clientTicker}/meeting/${meetingId}/dashboard${search ? `?${search}` : ""}`;
  redirect(targetPath);
};

export default MeetingPage;
