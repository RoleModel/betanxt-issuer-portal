-- BetaNXT Issuer Portal Database Schema
-- Generated from OpenAPI specification (core data models only)
-- Date: 2026-06-11T16:52:05.747Z

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types first
DROP TYPE IF EXISTS add_document_event_request_event_type CASCADE;
CREATE TYPE add_document_event_request_event_type AS ENUM('CREATED', 'UPLOADED', 'VIEWED', 'DOWNLOADED', 'NOT_UPLOADED', 'SIGNED', 'APPROVED', 'REJECTED', 'COMMENTED', 'UPDATED', 'DELETED');

DROP TYPE IF EXISTS cast_vote_request_vote CASCADE;
CREATE TYPE cast_vote_request_vote AS ENUM('FOR', 'AGAINST', 'ABSTAIN', 'WITHHOLD');

DROP TYPE IF EXISTS create_digital_shareholder_meeting_request_registrant_type CASCADE;
CREATE TYPE create_digital_shareholder_meeting_request_registrant_type AS ENUM('Shareholder', 'Guest', 'Proxy', 'Other');

DROP TYPE IF EXISTS create_notification_input_type CASCADE;
CREATE TYPE create_notification_input_type AS ENUM('info', 'warning', 'error', 'success');

DROP TYPE IF EXISTS create_notification_input_priority CASCADE;
CREATE TYPE create_notification_input_priority AS ENUM('low', 'medium', 'high', 'critical');

DROP TYPE IF EXISTS create_position_request_vote_status CASCADE;
CREATE TYPE create_position_request_vote_status AS ENUM('Voted', 'Unvoted');

DROP TYPE IF EXISTS create_position_request_source CASCADE;
CREATE TYPE create_position_request_source AS ENUM('WEB', 'PRINT', 'IVR');

DROP TYPE IF EXISTS digital_shareholder_meeting_registrant_type CASCADE;
CREATE TYPE digital_shareholder_meeting_registrant_type AS ENUM('Shareholder', 'Guest', 'Proxy', 'Other');

DROP TYPE IF EXISTS document_display_category CASCADE;
CREATE TYPE document_display_category AS ENUM('general', 'dsm', 'proxy-materials', 'meeting-materials', 'post-meeting', 'internal');

DROP TYPE IF EXISTS document_history_event_type CASCADE;
CREATE TYPE document_history_event_type AS ENUM('CREATED', 'UPLOADED', 'VIEWED', 'DOWNLOADED', 'SIGNED', 'APPROVED', 'REJECTED', 'COMMENTED', 'UPDATED', 'DELETED');

DROP TYPE IF EXISTS notification_type CASCADE;
CREATE TYPE notification_type AS ENUM('info', 'warning', 'error', 'success');

DROP TYPE IF EXISTS notification_priority CASCADE;
CREATE TYPE notification_priority AS ENUM('low', 'medium', 'high', 'critical');

DROP TYPE IF EXISTS position_vote_status CASCADE;
CREATE TYPE position_vote_status AS ENUM('Voted', 'Unvoted');

DROP TYPE IF EXISTS position_source CASCADE;
CREATE TYPE position_source AS ENUM('WEB', 'PRINT', 'IVR');

DROP TYPE IF EXISTS position_holder_category CASCADE;
CREATE TYPE position_holder_category AS ENUM('REGISTERED', 'PLAN', 'BENEFICIAL', 'NOBO');

DROP TYPE IF EXISTS proposal_final_result CASCADE;
CREATE TYPE proposal_final_result AS ENUM('PASSED', 'FAILED', 'PENDING');

DROP TYPE IF EXISTS update_position_request_vote_status CASCADE;
CREATE TYPE update_position_request_vote_status AS ENUM('Voted', 'Unvoted');

DROP TYPE IF EXISTS update_position_request_source CASCADE;
CREATE TYPE update_position_request_source AS ENUM('WEB', 'PRINT', 'IVR');

-- Table 'clients' generated from model 'Clients'
--
DROP TABLE IF EXISTS public.clients CASCADE;
CREATE TABLE public.clients (
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
    branding_id INTEGER DEFAULT NULL,
    logo_url TEXT DEFAULT NULL,
    primary_color TEXT DEFAULT NULL,
    secondary_color TEXT DEFAULT NULL,
    created_by TEXT DEFAULT NULL,
    enabled_features JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE clients IS 'Original model name - Clients.';
COMMENT ON COLUMN clients.ticker IS 'Unique ticker symbol for the client';
COMMENT ON COLUMN clients.company_name IS 'Full legal name of the company. Original param name - companyName.';
COMMENT ON COLUMN clients.short_name IS 'Short display name for the company. Original param name - shortName.';
COMMENT ON COLUMN clients.industry IS 'Industry sector';
COMMENT ON COLUMN clients.description IS 'Company description';
COMMENT ON COLUMN clients.website IS 'Company website URL';
COMMENT ON COLUMN clients.primary_contact IS 'Primary contact person. Original param name - primaryContact.';
COMMENT ON COLUMN clients.primary_contact_email IS 'Primary contact email. Original param name - primaryContactEmail.';
COMMENT ON COLUMN clients.is_active IS 'Whether the client is active. Original param name - isActive.';
COMMENT ON COLUMN clients.branding_id IS 'Unique branding identifier for document hosting site URLs. Original param name - brandingId.';
COMMENT ON COLUMN clients.logo_url IS 'URL of the client';
COMMENT ON COLUMN clients.primary_color IS 'Primary brand color as a hex string (e.g. Original param name - primaryColor.';
COMMENT ON COLUMN clients.secondary_color IS 'Secondary brand color as a hex string (e.g. Original param name - secondaryColor.';
COMMENT ON COLUMN clients.created_by IS 'Username of the CSM who created this client (for assignment). Original param name - createdBy.';
COMMENT ON COLUMN clients.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN clients.updated_at IS 'Original param name - updatedAt.';

-- Table 'account' generated from model 'Account'
--
DROP TABLE IF EXISTS public.account CASCADE;
CREATE TABLE public.account (
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
DROP TABLE IF EXISTS public."user" CASCADE;
CREATE TABLE public."user" (
    "id" TEXT DEFAULT NULL,
    username TEXT DEFAULT NULL,
    first_name TEXT DEFAULT NULL,
    last_name TEXT DEFAULT NULL,
    email TEXT DEFAULT NULL,
    "password" TEXT DEFAULT NULL,
    "type" TEXT DEFAULT NULL,
    account_id TEXT DEFAULT NULL,
    account TEXT DEFAULT NULL,
    avatar_url TEXT DEFAULT NULL
);
COMMENT ON TABLE "user" IS 'Original model name - User.';
COMMENT ON COLUMN "user".first_name IS 'Original param name - firstName.';
COMMENT ON COLUMN "user".last_name IS 'Original param name - lastName.';
COMMENT ON COLUMN "user"."password" IS 'Legacy password field for seed data - not used with NextAuth';
COMMENT ON COLUMN "user".account_id IS 'Original param name - accountId.';
COMMENT ON COLUMN "user".avatar_url IS 'URL of the user';

-- Table 'meeting' generated from model 'Meeting'
--
DROP TABLE IF EXISTS public.meeting CASCADE;
CREATE TABLE public.meeting (
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
    cutoff_date DATE DEFAULT NULL,
    meeting_type TEXT DEFAULT NULL,
    meeting_year INTEGER DEFAULT NULL,
    status TEXT DEFAULT NULL,
    current_phase TEXT DEFAULT NULL,
    overall_completion SMALLINT DEFAULT NULL,
    distribution_type TEXT DEFAULT NULL,
    transfer_agent TEXT DEFAULT NULL,
    transfer_agent_confirmed BOOLEAN DEFAULT 'false',
    employee_stock_plans TEXT DEFAULT NULL,
    plan_administrator TEXT DEFAULT NULL,
    plan_administrator_contact TEXT DEFAULT NULL,
    plan_administrator_contact_email TEXT DEFAULT NULL,
    solicitor TEXT DEFAULT NULL,
    solicitor_email TEXT DEFAULT NULL,
    inspector TEXT DEFAULT NULL,
    ivr_dial_in_number TEXT DEFAULT NULL,
    total_shares_outstanding TEXT DEFAULT NULL,
    quorum_requirement DECIMAL(20, 9) DEFAULT NULL,
    broker_non_vote DECIMAL(20, 9) DEFAULT NULL,
    mailing_status TEXT DEFAULT NULL,
    client_id TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL,
    tabulation_distribution TEXT DEFAULT NULL,
    client TEXT DEFAULT NULL
);
COMMENT ON TABLE meeting IS 'Original model name - Meeting.';
COMMENT ON COLUMN meeting.pre_filing_date IS 'Original param name - preFilingDate.';
COMMENT ON COLUMN meeting.filing_date IS 'Original param name - filingDate.';
COMMENT ON COLUMN meeting.broker_search_date IS 'Original param name - brokerSearchDate.';
COMMENT ON COLUMN meeting.record_date IS 'Original param name - recordDate.';
COMMENT ON COLUMN meeting.mailing_date IS 'Original param name - mailingDate.';
COMMENT ON COLUMN meeting.meeting_date IS 'Original param name - meetingDate.';
COMMENT ON COLUMN meeting.cutoff_date IS 'Voting cutoff date (previous business day before meeting). Original param name - cutoffDate.';
COMMENT ON COLUMN meeting.meeting_type IS 'Original param name - meetingType.';
COMMENT ON COLUMN meeting.meeting_year IS 'Original param name - meetingYear.';
COMMENT ON COLUMN meeting.current_phase IS 'Original param name - currentPhase.';
COMMENT ON COLUMN meeting.overall_completion IS 'Original param name - overallCompletion.';
COMMENT ON COLUMN meeting.distribution_type IS 'Original param name - distributionType.';
COMMENT ON COLUMN meeting.transfer_agent IS 'Original param name - transferAgent.';
COMMENT ON COLUMN meeting.transfer_agent_confirmed IS 'Whether the transfer agent has been confirmed (demo feature). Original param name - transferAgentConfirmed.';
COMMENT ON COLUMN meeting.employee_stock_plans IS 'Original param name - employeeStockPlans.';
COMMENT ON COLUMN meeting.plan_administrator IS 'Original param name - planAdministrator.';
COMMENT ON COLUMN meeting.plan_administrator_contact IS 'Original param name - planAdministratorContact.';
COMMENT ON COLUMN meeting.plan_administrator_contact_email IS 'Original param name - planAdministratorContactEmail.';
COMMENT ON COLUMN meeting.solicitor_email IS 'Original param name - solicitorEmail.';
COMMENT ON COLUMN meeting.total_shares_outstanding IS 'Original param name - totalSharesOutstanding.';
COMMENT ON COLUMN meeting.quorum_requirement IS 'Original param name - quorumRequirement.';
COMMENT ON COLUMN meeting.broker_non_vote IS 'Total broker non-votes for this meeting. Original param name - brokerNonVote.';
COMMENT ON COLUMN meeting.mailing_status IS 'Current status of the mailing process for this meeting. Original param name - mailingStatus.';
COMMENT ON COLUMN meeting.client_id IS 'The client this meeting belongs to. Original param name - clientId.';
COMMENT ON COLUMN meeting.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN meeting.updated_at IS 'Original param name - updatedAt.';
COMMENT ON COLUMN meeting.tabulation_distribution IS 'Original param name - tabulationDistribution.';

-- Table 'phase' generated from model 'Phase'
--
DROP TABLE IF EXISTS public.phase CASCADE;
CREATE TABLE public.phase (
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
DROP TABLE IF EXISTS public.task CASCADE;
CREATE TABLE public.task (
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
DROP TABLE IF EXISTS public."document" CASCADE;
CREATE TABLE public."document" (
    "id" TEXT DEFAULT NULL,
    meeting_id TEXT DEFAULT NULL,
    task_id TEXT DEFAULT NULL,
    participant_id TEXT DEFAULT NULL,
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
    deadline TIMESTAMP DEFAULT NULL,
    history JSON DEFAULT NULL,
    approved_by TEXT DEFAULT NULL,
    approved_at TIMESTAMP DEFAULT NULL,
    created_by TEXT DEFAULT NULL,
    created_by_first_name TEXT DEFAULT NULL,
    created_by_last_name TEXT DEFAULT NULL,
    updated_by TEXT DEFAULT NULL,
    updated_by_first_name TEXT DEFAULT NULL,
    updated_by_last_name TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL,
    display_category document_display_category DEFAULT NULL,
    meeting TEXT DEFAULT NULL,
    "comments" JSON DEFAULT NULL,
    signatures JSON DEFAULT NULL
);
COMMENT ON TABLE "document" IS 'Original model name - Document.';
COMMENT ON COLUMN "document".meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN "document".task_id IS 'Original param name - taskId.';
COMMENT ON COLUMN "document".participant_id IS 'ID of the DSM participant this document is assigned to. Original param name - participantId.';
COMMENT ON COLUMN "document".file_path IS 'Original param name - filePath.';
COMMENT ON COLUMN "document".file_type IS 'Original param name - fileType.';
COMMENT ON COLUMN "document".file_size IS 'Original param name - fileSize.';
COMMENT ON COLUMN "document".upload_date IS 'Original param name - uploadDate.';
COMMENT ON COLUMN "document".uploaded_date IS 'Original param name - uploadedDate.';
COMMENT ON COLUMN "document".signed_date IS 'Original param name - signedDate.';
COMMENT ON COLUMN "document".authorized_date IS 'Original param name - authorizedDate.';
COMMENT ON COLUMN "document".completed_date IS 'Original param name - completedDate.';
COMMENT ON COLUMN "document".in_progress_date IS 'Original param name - inProgressDate.';
COMMENT ON COLUMN "document".approved_by IS 'User who approved the document. Original param name - approvedBy.';
COMMENT ON COLUMN "document".approved_at IS 'When the document was approved. Original param name - approvedAt.';
COMMENT ON COLUMN "document".created_by IS 'User ID who created the document. Original param name - createdBy.';
COMMENT ON COLUMN "document".created_by_first_name IS 'First name of user who created the document. Original param name - createdByFirstName.';
COMMENT ON COLUMN "document".created_by_last_name IS 'Last name of user who created the document. Original param name - createdByLastName.';
COMMENT ON COLUMN "document".updated_by IS 'User ID who last updated the document. Original param name - updatedBy.';
COMMENT ON COLUMN "document".updated_by_first_name IS 'First name of user who last updated the document. Original param name - updatedByFirstName.';
COMMENT ON COLUMN "document".updated_by_last_name IS 'Last name of user who last updated the document. Original param name - updatedByLastName.';
COMMENT ON COLUMN "document".created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN "document".updated_at IS 'Original param name - updatedAt.';
COMMENT ON COLUMN "document".display_category IS 'Category for filtering document display (general, dsm, proxy-materials, meeting-materials, post-meeting, internal). Original param name - displayCategory.';

-- Table 'document_history' generated from model 'DocumentHistory'
--
DROP TABLE IF EXISTS public.document_history CASCADE;
CREATE TABLE public.document_history (
    "id" TEXT DEFAULT NULL,
    document_id TEXT DEFAULT NULL,
    event_type document_history_event_type DEFAULT NULL,
    user_id TEXT DEFAULT NULL,
    user_name TEXT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    "document" TEXT DEFAULT NULL,
    "user" TEXT DEFAULT NULL
);
COMMENT ON TABLE document_history IS 'Original model name - DocumentHistory.';
COMMENT ON COLUMN document_history.document_id IS 'Original param name - documentId.';
COMMENT ON COLUMN document_history.event_type IS 'Original param name - eventType.';
COMMENT ON COLUMN document_history.user_id IS 'Original param name - userId.';
COMMENT ON COLUMN document_history.user_name IS 'Original param name - userName.';
COMMENT ON COLUMN document_history.created_at IS 'Original param name - createdAt.';

-- Table 'digital_shareholder_meeting' generated from model 'DigitalShareholderMeeting'
--
DROP TABLE IF EXISTS public.digital_shareholder_meeting CASCADE;
CREATE TABLE public.digital_shareholder_meeting (
    "id" TEXT DEFAULT NULL,
    meeting_id TEXT DEFAULT NULL,
    registrant_type digital_shareholder_meeting_registrant_type DEFAULT NULL,
    first_name TEXT DEFAULT NULL,
    last_name TEXT DEFAULT NULL,
    email_address TEXT DEFAULT NULL,
    registration_questions TEXT DEFAULT NULL,
    minutes_attended_meeting INTEGER DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE digital_shareholder_meeting IS 'Original model name - DigitalShareholderMeeting.';
COMMENT ON COLUMN digital_shareholder_meeting.meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN digital_shareholder_meeting.registrant_type IS 'Original param name - registrantType.';
COMMENT ON COLUMN digital_shareholder_meeting.first_name IS 'Original param name - firstName.';
COMMENT ON COLUMN digital_shareholder_meeting.last_name IS 'Original param name - lastName.';
COMMENT ON COLUMN digital_shareholder_meeting.email_address IS 'Original param name - emailAddress.';
COMMENT ON COLUMN digital_shareholder_meeting.registration_questions IS 'Pre-meeting questions submitted during registration. Original param name - registrationQuestions.';
COMMENT ON COLUMN digital_shareholder_meeting.minutes_attended_meeting IS 'Minutes attended in the meeting. Original param name - minutesAttendedMeeting.';
COMMENT ON COLUMN digital_shareholder_meeting.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN digital_shareholder_meeting.updated_at IS 'Original param name - updatedAt.';

-- Table 'comment' generated from model 'Comment'
--
DROP TABLE IF EXISTS public."comment" CASCADE;
CREATE TABLE public."comment" (
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
DROP TABLE IF EXISTS public.signature CASCADE;
CREATE TABLE public.signature (
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
DROP TABLE IF EXISTS public."position" CASCADE;
CREATE TABLE public."position" (
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
    holder_category position_holder_category DEFAULT NULL,
    "state" VARCHAR(2) DEFAULT NULL,
    country VARCHAR(2) DEFAULT NULL,
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
COMMENT ON COLUMN "position"."state" IS 'US state code of the holder';
COMMENT ON COLUMN "position".country IS 'ISO 3166-1 alpha-2 country code.';
COMMENT ON COLUMN "position".created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN "position".updated_at IS 'Original param name - updatedAt.';

-- Table 'position_vote' generated from model 'PositionVote'
--
DROP TABLE IF EXISTS public.position_vote CASCADE;
CREATE TABLE public.position_vote (
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
DROP TABLE IF EXISTS public.proposal CASCADE;
CREATE TABLE public.proposal (
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
    total_votes_for DECIMAL(20, 9) DEFAULT NULL,
    total_votes_against DECIMAL(20, 9) DEFAULT NULL,
    total_votes_abstain DECIMAL(20, 9) DEFAULT NULL,
    total_shares_eligible DECIMAL(20, 9) DEFAULT NULL,
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
DROP TABLE IF EXISTS public.notification CASCADE;
CREATE TABLE public.notification (
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

-- Table 'mailing' generated from model 'Mailing'
--
DROP TABLE IF EXISTS public.mailing CASCADE;
CREATE TABLE public.mailing (
    "id" TEXT DEFAULT NULL,
    meeting_id TEXT DEFAULT NULL,
    ticker TEXT DEFAULT NULL,
    total_accounts INTEGER DEFAULT NULL,
    total_positions INTEGER DEFAULT NULL,
    total_retransmissions INTEGER DEFAULT NULL,
    total_rollups INTEGER DEFAULT NULL,
    fullset_mail_positions INTEGER DEFAULT NULL,
    naa_mail_positions INTEGER DEFAULT NULL,
    courtesy_other_mail_positions INTEGER DEFAULT NULL,
    electronic_suppressed_positions INTEGER DEFAULT NULL,
    household_suppressed_positions INTEGER DEFAULT NULL,
    managed_suppressed_positions INTEGER DEFAULT NULL,
    consolidated_suppressed_positions INTEGER DEFAULT NULL,
    canceled_suppressed_positions INTEGER DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE mailing IS 'Original model name - Mailing.';
COMMENT ON COLUMN mailing.meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN mailing.total_accounts IS 'Total number of accounts. Original param name - totalAccounts.';
COMMENT ON COLUMN mailing.total_positions IS 'Total number of positions. Original param name - totalPositions.';
COMMENT ON COLUMN mailing.total_retransmissions IS 'Number of retransmissions. Original param name - totalRetransmissions.';
COMMENT ON COLUMN mailing.total_rollups IS 'Number of rollups. Original param name - totalRollups.';
COMMENT ON COLUMN mailing.fullset_mail_positions IS 'Number of fullset mail positions. Original param name - fullsetMailPositions.';
COMMENT ON COLUMN mailing.naa_mail_positions IS 'Number of NAA mail positions. Original param name - naaMailPositions.';
COMMENT ON COLUMN mailing.courtesy_other_mail_positions IS 'Number of courtesy/other mail positions. Original param name - courtesyOtherMailPositions.';
COMMENT ON COLUMN mailing.electronic_suppressed_positions IS 'Number of electronic suppressed positions. Original param name - electronicSuppressedPositions.';
COMMENT ON COLUMN mailing.household_suppressed_positions IS 'Number of household suppressed positions. Original param name - householdSuppressedPositions.';
COMMENT ON COLUMN mailing.managed_suppressed_positions IS 'Number of managed suppressed positions. Original param name - managedSuppressedPositions.';
COMMENT ON COLUMN mailing.consolidated_suppressed_positions IS 'Number of consolidated suppressed positions. Original param name - consolidatedSuppressedPositions.';
COMMENT ON COLUMN mailing.canceled_suppressed_positions IS 'Number of canceled suppressed positions. Original param name - canceledSuppressedPositions.';
COMMENT ON COLUMN mailing.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN mailing.updated_at IS 'Original param name - updatedAt.';

-- Table 'tabulation_report' generated from model 'TabulationReport'
--
DROP TABLE IF EXISTS public.tabulation_report CASCADE;
CREATE TABLE public.tabulation_report (
    "id" TEXT NOT NULL,
    meeting_id TEXT NOT NULL,
    set_keys JSON DEFAULT NULL,
    broker_voting JSON DEFAULT NULL,
    share_range_performance JSON DEFAULT NULL,
    non_dtc_vote_status TEXT DEFAULT NULL,
    dtc_vote_status TEXT DEFAULT NULL,
    vote_distribution TEXT DEFAULT NULL,
    positions_voted TEXT DEFAULT NULL,
    last_calculated_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE tabulation_report IS 'Original model name - TabulationReport.';
COMMENT ON COLUMN tabulation_report."id" IS 'Primary key';
COMMENT ON COLUMN tabulation_report.meeting_id IS 'Foreign key to meeting table. Original param name - meetingId.';
COMMENT ON COLUMN tabulation_report.set_keys IS 'Unique set keys from position records. Original param name - setKeys.';
COMMENT ON COLUMN tabulation_report.broker_voting IS 'Top 6 brokers by total shares. Original param name - brokerVoting.';
COMMENT ON COLUMN tabulation_report.share_range_performance IS 'Performance metrics across 18 share ranges. Original param name - shareRangePerformance.';
COMMENT ON COLUMN tabulation_report.non_dtc_vote_status IS 'Original param name - nonDtcVoteStatus.';
COMMENT ON COLUMN tabulation_report.dtc_vote_status IS 'Original param name - dtcVoteStatus.';
COMMENT ON COLUMN tabulation_report.vote_distribution IS 'Original param name - voteDistribution.';
COMMENT ON COLUMN tabulation_report.positions_voted IS 'Original param name - positionsVoted.';
COMMENT ON COLUMN tabulation_report.last_calculated_at IS 'Timestamp of last statistics calculation. Original param name - lastCalculatedAt.';
COMMENT ON COLUMN tabulation_report.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN tabulation_report.updated_at IS 'Original param name - updatedAt.';

-- Table 'dsm_config' generated from model 'DSMConfig'
--
DROP TABLE IF EXISTS public.dsm_config CASCADE;
CREATE TABLE public.dsm_config (
    "id" TEXT DEFAULT NULL,
    meeting_id TEXT DEFAULT NULL,
    live_qa BOOLEAN DEFAULT 'false',
    audio_only BOOLEAN DEFAULT 'false',
    meeting_recording BOOLEAN DEFAULT 'false',
    static_slide_doc_id TEXT DEFAULT NULL,
    display_docs_doc_id TEXT DEFAULT NULL,
    is_confirmed BOOLEAN DEFAULT 'false',
    logistics_call_date TIMESTAMP DEFAULT NULL,
    logistics_call_notes TEXT DEFAULT NULL,
    logistics_call_scheduled BOOLEAN DEFAULT 'false',
    dry_run_date TIMESTAMP DEFAULT NULL,
    dry_run_notes TEXT DEFAULT NULL,
    dry_run_scheduled BOOLEAN DEFAULT 'false',
    dsm_enabled BOOLEAN DEFAULT 'true',
    ioe_enabled BOOLEAN DEFAULT 'true',
    dsm_producer_name TEXT DEFAULT NULL,
    dsm_producer_email TEXT DEFAULT NULL,
    inspector_name TEXT DEFAULT NULL,
    inspector_email TEXT DEFAULT NULL,
    speaker_list_doc_id TEXT DEFAULT NULL,
    guest_link_registration_doc_id TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);
COMMENT ON TABLE dsm_config IS 'Original model name - DSMConfig.';
COMMENT ON COLUMN dsm_config.meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN dsm_config.live_qa IS 'Original param name - liveQa.';
COMMENT ON COLUMN dsm_config.audio_only IS 'Original param name - audioOnly.';
COMMENT ON COLUMN dsm_config.meeting_recording IS 'Original param name - meetingRecording.';
COMMENT ON COLUMN dsm_config.static_slide_doc_id IS 'Original param name - staticSlideDocId.';
COMMENT ON COLUMN dsm_config.display_docs_doc_id IS 'Original param name - displayDocsDocId.';
COMMENT ON COLUMN dsm_config.is_confirmed IS 'Original param name - isConfirmed.';
COMMENT ON COLUMN dsm_config.logistics_call_date IS 'Original param name - logisticsCallDate.';
COMMENT ON COLUMN dsm_config.logistics_call_notes IS 'Original param name - logisticsCallNotes.';
COMMENT ON COLUMN dsm_config.logistics_call_scheduled IS 'Original param name - logisticsCallScheduled.';
COMMENT ON COLUMN dsm_config.dry_run_date IS 'Original param name - dryRunDate.';
COMMENT ON COLUMN dsm_config.dry_run_notes IS 'Original param name - dryRunNotes.';
COMMENT ON COLUMN dsm_config.dry_run_scheduled IS 'Original param name - dryRunScheduled.';
COMMENT ON COLUMN dsm_config.dsm_enabled IS 'Original param name - dsmEnabled.';
COMMENT ON COLUMN dsm_config.ioe_enabled IS 'Original param name - ioeEnabled.';
COMMENT ON COLUMN dsm_config.dsm_producer_name IS 'Original param name - dsmProducerName.';
COMMENT ON COLUMN dsm_config.dsm_producer_email IS 'Original param name - dsmProducerEmail.';
COMMENT ON COLUMN dsm_config.inspector_name IS 'Original param name - inspectorName.';
COMMENT ON COLUMN dsm_config.inspector_email IS 'Original param name - inspectorEmail.';
COMMENT ON COLUMN dsm_config.speaker_list_doc_id IS 'Original param name - speakerListDocId.';
COMMENT ON COLUMN dsm_config.guest_link_registration_doc_id IS 'Original param name - guestLinkRegistrationDocId.';
COMMENT ON COLUMN dsm_config.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN dsm_config.updated_at IS 'Original param name - updatedAt.';
