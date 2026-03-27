export type SessionStatus = "pending" | "submitted" | "reviewed" | "paid";

export type SessionRecord = {
  id: number;
  token: string;
  business_name: string;
  lecture_title: string;
  lecture_date: string;
  lecture_place: string;
  time_start: string;
  time_end: string;
  fee: number;
  lecturer_name: string;
  lecturer_phone: string;
  lecturer_email: string;
  status: SessionStatus;
  link_sent_at: string | null;
  link_sent_via: string | null;
  last_notification_error: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  attachment_count: number;
};

export type SubmissionRecord = {
  id: number;
  session_id: number;
  lecturer_name: string;
  lecturer_phone: string;
  resident_id: string;
  ocr_name: string;
  ocr_address: string;
  affiliation_title: string;
  address: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  privacy_consent: boolean;
  signature_data: string;
  created_at: string;
};

export type AttachmentRecord = {
  id: number;
  submission_id: number;
  file_type: string;
  original_name: string;
  saved_name: string;
  file_path: string;
  created_at: string;
};

export type SessionInput = {
  business_name?: string;
  lecture_title: string;
  lecture_date: string;
  lecture_place: string;
  time_start: string;
  time_end: string;
  fee: number;
  lecturer_name?: string;
  lecturer_phone?: string;
  lecturer_email?: string;
};

export type SubmissionInput = {
  token: string;
  lecturer_name: string;
  lecturer_phone: string;
  resident_id?: string;
  ocr_name?: string;
  ocr_address?: string;
  affiliation_title: string;
  address: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  privacy_consent: boolean;
  signature_data: string;
};

export type SessionUpdateInput = {
  business_name: string;
  lecture_title: string;
  lecture_date: string;
  lecture_place: string;
  time_start: string;
  time_end: string;
  fee: number;
  lecturer_name: string;
  lecturer_phone: string;
  lecturer_email?: string;
  resident_id?: string;
  affiliation_title?: string;
  address?: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
};
