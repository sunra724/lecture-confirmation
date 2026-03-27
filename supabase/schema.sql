create table if not exists sessions (
  id bigint generated always as identity primary key,
  token text not null unique,
  business_name text default '',
  lecture_title text not null,
  lecture_date date not null,
  lecture_place text not null,
  time_start text not null,
  time_end text not null,
  fee integer not null default 0,
  lecturer_name text default '',
  lecturer_phone text default '',
  lecturer_email text default '',
  status text not null default 'pending',
  link_sent_at timestamptz,
  link_sent_via text,
  last_notification_error text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_status_check check (status in ('pending', 'submitted', 'reviewed', 'paid'))
);

create table if not exists submissions (
  id bigint generated always as identity primary key,
  session_id bigint not null unique references sessions(id) on delete cascade,
  lecturer_name text not null,
  lecturer_phone text not null,
  resident_id text default '',
  ocr_name text default '',
  ocr_address text default '',
  ocr_raw text default '',
  affiliation_title text default '',
  address text default '',
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  privacy_consent boolean not null default false,
  signature_data text not null,
  created_at timestamptz not null default now()
);

alter table submissions
add column if not exists resident_id text default '';

alter table submissions
add column if not exists ocr_name text default '';

alter table submissions
add column if not exists ocr_address text default '';

alter table submissions
add column if not exists ocr_raw text default '';

create table if not exists attachments (
  id bigint generated always as identity primary key,
  submission_id bigint not null references submissions(id) on delete cascade,
  file_type text not null,
  original_name text not null,
  saved_name text not null,
  file_path text not null,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('lecture-confirmation-files', 'lecture-confirmation-files', false)
on conflict (id) do nothing;
