-- REVIEW DRAFT: lecture-confirmation (duwhavgcidfoamygmcsm). Not applied to production.
-- Business tables are reached through authorized server code; no client policies are needed.
-- Confirm deployment callers and rerun a fresh catalog audit before release.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
DO $preflight$
DECLARE target text; relation_oid oid;
BEGIN
  FOREACH target IN ARRAY ARRAY['proposals', 'expenditures', 'stamp_settings'] LOOP
    SELECT c.oid INTO relation_oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=target AND c.relkind IN ('r','p');
    IF relation_oid IS NULL THEN RAISE EXCEPTION 'Reviewed relation missing: public.%',target; END IF;
    IF EXISTS(SELECT 1 FROM pg_policy WHERE polrelid=relation_oid) THEN RAISE EXCEPTION 'Policy drift on public.%; review before migration',target; END IF;
  END LOOP;
END $preflight$;

ALTER TABLE public."proposals" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."proposals" FROM PUBLIC, anon, authenticated;
REVOKE SELECT ("id", "doc_number", "fund_type", "project_name", "project_period", "total_amount", "related_plan", "org_name", "submission_date", "items", "status", "created_at", "updated_at"), INSERT ("id", "doc_number", "fund_type", "project_name", "project_period", "total_amount", "related_plan", "org_name", "submission_date", "items", "status", "created_at", "updated_at"), UPDATE ("id", "doc_number", "fund_type", "project_name", "project_period", "total_amount", "related_plan", "org_name", "submission_date", "items", "status", "created_at", "updated_at"), REFERENCES ("id", "doc_number", "fund_type", "project_name", "project_period", "total_amount", "related_plan", "org_name", "submission_date", "items", "status", "created_at", "updated_at") ON TABLE public."proposals" FROM PUBLIC, anon, authenticated;

ALTER TABLE public."expenditures" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."expenditures" FROM PUBLIC, anon, authenticated;
REVOKE SELECT ("id", "proposal_id", "doc_number", "project_name", "expense_category", "issue_date", "record_date", "total_amount", "payee_address", "payee_company", "payee_name", "payment_method", "receipt_date", "receipt_name", "items", "status", "created_at", "updated_at"), INSERT ("id", "proposal_id", "doc_number", "project_name", "expense_category", "issue_date", "record_date", "total_amount", "payee_address", "payee_company", "payee_name", "payment_method", "receipt_date", "receipt_name", "items", "status", "created_at", "updated_at"), UPDATE ("id", "proposal_id", "doc_number", "project_name", "expense_category", "issue_date", "record_date", "total_amount", "payee_address", "payee_company", "payee_name", "payment_method", "receipt_date", "receipt_name", "items", "status", "created_at", "updated_at"), REFERENCES ("id", "proposal_id", "doc_number", "project_name", "expense_category", "issue_date", "record_date", "total_amount", "payee_address", "payee_company", "payee_name", "payment_method", "receipt_date", "receipt_name", "items", "status", "created_at", "updated_at") ON TABLE public."expenditures" FROM PUBLIC, anon, authenticated;

ALTER TABLE public."stamp_settings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."stamp_settings" FROM PUBLIC, anon, authenticated;
REVOKE SELECT ("id", "staff_name", "manager_name", "chairperson_name", "staff_stamp", "manager_stamp", "chairperson_stamp", "org_name", "updated_at"), INSERT ("id", "staff_name", "manager_name", "chairperson_name", "staff_stamp", "manager_stamp", "chairperson_stamp", "org_name", "updated_at"), UPDATE ("id", "staff_name", "manager_name", "chairperson_name", "staff_stamp", "manager_stamp", "chairperson_stamp", "org_name", "updated_at"), REFERENCES ("id", "staff_name", "manager_name", "chairperson_name", "staff_stamp", "manager_stamp", "chairperson_stamp", "org_name", "updated_at") ON TABLE public."stamp_settings" FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public."proposals_id_seq" FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public."expenditures_id_seq" FROM PUBLIC, anon, authenticated;

-- Actual application creator is postgres. Other creators need a separately reviewed change.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
-- Built-in PUBLIC EXECUTE is global, so a schema-only revoke would not remove it.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
COMMIT;
