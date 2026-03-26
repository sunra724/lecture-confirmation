import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type {
  AttachmentRecord,
  SessionInput,
  SessionRecord,
  SessionUpdateInput,
  SubmissionInput,
  SubmissionRecord
} from "@/lib/types";
import { createToken } from "@/lib/token";

const dbPath = path.join(process.cwd(), "lecture.db");
const uploadsRoot = path.join(process.cwd(), process.env.UPLOAD_DIR ?? "uploads");

let database: Database.Database | null = null;

function now() {
  return new Date().toISOString();
}

function ensureColumn(db: Database.Database, table: string, column: string, definition: string) {
  const columns = db.prepare(`pragma table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    db.exec(`alter table ${table} add column ${column} ${definition}`);
  }
}

function mapSession(row: Record<string, unknown>): SessionRecord {
  return {
    id: Number(row.id),
    token: String(row.token),
    business_name: String(row.business_name ?? ""),
    lecture_title: String(row.lecture_title),
    lecture_date: String(row.lecture_date),
    lecture_place: String(row.lecture_place),
    time_start: String(row.time_start),
    time_end: String(row.time_end),
    fee: Number(row.fee),
    lecturer_name: String(row.lecturer_name ?? ""),
    lecturer_phone: String(row.lecturer_phone ?? ""),
    lecturer_email: String(row.lecturer_email ?? ""),
    status: String(row.status) as SessionRecord["status"],
    link_sent_at: row.link_sent_at ? String(row.link_sent_at) : null,
    link_sent_via: row.link_sent_via ? String(row.link_sent_via) : null,
    last_notification_error: row.last_notification_error ? String(row.last_notification_error) : null,
    submitted_at: row.submitted_at ? String(row.submitted_at) : null,
    reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    paid_at: row.paid_at ? String(row.paid_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    attachment_count: Number(row.attachment_count ?? 0)
  };
}

function mapSubmission(row: Record<string, unknown>): SubmissionRecord {
  return {
    id: Number(row.id),
    session_id: Number(row.session_id),
    lecturer_name: String(row.lecturer_name),
    lecturer_phone: String(row.lecturer_phone),
    affiliation_title: String(row.affiliation_title ?? ""),
    address: String(row.address ?? ""),
    bank_name: String(row.bank_name),
    account_number: String(row.account_number),
    account_holder: String(row.account_holder),
    privacy_consent: Boolean(row.privacy_consent),
    signature_data: String(row.signature_data),
    created_at: String(row.created_at)
  };
}

function mapAttachment(row: Record<string, unknown>): AttachmentRecord {
  return {
    id: Number(row.id),
    submission_id: Number(row.submission_id),
    file_type: String(row.file_type),
    original_name: String(row.original_name),
    saved_name: String(row.saved_name),
    file_path: String(row.file_path),
    created_at: String(row.created_at)
  };
}

export function getDb() {
  if (database) return database;

  fs.mkdirSync(uploadsRoot, { recursive: true });
  database = new Database(dbPath);
  database.pragma("journal_mode = WAL");

  database.exec(`
    create table if not exists sessions (
      id integer primary key autoincrement,
      token text not null unique,
      business_name text default '',
      lecture_title text not null,
      lecture_date text not null,
      lecture_place text not null,
      time_start text not null,
      time_end text not null,
      fee integer not null default 0,
      lecturer_name text default '',
      lecturer_phone text default '',
      lecturer_email text default '',
      status text not null default 'pending',
      link_sent_at text,
      link_sent_via text,
      last_notification_error text,
      submitted_at text,
      reviewed_at text,
      paid_at text,
      created_at text not null,
      updated_at text not null,
      check (status in ('pending', 'submitted', 'reviewed', 'paid'))
    );

    create table if not exists submissions (
      id integer primary key autoincrement,
      session_id integer not null unique references sessions(id) on delete cascade,
      lecturer_name text not null,
      lecturer_phone text not null,
      affiliation_title text default '',
      address text default '',
      bank_name text not null,
      account_number text not null,
      account_holder text not null,
      privacy_consent integer not null default 0,
      signature_data text not null,
      created_at text not null
    );

    create table if not exists attachments (
      id integer primary key autoincrement,
      submission_id integer not null references submissions(id) on delete cascade,
      file_type text not null,
      original_name text not null,
      saved_name text not null,
      file_path text not null,
      created_at text not null
    );
  `);

  ensureColumn(database, "sessions", "business_name", "text default ''");
  ensureColumn(database, "sessions", "lecturer_email", "text default ''");
  ensureColumn(database, "submissions", "affiliation_title", "text default ''");
  ensureColumn(database, "submissions", "address", "text default ''");
  ensureColumn(database, "submissions", "privacy_consent", "integer not null default 0");

  return database;
}

export function listSessions() {
  const db = getDb();
  const rows = db.prepare(`
    select
      s.*,
      count(a.id) as attachment_count
    from sessions s
    left join submissions sub on sub.session_id = s.id
    left join attachments a on a.submission_id = sub.id
    group by s.id
    order by s.id desc
  `).all();
  return rows.map((row) => mapSession(row as Record<string, unknown>));
}

export function getSession(id: number) {
  const db = getDb();
  const row = db.prepare(`
    select
      s.*,
      count(a.id) as attachment_count
    from sessions s
    left join submissions sub on sub.session_id = s.id
    left join attachments a on a.submission_id = sub.id
    where s.id = ?
    group by s.id
  `).get(id);
  return row ? mapSession(row as Record<string, unknown>) : null;
}

export function getSessionByToken(token: string) {
  const db = getDb();
  const row = db.prepare(`
    select
      s.*,
      count(a.id) as attachment_count
    from sessions s
    left join submissions sub on sub.session_id = s.id
    left join attachments a on a.submission_id = sub.id
    where s.token = ?
    group by s.id
  `).get(token);
  return row ? mapSession(row as Record<string, unknown>) : null;
}

export function createSession(input: SessionInput) {
  const db = getDb();
  const token = createToken();
  const timestamp = now();
  const result = db.prepare(`
    insert into sessions (
      token, lecture_title, lecture_date, lecture_place, time_start, time_end,
      business_name, fee, lecturer_name, lecturer_phone, lecturer_email, status, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(
    token,
    input.lecture_title,
    input.lecture_date,
    input.lecture_place,
    input.time_start,
    input.time_end,
    input.business_name ?? "",
    input.fee,
    input.lecturer_name ?? "",
    input.lecturer_phone ?? "",
    input.lecturer_email ?? "",
    timestamp,
    timestamp
  );

  return getSession(Number(result.lastInsertRowid));
}

export function getSubmissionBySessionId(sessionId: number) {
  const db = getDb();
  const row = db.prepare("select * from submissions where session_id = ?").get(sessionId);
  return (row as SubmissionRecord | undefined) ?? null;
}

export function getAttachmentsBySubmissionId(submissionId: number) {
  const db = getDb();
  const rows = db.prepare("select * from attachments where submission_id = ? order by id").all(submissionId);
  return rows.map((row) => mapAttachment(row as Record<string, unknown>));
}

export function deleteSession(id: number) {
  const db = getDb();
  const session = getSession(id);
  if (!session) return false;

  const submission = getSubmissionBySessionId(id);
  const attachments = submission ? getAttachmentsBySubmissionId(submission.id) : [];

  const transaction = db.transaction(() => {
    if (submission) {
      db.prepare("delete from attachments where submission_id = ?").run(submission.id);
      db.prepare("delete from submissions where id = ?").run(submission.id);
    }
    db.prepare("delete from sessions where id = ?").run(id);
  });

  transaction();

  for (const attachment of attachments) {
    try {
      fs.rmSync(attachment.file_path, { force: true });
    } catch {
      // Ignore missing files so stale metadata can still be removed.
    }
  }

  if (submission) {
    try {
      fs.rmSync(path.join(uploadsRoot, String(submission.id)), { recursive: true, force: true });
    } catch {
      // Ignore missing directories.
    }
  }

  return true;
}

export function createSubmission(input: SubmissionInput) {
  const db = getDb();
  const session = getSessionByToken(input.token);
  if (!session) {
    throw new Error("유효하지 않은 링크입니다.");
  }

  if (session.status !== "pending") {
    throw new Error("이미 제출된 강의확인서입니다.");
  }

  const timestamp = now();
  const transaction = db.transaction(() => {
    const result = db.prepare(`
      insert into submissions (
        session_id, lecturer_name, lecturer_phone, affiliation_title, address, bank_name,
        account_number, account_holder, privacy_consent, signature_data, created_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      input.lecturer_name,
      input.lecturer_phone,
      input.affiliation_title,
      input.address,
      input.bank_name,
      input.account_number,
      input.account_holder,
      input.privacy_consent ? 1 : 0,
      input.signature_data,
      timestamp
    );

    db.prepare(`
      update sessions
      set lecturer_name = ?, lecturer_phone = ?, business_name = ?, status = 'submitted', submitted_at = ?, updated_at = ?
      where id = ?
    `).run(input.lecturer_name, input.lecturer_phone, session.business_name, timestamp, timestamp, session.id);

    return Number(result.lastInsertRowid);
  });

  return {
    session,
    submissionId: transaction()
  };
}

export function addAttachment(input: {
  submissionId: number;
  fileType: string;
  originalName: string;
  savedName: string;
  filePath: string;
}) {
  const db = getDb();
  db.prepare(`
    insert into attachments (
      submission_id, file_type, original_name, saved_name, file_path, created_at
    ) values (?, ?, ?, ?, ?, ?)
  `).run(input.submissionId, input.fileType, input.originalName, input.savedName, input.filePath, now());
}

export function getUploadDirForSubmission(submissionId: number) {
  return path.join(uploadsRoot, String(submissionId));
}

export function getAttachment(id: number) {
  const db = getDb();
  const row = db.prepare("select * from attachments where id = ?").get(id);
  return row ? mapAttachment(row as Record<string, unknown>) : null;
}

export function deleteAttachment(id: number) {
  const db = getDb();
  const attachment = getAttachment(id);
  if (!attachment) return false;

  db.prepare("delete from attachments where id = ?").run(id);

  try {
    fs.rmSync(attachment.file_path, { force: true });
  } catch {
    // Ignore missing files so stale metadata can still be removed.
  }

  return true;
}

export function getSessionDetail(id: number) {
  const session = getSession(id);
  if (!session) return null;

  const submission = getSubmissionBySessionId(id);
  const attachments = submission ? getAttachmentsBySubmissionId(submission.id) : [];

  return {
    session,
    submission,
    attachments
  };
}

export function updateSessionStatus(id: number, status: SessionRecord["status"]) {
  const db = getDb();
  const session = getSession(id);
  if (!session) return null;

  const timestamp = now();
  const reviewedAt = status === "reviewed" ? timestamp : session.reviewed_at;
  const paidAt = status === "paid" ? timestamp : session.paid_at;

  db.prepare(`
    update sessions
    set status = ?, reviewed_at = ?, paid_at = ?, updated_at = ?
    where id = ?
  `).run(status, reviewedAt, paidAt, timestamp, id);

  return getSession(id);
}

export function updateSessionDetail(id: number, input: SessionUpdateInput) {
  const db = getDb();
  const current = getSessionDetail(id);
  if (!current) return null;

  const timestamp = now();
  const transaction = db.transaction(() => {
    db.prepare(`
      update sessions
      set business_name = ?, lecture_title = ?, lecture_date = ?, lecture_place = ?, time_start = ?, time_end = ?,
          fee = ?, lecturer_name = ?, lecturer_phone = ?, lecturer_email = ?, updated_at = ?
      where id = ?
    `).run(
      input.business_name,
      input.lecture_title,
      input.lecture_date,
      input.lecture_place,
      input.time_start,
      input.time_end,
      input.fee,
      input.lecturer_name,
      input.lecturer_phone,
      input.lecturer_email ?? current.session.lecturer_email,
      timestamp,
      id
    );

    if (current.submission) {
      db.prepare(`
        update submissions
        set lecturer_name = ?, lecturer_phone = ?, affiliation_title = ?, address = ?, bank_name = ?, account_number = ?, account_holder = ?
        where session_id = ?
      `).run(
        input.lecturer_name,
        input.lecturer_phone,
        input.affiliation_title ?? current.submission.affiliation_title,
        input.address ?? current.submission.address,
        input.bank_name ?? current.submission.bank_name,
        input.account_number ?? current.submission.account_number,
        input.account_holder ?? current.submission.account_holder,
        id
      );
    }
  });

  transaction();
  return getSessionDetail(id);
}

export function markSessionNotification(params: {
  id: number;
  via: "email" | "sms" | "alimtalk" | "combined";
  error?: string | null;
}) {
  const db = getDb();
  const timestamp = now();
  db.prepare(`
    update sessions
    set link_sent_at = ?, link_sent_via = ?, last_notification_error = ?, updated_at = ?
    where id = ?
  `).run(timestamp, params.via, params.error ?? null, timestamp, params.id);
  return getSession(params.id);
}

export function seedExampleSession() {
  const db = getDb();
  const count = db.prepare("select count(*) as count from sessions").get() as { count: number };
  if (count.count > 0) return;
  createSession({
    business_name: "소이랩 디지털 역량강화 사업",
    lecture_title: "AI 활용 워크숍",
    lecture_date: "2026-04-10",
    lecture_place: "소이랩 교육장",
    time_start: "14:00",
    time_end: "17:00",
    fee: 150000,
    lecturer_name: "홍길동",
    lecturer_phone: "010-1234-5678",
    lecturer_email: "lecturer@example.com"
  });
}
