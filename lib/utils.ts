export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatFee(fee: number) {
  return `${fee.toLocaleString("ko-KR")}원`;
}

export function formatFeeInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ko-KR");
}

export function parseFeeInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function formatDate(date: string) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(value);
}

export function formatDateTime(dateTime: string | null) {
  if (!dateTime) return "-";
  const value = new Date(dateTime);
  if (Number.isNaN(value.getTime())) return dateTime;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value);
}

export function calcLectureHours(timeStart: string, timeEnd: string) {
  const [startHour, startMinute] = timeStart.split(":").map(Number);
  const [endHour, endMinute] = timeEnd.split(":").map(Number);
  const minutes = Math.max(endHour * 60 + endMinute - (startHour * 60 + startMinute), 0);
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length < 11) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function getQuarterHourOptions() {
  return Array.from({ length: 96 }, (_, index) => {
    const hour = String(Math.floor(index / 4)).padStart(2, "0");
    const minute = String((index % 4) * 15).padStart(2, "0");
    return `${hour}:${minute}`;
  });
}

export function getStatusLabel(status: "pending" | "submitted" | "reviewed" | "paid") {
  const labels = {
    pending: "제출 요청",
    submitted: "서류 제출",
    reviewed: "검토 완료",
    paid: "지급 완료"
  } as const;

  return labels[status];
}

export function getStatusBadgeClass(status: "pending" | "submitted" | "reviewed" | "paid") {
  const classes = {
    pending: "bg-slate-100 text-slate-600",
    submitted: "bg-sky-100 text-sky-700",
    reviewed: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700"
  } as const;

  return classes[status];
}

export function getNotificationChannelLabel(channel: string | null) {
  if (channel === "combined") return "메일+문자";
  if (channel === "email") return "이메일";
  if (channel === "sms") return "문자";
  if (channel === "alimtalk") return "알림톡";
  return "-";
}

export function getAttachmentLabel(fileType: string) {
  const labels: Record<string, string> = {
    bankbook: "통장사본 또는 계좌개설확인서",
    id_card: "신분증사본",
    resume: "이력서",
    lecture_plan: "강의계획서",
    supporting_document: "기타 증빙서류"
  };

  return labels[fileType] ?? fileType;
}
