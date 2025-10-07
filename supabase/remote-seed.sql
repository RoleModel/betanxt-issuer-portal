


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."add_document_event_request_event_type" AS ENUM (
    'CREATED',
    'UPLOADED',
    'VIEWED',
    'DOWNLOADED',
    'NOT_UPLOADED',
    'SIGNED',
    'APPROVED',
    'REJECTED',
    'COMMENTED',
    'UPDATED',
    'DELETED'
);


ALTER TYPE "public"."add_document_event_request_event_type" OWNER TO "postgres";


CREATE TYPE "public"."cast_vote_request_vote" AS ENUM (
    'FOR',
    'AGAINST',
    'ABSTAIN',
    'WITHHOLD'
);


ALTER TYPE "public"."cast_vote_request_vote" OWNER TO "postgres";


CREATE TYPE "public"."create_digital_shareholder_meeting_request_registrant_type" AS ENUM (
    'Shareholder',
    'Guest',
    'Proxy',
    'Other'
);


ALTER TYPE "public"."create_digital_shareholder_meeting_request_registrant_type" OWNER TO "postgres";


CREATE TYPE "public"."create_position_request_source" AS ENUM (
    'WEB',
    'PRINT',
    'IVR'
);


ALTER TYPE "public"."create_position_request_source" OWNER TO "postgres";


CREATE TYPE "public"."create_position_request_vote_status" AS ENUM (
    'Voted',
    'Unvoted'
);


ALTER TYPE "public"."create_position_request_vote_status" OWNER TO "postgres";


CREATE TYPE "public"."digital_shareholder_meeting_registrant_type" AS ENUM (
    'Shareholder',
    'Guest',
    'Proxy',
    'Other'
);


ALTER TYPE "public"."digital_shareholder_meeting_registrant_type" OWNER TO "postgres";


CREATE TYPE "public"."document_display_category" AS ENUM (
    'general',
    'dsm',
    'proxy-materials',
    'meeting-materials',
    'post-meeting',
    'internal'
);


ALTER TYPE "public"."document_display_category" OWNER TO "postgres";


CREATE TYPE "public"."document_history_event_type" AS ENUM (
    'CREATED',
    'UPLOADED',
    'VIEWED',
    'DOWNLOADED',
    'SIGNED',
    'APPROVED',
    'REJECTED',
    'COMMENTED',
    'UPDATED',
    'DELETED'
);


ALTER TYPE "public"."document_history_event_type" OWNER TO "postgres";


CREATE TYPE "public"."notification_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE "public"."notification_priority" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'info',
    'warning',
    'error',
    'success'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."position_source" AS ENUM (
    'WEB',
    'PRINT',
    'IVR'
);


ALTER TYPE "public"."position_source" OWNER TO "postgres";


CREATE TYPE "public"."position_vote_status" AS ENUM (
    'Voted',
    'Unvoted'
);


ALTER TYPE "public"."position_vote_status" OWNER TO "postgres";


CREATE TYPE "public"."proposal_final_result" AS ENUM (
    'PASSED',
    'FAILED',
    'PENDING'
);


ALTER TYPE "public"."proposal_final_result" OWNER TO "postgres";


CREATE TYPE "public"."update_position_request_source" AS ENUM (
    'WEB',
    'PRINT',
    'IVR'
);


ALTER TYPE "public"."update_position_request_source" OWNER TO "postgres";


CREATE TYPE "public"."update_position_request_vote_status" AS ENUM (
    'Voted',
    'Unvoted'
);


ALTER TYPE "public"."update_position_request_vote_status" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."account" (
    "id" "text",
    "name" "text",
    "primary_contact" "text",
    "client_id" "text",
    "created_at" timestamp without time zone,
    "client" "text"
);


ALTER TABLE "public"."account" OWNER TO "postgres";


COMMENT ON TABLE "public"."account" IS 'Original model name - Account.';



COMMENT ON COLUMN "public"."account"."primary_contact" IS 'Original param name - primaryContact.';



COMMENT ON COLUMN "public"."account"."client_id" IS 'The client this account belongs to. Original param name - clientId.';



COMMENT ON COLUMN "public"."account"."created_at" IS 'Original param name - createdAt.';



CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "text",
    "ticker" "text",
    "company_name" "text",
    "short_name" "text",
    "industry" "text",
    "description" "text",
    "website" "text",
    "primary_contact" "text",
    "primary_contact_email" "text",
    "is_active" boolean DEFAULT true,
    "branding_id" integer,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON TABLE "public"."clients" IS 'Original model name - Clients.';



COMMENT ON COLUMN "public"."clients"."ticker" IS 'Unique ticker symbol for the client';



COMMENT ON COLUMN "public"."clients"."company_name" IS 'Full legal name of the company. Original param name - companyName.';



COMMENT ON COLUMN "public"."clients"."short_name" IS 'Short display name for the company. Original param name - shortName.';



COMMENT ON COLUMN "public"."clients"."industry" IS 'Industry sector';



COMMENT ON COLUMN "public"."clients"."description" IS 'Company description';



COMMENT ON COLUMN "public"."clients"."website" IS 'Company website URL';



COMMENT ON COLUMN "public"."clients"."primary_contact" IS 'Primary contact person. Original param name - primaryContact.';



COMMENT ON COLUMN "public"."clients"."primary_contact_email" IS 'Primary contact email. Original param name - primaryContactEmail.';



COMMENT ON COLUMN "public"."clients"."is_active" IS 'Whether the client is active. Original param name - isActive.';



COMMENT ON COLUMN "public"."clients"."branding_id" IS 'Unique branding identifier for document hosting site URLs. Original param name - brandingId.';



COMMENT ON COLUMN "public"."clients"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."clients"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."comment" (
    "id" bigint,
    "document_id" "text",
    "user_id" "text",
    "comment" "text",
    "first_name" "text",
    "last_name" "text",
    "created_at" timestamp without time zone,
    "document" "text",
    "user" "text"
);


ALTER TABLE "public"."comment" OWNER TO "postgres";


COMMENT ON TABLE "public"."comment" IS 'Original model name - Comment.';



COMMENT ON COLUMN "public"."comment"."document_id" IS 'Original param name - documentId.';



COMMENT ON COLUMN "public"."comment"."user_id" IS 'Original param name - userId.';



COMMENT ON COLUMN "public"."comment"."first_name" IS 'Original param name - firstName.';



COMMENT ON COLUMN "public"."comment"."last_name" IS 'Original param name - lastName.';



COMMENT ON COLUMN "public"."comment"."created_at" IS 'Original param name - createdAt.';



CREATE TABLE IF NOT EXISTS "public"."digital_shareholder_meeting" (
    "id" "text",
    "meeting_id" "text",
    "registrant_type" "public"."digital_shareholder_meeting_registrant_type",
    "first_name" "text",
    "last_name" "text",
    "email_address" "text",
    "registration_questions" "text",
    "minutes_attended_meeting" integer,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."digital_shareholder_meeting" OWNER TO "postgres";


COMMENT ON TABLE "public"."digital_shareholder_meeting" IS 'Original model name - DigitalShareholderMeeting.';



COMMENT ON COLUMN "public"."digital_shareholder_meeting"."meeting_id" IS 'Original param name - meetingId.';



COMMENT ON COLUMN "public"."digital_shareholder_meeting"."registrant_type" IS 'Original param name - registrantType.';



COMMENT ON COLUMN "public"."digital_shareholder_meeting"."first_name" IS 'Original param name - firstName.';



COMMENT ON COLUMN "public"."digital_shareholder_meeting"."last_name" IS 'Original param name - lastName.';



COMMENT ON COLUMN "public"."digital_shareholder_meeting"."email_address" IS 'Original param name - emailAddress.';



COMMENT ON COLUMN "public"."digital_shareholder_meeting"."registration_questions" IS 'Pre-meeting questions submitted during registration. Original param name - registrationQuestions.';



COMMENT ON COLUMN "public"."digital_shareholder_meeting"."minutes_attended_meeting" IS 'Minutes attended in the meeting. Original param name - minutesAttendedMeeting.';



COMMENT ON COLUMN "public"."digital_shareholder_meeting"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."digital_shareholder_meeting"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."document" (
    "id" "text",
    "meeting_id" "text",
    "task_id" "text",
    "title" "text",
    "description" "text",
    "type" "text",
    "file_path" "text",
    "file_type" "text",
    "file_size" integer,
    "status" "text",
    "upload_date" timestamp without time zone,
    "uploaded_date" timestamp without time zone,
    "signed_date" timestamp without time zone,
    "authorized_date" timestamp without time zone,
    "completed_date" timestamp without time zone,
    "in_progress_date" timestamp without time zone,
    "deadline" timestamp without time zone,
    "history" json,
    "approved_by" "text",
    "approved_at" timestamp without time zone,
    "created_by" "text",
    "created_by_first_name" "text",
    "created_by_last_name" "text",
    "updated_by" "text",
    "updated_by_first_name" "text",
    "updated_by_last_name" "text",
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "display_category" "public"."document_display_category",
    "meeting" "text",
    "comments" json,
    "signatures" json
);


ALTER TABLE "public"."document" OWNER TO "postgres";


COMMENT ON TABLE "public"."document" IS 'Original model name - Document.';



COMMENT ON COLUMN "public"."document"."meeting_id" IS 'Original param name - meetingId.';



COMMENT ON COLUMN "public"."document"."task_id" IS 'Original param name - taskId.';



COMMENT ON COLUMN "public"."document"."file_path" IS 'Original param name - filePath.';



COMMENT ON COLUMN "public"."document"."file_type" IS 'Original param name - fileType.';



COMMENT ON COLUMN "public"."document"."file_size" IS 'Original param name - fileSize.';



COMMENT ON COLUMN "public"."document"."upload_date" IS 'Original param name - uploadDate.';



COMMENT ON COLUMN "public"."document"."uploaded_date" IS 'Original param name - uploadedDate.';



COMMENT ON COLUMN "public"."document"."signed_date" IS 'Original param name - signedDate.';



COMMENT ON COLUMN "public"."document"."authorized_date" IS 'Original param name - authorizedDate.';



COMMENT ON COLUMN "public"."document"."completed_date" IS 'Original param name - completedDate.';



COMMENT ON COLUMN "public"."document"."in_progress_date" IS 'Original param name - inProgressDate.';



COMMENT ON COLUMN "public"."document"."approved_by" IS 'User who approved the document. Original param name - approvedBy.';



COMMENT ON COLUMN "public"."document"."approved_at" IS 'When the document was approved. Original param name - approvedAt.';



COMMENT ON COLUMN "public"."document"."created_by" IS 'User ID who created the document. Original param name - createdBy.';



COMMENT ON COLUMN "public"."document"."created_by_first_name" IS 'First name of user who created the document. Original param name - createdByFirstName.';



COMMENT ON COLUMN "public"."document"."created_by_last_name" IS 'Last name of user who created the document. Original param name - createdByLastName.';



COMMENT ON COLUMN "public"."document"."updated_by" IS 'User ID who last updated the document. Original param name - updatedBy.';



COMMENT ON COLUMN "public"."document"."updated_by_first_name" IS 'First name of user who last updated the document. Original param name - updatedByFirstName.';



COMMENT ON COLUMN "public"."document"."updated_by_last_name" IS 'Last name of user who last updated the document. Original param name - updatedByLastName.';



COMMENT ON COLUMN "public"."document"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."document"."updated_at" IS 'Original param name - updatedAt.';



COMMENT ON COLUMN "public"."document"."display_category" IS 'Category for filtering document display (general, dsm, proxy-materials, meeting-materials, post-meeting, internal). Original param name - displayCategory.';



CREATE TABLE IF NOT EXISTS "public"."document_history" (
    "id" "text",
    "document_id" "text",
    "event_type" "public"."document_history_event_type",
    "user_id" "text",
    "user_name" "text",
    "metadata" json,
    "created_at" timestamp without time zone,
    "document" "text",
    "user" "text"
);


ALTER TABLE "public"."document_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."document_history" IS 'Original model name - DocumentHistory.';



COMMENT ON COLUMN "public"."document_history"."document_id" IS 'Original param name - documentId.';



COMMENT ON COLUMN "public"."document_history"."event_type" IS 'Original param name - eventType.';



COMMENT ON COLUMN "public"."document_history"."user_id" IS 'Original param name - userId.';



COMMENT ON COLUMN "public"."document_history"."user_name" IS 'Original param name - userName.';



COMMENT ON COLUMN "public"."document_history"."created_at" IS 'Original param name - createdAt.';



CREATE TABLE IF NOT EXISTS "public"."dsm_config" (
    "id" "text",
    "meeting_id" "text",
    "live_qa" boolean DEFAULT false,
    "audio_only" boolean DEFAULT false,
    "meeting_recording" boolean DEFAULT false,
    "static_slide_doc_id" "text",
    "display_docs_doc_id" "text",
    "is_confirmed" boolean DEFAULT false,
    "logistics_call_date" timestamp without time zone,
    "logistics_call_notes" "text",
    "logistics_call_scheduled" boolean DEFAULT false,
    "dry_run_date" timestamp without time zone,
    "dry_run_notes" "text",
    "dry_run_scheduled" boolean DEFAULT false,
    "dsm_enabled" boolean DEFAULT true,
    "ioe_enabled" boolean DEFAULT true,
    "dsm_producer_name" "text",
    "dsm_producer_email" "text",
    "inspector_name" "text",
    "inspector_email" "text",
    "speaker_list_doc_id" "text",
    "guest_link_registration_doc_id" "text",
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."dsm_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."dsm_config" IS 'Original model name - DSMConfig.';



COMMENT ON COLUMN "public"."dsm_config"."meeting_id" IS 'Original param name - meetingId.';



COMMENT ON COLUMN "public"."dsm_config"."live_qa" IS 'Original param name - liveQa.';



COMMENT ON COLUMN "public"."dsm_config"."audio_only" IS 'Original param name - audioOnly.';



COMMENT ON COLUMN "public"."dsm_config"."meeting_recording" IS 'Original param name - meetingRecording.';



COMMENT ON COLUMN "public"."dsm_config"."static_slide_doc_id" IS 'Original param name - staticSlideDocId.';



COMMENT ON COLUMN "public"."dsm_config"."display_docs_doc_id" IS 'Original param name - displayDocsDocId.';



COMMENT ON COLUMN "public"."dsm_config"."is_confirmed" IS 'Original param name - isConfirmed.';



COMMENT ON COLUMN "public"."dsm_config"."logistics_call_date" IS 'Original param name - logisticsCallDate.';



COMMENT ON COLUMN "public"."dsm_config"."logistics_call_notes" IS 'Original param name - logisticsCallNotes.';



COMMENT ON COLUMN "public"."dsm_config"."logistics_call_scheduled" IS 'Original param name - logisticsCallScheduled.';



COMMENT ON COLUMN "public"."dsm_config"."dry_run_date" IS 'Original param name - dryRunDate.';



COMMENT ON COLUMN "public"."dsm_config"."dry_run_notes" IS 'Original param name - dryRunNotes.';



COMMENT ON COLUMN "public"."dsm_config"."dry_run_scheduled" IS 'Original param name - dryRunScheduled.';



COMMENT ON COLUMN "public"."dsm_config"."dsm_enabled" IS 'Original param name - dsmEnabled.';



COMMENT ON COLUMN "public"."dsm_config"."ioe_enabled" IS 'Original param name - ioeEnabled.';



COMMENT ON COLUMN "public"."dsm_config"."dsm_producer_name" IS 'Original param name - dsmProducerName.';



COMMENT ON COLUMN "public"."dsm_config"."dsm_producer_email" IS 'Original param name - dsmProducerEmail.';



COMMENT ON COLUMN "public"."dsm_config"."inspector_name" IS 'Original param name - inspectorName.';



COMMENT ON COLUMN "public"."dsm_config"."inspector_email" IS 'Original param name - inspectorEmail.';



COMMENT ON COLUMN "public"."dsm_config"."speaker_list_doc_id" IS 'Original param name - speakerListDocId.';



COMMENT ON COLUMN "public"."dsm_config"."guest_link_registration_doc_id" IS 'Original param name - guestLinkRegistrationDocId.';



COMMENT ON COLUMN "public"."dsm_config"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."dsm_config"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."mailing" (
    "id" "text",
    "meeting_id" "text",
    "ticker" "text",
    "total_accounts" integer,
    "total_positions" integer,
    "total_retransmissions" integer,
    "total_rollups" integer,
    "fullset_mail_positions" integer,
    "naa_mail_positions" integer,
    "courtesy_other_mail_positions" integer,
    "electronic_suppressed_positions" integer,
    "household_suppressed_positions" integer,
    "managed_suppressed_positions" integer,
    "consolidated_suppressed_positions" integer,
    "canceled_suppressed_positions" integer,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."mailing" OWNER TO "postgres";


COMMENT ON TABLE "public"."mailing" IS 'Original model name - Mailing.';



COMMENT ON COLUMN "public"."mailing"."meeting_id" IS 'Original param name - meetingId.';



COMMENT ON COLUMN "public"."mailing"."total_accounts" IS 'Total number of accounts. Original param name - totalAccounts.';



COMMENT ON COLUMN "public"."mailing"."total_positions" IS 'Total number of positions. Original param name - totalPositions.';



COMMENT ON COLUMN "public"."mailing"."total_retransmissions" IS 'Number of retransmissions. Original param name - totalRetransmissions.';



COMMENT ON COLUMN "public"."mailing"."total_rollups" IS 'Number of rollups. Original param name - totalRollups.';



COMMENT ON COLUMN "public"."mailing"."fullset_mail_positions" IS 'Number of fullset mail positions. Original param name - fullsetMailPositions.';



COMMENT ON COLUMN "public"."mailing"."naa_mail_positions" IS 'Number of NAA mail positions. Original param name - naaMailPositions.';



COMMENT ON COLUMN "public"."mailing"."courtesy_other_mail_positions" IS 'Number of courtesy/other mail positions. Original param name - courtesyOtherMailPositions.';



COMMENT ON COLUMN "public"."mailing"."electronic_suppressed_positions" IS 'Number of electronic suppressed positions. Original param name - electronicSuppressedPositions.';



COMMENT ON COLUMN "public"."mailing"."household_suppressed_positions" IS 'Number of household suppressed positions. Original param name - householdSuppressedPositions.';



COMMENT ON COLUMN "public"."mailing"."managed_suppressed_positions" IS 'Number of managed suppressed positions. Original param name - managedSuppressedPositions.';



COMMENT ON COLUMN "public"."mailing"."consolidated_suppressed_positions" IS 'Number of consolidated suppressed positions. Original param name - consolidatedSuppressedPositions.';



COMMENT ON COLUMN "public"."mailing"."canceled_suppressed_positions" IS 'Number of canceled suppressed positions. Original param name - canceledSuppressedPositions.';



COMMENT ON COLUMN "public"."mailing"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."mailing"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."meeting" (
    "id" "text",
    "title" "text",
    "cusip" "text",
    "ticker" "text",
    "pre_filing_date" "date",
    "filing_date" "date",
    "broker_search_date" "date",
    "record_date" "date",
    "mailing_date" "date",
    "meeting_date" "date",
    "meeting_type" "text",
    "meeting_year" integer,
    "status" "text",
    "current_phase" "text",
    "overall_completion" smallint,
    "distribution_type" "text",
    "transfer_agent" "text",
    "employee_stock_plans" "text",
    "plan_administrator" "text",
    "plan_administrator_contact" "text",
    "plan_administrator_contact_email" "text",
    "solicitor" "text",
    "solicitor_email" "text",
    "inspector" "text",
    "ivr_dial_in_number" "text",
    "total_shares_outstanding" "text",
    "quorum_requirement" numeric(20,9) DEFAULT NULL::numeric,
    "client_id" "text",
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "client" "text"
);


ALTER TABLE "public"."meeting" OWNER TO "postgres";


COMMENT ON TABLE "public"."meeting" IS 'Original model name - Meeting.';



COMMENT ON COLUMN "public"."meeting"."pre_filing_date" IS 'Original param name - preFilingDate.';



COMMENT ON COLUMN "public"."meeting"."filing_date" IS 'Original param name - filingDate.';



COMMENT ON COLUMN "public"."meeting"."broker_search_date" IS 'Original param name - brokerSearchDate.';



COMMENT ON COLUMN "public"."meeting"."record_date" IS 'Original param name - recordDate.';



COMMENT ON COLUMN "public"."meeting"."mailing_date" IS 'Original param name - mailingDate.';



COMMENT ON COLUMN "public"."meeting"."meeting_date" IS 'Original param name - meetingDate.';



COMMENT ON COLUMN "public"."meeting"."meeting_type" IS 'Original param name - meetingType.';



COMMENT ON COLUMN "public"."meeting"."meeting_year" IS 'Original param name - meetingYear.';



COMMENT ON COLUMN "public"."meeting"."current_phase" IS 'Original param name - currentPhase.';



COMMENT ON COLUMN "public"."meeting"."overall_completion" IS 'Original param name - overallCompletion.';



COMMENT ON COLUMN "public"."meeting"."distribution_type" IS 'Original param name - distributionType.';



COMMENT ON COLUMN "public"."meeting"."transfer_agent" IS 'Original param name - transferAgent.';



COMMENT ON COLUMN "public"."meeting"."employee_stock_plans" IS 'Original param name - employeeStockPlans.';



COMMENT ON COLUMN "public"."meeting"."plan_administrator" IS 'Original param name - planAdministrator.';



COMMENT ON COLUMN "public"."meeting"."plan_administrator_contact" IS 'Original param name - planAdministratorContact.';



COMMENT ON COLUMN "public"."meeting"."plan_administrator_contact_email" IS 'Original param name - planAdministratorContactEmail.';



COMMENT ON COLUMN "public"."meeting"."solicitor_email" IS 'Original param name - solicitorEmail.';



COMMENT ON COLUMN "public"."meeting"."total_shares_outstanding" IS 'Original param name - totalSharesOutstanding.';



COMMENT ON COLUMN "public"."meeting"."quorum_requirement" IS 'Original param name - quorumRequirement.';



COMMENT ON COLUMN "public"."meeting"."client_id" IS 'The client this meeting belongs to. Original param name - clientId.';



COMMENT ON COLUMN "public"."meeting"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."meeting"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."notification" (
    "id" "text",
    "title" "text",
    "message" "text",
    "type" "public"."notification_type",
    "priority" "public"."notification_priority",
    "read" boolean DEFAULT false,
    "user_id" "text",
    "meeting_id" "text",
    "task_id" "text",
    "action_url" "text",
    "created_at" timestamp without time zone,
    "read_at" timestamp without time zone,
    "expires_at" timestamp without time zone
);


ALTER TABLE "public"."notification" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification" IS 'Original model name - Notification.';



COMMENT ON COLUMN "public"."notification"."user_id" IS 'Original param name - userId.';



COMMENT ON COLUMN "public"."notification"."meeting_id" IS 'Original param name - meetingId.';



COMMENT ON COLUMN "public"."notification"."task_id" IS 'Original param name - taskId.';



COMMENT ON COLUMN "public"."notification"."action_url" IS 'Original param name - actionUrl.';



COMMENT ON COLUMN "public"."notification"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."notification"."read_at" IS 'Original param name - readAt.';



COMMENT ON COLUMN "public"."notification"."expires_at" IS 'Original param name - expiresAt.';



CREATE TABLE IF NOT EXISTS "public"."phase" (
    "id" "text",
    "meeting_id" "text",
    "name" "text",
    "order_index" integer,
    "status" "text",
    "key_dates" "text",
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."phase" OWNER TO "postgres";


COMMENT ON TABLE "public"."phase" IS 'Original model name - Phase.';



COMMENT ON COLUMN "public"."phase"."meeting_id" IS 'Original param name - meetingId.';



COMMENT ON COLUMN "public"."phase"."order_index" IS 'Original param name - orderIndex.';



COMMENT ON COLUMN "public"."phase"."key_dates" IS 'Original param name - keyDates.';



COMMENT ON COLUMN "public"."phase"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."phase"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."position" (
    "id" "text",
    "meeting_id" "text",
    "cusip" "text",
    "account_type" "text",
    "set_key" "text",
    "name" "text",
    "account_number" "text",
    "control_number" "text",
    "vote_status" "public"."position_vote_status",
    "shares" numeric(20,9) DEFAULT NULL::numeric,
    "shares_voted" numeric(20,9) DEFAULT NULL::numeric,
    "source" "public"."position_source",
    "date_voted" "text",
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."position" OWNER TO "postgres";


COMMENT ON TABLE "public"."position" IS 'Original model name - Position.';



COMMENT ON COLUMN "public"."position"."meeting_id" IS 'Original param name - meetingId.';



COMMENT ON COLUMN "public"."position"."account_type" IS 'Original param name - accountType.';



COMMENT ON COLUMN "public"."position"."set_key" IS 'Original param name - setKey.';



COMMENT ON COLUMN "public"."position"."account_number" IS 'Original param name - accountNumber.';



COMMENT ON COLUMN "public"."position"."control_number" IS 'Original param name - controlNumber.';



COMMENT ON COLUMN "public"."position"."vote_status" IS 'Original param name - voteStatus.';



COMMENT ON COLUMN "public"."position"."shares_voted" IS 'Original param name - sharesVoted.';



COMMENT ON COLUMN "public"."position"."date_voted" IS 'Original param name - dateVoted.';



COMMENT ON COLUMN "public"."position"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."position"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."position_vote" (
    "id" "text",
    "position_id" "text",
    "proposal_id" "text",
    "vote" "text",
    "shares_voting" "text",
    "created_at" timestamp without time zone
);


ALTER TABLE "public"."position_vote" OWNER TO "postgres";


COMMENT ON TABLE "public"."position_vote" IS 'Original model name - PositionVote.';



COMMENT ON COLUMN "public"."position_vote"."position_id" IS 'Original param name - positionId.';



COMMENT ON COLUMN "public"."position_vote"."proposal_id" IS 'Original param name - proposalId.';



COMMENT ON COLUMN "public"."position_vote"."shares_voting" IS 'Original param name - sharesVoting.';



COMMENT ON COLUMN "public"."position_vote"."created_at" IS 'Original param name - createdAt.';



CREATE TABLE IF NOT EXISTS "public"."proposal" (
    "id" "text",
    "meeting_id" "text",
    "proposal_number" numeric(20,9) DEFAULT NULL::numeric,
    "proposal_title" "text",
    "proposal_type" "text",
    "proposal_subtype" "text",
    "director_name" "text",
    "director_term_years" integer,
    "director_class" "text",
    "term_expiration_year" integer,
    "frequency_options" json,
    "recommendation" "text",
    "final_result" "public"."proposal_final_result",
    "total_votes_for" integer,
    "total_votes_against" integer,
    "total_votes_abstain" integer,
    "total_shares_eligible" integer,
    "for_percentage" numeric(20,9) DEFAULT NULL::numeric,
    "against_percentage" numeric(20,9) DEFAULT NULL::numeric,
    "abstain_percentage" numeric(20,9) DEFAULT NULL::numeric,
    "participation_rate" numeric(20,9) DEFAULT NULL::numeric,
    "voting_completed" boolean DEFAULT false,
    "voting_completed_at" timestamp without time zone,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."proposal" OWNER TO "postgres";


COMMENT ON TABLE "public"."proposal" IS 'Original model name - Proposal.';



COMMENT ON COLUMN "public"."proposal"."meeting_id" IS 'Original param name - meetingId.';



COMMENT ON COLUMN "public"."proposal"."proposal_number" IS 'Original param name - proposalNumber.';



COMMENT ON COLUMN "public"."proposal"."proposal_title" IS 'Original param name - proposalTitle.';



COMMENT ON COLUMN "public"."proposal"."proposal_type" IS 'Original param name - proposalType.';



COMMENT ON COLUMN "public"."proposal"."proposal_subtype" IS 'Original param name - proposalSubtype.';



COMMENT ON COLUMN "public"."proposal"."director_name" IS 'Original param name - directorName.';



COMMENT ON COLUMN "public"."proposal"."director_term_years" IS 'Original param name - directorTermYears.';



COMMENT ON COLUMN "public"."proposal"."director_class" IS 'Original param name - directorClass.';



COMMENT ON COLUMN "public"."proposal"."term_expiration_year" IS 'Original param name - termExpirationYear.';



COMMENT ON COLUMN "public"."proposal"."frequency_options" IS 'Original param name - frequencyOptions.';



COMMENT ON COLUMN "public"."proposal"."final_result" IS 'Final result of the proposal voting. Original param name - finalResult.';



COMMENT ON COLUMN "public"."proposal"."total_votes_for" IS 'Total number of votes in favor. Original param name - totalVotesFor.';



COMMENT ON COLUMN "public"."proposal"."total_votes_against" IS 'Total number of votes against. Original param name - totalVotesAgainst.';



COMMENT ON COLUMN "public"."proposal"."total_votes_abstain" IS 'Total number of abstained votes. Original param name - totalVotesAbstain.';



COMMENT ON COLUMN "public"."proposal"."total_shares_eligible" IS 'Total number of shares eligible to vote. Original param name - totalSharesEligible.';



COMMENT ON COLUMN "public"."proposal"."for_percentage" IS 'Percentage of votes in favor. Original param name - forPercentage.';



COMMENT ON COLUMN "public"."proposal"."against_percentage" IS 'Percentage of votes against. Original param name - againstPercentage.';



COMMENT ON COLUMN "public"."proposal"."abstain_percentage" IS 'Percentage of abstained votes. Original param name - abstainPercentage.';



COMMENT ON COLUMN "public"."proposal"."participation_rate" IS 'Overall participation rate. Original param name - participationRate.';



COMMENT ON COLUMN "public"."proposal"."voting_completed" IS 'Whether voting on this proposal has been completed. Original param name - votingCompleted.';



COMMENT ON COLUMN "public"."proposal"."voting_completed_at" IS 'When voting was completed. Original param name - votingCompletedAt.';



COMMENT ON COLUMN "public"."proposal"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."proposal"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."signature" (
    "id" "text",
    "document_id" "text",
    "page_number" integer,
    "x_position" numeric(20,9) DEFAULT NULL::numeric,
    "y_position" numeric(20,9) DEFAULT NULL::numeric,
    "width" numeric(20,9) DEFAULT NULL::numeric,
    "height" numeric(20,9) DEFAULT NULL::numeric,
    "signature_type" "text",
    "required" boolean,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "document" "text"
);


ALTER TABLE "public"."signature" OWNER TO "postgres";


COMMENT ON TABLE "public"."signature" IS 'Original model name - Signature.';



COMMENT ON COLUMN "public"."signature"."document_id" IS 'Original param name - documentId.';



COMMENT ON COLUMN "public"."signature"."page_number" IS 'Original param name - pageNumber.';



COMMENT ON COLUMN "public"."signature"."x_position" IS 'Original param name - xPosition.';



COMMENT ON COLUMN "public"."signature"."y_position" IS 'Original param name - yPosition.';



COMMENT ON COLUMN "public"."signature"."signature_type" IS 'Original param name - signatureType.';



COMMENT ON COLUMN "public"."signature"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."signature"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."tabulation_report" (
    "id" "text" NOT NULL,
    "meeting_id" "text" NOT NULL,
    "set_keys" json,
    "broker_voting" json,
    "share_range_performance" json,
    "non_dtc_vote_status" "text",
    "dtc_vote_status" "text",
    "vote_distribution" "text",
    "positions_voted" "text",
    "last_calculated_at" timestamp without time zone,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."tabulation_report" OWNER TO "postgres";


COMMENT ON TABLE "public"."tabulation_report" IS 'Original model name - TabulationReport.';



COMMENT ON COLUMN "public"."tabulation_report"."id" IS 'Primary key';



COMMENT ON COLUMN "public"."tabulation_report"."meeting_id" IS 'Foreign key to meeting table. Original param name - meetingId.';



COMMENT ON COLUMN "public"."tabulation_report"."set_keys" IS 'Unique set keys from position records. Original param name - setKeys.';



COMMENT ON COLUMN "public"."tabulation_report"."broker_voting" IS 'Top 6 brokers by total shares. Original param name - brokerVoting.';



COMMENT ON COLUMN "public"."tabulation_report"."share_range_performance" IS 'Performance metrics across 18 share ranges. Original param name - shareRangePerformance.';



COMMENT ON COLUMN "public"."tabulation_report"."non_dtc_vote_status" IS 'Original param name - nonDtcVoteStatus.';



COMMENT ON COLUMN "public"."tabulation_report"."dtc_vote_status" IS 'Original param name - dtcVoteStatus.';



COMMENT ON COLUMN "public"."tabulation_report"."vote_distribution" IS 'Original param name - voteDistribution.';



COMMENT ON COLUMN "public"."tabulation_report"."positions_voted" IS 'Original param name - positionsVoted.';



COMMENT ON COLUMN "public"."tabulation_report"."last_calculated_at" IS 'Timestamp of last statistics calculation. Original param name - lastCalculatedAt.';



COMMENT ON COLUMN "public"."tabulation_report"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."tabulation_report"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."task" (
    "id" "text",
    "task_id" "text",
    "phase_id" "text",
    "meeting_id" "text",
    "phase_number" integer,
    "title" "text",
    "description" "text",
    "type" "text",
    "status" "text",
    "due_date" "date",
    "owner" "text",
    "document_id" "text",
    "links" json,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."task" OWNER TO "postgres";


COMMENT ON TABLE "public"."task" IS 'Original model name - Task.';



COMMENT ON COLUMN "public"."task"."task_id" IS 'Original param name - taskId.';



COMMENT ON COLUMN "public"."task"."phase_id" IS 'Original param name - phaseId.';



COMMENT ON COLUMN "public"."task"."meeting_id" IS 'Original param name - meetingId.';



COMMENT ON COLUMN "public"."task"."phase_number" IS 'Original param name - phaseNumber.';



COMMENT ON COLUMN "public"."task"."due_date" IS 'Original param name - dueDate.';



COMMENT ON COLUMN "public"."task"."document_id" IS 'Original param name - documentId.';



COMMENT ON COLUMN "public"."task"."created_at" IS 'Original param name - createdAt.';



COMMENT ON COLUMN "public"."task"."updated_at" IS 'Original param name - updatedAt.';



CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" "text",
    "username" "text",
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "password" "text",
    "type" "text",
    "account_id" "text",
    "account" "text",
    "avatar_url" "text"
);


ALTER TABLE "public"."user" OWNER TO "postgres";


COMMENT ON TABLE "public"."user" IS 'Original model name - User.';



COMMENT ON COLUMN "public"."user"."first_name" IS 'Original param name - firstName.';



COMMENT ON COLUMN "public"."user"."last_name" IS 'Original param name - lastName.';



COMMENT ON COLUMN "public"."user"."password" IS 'Legacy password field for seed data - not used with NextAuth';



COMMENT ON COLUMN "public"."user"."account_id" IS 'Original param name - accountId.';



COMMENT ON COLUMN "public"."user"."avatar_url" IS 'URL of the user';





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON TABLE "public"."account" TO "anon";
GRANT ALL ON TABLE "public"."account" TO "authenticated";
GRANT ALL ON TABLE "public"."account" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."comment" TO "anon";
GRANT ALL ON TABLE "public"."comment" TO "authenticated";
GRANT ALL ON TABLE "public"."comment" TO "service_role";



GRANT ALL ON TABLE "public"."digital_shareholder_meeting" TO "anon";
GRANT ALL ON TABLE "public"."digital_shareholder_meeting" TO "authenticated";
GRANT ALL ON TABLE "public"."digital_shareholder_meeting" TO "service_role";



GRANT ALL ON TABLE "public"."document" TO "anon";
GRANT ALL ON TABLE "public"."document" TO "authenticated";
GRANT ALL ON TABLE "public"."document" TO "service_role";



GRANT ALL ON TABLE "public"."document_history" TO "anon";
GRANT ALL ON TABLE "public"."document_history" TO "authenticated";
GRANT ALL ON TABLE "public"."document_history" TO "service_role";



GRANT ALL ON TABLE "public"."dsm_config" TO "anon";
GRANT ALL ON TABLE "public"."dsm_config" TO "authenticated";
GRANT ALL ON TABLE "public"."dsm_config" TO "service_role";



GRANT ALL ON TABLE "public"."mailing" TO "anon";
GRANT ALL ON TABLE "public"."mailing" TO "authenticated";
GRANT ALL ON TABLE "public"."mailing" TO "service_role";



GRANT ALL ON TABLE "public"."meeting" TO "anon";
GRANT ALL ON TABLE "public"."meeting" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting" TO "service_role";



GRANT ALL ON TABLE "public"."notification" TO "anon";
GRANT ALL ON TABLE "public"."notification" TO "authenticated";
GRANT ALL ON TABLE "public"."notification" TO "service_role";



GRANT ALL ON TABLE "public"."phase" TO "anon";
GRANT ALL ON TABLE "public"."phase" TO "authenticated";
GRANT ALL ON TABLE "public"."phase" TO "service_role";



GRANT ALL ON TABLE "public"."position" TO "anon";
GRANT ALL ON TABLE "public"."position" TO "authenticated";
GRANT ALL ON TABLE "public"."position" TO "service_role";



GRANT ALL ON TABLE "public"."position_vote" TO "anon";
GRANT ALL ON TABLE "public"."position_vote" TO "authenticated";
GRANT ALL ON TABLE "public"."position_vote" TO "service_role";



GRANT ALL ON TABLE "public"."proposal" TO "anon";
GRANT ALL ON TABLE "public"."proposal" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal" TO "service_role";



GRANT ALL ON TABLE "public"."signature" TO "anon";
GRANT ALL ON TABLE "public"."signature" TO "authenticated";
GRANT ALL ON TABLE "public"."signature" TO "service_role";



GRANT ALL ON TABLE "public"."tabulation_report" TO "anon";
GRANT ALL ON TABLE "public"."tabulation_report" TO "authenticated";
GRANT ALL ON TABLE "public"."tabulation_report" TO "service_role";



GRANT ALL ON TABLE "public"."task" TO "anon";
GRANT ALL ON TABLE "public"."task" TO "authenticated";
GRANT ALL ON TABLE "public"."task" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
