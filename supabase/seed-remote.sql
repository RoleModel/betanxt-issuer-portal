-- Minimal Seed Data for Remote Supabase (Vercel Preview)
-- This is a lightweight version for development/preview environments
-- Full seed data should be loaded separately if needed

-- Clear existing data
DELETE FROM signature;
DELETE FROM "comment";
DELETE FROM notification;
DELETE FROM position_vote;
DELETE FROM "position";
DELETE FROM proposal;
DELETE FROM "document";
DELETE FROM task;
DELETE FROM phase;
DELETE FROM mailing;
DELETE FROM meeting;
DELETE FROM "user";
DELETE FROM account;
DELETE FROM clients;

-- Insert one client for testing
INSERT INTO clients(id, ticker, company_name, short_name, industry, description, website, primary_contact, primary_contact_email, is_active, branding_id, created_at)
VALUES (
    'b3de63cf-5047-57b0-8894-9764e7fd780b',
    'WEN',
    'The Wendy''s Company',
    'Wendy''s',
    'Restaurants',
    'Quick-service restaurant chain',
    'https://www.wendys.com',
    'Mike Chen',
    'mike.chen@wendys.com',
    true,
    966152,
    NOW()
);

-- Insert accounts
INSERT INTO account(id, name, primary_contact, created_at)
VALUES ('bf4e6a0b-599c-54c8-b4f1-1a393da93bce', 'BetaNXT Relationship Management', 'Sarah Johnson', NOW());

INSERT INTO account(id, client_id, name, primary_contact, created_at)
VALUES ('a75ad3bb-7396-5aa2-aed8-cad6a0f11262', 'b3de63cf-5047-57b0-8894-9764e7fd780b', 'The Wendy''s Company', 'Mike Chen', NOW());

-- Insert test users
INSERT INTO "user"(id, username, first_name, last_name, email, password, type, account_id)
VALUES (
    'ce4b0ac1-095c-5e6f-a301-e489723079a3',
    'dev.user',
    'Dev',
    'User',
    'dev@betanxt.com',
    'password',
    'ADMIN',
    NULL
);

INSERT INTO "user"(id, username, first_name, last_name, email, password, type, account_id)
VALUES (
    'e3e85881-afe0-52f7-9c33-a1d0f58836e7',
    'mike.chen',
    'Mike',
    'Chen',
    'mike.chen@wendys.com',
    'password',
    'ADMIN',
    'a75ad3bb-7396-5aa2-aed8-cad6a0f11262'
);

-- Insert a meeting for testing
INSERT INTO meeting(
    id, title, cusip, ticker,
    pre_filing_date, filing_date, broker_search_date, record_date, mailing_date, meeting_date,
    meeting_type, meeting_year, status, current_phase, overall_completion,
    distribution_type, transfer_agent, employee_stock_plans,
    plan_administrator, plan_administrator_contact, plan_administrator_contact_email,
    solicitor, solicitor_email, inspector, ivr_dial_in_number,
    total_shares_outstanding, quorum_requirement, client_id,
    created_at, updated_at
) VALUES (
    'wen-annual-meeting-2026',
    'Annual Meeting',
    '95058W100',
    'WEN',
    '2026-02-16', '2026-04-22', '2026-03-13', '2026-04-02', '2026-05-07', '2026-06-01',
    'Annual Meeting', 2026, 'ACTIVE', 'Phase 1', 0,
    'NAA', 'VStock Transfer, LLC', '401(k)',
    'Fidelity', 'Mark Johnson', 'mark.johnson@fidelity.com',
    'Georgeson Inc.', 'contact@georgeson.com', 'Sarah Mitchell', '1-800-753-04812',
    176618508, 50, 'b3de63cf-5047-57b0-8894-9764e7fd780b',
    NOW(), NOW()
);

-- Success message
SELECT 'Remote seed data loaded successfully' AS status;
