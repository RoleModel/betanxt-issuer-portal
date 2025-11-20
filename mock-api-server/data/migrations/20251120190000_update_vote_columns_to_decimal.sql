-- Update vote columns from integer to decimal to support fractional shares

ALTER TABLE proposal 
  ALTER COLUMN total_votes_for TYPE DECIMAL(20, 9),
  ALTER COLUMN total_votes_against TYPE DECIMAL(20, 9),
  ALTER COLUMN total_votes_abstain TYPE DECIMAL(20, 9),
  ALTER COLUMN total_shares_eligible TYPE DECIMAL(20, 9);

-- Update meeting shares columns
ALTER TABLE meeting
  ALTER COLUMN total_shares_outstanding TYPE DECIMAL(20, 9);

-- Update position shares columns
ALTER TABLE position
  ALTER COLUMN shares TYPE DECIMAL(20, 9),
  ALTER COLUMN shares_voted TYPE DECIMAL(20, 9);

-- Update position_vote shares columns  
ALTER TABLE position_vote
  ALTER COLUMN shares_voted TYPE DECIMAL(20, 9);
