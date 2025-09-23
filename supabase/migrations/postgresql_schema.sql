--
-- Schema objects for PostgreSQL
-- "BetaNXT Issuer Portal API"
-- Created using 'openapi-generator' ('postgresql-schema' generator)
-- (https://openapi-generator.tech/docs/generators/postgresql-schema)
--

--
-- DROP OBJECTS
-- (remove comment prefix to start using DROP commands)
--
-- TABLES
--
-- DROP TABLE IF EXISTS public.account;
-- DROP TABLE IF EXISTS public.approve_document_version_request;
-- DROP TABLE IF EXISTS public.cast_vote_request;
-- DROP TABLE IF EXISTS public.clients;
-- DROP TABLE IF EXISTS public."comment";
-- DROP TABLE IF EXISTS public.create_account_request;
-- DROP TABLE IF EXISTS public.create_account_user_request;
-- DROP TABLE IF EXISTS public.create_client_request;
-- DROP TABLE IF EXISTS public.create_comment_request;
-- DROP TABLE IF EXISTS public.create_meeting_request;
-- DROP TABLE IF EXISTS public.create_phase_request;
-- DROP TABLE IF EXISTS public.create_phase_request_key_dates;
-- DROP TABLE IF EXISTS public.create_position_request;
-- DROP TABLE IF EXISTS public.create_proposal_request;
-- DROP TABLE IF EXISTS public.create_task_request;
-- DROP TABLE IF EXISTS public.create_user_request;
-- DROP TABLE IF EXISTS public."document";
-- DROP TABLE IF EXISTS public."error";
-- DROP TABLE IF EXISTS public.get_documents_readiness_200_response;
-- DROP TABLE IF EXISTS public.list_account_users_200_response;
-- DROP TABLE IF EXISTS public.list_accounts_200_response;
-- DROP TABLE IF EXISTS public.list_clients_200_response;
-- DROP TABLE IF EXISTS public.list_meetings_200_response;
-- DROP TABLE IF EXISTS public.list_notifications_200_response;
-- DROP TABLE IF EXISTS public.list_user_accounts_200_response;
-- DROP TABLE IF EXISTS public.login_user_200_response;
-- DROP TABLE IF EXISTS public.login_user_request;
-- DROP TABLE IF EXISTS public.logout_user_200_response;
-- DROP TABLE IF EXISTS public.meeting;
-- DROP TABLE IF EXISTS public.notification;
-- DROP TABLE IF EXISTS public.pagination;
-- DROP TABLE IF EXISTS public.phase;
-- DROP TABLE IF EXISTS public.phase_key_dates;
-- DROP TABLE IF EXISTS public."position";
-- DROP TABLE IF EXISTS public.position_vote;
-- DROP TABLE IF EXISTS public.proposal;
-- DROP TABLE IF EXISTS public.sign_form_digital_request;
-- DROP TABLE IF EXISTS public.signature;
-- DROP TABLE IF EXISTS public.task;
-- DROP TABLE IF EXISTS public.update_account_request;
-- DROP TABLE IF EXISTS public.update_client_request;
-- DROP TABLE IF EXISTS public.update_document_request;
-- DROP TABLE IF EXISTS public.update_meeting_request;
-- DROP TABLE IF EXISTS public.update_phase_request;
-- DROP TABLE IF EXISTS public.update_phase_request_key_dates;
-- DROP TABLE IF EXISTS public.update_position_request;
-- DROP TABLE IF EXISTS public.update_proposal_request;
-- DROP TABLE IF EXISTS public.update_task_request;
-- DROP TABLE IF EXISTS public.update_user_request;
-- DROP TABLE IF EXISTS public."user";

--
-- TYPES
--
-- DROP TYPE IF EXISTS cast_vote_request_vote;
-- DROP TYPE IF EXISTS create_position_request_vote_status;
-- DROP TYPE IF EXISTS create_position_request_source;
-- DROP TYPE IF EXISTS notification_type;
-- DROP TYPE IF EXISTS notification_priority;
-- DROP TYPE IF EXISTS position_vote_status;
-- DROP TYPE IF EXISTS position_source;
-- DROP TYPE IF EXISTS proposal_final_result;
-- DROP TYPE IF EXISTS update_position_request_vote_status;
-- DROP TYPE IF EXISTS update_position_request_source;


--
-- CREATE OBJECTS
--
-- TYPES
--
CREATE TYPE cast_vote_request_vote AS ENUM('FOR', 'AGAINST', 'ABSTAIN', 'WITHHOLD');
CREATE TYPE create_position_request_vote_status AS ENUM('Voted', 'Unvoted');
CREATE TYPE create_position_request_source AS ENUM('WEB', 'PRINT', 'IVR');
CREATE TYPE notification_type AS ENUM('info', 'warning', 'error', 'success');
CREATE TYPE notification_priority AS ENUM('low', 'medium', 'high', 'critical');
CREATE TYPE position_vote_status AS ENUM('Voted', 'Unvoted');
CREATE TYPE position_source AS ENUM('WEB', 'PRINT', 'IVR');
CREATE TYPE proposal_final_result AS ENUM('PASSED', 'FAILED', 'PENDING');
CREATE TYPE update_position_request_vote_status AS ENUM('Voted', 'Unvoted');
CREATE TYPE update_position_request_source AS ENUM('WEB', 'PRINT', 'IVR');

--
-- TABLES
--
--
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

--
-- Table 'approve_document_version_request' generated from model 'approveDocumentVersionUnderscorerequest'
--
CREATE TABLE IF NOT EXISTS public.approve_document_version_request (
    meeting_id TEXT NOT NULL,
    "comment" TEXT DEFAULT NULL
);
COMMENT ON TABLE approve_document_version_request IS 'Original model name - approveDocumentVersion_request.';
COMMENT ON COLUMN approve_document_version_request.meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN approve_document_version_request."comment" IS 'Optional approval comment';

--
-- Table 'cast_vote_request' generated from model 'CastVoteRequest'
--
CREATE TABLE IF NOT EXISTS public.cast_vote_request (
    proposal_id TEXT NOT NULL,
    vote cast_vote_request_vote NOT NULL,
    shares_voting TEXT NOT NULL
);
COMMENT ON TABLE cast_vote_request IS 'Original model name - CastVoteRequest.';
COMMENT ON COLUMN cast_vote_request.proposal_id IS 'Original param name - proposalId.';
COMMENT ON COLUMN cast_vote_request.shares_voting IS 'Original param name - sharesVoting.';

--
-- Table 'clients' generated from model 'Clients'
--
CREATE TABLE IF NOT EXISTS public.clients (
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
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL,
    accounts JSON DEFAULT NULL,
    meetings JSON DEFAULT NULL
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
COMMENT ON COLUMN clients.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN clients.updated_at IS 'Original param name - updatedAt.';
COMMENT ON COLUMN clients.accounts IS 'JSON array of related account information';
COMMENT ON COLUMN clients.meetings IS 'JSON array of related meeting information';

--
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

--
-- Table 'create_account_request' generated from model 'CreateAccountRequest'
--
CREATE TABLE IF NOT EXISTS public.create_account_request (
    "name" VARCHAR(100) NOT NULL,
    primary_contact TEXT NOT NULL,
    client_id TEXT NOT NULL
);
COMMENT ON TABLE create_account_request IS 'Original model name - CreateAccountRequest.';
COMMENT ON COLUMN create_account_request.primary_contact IS 'Original param name - primaryContact.';
COMMENT ON COLUMN create_account_request.client_id IS 'The client this account belongs to. Original param name - clientId.';

--
-- Table 'create_account_user_request' generated from model 'CreateAccountUserRequest'
--
CREATE TABLE IF NOT EXISTS public.create_account_user_request (
    username VARCHAR(30) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" TEXT NOT NULL
);
COMMENT ON TABLE create_account_user_request IS 'Original model name - CreateAccountUserRequest.';
COMMENT ON COLUMN create_account_user_request.first_name IS 'Original param name - firstName.';
COMMENT ON COLUMN create_account_user_request.last_name IS 'Original param name - lastName.';

--
-- Table 'create_client_request' generated from model 'CreateClientRequest'
--
CREATE TABLE IF NOT EXISTS public.create_client_request (
    ticker VARCHAR(10) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    industry VARCHAR(100) DEFAULT NULL,
    description VARCHAR(1000) DEFAULT NULL,
    website TEXT DEFAULT NULL,
    primary_contact VARCHAR(100) DEFAULT NULL,
    primary_contact_email TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT 'true',
    branding_id INTEGER DEFAULT NULL
);
COMMENT ON TABLE create_client_request IS 'Original model name - CreateClientRequest.';
COMMENT ON COLUMN create_client_request.ticker IS 'Unique ticker symbol for the client';
COMMENT ON COLUMN create_client_request.company_name IS 'Full legal name of the company. Original param name - companyName.';
COMMENT ON COLUMN create_client_request.short_name IS 'Short display name for the company. Original param name - shortName.';
COMMENT ON COLUMN create_client_request.industry IS 'Industry sector';
COMMENT ON COLUMN create_client_request.description IS 'Company description';
COMMENT ON COLUMN create_client_request.website IS 'Company website URL';
COMMENT ON COLUMN create_client_request.primary_contact IS 'Primary contact person. Original param name - primaryContact.';
COMMENT ON COLUMN create_client_request.primary_contact_email IS 'Primary contact email. Original param name - primaryContactEmail.';
COMMENT ON COLUMN create_client_request.is_active IS 'Whether the client is active. Original param name - isActive.';
COMMENT ON COLUMN create_client_request.branding_id IS 'Unique branding identifier for document hosting site URLs. Original param name - brandingId.';

--
-- Table 'create_comment_request' generated from model 'CreateCommentRequest'
--
CREATE TABLE IF NOT EXISTS public.create_comment_request (
    "comment" VARCHAR(2000) NOT NULL
);
COMMENT ON TABLE create_comment_request IS 'Original model name - CreateCommentRequest.';

--
-- Table 'create_meeting_request' generated from model 'CreateMeetingRequest'
--
CREATE TABLE IF NOT EXISTS public.create_meeting_request (
    "id" TEXT NOT NULL,
    title VARCHAR(200) NOT NULL,
    cusip TEXT NOT NULL,
    ticker TEXT NOT NULL,
    record_date DATE NOT NULL,
    mailing_date DATE NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_type TEXT NOT NULL,
    meeting_year INTEGER NOT NULL,
    distribution_type TEXT NOT NULL,
    transfer_agent TEXT NOT NULL,
    employee_stock_plans TEXT DEFAULT NULL,
    plan_administrator TEXT DEFAULT NULL,
    plan_administrator_contact TEXT DEFAULT NULL,
    plan_administrator_contact_email TEXT DEFAULT NULL,
    solicitor TEXT DEFAULT NULL,
    solicitor_email TEXT DEFAULT NULL,
    ivr_dial_in_number TEXT DEFAULT NULL,
    total_shares_outstanding TEXT NOT NULL,
    quorum_requirement DECIMAL(20, 9) NOT NULL,
    client_id TEXT NOT NULL
);
COMMENT ON TABLE create_meeting_request IS 'Original model name - CreateMeetingRequest.';
COMMENT ON COLUMN create_meeting_request.record_date IS 'Original param name - recordDate.';
COMMENT ON COLUMN create_meeting_request.mailing_date IS 'Original param name - mailingDate.';
COMMENT ON COLUMN create_meeting_request.meeting_date IS 'Original param name - meetingDate.';
COMMENT ON COLUMN create_meeting_request.meeting_type IS 'Original param name - meetingType.';
COMMENT ON COLUMN create_meeting_request.meeting_year IS 'Original param name - meetingYear.';
COMMENT ON COLUMN create_meeting_request.distribution_type IS 'Original param name - distributionType.';
COMMENT ON COLUMN create_meeting_request.transfer_agent IS 'Original param name - transferAgent.';
COMMENT ON COLUMN create_meeting_request.employee_stock_plans IS 'Original param name - employeeStockPlans.';
COMMENT ON COLUMN create_meeting_request.plan_administrator IS 'Original param name - planAdministrator.';
COMMENT ON COLUMN create_meeting_request.plan_administrator_contact IS 'Original param name - planAdministratorContact.';
COMMENT ON COLUMN create_meeting_request.plan_administrator_contact_email IS 'Original param name - planAdministratorContactEmail.';
COMMENT ON COLUMN create_meeting_request.solicitor_email IS 'Original param name - solicitorEmail.';
COMMENT ON COLUMN create_meeting_request.ivr_dial_in_number IS 'IVR dial-in voting number. Original param name - ivrDialInNumber.';
COMMENT ON COLUMN create_meeting_request.total_shares_outstanding IS 'Original param name - totalSharesOutstanding.';
COMMENT ON COLUMN create_meeting_request.quorum_requirement IS 'Original param name - quorumRequirement.';
COMMENT ON COLUMN create_meeting_request.client_id IS 'The client this meeting belongs to. Original param name - clientId.';

--
-- Table 'create_phase_request' generated from model 'CreatePhaseRequest'
--
CREATE TABLE IF NOT EXISTS public.create_phase_request (
    "name" VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL,
    key_dates TEXT DEFAULT NULL
);
COMMENT ON TABLE create_phase_request IS 'Original model name - CreatePhaseRequest.';
COMMENT ON COLUMN create_phase_request.order_index IS 'Original param name - orderIndex.';
COMMENT ON COLUMN create_phase_request.key_dates IS 'Original param name - keyDates.';

--
-- Table 'create_phase_request_key_dates' generated from model 'CreatePhaseRequestUnderscorekeyDates'
--
CREATE TABLE IF NOT EXISTS public.create_phase_request_key_dates (
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    due_date DATE DEFAULT NULL
);
COMMENT ON TABLE create_phase_request_key_dates IS 'Original model name - CreatePhaseRequest_keyDates.';
COMMENT ON COLUMN create_phase_request_key_dates.start_date IS 'Original param name - startDate.';
COMMENT ON COLUMN create_phase_request_key_dates.end_date IS 'Original param name - endDate.';
COMMENT ON COLUMN create_phase_request_key_dates.due_date IS 'Original param name - dueDate.';

--
-- Table 'create_position_request' generated from model 'CreatePositionRequest'
--
CREATE TABLE IF NOT EXISTS public.create_position_request (
    meeting_id TEXT NOT NULL,
    cusip TEXT NOT NULL,
    account_type TEXT NOT NULL,
    set_key TEXT NOT NULL,
    "name" TEXT NOT NULL,
    account_number TEXT DEFAULT NULL,
    control_number TEXT DEFAULT NULL,
    vote_status create_position_request_vote_status NOT NULL,
    shares DECIMAL(20, 9) NOT NULL,
    shares_voted DECIMAL(20, 9) DEFAULT '0',
    "source" create_position_request_source DEFAULT NULL,
    date_voted TEXT DEFAULT NULL
);
COMMENT ON TABLE create_position_request IS 'Original model name - CreatePositionRequest.';
COMMENT ON COLUMN create_position_request.meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN create_position_request.account_type IS 'Original param name - accountType.';
COMMENT ON COLUMN create_position_request.set_key IS 'Original param name - setKey.';
COMMENT ON COLUMN create_position_request.account_number IS 'Original param name - accountNumber.';
COMMENT ON COLUMN create_position_request.control_number IS 'Original param name - controlNumber.';
COMMENT ON COLUMN create_position_request.vote_status IS 'Original param name - voteStatus.';
COMMENT ON COLUMN create_position_request.shares_voted IS 'Original param name - sharesVoted.';
COMMENT ON COLUMN create_position_request.date_voted IS 'Original param name - dateVoted.';

--
-- Table 'create_proposal_request' generated from model 'CreateProposalRequest'
--
CREATE TABLE IF NOT EXISTS public.create_proposal_request (
    proposal_number DECIMAL(20, 9) NOT NULL,
    proposal_title VARCHAR(500) NOT NULL,
    proposal_type TEXT NOT NULL,
    proposal_subtype TEXT DEFAULT NULL,
    director_name TEXT DEFAULT NULL,
    director_term_years INTEGER DEFAULT NULL,
    director_class TEXT DEFAULT NULL,
    term_expiration_year INTEGER DEFAULT NULL,
    frequency_options JSON DEFAULT NULL,
    recommendation TEXT NOT NULL
);
COMMENT ON TABLE create_proposal_request IS 'Original model name - CreateProposalRequest.';
COMMENT ON COLUMN create_proposal_request.proposal_number IS 'Original param name - proposalNumber.';
COMMENT ON COLUMN create_proposal_request.proposal_title IS 'Original param name - proposalTitle.';
COMMENT ON COLUMN create_proposal_request.proposal_type IS 'Original param name - proposalType.';
COMMENT ON COLUMN create_proposal_request.proposal_subtype IS 'Original param name - proposalSubtype.';
COMMENT ON COLUMN create_proposal_request.director_name IS 'Original param name - directorName.';
COMMENT ON COLUMN create_proposal_request.director_term_years IS 'Original param name - directorTermYears.';
COMMENT ON COLUMN create_proposal_request.director_class IS 'Original param name - directorClass.';
COMMENT ON COLUMN create_proposal_request.term_expiration_year IS 'Original param name - termExpirationYear.';
COMMENT ON COLUMN create_proposal_request.frequency_options IS 'Original param name - frequencyOptions.';

--
-- Table 'create_task_request' generated from model 'CreateTaskRequest'
--
CREATE TABLE IF NOT EXISTS public.create_task_request (
    task_id TEXT NOT NULL,
    phase_id TEXT NOT NULL,
    phase_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT NULL,
    "type" TEXT NOT NULL,
    due_date DATE DEFAULT NULL,
    "owner" TEXT NOT NULL,
    document_id TEXT DEFAULT NULL,
    links JSON DEFAULT NULL
);
COMMENT ON TABLE create_task_request IS 'Original model name - CreateTaskRequest.';
COMMENT ON COLUMN create_task_request.task_id IS 'Original param name - taskId.';
COMMENT ON COLUMN create_task_request.phase_id IS 'Original param name - phaseId.';
COMMENT ON COLUMN create_task_request.phase_number IS 'Original param name - phaseNumber.';
COMMENT ON COLUMN create_task_request.due_date IS 'Original param name - dueDate.';
COMMENT ON COLUMN create_task_request.document_id IS 'Original param name - documentId.';

--
-- Table 'create_user_request' generated from model 'CreateUserRequest'
--
CREATE TABLE IF NOT EXISTS public.create_user_request (
    username VARCHAR(30) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    account_id TEXT DEFAULT NULL
);
COMMENT ON TABLE create_user_request IS 'Original model name - CreateUserRequest.';
COMMENT ON COLUMN create_user_request.first_name IS 'Original param name - firstName.';
COMMENT ON COLUMN create_user_request.last_name IS 'Original param name - lastName.';
COMMENT ON COLUMN create_user_request.account_id IS 'Original param name - accountId.';

--
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
    deadline TIMESTAMP DEFAULT NULL,
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

--
-- Table 'error' generated from model 'Error'
--
CREATE TABLE IF NOT EXISTS public."error" (
    message TEXT DEFAULT NULL,
    code TEXT DEFAULT NULL,
    details JSON DEFAULT NULL
);
COMMENT ON TABLE "error" IS 'Original model name - Error.';

--
-- Table 'get_documents_readiness_200_response' generated from model 'getDocumentsReadinessUnderscore200Underscoreresponse'
--
CREATE TABLE IF NOT EXISTS public.get_documents_readiness_200_response (
    phase1_ready BOOLEAN DEFAULT NULL,
    phase2_ready BOOLEAN DEFAULT NULL,
    overall_ready BOOLEAN DEFAULT NULL,
    outstanding_phase1 JSON DEFAULT NULL,
    outstanding_phase2 JSON DEFAULT NULL
);
COMMENT ON TABLE get_documents_readiness_200_response IS 'Original model name - getDocumentsReadiness_200_response.';
COMMENT ON COLUMN get_documents_readiness_200_response.phase1_ready IS 'Original param name - phase1Ready.';
COMMENT ON COLUMN get_documents_readiness_200_response.phase2_ready IS 'Original param name - phase2Ready.';
COMMENT ON COLUMN get_documents_readiness_200_response.overall_ready IS 'Original param name - overallReady.';
COMMENT ON COLUMN get_documents_readiness_200_response.outstanding_phase1 IS 'Original param name - outstandingPhase1.';
COMMENT ON COLUMN get_documents_readiness_200_response.outstanding_phase2 IS 'Original param name - outstandingPhase2.';

--
-- Table 'list_account_users_200_response' generated from model 'listAccountUsersUnderscore200Underscoreresponse'
--
CREATE TABLE IF NOT EXISTS public.list_account_users_200_response (
    users JSON DEFAULT NULL,
    pagination TEXT DEFAULT NULL
);
COMMENT ON TABLE list_account_users_200_response IS 'Original model name - listAccountUsers_200_response.';

--
-- Table 'list_accounts_200_response' generated from model 'listAccountsUnderscore200Underscoreresponse'
--
CREATE TABLE IF NOT EXISTS public.list_accounts_200_response (
    accounts JSON DEFAULT NULL,
    pagination TEXT DEFAULT NULL
);
COMMENT ON TABLE list_accounts_200_response IS 'Original model name - listAccounts_200_response.';

--
-- Table 'list_clients_200_response' generated from model 'listClientsUnderscore200Underscoreresponse'
--
CREATE TABLE IF NOT EXISTS public.list_clients_200_response (
    clients JSON DEFAULT NULL,
    pagination TEXT DEFAULT NULL
);
COMMENT ON TABLE list_clients_200_response IS 'Original model name - listClients_200_response.';

--
-- Table 'list_meetings_200_response' generated from model 'listMeetingsUnderscore200Underscoreresponse'
--
CREATE TABLE IF NOT EXISTS public.list_meetings_200_response (
    meetings JSON DEFAULT NULL,
    pagination TEXT DEFAULT NULL
);
COMMENT ON TABLE list_meetings_200_response IS 'Original model name - listMeetings_200_response.';

--
-- Table 'list_notifications_200_response' generated from model 'listNotificationsUnderscore200Underscoreresponse'
--
CREATE TABLE IF NOT EXISTS public.list_notifications_200_response (
    "data" JSON DEFAULT NULL,
    pagination TEXT DEFAULT NULL
);
COMMENT ON TABLE list_notifications_200_response IS 'Original model name - listNotifications_200_response.';

--
-- Table 'list_user_accounts_200_response' generated from model 'listUserAccountsUnderscore200Underscoreresponse'
--
CREATE TABLE IF NOT EXISTS public.list_user_accounts_200_response (
    accounts JSON NOT NULL,
    total INTEGER NOT NULL
);
COMMENT ON TABLE list_user_accounts_200_response IS 'Original model name - listUserAccounts_200_response.';
COMMENT ON COLUMN list_user_accounts_200_response.total IS 'Total number of accounts';

--
-- Table 'login_user_200_response' generated from model 'loginUserUnderscore200Underscoreresponse'
--
CREATE TABLE IF NOT EXISTS public.login_user_200_response (
    "user" TEXT DEFAULT NULL,
    "token" TEXT DEFAULT NULL
);
COMMENT ON TABLE login_user_200_response IS 'Original model name - loginUser_200_response.';

--
-- Table 'login_user_request' generated from model 'loginUserUnderscorerequest'
--
CREATE TABLE IF NOT EXISTS public.login_user_request (
    username TEXT NOT NULL,
    "password" TEXT NOT NULL
);
COMMENT ON TABLE login_user_request IS 'Original model name - loginUser_request.';

--
-- Table 'logout_user_200_response' generated from model 'logoutUserUnderscore200Underscoreresponse'
--
CREATE TABLE IF NOT EXISTS public.logout_user_200_response (
    message TEXT DEFAULT NULL
);
COMMENT ON TABLE logout_user_200_response IS 'Original model name - logoutUser_200_response.';

--
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
COMMENT ON COLUMN meeting.ivr_dial_in_number IS 'IVR dial-in voting number (e.g., \&quot;1-800-555-VOTE\&quot;). Original param name - ivrDialInNumber.';
COMMENT ON COLUMN meeting.total_shares_outstanding IS 'Original param name - totalSharesOutstanding.';
COMMENT ON COLUMN meeting.quorum_requirement IS 'Original param name - quorumRequirement.';
COMMENT ON COLUMN meeting.client_id IS 'The client this meeting belongs to. Original param name - clientId.';
COMMENT ON COLUMN meeting.created_at IS 'Original param name - createdAt.';
COMMENT ON COLUMN meeting.updated_at IS 'Original param name - updatedAt.';

--
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

--
-- Table 'pagination' generated from model 'Pagination'
--
CREATE TABLE IF NOT EXISTS public.pagination (
    page INTEGER DEFAULT NULL,
    "limit" INTEGER DEFAULT NULL,
    total INTEGER DEFAULT NULL,
    pages INTEGER DEFAULT NULL
);
COMMENT ON TABLE pagination IS 'Original model name - Pagination.';

--
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

--
-- Table 'phase_key_dates' generated from model 'PhaseUnderscorekeyDates'
--
CREATE TABLE IF NOT EXISTS public.phase_key_dates (
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    due_date DATE DEFAULT NULL,
    completion_date DATE DEFAULT NULL
);
COMMENT ON TABLE phase_key_dates IS 'Original model name - Phase_keyDates.';
COMMENT ON COLUMN phase_key_dates.start_date IS 'Original param name - startDate.';
COMMENT ON COLUMN phase_key_dates.end_date IS 'Original param name - endDate.';
COMMENT ON COLUMN phase_key_dates.due_date IS 'Original param name - dueDate.';
COMMENT ON COLUMN phase_key_dates.completion_date IS 'Original param name - completionDate.';

--
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

--
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

--
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

--
-- Table 'sign_form_digital_request' generated from model 'signFormDigitalUnderscorerequest'
--
CREATE TABLE IF NOT EXISTS public.sign_form_digital_request (
    meeting_id TEXT NOT NULL,
    signer_user_id TEXT NOT NULL,
    signature_reason TEXT DEFAULT NULL,
    replace_existing BOOLEAN DEFAULT NULL
);
COMMENT ON TABLE sign_form_digital_request IS 'Original model name - signFormDigital_request.';
COMMENT ON COLUMN sign_form_digital_request.meeting_id IS 'Original param name - meetingId.';
COMMENT ON COLUMN sign_form_digital_request.signer_user_id IS 'User performing the digital signature. Original param name - signerUserId.';
COMMENT ON COLUMN sign_form_digital_request.signature_reason IS 'Optional reason or context for the signature. Original param name - signatureReason.';
COMMENT ON COLUMN sign_form_digital_request.replace_existing IS 'If true, replaces any existing signature artifact. Original param name - replaceExisting.';

--
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

--
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

--
-- Table 'update_account_request' generated from model 'UpdateAccountRequest'
--
CREATE TABLE IF NOT EXISTS public.update_account_request (
    "name" VARCHAR(100) DEFAULT NULL,
    primary_contact TEXT DEFAULT NULL,
    client_id TEXT DEFAULT NULL
);
COMMENT ON TABLE update_account_request IS 'Original model name - UpdateAccountRequest.';
COMMENT ON COLUMN update_account_request.primary_contact IS 'Original param name - primaryContact.';
COMMENT ON COLUMN update_account_request.client_id IS 'The client this account belongs to. Original param name - clientId.';

--
-- Table 'update_client_request' generated from model 'UpdateClientRequest'
--
CREATE TABLE IF NOT EXISTS public.update_client_request (
    company_name VARCHAR(200) DEFAULT NULL,
    short_name VARCHAR(100) DEFAULT NULL,
    industry VARCHAR(100) DEFAULT NULL,
    description VARCHAR(1000) DEFAULT NULL,
    website TEXT DEFAULT NULL,
    primary_contact VARCHAR(100) DEFAULT NULL,
    primary_contact_email TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT NULL,
    branding_id INTEGER DEFAULT NULL
);
COMMENT ON TABLE update_client_request IS 'Original model name - UpdateClientRequest.';
COMMENT ON COLUMN update_client_request.company_name IS 'Full legal name of the company. Original param name - companyName.';
COMMENT ON COLUMN update_client_request.short_name IS 'Short display name for the company. Original param name - shortName.';
COMMENT ON COLUMN update_client_request.industry IS 'Industry sector';
COMMENT ON COLUMN update_client_request.description IS 'Company description';
COMMENT ON COLUMN update_client_request.website IS 'Company website URL';
COMMENT ON COLUMN update_client_request.primary_contact IS 'Primary contact person. Original param name - primaryContact.';
COMMENT ON COLUMN update_client_request.primary_contact_email IS 'Primary contact email. Original param name - primaryContactEmail.';
COMMENT ON COLUMN update_client_request.is_active IS 'Whether the client is active. Original param name - isActive.';
COMMENT ON COLUMN update_client_request.branding_id IS 'Unique branding identifier for document hosting site URLs. Original param name - brandingId.';

--
-- Table 'update_document_request' generated from model 'UpdateDocumentRequest'
--
CREATE TABLE IF NOT EXISTS public.update_document_request (
    title VARCHAR(200) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    status TEXT DEFAULT NULL
);
COMMENT ON TABLE update_document_request IS 'Original model name - UpdateDocumentRequest.';

--
-- Table 'update_meeting_request' generated from model 'UpdateMeetingRequest'
--
CREATE TABLE IF NOT EXISTS public.update_meeting_request (
    title VARCHAR(200) DEFAULT NULL,
    record_date DATE DEFAULT NULL,
    mailing_date DATE DEFAULT NULL,
    meeting_date DATE DEFAULT NULL,
    meeting_type TEXT DEFAULT NULL,
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
    ivr_dial_in_number TEXT DEFAULT NULL,
    total_shares_outstanding TEXT DEFAULT NULL,
    quorum_requirement DECIMAL(20, 9) DEFAULT NULL
);
COMMENT ON TABLE update_meeting_request IS 'Original model name - UpdateMeetingRequest.';
COMMENT ON COLUMN update_meeting_request.record_date IS 'Original param name - recordDate.';
COMMENT ON COLUMN update_meeting_request.mailing_date IS 'Original param name - mailingDate.';
COMMENT ON COLUMN update_meeting_request.meeting_date IS 'Original param name - meetingDate.';
COMMENT ON COLUMN update_meeting_request.meeting_type IS 'Original param name - meetingType.';
COMMENT ON COLUMN update_meeting_request.current_phase IS 'Original param name - currentPhase.';
COMMENT ON COLUMN update_meeting_request.overall_completion IS 'Original param name - overallCompletion.';
COMMENT ON COLUMN update_meeting_request.distribution_type IS 'Original param name - distributionType.';
COMMENT ON COLUMN update_meeting_request.transfer_agent IS 'Original param name - transferAgent.';
COMMENT ON COLUMN update_meeting_request.employee_stock_plans IS 'Original param name - employeeStockPlans.';
COMMENT ON COLUMN update_meeting_request.plan_administrator IS 'Original param name - planAdministrator.';
COMMENT ON COLUMN update_meeting_request.plan_administrator_contact IS 'Original param name - planAdministratorContact.';
COMMENT ON COLUMN update_meeting_request.plan_administrator_contact_email IS 'Original param name - planAdministratorContactEmail.';
COMMENT ON COLUMN update_meeting_request.solicitor_email IS 'Original param name - solicitorEmail.';
COMMENT ON COLUMN update_meeting_request.ivr_dial_in_number IS 'IVR dial-in voting number. Original param name - ivrDialInNumber.';
COMMENT ON COLUMN update_meeting_request.total_shares_outstanding IS 'Original param name - totalSharesOutstanding.';
COMMENT ON COLUMN update_meeting_request.quorum_requirement IS 'Original param name - quorumRequirement.';

--
-- Table 'update_phase_request' generated from model 'UpdatePhaseRequest'
--
CREATE TABLE IF NOT EXISTS public.update_phase_request (
    "name" VARCHAR(50) DEFAULT NULL,
    order_index INTEGER DEFAULT NULL,
    status TEXT DEFAULT NULL,
    key_dates TEXT DEFAULT NULL
);
COMMENT ON TABLE update_phase_request IS 'Original model name - UpdatePhaseRequest.';
COMMENT ON COLUMN update_phase_request.order_index IS 'Original param name - orderIndex.';
COMMENT ON COLUMN update_phase_request.key_dates IS 'Original param name - keyDates.';

--
-- Table 'update_phase_request_key_dates' generated from model 'UpdatePhaseRequestUnderscorekeyDates'
--
CREATE TABLE IF NOT EXISTS public.update_phase_request_key_dates (
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    due_date DATE DEFAULT NULL,
    completion_date DATE DEFAULT NULL
);
COMMENT ON TABLE update_phase_request_key_dates IS 'Original model name - UpdatePhaseRequest_keyDates.';
COMMENT ON COLUMN update_phase_request_key_dates.start_date IS 'Original param name - startDate.';
COMMENT ON COLUMN update_phase_request_key_dates.end_date IS 'Original param name - endDate.';
COMMENT ON COLUMN update_phase_request_key_dates.due_date IS 'Original param name - dueDate.';
COMMENT ON COLUMN update_phase_request_key_dates.completion_date IS 'Original param name - completionDate.';

--
-- Table 'update_position_request' generated from model 'UpdatePositionRequest'
--
CREATE TABLE IF NOT EXISTS public.update_position_request (
    "name" TEXT DEFAULT NULL,
    account_number TEXT DEFAULT NULL,
    control_number TEXT DEFAULT NULL,
    vote_status update_position_request_vote_status DEFAULT NULL,
    shares DECIMAL(20, 9) DEFAULT NULL,
    shares_voted DECIMAL(20, 9) DEFAULT NULL,
    "source" update_position_request_source DEFAULT NULL,
    date_voted TEXT DEFAULT NULL
);
COMMENT ON TABLE update_position_request IS 'Original model name - UpdatePositionRequest.';
COMMENT ON COLUMN update_position_request.account_number IS 'Original param name - accountNumber.';
COMMENT ON COLUMN update_position_request.control_number IS 'Original param name - controlNumber.';
COMMENT ON COLUMN update_position_request.vote_status IS 'Original param name - voteStatus.';
COMMENT ON COLUMN update_position_request.shares_voted IS 'Original param name - sharesVoted.';
COMMENT ON COLUMN update_position_request.date_voted IS 'Original param name - dateVoted.';

--
-- Table 'update_proposal_request' generated from model 'UpdateProposalRequest'
--
CREATE TABLE IF NOT EXISTS public.update_proposal_request (
    proposal_title VARCHAR(500) DEFAULT NULL,
    proposal_type TEXT DEFAULT NULL,
    proposal_subtype TEXT DEFAULT NULL,
    director_name TEXT DEFAULT NULL,
    director_term_years INTEGER DEFAULT NULL,
    director_class TEXT DEFAULT NULL,
    term_expiration_year INTEGER DEFAULT NULL,
    frequency_options JSON DEFAULT NULL,
    recommendation TEXT DEFAULT NULL
);
COMMENT ON TABLE update_proposal_request IS 'Original model name - UpdateProposalRequest.';
COMMENT ON COLUMN update_proposal_request.proposal_title IS 'Original param name - proposalTitle.';
COMMENT ON COLUMN update_proposal_request.proposal_type IS 'Original param name - proposalType.';
COMMENT ON COLUMN update_proposal_request.proposal_subtype IS 'Original param name - proposalSubtype.';
COMMENT ON COLUMN update_proposal_request.director_name IS 'Original param name - directorName.';
COMMENT ON COLUMN update_proposal_request.director_term_years IS 'Original param name - directorTermYears.';
COMMENT ON COLUMN update_proposal_request.director_class IS 'Original param name - directorClass.';
COMMENT ON COLUMN update_proposal_request.term_expiration_year IS 'Original param name - termExpirationYear.';
COMMENT ON COLUMN update_proposal_request.frequency_options IS 'Original param name - frequencyOptions.';

--
-- Table 'update_task_request' generated from model 'UpdateTaskRequest'
--
CREATE TABLE IF NOT EXISTS public.update_task_request (
    title VARCHAR(200) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    "type" TEXT DEFAULT NULL,
    status TEXT DEFAULT NULL,
    phase_number SMALLINT DEFAULT NULL,
    due_date DATE DEFAULT NULL,
    "owner" TEXT DEFAULT NULL,
    document_id TEXT DEFAULT NULL,
    links JSON DEFAULT NULL
);
COMMENT ON TABLE update_task_request IS 'Original model name - UpdateTaskRequest.';
COMMENT ON COLUMN update_task_request.phase_number IS 'Original param name - phaseNumber.';
COMMENT ON COLUMN update_task_request.due_date IS 'Original param name - dueDate.';
COMMENT ON COLUMN update_task_request.document_id IS 'Original param name - documentId.';

--
-- Table 'update_user_request' generated from model 'UpdateUserRequest'
--
CREATE TABLE IF NOT EXISTS public.update_user_request (
    first_name VARCHAR(50) DEFAULT NULL,
    last_name VARCHAR(50) DEFAULT NULL,
    email TEXT DEFAULT NULL,
    "type" TEXT DEFAULT NULL,
    account_id TEXT DEFAULT NULL
);
COMMENT ON TABLE update_user_request IS 'Original model name - UpdateUserRequest.';
COMMENT ON COLUMN update_user_request.first_name IS 'Original param name - firstName.';
COMMENT ON COLUMN update_user_request.last_name IS 'Original param name - lastName.';
COMMENT ON COLUMN update_user_request.account_id IS 'Original param name - accountId.';

--
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

