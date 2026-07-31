/** Deterministic demo participation % in the 60–75% range for a meeting id. */
export function generateSeededEventParticipationPercent(
  meetingId: string
): number {
  const meetingIdHash = (meetingId ?? "")
    .split("")
    .reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);
  const seededRandom = ((meetingIdHash * 9301 + 49_297) % 233_280) / 233_280;
  return Math.round((60 + seededRandom * 15) * 10) / 10;
}
