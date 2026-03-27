import { randomUUID } from "node:crypto";
import path from "node:path";
import type {
  AttachmentRecord,
  SessionInput,
  SessionRecord,
  SessionUpdateInput,
  SubmissionInput,
  SubmissionRecord
} from "@/lib/types";
import { getSupabaseAdmin, getSupabaseStorageBucket } from "@/lib/supabase";
import { createToken } from "@/lib/token";

type SessionRow = {
  id: number;
  token: string;
  business_name: string | null;
  lecture_title: string;
  lecture_date: string;
  lecture_place: string;
  time_start: string;
  time_end: string;
  fee: number;
  lecturer_name: string | null;
  lecturer_phone: string | null;
  lecturer_email: string | null;
  status: SessionRecord["status"];
  link_sent_at: string | null;
  link_sent_via: string | null;
  last_notification_error: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  submissions?: SubmissionRow[] | SubmissionRow | null;
};

type SubmissionRow = {
  id: number;
  session_id: number;
  lecturer_name: string;
  lecturer_phone: string;
  resident_id: string | null;
  affiliation_title: string | null;
  address: string | null;
  bank_name: string;
  account_number: string;
  account_holder: string;
  privacy_consent: boolean;
  signature_data: string;
  created_at: string;
  attachments?: AttachmentRow[] | null;
};

type AttachmentRow = {
  id: number;
  submission_id: number;
  file_type: string;
  original_name: string;
  saved_name: string;
  file_path: string;
  created_at: string;
};

const SESSION_DETAIL_SELECT = `
  id,
  token,
  business_name,
  lecture_title,
  lecture_date,
  lecture_place,
  time_start,
  time_end,
  fee,
  lecturer_name,
  lecturer_phone,
  lecturer_email,
  status,
  link_sent_at,
  link_sent_via,
  last_notification_error,
  submitted_at,
  reviewed_at,
  paid_at,
  created_at,
  updated_at,
  submissions (
    id,
    session_id,
    lecturer_name,
    lecturer_phone,
    resident_id,
    affiliation_title,
    address,
    bank_name,
    account_number,
    account_holder,
    privacy_consent,
    signature_data,
    created_at,
    attachments (
      id,
      submission_id,
      file_type,
      original_name,
      saved_name,
      file_path,
      created_at
    )
  )
`;

function now() {
  return new Date().toISOString();
}

function getSubmissionFromRow(row: SessionRow) {
  if (!row.submissions) return null;
  if (Array.isArray(row.submissions)) {
    return row.submissions[0] ?? null;
  }
  return row.submissions;
}

function mapAttachment(row: AttachmentRow): AttachmentRecord {
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

function mapSubmission(row: SubmissionRow): SubmissionRecord {
  return {
    id: Number(row.id),
    session_id: Number(row.session_id),
    lecturer_name: String(row.lecturer_name),
    lecturer_phone: String(row.lecturer_phone),
    resident_id: String(row.resident_id ?? ""),
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

function mapSession(row: SessionRow): SessionRecord {
  const submission = getSubmissionFromRow(row);
  const attachments = Array.isArray(submission?.attachments) ? submission.attachments : [];

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
    status: row.status,
    link_sent_at: row.link_sent_at,
    link_sent_via: row.link_sent_via,
    last_notification_error: row.last_notification_error,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    paid_at: row.paid_at,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    attachment_count: attachments.length
  };
}

function mapSessionDetail(row: SessionRow) {
  const submissionRow = getSubmissionFromRow(row);
  const attachments = Array.isArray(submissionRow?.attachments)
    ? submissionRow.attachments.map(mapAttachment)
    : [];

  return {
    session: mapSession(row),
    submission: submissionRow ? mapSubmission(submissionRow) : null,
    attachments
  };
}

function getExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return extension || ".bin";
}

async function uploadFileToStorage(file: File, submissionId: number) {
  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseStorageBucket();
  const extension = getExtension(file.name);
  const savedName = `${randomUUID()}${extension}`;
  const storagePath = `${submissionId}/${savedName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(storagePath, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    savedName,
    filePath: storagePath
  };
}

async function removeStoragePaths(paths: string[]) {
  if (!paths.length) return;

  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseStorageBucket();
  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listSessions() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("sessions").select(SESSION_DETAIL_SELECT).order("id", {
    ascending: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data as SessionRow[]).map(mapSession);
}

export async function getSession(id: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSession(data as SessionRow) : null;
}

export async function getSessionByToken(token: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_DETAIL_SELECT)
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSession(data as SessionRow) : null;
}

export async function createSession(input: SessionInput) {
  const supabase = getSupabaseAdmin();
  const token = createToken();
  const timestamp = now();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      token,
      business_name: input.business_name ?? "",
      lecture_title: input.lecture_title,
      lecture_date: input.lecture_date,
      lecture_place: input.lecture_place,
      time_start: input.time_start,
      time_end: input.time_end,
      fee: input.fee,
      lecturer_name: input.lecturer_name ?? "",
      lecturer_phone: input.lecturer_phone ?? "",
      lecturer_email: input.lecturer_email ?? "",
      status: "pending",
      created_at: timestamp,
      updated_at: timestamp
    })
    .select(SESSION_DETAIL_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSession(data as SessionRow);
}

export async function getSubmissionBySessionId(sessionId: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSubmission(data as SubmissionRow) : null;
}

export async function getAttachmentsBySubmissionId(submissionId: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("submission_id", submissionId)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as AttachmentRow[]).map(mapAttachment);
}

export async function deleteSession(id: number) {
  const detail = await getSessionDetail(id);
  if (!detail) return false;

  if (detail.attachments.length) {
    await removeStoragePaths(detail.attachments.map((attachment) => attachment.file_path));
  }

  const supabase = getSupabaseAdmin();
  if (detail.submission) {
    const { error: attachmentError } = await supabase
      .from("attachments")
      .delete()
      .eq("submission_id", detail.submission.id);
    if (attachmentError) {
      throw new Error(attachmentError.message);
    }

    const { error: submissionError } = await supabase
      .from("submissions")
      .delete()
      .eq("session_id", id);
    if (submissionError) {
      throw new Error(submissionError.message);
    }
  }

  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function createSubmission(input: SubmissionInput) {
  const supabase = getSupabaseAdmin();
  const session = await getSessionByToken(input.token);
  if (!session) {
    throw new Error("유효하지 않은 링크입니다.");
  }

  if (session.status !== "pending") {
    throw new Error("이미 제출된 강의확인서입니다.");
  }

  const timestamp = now();
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      session_id: session.id,
      lecturer_name: input.lecturer_name,
      lecturer_phone: input.lecturer_phone,
      resident_id: input.resident_id ?? "",
      affiliation_title: input.affiliation_title,
      address: input.address,
      bank_name: input.bank_name,
      account_number: input.account_number,
      account_holder: input.account_holder,
      privacy_consent: input.privacy_consent,
      signature_data: input.signature_data,
      created_at: timestamp
    })
    .select("id")
    .single();

  if (submissionError) {
    throw new Error(submissionError.message);
  }

  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      lecturer_name: input.lecturer_name,
      lecturer_phone: input.lecturer_phone,
      status: "submitted",
      submitted_at: timestamp,
      updated_at: timestamp
    })
    .eq("id", session.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    session,
    submissionId: Number(submission.id)
  };
}

export async function addAttachment(input: {
  submissionId: number;
  fileType: string;
  originalName: string;
  savedName: string;
  filePath: string;
}) {
  const supabase = getSupabaseAdmin();
  const timestamp = now();
  const { data, error } = await supabase
    .from("attachments")
    .insert({
      submission_id: input.submissionId,
      file_type: input.fileType,
      original_name: input.originalName,
      saved_name: input.savedName,
      file_path: input.filePath,
      created_at: timestamp
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapAttachment(data as AttachmentRow);
}

export async function createAttachmentUpload(input: {
  submissionId: number;
  fileType: string;
  file: File;
}) {
  const saved = await uploadFileToStorage(input.file, input.submissionId);
  return addAttachment({
    submissionId: input.submissionId,
    fileType: input.fileType,
    originalName: input.file.name,
    savedName: saved.savedName,
    filePath: saved.filePath
  });
}

export async function getAttachment(id: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapAttachment(data as AttachmentRow) : null;
}

export async function deleteAttachment(id: number) {
  const attachment = await getAttachment(id);
  if (!attachment) return false;

  await removeStoragePaths([attachment.file_path]);

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("attachments").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function downloadAttachmentContent(id: number) {
  const attachment = await getAttachment(id);
  if (!attachment) return null;

  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseStorageBucket();
  const { data, error } = await supabase.storage.from(bucket).download(attachment.file_path);

  if (error) {
    throw new Error(error.message);
  }

  const fileBuffer = Buffer.from(await data.arrayBuffer());
  return {
    attachment,
    fileBuffer,
    contentType: data.type || "application/octet-stream"
  };
}

export async function getSessionDetail(id: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSessionDetail(data as SessionRow) : null;
}

export async function updateSessionStatus(id: number, status: SessionRecord["status"]) {
  const current = await getSession(id);
  if (!current) return null;

  const timestamp = now();
  const reviewedAt = status === "reviewed" ? timestamp : current.reviewed_at;
  const paidAt = status === "paid" ? timestamp : current.paid_at;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("sessions")
    .update({
      status,
      reviewed_at: reviewedAt,
      paid_at: paidAt,
      updated_at: timestamp
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return getSession(id);
}

export async function updateSessionDetail(id: number, input: SessionUpdateInput) {
  const current = await getSessionDetail(id);
  if (!current) return null;

  const timestamp = now();
  const supabase = getSupabaseAdmin();

  const { error: sessionError } = await supabase
    .from("sessions")
    .update({
      business_name: input.business_name,
      lecture_title: input.lecture_title,
      lecture_date: input.lecture_date,
      lecture_place: input.lecture_place,
      time_start: input.time_start,
      time_end: input.time_end,
      fee: input.fee,
      lecturer_name: input.lecturer_name,
      lecturer_phone: input.lecturer_phone,
      lecturer_email: input.lecturer_email ?? current.session.lecturer_email,
      updated_at: timestamp
    })
    .eq("id", id);

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (current.submission) {
    const { error: submissionError } = await supabase
      .from("submissions")
      .update({
        lecturer_name: input.lecturer_name,
        lecturer_phone: input.lecturer_phone,
        resident_id: input.resident_id ?? current.submission.resident_id,
        affiliation_title: input.affiliation_title ?? current.submission.affiliation_title,
        address: input.address ?? current.submission.address,
        bank_name: input.bank_name ?? current.submission.bank_name,
        account_number: input.account_number ?? current.submission.account_number,
        account_holder: input.account_holder ?? current.submission.account_holder
      })
      .eq("session_id", id);

    if (submissionError) {
      throw new Error(submissionError.message);
    }
  }

  return getSessionDetail(id);
}

export async function markSessionNotification(params: {
  id: number;
  via: "email" | "sms" | "alimtalk" | "combined";
  error?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const timestamp = now();
  const payload = params.error
    ? {
        link_sent_at: null,
        link_sent_via: null,
        last_notification_error: params.error,
        updated_at: timestamp
      }
    : {
        link_sent_at: timestamp,
        link_sent_via: params.via,
        last_notification_error: null,
        updated_at: timestamp
      };

  const { error } = await supabase
    .from("sessions")
    .update(payload)
    .eq("id", params.id);

  if (error) {
    throw new Error(error.message);
  }

  return getSession(params.id);
}

export async function listReviewedTaxRows() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      fee,
      status,
      submissions (
        lecturer_name,
        resident_id
      )
    `
    )
    .in("status", ["reviewed", "paid"])
    .order("id", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{
    fee: number;
    status: SessionRecord["status"];
    submissions?: Array<{ lecturer_name: string; resident_id: string | null }> | { lecturer_name: string; resident_id: string | null } | null;
  }>).map((row) => {
    const submission = Array.isArray(row.submissions) ? (row.submissions[0] ?? null) : (row.submissions ?? null);
    return {
      lecturer_name: submission?.lecturer_name ?? "",
      resident_id: submission?.resident_id ?? "",
      fee: Number(row.fee ?? 0),
      status: row.status
    };
  });
}

export async function seedExampleSession() {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  if ((count ?? 0) > 0) return;

  await createSession({
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
