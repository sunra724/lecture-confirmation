-- Isolated catalog reconstruction. No production rows, triggers, indexes or API stack copied.
-- Run ONLY in the disposable local test database. Production schema truth: evidence/duwhavgcidfoamygmcsm.json.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA public, extensions, auth TO anon, authenticated, service_role, audit_backend;
CREATE SEQUENCE public."proposals_id_seq";
CREATE SEQUENCE public."expenditures_id_seq";
CREATE TABLE public."proposals" (
  "id" bigint NOT NULL,
  "doc_number" text DEFAULT ''::text,
  "fund_type" text DEFAULT 'grant'::text NOT NULL,
  "project_name" text DEFAULT ''::text,
  "project_period" text DEFAULT ''::text,
  "total_amount" integer DEFAULT 0,
  "related_plan" text DEFAULT ''::text,
  "org_name" text DEFAULT '협동조합 soilab'::text,
  "submission_date" date,
  "items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."proposals" ADD CONSTRAINT "proposals_fund_type_check" CHECK (fund_type = ANY (ARRAY['grant'::text, 'self'::text, 'both'::text]));
ALTER TABLE public."proposals" ADD CONSTRAINT "proposals_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'finalized'::text]));
ALTER TABLE public."proposals" ADD CONSTRAINT "proposals_pkey" PRIMARY KEY (id);
CREATE TABLE public."expenditures" (
  "id" bigint NOT NULL,
  "proposal_id" bigint,
  "doc_number" text DEFAULT ''::text,
  "project_name" text DEFAULT ''::text,
  "expense_category" text DEFAULT ''::text,
  "issue_date" date,
  "record_date" date,
  "total_amount" integer DEFAULT 0,
  "payee_address" text DEFAULT ''::text,
  "payee_company" text DEFAULT ''::text,
  "payee_name" text DEFAULT ''::text,
  "payment_method" text DEFAULT '계좌이체'::text,
  "receipt_date" date,
  "receipt_name" text DEFAULT ''::text,
  "items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."expenditures" ADD CONSTRAINT "expenditures_pkey" PRIMARY KEY (id);
CREATE TABLE public."stamp_settings" (
  "id" integer DEFAULT 1 NOT NULL,
  "staff_name" text DEFAULT '담당자'::text,
  "manager_name" text DEFAULT '실장'::text,
  "chairperson_name" text DEFAULT '이사장'::text,
  "staff_stamp" text DEFAULT '/stamps/staff.png'::text,
  "manager_stamp" text DEFAULT '/stamps/manager.png'::text,
  "chairperson_stamp" text DEFAULT '/stamps/chairperson.png'::text,
  "org_name" text DEFAULT '협동조합 soilab'::text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."stamp_settings" ADD CONSTRAINT "stamp_settings_pkey" PRIMARY KEY (id);
ALTER TABLE public."expenditures" ADD CONSTRAINT "expenditures_proposal_id_fkey" FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, audit_backend;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, audit_backend;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
