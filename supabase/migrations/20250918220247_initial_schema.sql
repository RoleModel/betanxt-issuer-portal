-- BetaNXT Issuer Portal Database Schema
-- Generated from OpenAPI specification (core data models only)
-- Date: 2025-09-19T03:02:47.359Z

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types first
DROP TYPE IF EXISTS cast_vote_request_vote;
CREATE TYPE cast_vote_request_vote AS ENUM('FOR', 'AGAINST', 'ABSTAIN', 'WITHHOLD');

DROP TYPE IF EXISTS create_position_request_vote_status;
CREATE TYPE create_position_request_vote_status AS ENUM('Voted', 'Unvoted');

DROP TYPE IF EXISTS create_position_request_source;
CREATE TYPE create_position_request_source AS ENUM('WEB', 'PRINT', 'IVR');

DROP TYPE IF EXISTS notification_type;
CREATE TYPE notification_type AS ENUM('info', 'warning', 'error', 'success');

DROP TYPE IF EXISTS notification_priority;
CREATE TYPE notification_priority AS ENUM('low', 'medium', 'high', 'critical');

DROP TYPE IF EXISTS position_vote_status;
CREATE TYPE position_vote_status AS ENUM('Voted', 'Unvoted');

DROP TYPE IF EXISTS position_source;
CREATE TYPE position_source AS ENUM('WEB', 'PRINT', 'IVR');

DROP TYPE IF EXISTS proposal_final_result;
CREATE TYPE proposal_final_result AS ENUM('PASSED', 'FAILED', 'PENDING');

DROP TYPE IF EXISTS update_position_request_vote_status;
CREATE TYPE update_position_request_vote_status AS ENUM('Voted', 'Unvoted');

DROP TYPE IF EXISTS update_position_request_source;
CREATE TYPE update_position_request_source AS ENUM('WEB', 'PRINT', 'IVR');

-- Table 'client' generated from model 'Client'
--
CREATE TABLE IF NOT EXISTS public.client (
    "id" TEXT DEFAULT NULL,
    ticker TEXT DEFAULT NULL,
    company_name TEXT DEFAULT NULL,
    short_name TEXT DEFAULT NULL,
    industry TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    website TEXT DEFAULT NULL,
    primary_contact TEXT DEFAULT NULL,
    primary_contact_email TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT 'true',
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL,
    accounts JSON DEFAULT NULL,
    meetings JSON DEFAULT NULL
);
COMMENT ON TABLE client IS 'Original model name - Client.';
COMMENT ON COLUMN client.ticker IS 'Unique ticker symbol for the client';
COMMENT ON COLUMN client.company_name IS 'Full legal name of the company. Original param name - companyName.';
COMMENT ON COLUMN client.short_name IS 'Short display name for the company. Original param name - shortName.';
COMMENT ON COLUMN client.industry IS 'Industry sector';
COMMENT ON COLUMN client.description IS 'Company description';
COMMENT ON COLUMN client.website IS 'Company website URL';
COMMENT ON COLUMN client.primary_contact IS 'Primary contact person. Original param name - primaryContact.';
COMMENT ON COLUMN client.primary_contact_email IS 'Primary contact email. Original param name - primaryContactEmail.';
COMMENT ON COLUMN client.is_active IS 'Whether the client is active. Original param name - isActive.';
COMMENT ON COLUMN client.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN client.updated_at IS 'Original param name - updatedAt.';
COMMENT ON COLUMN client.accounts IS 'JSON array of related account information';
COMMENT ON COLUMN client.meetings IS 'JSON array of related meeting information';

-- Table 'account' generated from model 'Account'
--
CREATE TABLE IF NOT EXISTS public.account (
    "id" TEXT DEFAULT NULL,
    "name" TEXT DEFAULT NULL,
    primary_contact TEXT DEFAULT NULL,
    client_id TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    client TEXT DEFAULT NULL
);
COMMENT ON TABLE account IS 'Original model name - Account.';
COMMENT ON COLUMN account.primary_contact IS 'Original param name - primaryContact.';
COMMENT ON COLUMN account.client_id IS 'The client this account belongs to. Original param name - clientId.';
COMMENT ON COLUMN account.created_at IS 'Original param name - createdAt.';

-- Table 'user' generated from model 'User'
--
CREATE TABLE IF NOT EXISTS public."user" (
    "id" TEXT DEFAULT NULL,
    username TEXT DEFAULT NULL,
    first_name TEXT DEFAULT NULL,
    last_name TEXT DEFAULT NULL,
    email TEXT DEFAULT NULL,
    "password" TEXT DEFAULT NULL,
    "type" TEXT DEFAULT NULL,
    account_id TEXT DEFAULT NULL,
    account TEXT DEFAULT NULL
);
COMMENT ON TABLE "user" IS 'Original model name - User.';
COMMENT ON COLUMN "user".first_name IS 'Original param name - firstName.';
COMMENT ON COLUMN "user".last_name IS 'Original param name - lastName.';
COMMENT ON COLUMN "user"."password" IS 'Legacy password field for seed data - not used with NextAuth';
COMMENT ON COLUMN "user".account_id IS 'Original param name - accountId.';

-- Table 'meeting' generated from model 'Meeting'
--
CREATE TABLE IF NOT EXISTS public.meeting (
    "id" TEXT DEFAULT NULL,
    title TEXT DEFAULT NULL,
    cusip TEXT DEFAULT NULL,
    ticker TEXT DEFAULT NULL,
    pre_filing_date DATE DEFAULT NULL,
    filing_date DATE DEFAULT NULL,
    broker_search_date DATE DEFAULT NULL,
    record_date DATE DEFAULT NULL,
    mailing_date DATE DEFAULT NULL,
    meeting_date DATE DEFAULT NULL,
    meeting_type TEXT DEFAULT NULL,
    meeting_year INTEGER DEFAULT NULL,
    status TEXT DEFAULT NULL,
    current_phase TEXT DEFAULT NULL,
    overall_completion SMALLINT DEFAULT NULL,
    distribution_type TEXT DEFAULT NULL,
    transfer_agent TEXT DEFAULT NULL,
    employee_stock_plans TEXT DEFAULT NULL,
    plan_administrator TEXT DEFAULT NULL,
    plan_administrator_contact TEXT DEFAULT NULL,
    plan_administrator_contact_email TEXT DEFAULT NULL,
    solicitor TEXT DEFAULT NULL,
    solicitor_email TEXT DEFAULT NULL,
    inspector TEXT DEFAULT NULL,
    document_hosting_site_label TEXT DEFAULT NULL,
    document_hosting_site_url TEXT DEFAULT NULL,
    e_vote_site_label TEXT DEFAULT NULL,
    e_vote_site_url TEXT DEFAULT NULL,
    ivr_dial_in_number TEXT DEFAULT NULL,
    total_shares_outstanding TEXT DEFAULT NULL,
    quorum_requirement DECIMAL(20, 9) DEFAULT NULL,
    client_id TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL,
    client TEXT DEFAULT NULL
);
COMMENT ON TABLE meeting IS 'Original model name - Meeting.';
COMMENT ON COLUMN meeting.pre_filing_date IS 'Original param name - preFilingDate.';
COMMENT ON COLUMN meeting.filing_date IS 'Original param name - filingDate.';
COMMENT ON COLUMN meeting.broker_search_date IS 'Original param name - brokerSearchDate.';
COMMENT ON COLUMN meeting.record_date IS 'Original param name - recordDate.';
COMMENT ON COLUMN meeting.mailing_date IS 'Original param name - mailingDate.';
COMMENT ON COLUMN meeting.meeting_date IS 'Original param name - meetingDate.';
COMMENT ON COLUMN meeting.meeting_type IS 'Original param name - meetingType.';
COMMENT ON COLUMN meeting.meeting_year IS 'Original param name - meetingYear.';
COMMENT ON COLUMN meeting.current_phase IS 'Original param name - currentPhase.';
COMMENT ON COLUMN meeting.overall_completion IS 'Original param name - overallCompletion.';
COMMENT ON COLUMN meeting.distribution_type IS 'Original param name - distributionType.';
COMMENT ON COLUMN meeting.transfer_agent IS 'Original param name - transferAgent.';
COMMENT ON COLUMN meeting.employee_stock_plans IS 'Original param name - employeeStockPlans.';
COMMENT ON COLUMN meeting.plan_administrator IS 'Original param name - planAdministrator.';
COMMENT ON COLUMN meeting.plan_administrator_contact IS 'Original param name - planAdministratorContact.';
COMMENT ON COLUMN meeting.plan_administrator_contact_email IS 'Original param name - planAdministratorContactEmail.';
COMMENT ON COLUMN meeting.solicitor_email IS 'Original param name - solicitorEmail.';
COMMENT ON COLUMN meeting.total_shares_outstanding IS 'Original param name - totalSharesOutstanding.';
COMMENT ON COLUMN meeting.quorum_requirement IS 'Original param name - quorumRequirement.';
COMMENT ON COLUMN meeting.client_id IS 'The client this meeting belongs to. Original param name - clientId.';
COMMENT ON COLUMN meeting.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN meeting.updated_at IS 'Original param name - updatedAt.';

-- Table 'phase' generated from model 'Phase'
--
CREATE TABLE IF NOT EXISTS public.phase (
    "id" TEXT DEFAULT NULL,
    meeting_id TEXT DEFAULT NULL,
    "name" TEXT DEFAULT NULL,
    order_index INTEGER DEFAULT NULL,
    status TEXT DEFAULT NULL,
    key_dates TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE phase IS 'Original model name - Phase.';
COMMENT ON COLUMN phase.meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN phase.order_index IS 'Original param name - orderIndex.';
COMMENT ON COLUMN phase.key_dates IS 'Original param name - keyDates.';
COMMENT ON COLUMN phase.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN phase.updated_at IS 'Original param name - updatedAt.';

-- Table 'task' generated from model 'Task'
--
CREATE TABLE IF NOT EXISTS public.task (
    "id" TEXT DEFAULT NULL,
    task_id TEXT DEFAULT NULL,
    phase_id TEXT DEFAULT NULL,
    meeting_id TEXT DEFAULT NULL,
    phase_number INTEGER DEFAULT NULL,
    title TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    "type" TEXT DEFAULT NULL,
    status TEXT DEFAULT NULL,
    due_date DATE DEFAULT NULL,
    "owner" TEXT DEFAULT NULL,
    document_id TEXT DEFAULT NULL,
    links JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE task IS 'Original model name - Task.';
COMMENT ON COLUMN task.task_id IS 'Original param name - taskId.';
COMMENT ON COLUMN task.phase_id IS 'Original param name - phaseId.';
COMMENT ON COLUMN task.meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN task.phase_number IS 'Original param name - phaseNumber.';
COMMENT ON COLUMN task.due_date IS 'Original param name - dueDate.';
COMMENT ON COLUMN task.document_id IS 'Original param name - documentId.';
COMMENT ON COLUMN task.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN task.updated_at IS 'Original param name - updatedAt.';

-- Table 'document' generated from model 'Document'
--
CREATE TABLE IF NOT EXISTS public."document" (
    "id" TEXT DEFAULT NULL,
    meeting_id TEXT DEFAULT NULL,
    task_id TEXT DEFAULT NULL,
    title TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    "type" TEXT DEFAULT NULL,
    file_path TEXT DEFAULT NULL,
    file_type TEXT DEFAULT NULL,
    file_size INTEGER DEFAULT NULL,
    status TEXT DEFAULT NULL,
    upload_date TIMESTAMP DEFAULT NULL,
    uploaded_date TIMESTAMP DEFAULT NULL,
    signed_date TIMESTAMP DEFAULT NULL,
    authorized_date TIMESTAMP DEFAULT NULL,
    completed_date TIMESTAMP DEFAULT NULL,
    in_progress_date TIMESTAMP DEFAULT NULL,
    history JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL,
    meeting TEXT DEFAULT NULL,
    "comments" JSON DEFAULT NULL,
    signatures JSON DEFAULT NULL
);
COMMENT ON TABLE "document" IS 'Original model name - Document.';
COMMENT ON COLUMN "document".meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN "document".task_id IS 'Original param name - taskId.';
COMMENT ON COLUMN "document".file_path IS 'Original param name - filePath.';
COMMENT ON COLUMN "document".file_type IS 'Original param name - fileType.';
COMMENT ON COLUMN "document".file_size IS 'Original param name - fileSize.';
COMMENT ON COLUMN "document".upload_date IS 'Original param name - uploadDate.';
COMMENT ON COLUMN "document".uploaded_date IS 'Original param name - uploadedDate.';
COMMENT ON COLUMN "document".signed_date IS 'Original param name - signedDate.';
COMMENT ON COLUMN "document".authorized_date IS 'Original param name - authorizedDate.';
COMMENT ON COLUMN "document".completed_date IS 'Original param name - completedDate.';
COMMENT ON COLUMN "document".in_progress_date IS 'Original param name - inProgressDate.';
COMMENT ON COLUMN "document".created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN "document".updated_at IS 'Original param name - updatedAt.';

-- Table 'comment' generated from model 'Comment'
--
CREATE TABLE IF NOT EXISTS public."comment" (
    "id" BIGINT DEFAULT NULL,
    document_id TEXT DEFAULT NULL,
    user_id TEXT DEFAULT NULL,
    "comment" TEXT DEFAULT NULL,
    first_name TEXT DEFAULT NULL,
    last_name TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    "document" TEXT DEFAULT NULL,
    "user" TEXT DEFAULT NULL
);
COMMENT ON TABLE "comment" IS 'Original model name - Comment.';
COMMENT ON COLUMN "comment".document_id IS 'Original param name - documentId.';
COMMENT ON COLUMN "comment".user_id IS 'Original param name - userId.';
COMMENT ON COLUMN "comment".first_name IS 'Original param name - firstName.';
COMMENT ON COLUMN "comment".last_name IS 'Original param name - lastName.';
COMMENT ON COLUMN "comment".created_at IS 'Original param name - createdAt.';

-- Table 'signature' generated from model 'Signature'
--
CREATE TABLE IF NOT EXISTS public.signature (
    "id" TEXT DEFAULT NULL,
    document_id TEXT DEFAULT NULL,
    page_number INTEGER DEFAULT NULL,
    x_position DECIMAL(20, 9) DEFAULT NULL,
    y_position DECIMAL(20, 9) DEFAULT NULL,
    width DECIMAL(20, 9) DEFAULT NULL,
    height DECIMAL(20, 9) DEFAULT NULL,
    signature_type TEXT DEFAULT NULL,
    required BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL,
    "document" TEXT DEFAULT NULL
);
COMMENT ON TABLE signature IS 'Original model name - Signature.';
COMMENT ON COLUMN signature.document_id IS 'Original param name - documentId.';
COMMENT ON COLUMN signature.page_number IS 'Original param name - pageNumber.';
COMMENT ON COLUMN signature.x_position IS 'Original param name - xPosition.';
COMMENT ON COLUMN signature.y_position IS 'Original param name - yPosition.';
COMMENT ON COLUMN signature.signature_type IS 'Original param name - signatureType.';
COMMENT ON COLUMN signature.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN signature.updated_at IS 'Original param name - updatedAt.';

-- Table 'position' generated from model 'Position'
--
CREATE TABLE IF NOT EXISTS public."position" (
    "id" TEXT DEFAULT NULL,
    meeting_id TEXT DEFAULT NULL,
    cusip TEXT DEFAULT NULL,
    account_type TEXT DEFAULT NULL,
    set_key TEXT DEFAULT NULL,
    "name" TEXT DEFAULT NULL,
    account_number TEXT DEFAULT NULL,
    control_number TEXT DEFAULT NULL,
    vote_status position_vote_status DEFAULT NULL,
    shares DECIMAL(20, 9) DEFAULT NULL,
    shares_voted DECIMAL(20, 9) DEFAULT NULL,
    "source" position_source DEFAULT NULL,
    date_voted TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE "position" IS 'Original model name - Position.';
COMMENT ON COLUMN "position".meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN "position".account_type IS 'Original param name - accountType.';
COMMENT ON COLUMN "position".set_key IS 'Original param name - setKey.';
COMMENT ON COLUMN "position".account_number IS 'Original param name - accountNumber.';
COMMENT ON COLUMN "position".control_number IS 'Original param name - controlNumber.';
COMMENT ON COLUMN "position".vote_status IS 'Original param name - voteStatus.';
COMMENT ON COLUMN "position".shares_voted IS 'Original param name - sharesVoted.';
COMMENT ON COLUMN "position".date_voted IS 'Original param name - dateVoted.';
COMMENT ON COLUMN "position".created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN "position".updated_at IS 'Original param name - updatedAt.';

-- Table 'position_vote' generated from model 'PositionVote'
--
CREATE TABLE IF NOT EXISTS public.position_vote (
    "id" TEXT DEFAULT NULL,
    position_id TEXT DEFAULT NULL,
    proposal_id TEXT DEFAULT NULL,
    vote TEXT DEFAULT NULL,
    shares_voting TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE position_vote IS 'Original model name - PositionVote.';
COMMENT ON COLUMN position_vote.position_id IS 'Original param name - positionId.';
COMMENT ON COLUMN position_vote.proposal_id IS 'Original param name - proposalId.';
COMMENT ON COLUMN position_vote.shares_voting IS 'Original param name - sharesVoting.';
COMMENT ON COLUMN position_vote.created_at IS 'Original param name - createdAt.';

-- Table 'proposal' generated from model 'Proposal'
--
CREATE TABLE IF NOT EXISTS public.proposal (
    "id" TEXT DEFAULT NULL,
    meeting_id TEXT DEFAULT NULL,
    proposal_number DECIMAL(20, 9) DEFAULT NULL,
    proposal_title TEXT DEFAULT NULL,
    proposal_type TEXT DEFAULT NULL,
    proposal_subtype TEXT DEFAULT NULL,
    director_name TEXT DEFAULT NULL,
    director_term_years INTEGER DEFAULT NULL,
    director_class TEXT DEFAULT NULL,
    term_expiration_year INTEGER DEFAULT NULL,
    frequency_options JSON DEFAULT NULL,
    recommendation TEXT DEFAULT NULL,
    final_result proposal_final_result DEFAULT NULL,
    total_votes_for INTEGER DEFAULT NULL,
    total_votes_against INTEGER DEFAULT NULL,
    total_votes_abstain INTEGER DEFAULT NULL,
    total_shares_eligible INTEGER DEFAULT NULL,
    for_percentage DECIMAL(20, 9) DEFAULT NULL,
    against_percentage DECIMAL(20, 9) DEFAULT NULL,
    abstain_percentage DECIMAL(20, 9) DEFAULT NULL,
    participation_rate DECIMAL(20, 9) DEFAULT NULL,
    voting_completed BOOLEAN DEFAULT 'false',
    voting_completed_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE proposal IS 'Original model name - Proposal.';
COMMENT ON COLUMN proposal.meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN proposal.proposal_number IS 'Original param name - proposalNumber.';
COMMENT ON COLUMN proposal.proposal_title IS 'Original param name - proposalTitle.';
COMMENT ON COLUMN proposal.proposal_type IS 'Original param name - proposalType.';
COMMENT ON COLUMN proposal.proposal_subtype IS 'Original param name - proposalSubtype.';
COMMENT ON COLUMN proposal.director_name IS 'Original param name - directorName.';
COMMENT ON COLUMN proposal.director_term_years IS 'Original param name - directorTermYears.';
COMMENT ON COLUMN proposal.director_class IS 'Original param name - directorClass.';
COMMENT ON COLUMN proposal.term_expiration_year IS 'Original param name - termExpirationYear.';
COMMENT ON COLUMN proposal.frequency_options IS 'Original param name - frequencyOptions.';
COMMENT ON COLUMN proposal.final_result IS 'Final result of the proposal voting. Original param name - finalResult.';
COMMENT ON COLUMN proposal.total_votes_for IS 'Total number of votes in favor. Original param name - totalVotesFor.';
COMMENT ON COLUMN proposal.total_votes_against IS 'Total number of votes against. Original param name - totalVotesAgainst.';
COMMENT ON COLUMN proposal.total_votes_abstain IS 'Total number of abstained votes. Original param name - totalVotesAbstain.';
COMMENT ON COLUMN proposal.total_shares_eligible IS 'Total number of shares eligible to vote. Original param name - totalSharesEligible.';
COMMENT ON COLUMN proposal.for_percentage IS 'Percentage of votes in favor. Original param name - forPercentage.';
COMMENT ON COLUMN proposal.against_percentage IS 'Percentage of votes against. Original param name - againstPercentage.';
COMMENT ON COLUMN proposal.abstain_percentage IS 'Percentage of abstained votes. Original param name - abstainPercentage.';
COMMENT ON COLUMN proposal.participation_rate IS 'Overall participation rate. Original param name - participationRate.';
COMMENT ON COLUMN proposal.voting_completed IS 'Whether voting on this proposal has been completed. Original param name - votingCompleted.';
COMMENT ON COLUMN proposal.voting_completed_at IS 'When voting was completed. Original param name - votingCompletedAt.';
COMMENT ON COLUMN proposal.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN proposal.updated_at IS 'Original param name - updatedAt.';

-- Table 'notification' generated from model 'Notification'
--
CREATE TABLE IF NOT EXISTS public.notification (
    "id" TEXT DEFAULT NULL,
    title TEXT DEFAULT NULL,
    message TEXT DEFAULT NULL,
    "type" notification_type DEFAULT NULL,
    priority notification_priority DEFAULT NULL,
    "read" BOOLEAN DEFAULT 'false',
    user_id TEXT DEFAULT NULL,
    meeting_id TEXT DEFAULT NULL,
    task_id TEXT DEFAULT NULL,
    action_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    read_at TIMESTAMP DEFAULT NULL,
    expires_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE notification IS 'Original model name - Notification.';
COMMENT ON COLUMN notification.user_id IS 'Original param name - userId.';
COMMENT ON COLUMN notification.meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN notification.task_id IS 'Original param name - taskId.';
COMMENT ON COLUMN notification.action_url IS 'Original param name - actionUrl.';
COMMENT ON COLUMN notification.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN notification.read_at IS 'Original param name - readAt.';
COMMENT ON COLUMN notification.expires_at IS 'Original param name - expiresAt.';

