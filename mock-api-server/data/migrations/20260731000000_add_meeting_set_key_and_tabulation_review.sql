ALTER TABLE public.meeting
  ADD COLUMN IF NOT EXISTS set_key TEXT DEFAULT NULL;

COMMENT ON COLUMN public.meeting.set_key IS 'Proxy event set key identifying the tabulation job set for this event. Original param name - setKey.';

ALTER TABLE public.meeting
  ADD COLUMN IF NOT EXISTS tabulation_review JSONB DEFAULT NULL;

COMMENT ON COLUMN public.meeting.tabulation_review IS 'Prototype CSM review/approval state for tabulation report release. Original param name - tabulationReview.';

ALTER TABLE public.proposal
  ADD COLUMN IF NOT EXISTS broker_non_votes NUMERIC(20,9) DEFAULT NULL;

COMMENT ON COLUMN public.proposal.broker_non_votes IS 'Broker non-votes recorded against this proposal. Original param name - brokerNonVotes.';
