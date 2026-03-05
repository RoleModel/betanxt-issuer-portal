-- Add account_email column to position table
ALTER TABLE position ADD COLUMN account_email TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN position.account_email IS 'Email address associated with the account holder';
