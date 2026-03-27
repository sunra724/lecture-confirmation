import { NextResponse } from "next/server";
import { createAttachmentUpload, createSubmission, getSessionByToken } from "@/lib/db";
import { extractIdCardInfo } from "@/lib/id-card-ocr";
import { sendSubmissionNotification } from "@/lib/notify";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();

  const token = String(formData.get("token") ?? "");
  const lecturerName = String(formData.get("lecturer_name") ?? "").trim();
  const lecturerPhone = String(formData.get("lecturer_phone") ?? "").trim();
  const affiliationTitle = String(formData.get("affiliation_title") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const accountNumber = String(formData.get("account_number") ?? "").trim();
  const accountHolder = String(formData.get("account_holder") ?? "").trim();
  const privacyConsent = String(formData.get("privacy_consent") ?? "") === "yes";
  const signatureData = String(formData.get("signature_data") ?? "").trim();

  if (
    !token ||
    !lecturerName ||
    !lecturerPhone ||
    !affiliationTitle ||
    !address ||
    !bankName ||
    !accountNumber ||
    !accountHolder ||
    !privacyConsent ||
    !signatureData
  ) {
    return NextResponse.json({ message: "필수 입력 항목이 누락되었습니다." }, { status: 400 });
  }

  const bankbook = formData.get("bankbook");
  const idCard = formData.get("id_card");
  const resume = formData.get("resume");
  const lecturePlan = formData.get("lecture_plan");
  const supportingDocuments = formData.getAll("supporting_documents");

  if (!(bankbook instanceof File) || !(idCard instanceof File) || !(resume instanceof File) || !(lecturePlan instanceof File)) {
    return NextResponse.json({ message: "필수 첨부파일이 누락되었습니다." }, { status: 400 });
  }

  const session = await getSessionByToken(token);
  if (!session) {
    return NextResponse.json({ message: "유효하지 않은 링크입니다." }, { status: 404 });
  }

  if (session.status !== "pending") {
    return NextResponse.json({ message: "이미 제출된 강의확인서입니다." }, { status: 409 });
  }

  try {
    const extractedIdInfo = await extractIdCardInfo(idCard);
    const { submissionId } = await createSubmission({
      token,
      lecturer_name: lecturerName,
      lecturer_phone: lecturerPhone,
      resident_id: extractedIdInfo?.residentId ?? "",
      ocr_name: extractedIdInfo?.name ?? "",
      ocr_address: extractedIdInfo?.address ?? "",
      ocr_raw: extractedIdInfo?.raw ?? "",
      ocr_error: extractedIdInfo?.error ?? "",
      affiliation_title: affiliationTitle,
      address,
      bank_name: bankName,
      account_number: accountNumber,
      account_holder: accountHolder,
      privacy_consent: privacyConsent,
      signature_data: signatureData
    });

    const files = [
      { key: "bankbook", type: "bankbook", value: bankbook },
      { key: "id_card", type: "id_card", value: idCard },
      { key: "resume", type: "resume", value: resume },
      { key: "lecture_plan", type: "lecture_plan", value: lecturePlan }
    ] as const;

    for (const fileEntry of files) {
      if (!(fileEntry.value instanceof File) || fileEntry.value.size === 0) continue;
      await createAttachmentUpload({
        submissionId,
        fileType: fileEntry.type,
        file: fileEntry.value
      });
    }

    for (const fileEntry of supportingDocuments) {
      if (!(fileEntry instanceof File) || fileEntry.size === 0) continue;
      await createAttachmentUpload({
        submissionId,
        fileType: "supporting_document",
        file: fileEntry
      });
    }

    await sendSubmissionNotification({
      lecturerName,
      lecturerEmail: session.lecturer_email,
      lectureTitle: session.lecture_title,
      lectureDate: session.lecture_date,
      timeStart: session.time_start,
      timeEnd: session.time_end,
      fee: session.fee,
      submittedAt: new Date().toISOString(),
      adminUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/admin/${session.id}`
    });

    return NextResponse.json({ ok: true, submissionId });
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "제출 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
