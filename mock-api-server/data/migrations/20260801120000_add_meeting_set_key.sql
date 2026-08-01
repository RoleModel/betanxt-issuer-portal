ALTER TABLE public.meeting
  ADD COLUMN IF NOT EXISTS set_key TEXT DEFAULT NULL;

COMMENT ON COLUMN public.meeting.set_key IS 'Broadridge set key for the mailing set, ${TICKER}J${YEAR} convention (e.g. WENJ2026). Original param name - setKey.';

-- Backfill from the meeting''s own positions where they already carry one,
-- otherwise derive it from ticker + meeting year.
UPDATE public.meeting AS m
SET set_key = p.set_key
FROM (
  SELECT DISTINCT ON (meeting_id) meeting_id, set_key
  FROM public.position
  WHERE set_key IS NOT NULL AND set_key <> ''
) AS p
WHERE p.meeting_id = m.id AND m.set_key IS NULL;

UPDATE public.meeting
SET set_key = UPPER(ticker) || 'J' || EXTRACT(YEAR FROM meeting_date)::TEXT
WHERE set_key IS NULL
  AND ticker IS NOT NULL
  AND meeting_date IS NOT NULL;
