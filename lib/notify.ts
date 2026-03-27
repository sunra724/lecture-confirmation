import { sendMail } from "@/lib/email";
import { SolapiMessageService } from "solapi";
import type { SessionRecord } from "@/lib/types";
import { formatDate, formatFee, normalizePhone } from "@/lib/utils";

export type NotificationChannel = "email" | "sms" | "alimtalk" | "combined";
type NotificationResult = {
  channel: NotificationChannel;
  recipient: string;
  link: string;
};

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();
  if (!trimmed || trimmed === "http://" || trimmed === "https://") {
    return "";
  }

  return trimmed.replace(/\/+$/, "");
}

function isPublicBaseUrl(baseUrl: string) {
  return !/localhost|127\.0\.0\.1/i.test(baseUrl);
}

function getAdminRecipient() {
  const recipient = process.env.EMAIL_TO;
  if (!recipient) {
    throw new Error("EMAIL_TO가 설정되지 않았습니다.");
  }
  return recipient;
}

function getLecturerEmail(session: SessionRecord) {
  const email = session.lecturer_email.trim();
  if (!email) {
    throw new Error("강사 이메일이 등록되지 않아 이메일 발송을 할 수 없습니다.");
  }
  return email;
}

function getPublicLink(session: SessionRecord, baseUrl?: string) {
  const envBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL ?? "");
  const requestBaseUrl = normalizeBaseUrl(baseUrl ?? "");
  const resolvedBaseUrl =
    envBaseUrl && isPublicBaseUrl(envBaseUrl)
      ? envBaseUrl
      : requestBaseUrl && isPublicBaseUrl(requestBaseUrl)
        ? requestBaseUrl
        : envBaseUrl || requestBaseUrl;

  if (!resolvedBaseUrl) {
    throw new Error("제출 링크를 만들 BASE URL이 설정되지 않았습니다.");
  }
  return `${resolvedBaseUrl}/form/${session.token}`;
}

function getSolapiService() {
  const apiKey = process.env.SOLAPI_API_KEY?.trim();
  const apiSecret = process.env.SOLAPI_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    throw new Error("SOLAPI_API_KEY 또는 SOLAPI_API_SECRET이 설정되지 않았습니다.");
  }

  return new SolapiMessageService(apiKey, apiSecret);
}

function getLecturerPhone(session: SessionRecord) {
  const phone = session.lecturer_phone.replace(/\D/g, "");
  if (!phone) {
    throw new Error("강사 연락처가 없어 문자 또는 알림톡을 보낼 수 없습니다.");
  }
  return phone;
}

function getSolapiConfig() {
  const sender = process.env.SOLAPI_SENDER?.trim();
  const pfId = process.env.SOLAPI_PFID?.trim();
  const templateId = process.env.SOLAPI_TEMPLATE_ID?.trim();

  if (!sender) {
    throw new Error("SOLAPI_SENDER가 설정되지 않았습니다.");
  }

  if (!pfId) {
    throw new Error("SOLAPI_PFID가 설정되지 않았습니다.");
  }

  if (!templateId) {
    throw new Error("SOLAPI_TEMPLATE_ID가 설정되지 않았습니다.");
  }

  return { sender, pfId, templateId };
}

async function sendSolapiNotification(session: SessionRecord, baseUrl?: string): Promise<NotificationResult> {
  const messageService = getSolapiService();
  const { sender, pfId, templateId } = getSolapiConfig();
  const publicLink = getPublicLink(session, baseUrl);
  const recipientPhone = getLecturerPhone(session);
  const recipientName = session.lecturer_name || "강사";

  const text = [
    "[협동조합 소이랩]",
    "안녕하세요, #{이름}님.",
    "",
    "강사비 지급을 위해 아래 서류 제출을 요청드립니다.",
    "",
    "■ 제출 서류",
    "· 신분증 사본 (주민등록증·운전면허증·여권)",
    "· 통장사본 또는 계좌개설확인서",
    "· 기타 증빙서류",
    "",
    "아래 버튼을 눌러 서류를 제출해 주세요.",
    "제출하신 정보는 원천징수 및 소득 지급 목적으로만 사용됩니다.",
    "",
    `문의: ${process.env.NOTIFY_CONTACT ?? "053-941-9003"}`,
  ].join("\n");

  await messageService.sendOne({
    to: recipientPhone,
    from: sender,
    text,
    type: "ATA",
    kakaoOptions: {
      pfId,
      templateId,
      disableSms: true,
      variables: {
        이름: recipientName
      }
    }
  });

  return {
    channel: "alimtalk" as const,
    recipient: recipientPhone,
    link: publicLink
  };
}

async function sendSmsFallbackNotification(session: SessionRecord, baseUrl?: string): Promise<NotificationResult> {
  const messageService = getSolapiService();
  const { sender } = getSolapiConfig();
  const publicLink = getPublicLink(session, baseUrl);
  const recipientPhone = getLecturerPhone(session);
  const recipientName = session.lecturer_name || "강사";

  const text = [
    "[협동조합 소이랩]",
    `안녕하세요, ${recipientName}님.`,
    "",
    "강사비 지급을 위해 아래 서류 제출을 요청드립니다.",
    "",
    "제출 링크",
    publicLink,
    "",
    `문의: ${process.env.NOTIFY_CONTACT ?? "053-941-9003"}`
  ].join("\n");

  await messageService.sendOne({
    to: recipientPhone,
    from: sender,
    text,
    type: "LMS"
  });

  return {
    channel: "sms" as const,
    recipient: recipientPhone,
    link: publicLink
  };
}

export async function sendSubmissionNotification(params: {
  lecturerName: string;
  lectureTitle: string;
  lectureDate: string;
  timeStart: string;
  timeEnd: string;
  fee: number;
  submittedAt: string;
  adminUrl: string;
}) {
  const subject = `[강의확인서 제출] ${params.lecturerName} 강사 - ${params.lectureTitle} (${params.lectureDate})`;
  const html = `
    <div style="font-family:'Noto Sans KR',Arial,sans-serif;line-height:1.7;color:#172033">
      <h1 style="font-size:20px;color:#46549C;margin-bottom:16px">강의확인서 제출 알림</h1>
      <table style="border-collapse:collapse;width:100%;max-width:640px">
        <tbody>
          <tr><td style="padding:8px 0;font-weight:700">강사명</td><td>${params.lecturerName}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">강의명</td><td>${params.lectureTitle}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">강의일</td><td>${formatDate(params.lectureDate)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">시간</td><td>${params.timeStart} - ${params.timeEnd}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">강사비</td><td>${formatFee(params.fee)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">제출시각</td><td>${params.submittedAt}</td></tr>
        </tbody>
      </table>
      <p style="margin-top:24px">
        <a href="${params.adminUrl}" style="display:inline-block;background:#46549C;color:white;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700">
          어드민에서 확인하기
        </a>
      </p>
      <p style="margin-top:24px;color:#64748B;font-size:13px">본 메일은 강의확인서 시스템에서 자동 발송되었습니다.</p>
    </div>
  `;

  await sendMail({
    to: getAdminRecipient(),
    subject,
    html
  });
}

export async function sendSessionLinkNotification(
  session: SessionRecord,
  preferredChannel: NotificationChannel = "combined",
  baseUrl?: string
): Promise<NotificationResult> {
  if (preferredChannel === "combined") {
    const emailResult = await sendSessionLinkNotification(session, "email", baseUrl);
    const smsResult = await sendSmsFallbackNotification(session, baseUrl);
    return {
      channel: "combined" as const,
      recipient: `${emailResult.recipient}, ${smsResult.recipient}`,
      link: emailResult.link
    };
  }

  if (preferredChannel === "sms" || preferredChannel === "alimtalk") {
    return preferredChannel === "sms"
      ? sendSmsFallbackNotification(session, baseUrl)
      : sendSolapiNotification(session, baseUrl);
  }

  const recipient = getLecturerEmail(session);
  const publicLink = getPublicLink(session, baseUrl);
  const subject = `[강의확인서 링크 발송 준비] ${session.lecture_title}`;
  const html = `
    <div style="font-family:'Noto Sans KR',Arial,sans-serif;line-height:1.7;color:#172033">
      <h1 style="font-size:20px;color:#46549C;margin-bottom:16px">강의확인서 제출 링크</h1>
      <p>안녕하세요. 강사비 지급을 위해 아래 서류 제출을 요청드립니다.</p>
      <table style="border-collapse:collapse;width:100%;max-width:640px">
        <tbody>
          <tr><td style="padding:8px 0;font-weight:700">강의명</td><td>${session.lecture_title}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">강의일</td><td>${formatDate(session.lecture_date)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">강사명</td><td>${session.lecturer_name || "-"}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">연락처</td><td>${session.lecturer_phone ? normalizePhone(session.lecturer_phone) : "-"}</td></tr>
        </tbody>
      </table>
      <div style="margin-top:20px">
        <div style="font-weight:700;margin-bottom:8px">제출 서류</div>
        <div>- 신분증 사본</div>
        <div>- 통장사본 또는 계좌개설확인서</div>
        <div>- 이력서</div>
        <div>- 강의계획서</div>
        <div>- 기타 증빙서류(학위증명서, 경력증명서, 자격증 등)</div>
      </div>
      <p style="margin-top:20px"><a href="${publicLink}">${publicLink}</a></p>
      <p style="margin-top:24px;color:#64748B;font-size:13px">본 메일은 강의확인서 시스템에서 자동 발송되었습니다.</p>
    </div>
  `;

  await sendMail({
    to: recipient,
    subject,
    html
  });

  return {
    channel: "email" as const,
    recipient,
    link: publicLink
  };
}
