import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { requireAdminSession } from "@/lib/auth";
import { getSessionDetail } from "@/lib/db";
import { formatFee, normalizePhone } from "@/lib/utils";

export default async function AdminPrintPage({ params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    redirect("/admin/login");
  }

  const detail = await getSessionDetail(Number(params.id));
  if (!detail) notFound();

  const { session, submission } = detail;
  const lecturerName = submission?.lecturer_name ?? session.lecturer_name ?? "";
  const lecturerPhone = submission?.lecturer_phone
    ? normalizePhone(submission.lecturer_phone)
    : session.lecturer_phone
      ? normalizePhone(session.lecturer_phone)
      : "";
  const issueDate = new Date();
  const issueYear = issueDate.getFullYear();
  const issueMonth = issueDate.getMonth() + 1;
  const issueDay = issueDate.getDate();

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-black print:px-0 print:py-0">
      <div className="mx-auto max-w-[190mm]">
        <div className="mb-6 print:hidden">
          <PrintButton />
        </div>

        <article className="bg-white px-6 py-6 print:px-4 print:py-4">
          <header className="pb-6 text-center">
            <h1 className="text-[30px] font-semibold tracking-[0.38em]">강 의 확 인 서</h1>
          </header>

          <section className="border border-black">
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                <tr>
                  <th className="w-[16%] border border-black px-3 py-3 text-center font-medium">사업명</th>
                  <td className="border border-black px-3 py-3" colSpan={3}>
                    {session.business_name}
                  </td>
                </tr>
                <tr>
                  <th className="border border-black px-3 py-3 text-center font-medium">강의명</th>
                  <td className="border border-black px-3 py-3" colSpan={3}>
                    {session.lecture_title}
                  </td>
                </tr>
                <tr>
                  <th className="border border-black px-3 py-3 text-center font-medium">일 시</th>
                  <td className="border border-black px-3 py-3">
                    {session.lecture_date} &nbsp; {session.time_start} ~ {session.time_end}
                  </td>
                  <th className="w-[18%] border border-black px-3 py-3 text-center font-medium">장 소</th>
                  <td className="border border-black px-3 py-3">{session.lecture_place}</td>
                </tr>
                <tr>
                  <th className="border border-black px-3 py-3 text-center font-medium">성 명</th>
                  <td className="border border-black px-3 py-3">{lecturerName}</td>
                  <th className="border border-black px-3 py-3 text-center font-medium">주민번호</th>
                  <td className="border border-black px-3 py-3"></td>
                </tr>
                <tr>
                  <th className="border border-black px-3 py-3 text-center font-medium">소속 및 직위</th>
                  <td className="border border-black px-3 py-3">{submission?.affiliation_title ?? ""}</td>
                  <th className="border border-black px-3 py-3 text-center font-medium">연 락 처</th>
                  <td className="border border-black px-3 py-3">{lecturerPhone}</td>
                </tr>
                <tr>
                  <th className="border border-black px-3 py-3 text-center font-medium">주 소</th>
                  <td className="border border-black px-3 py-3" colSpan={3}>
                    {submission?.address ?? ""}
                  </td>
                </tr>
                <tr>
                  <th className="border border-black px-3 py-3 text-center font-medium">금 액</th>
                  <td className="border border-black px-3 py-3 text-center">
                    <div>{formatFee(session.fee)}</div>
                    <div className="mt-1 text-[11px] text-slate-500">(소득세 등 공제 전 지급 기준 금액)</div>
                  </td>
                  <th className="border border-black px-3 py-3 text-center font-medium">지급방법</th>
                  <td className="border border-black px-3 py-3 text-center">계좌이체</td>
                </tr>
                <tr>
                  <th className="border border-black px-3 py-3 text-center font-medium">지급계좌</th>
                  <td className="border border-black px-3 py-3 leading-7" colSpan={3}>
                    <div>은행명 : {submission?.bank_name ?? ""}</div>
                    <div>계좌번호 : {submission?.account_number ?? ""}</div>
                    <div>예금주 : {submission?.account_holder ?? ""}</div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-5 py-6 text-center text-[11px] leading-6 text-slate-700" colSpan={4}>
                    <p>※ 확인서 작성시 정확하게 기입해주세요.</p>
                    <p>
                      ※ 위의 개인정보 및 고유식별정보는 소득세법 제164조에 의해 수집 및 활용될 것이며,
                      제출하신 정보는 원천징수 및 소득 지급 목적으로만 사용됩니다. 개인정보 제공에 동의하십니까?
                    </p>
                    <p className="mt-2">{submission?.privacy_consent ? "■ 예 / □ 아니오" : "□ 예 / ■ 아니오"}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="mt-6 text-center text-[13px]">
            <p>
              {issueYear} &nbsp;&nbsp; 년 &nbsp;&nbsp; {issueMonth} &nbsp;&nbsp; 월 &nbsp;&nbsp; {issueDay} &nbsp;&nbsp; 일
            </p>
          </section>

          <section className="mt-8 flex items-baseline justify-end gap-8 pr-5 text-[14px]">
            <div className="font-medium leading-none">강사</div>
            <div className="relative min-h-20 min-w-44 pr-2 text-right">
              <span className="mr-3 inline-block align-baseline leading-none">(서명)</span>
              {submission?.signature_data ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="강사 서명"
                  className="absolute bottom-0 right-0 max-h-16 max-w-28 object-contain"
                  src={submission.signature_data}
                />
              ) : null}
            </div>
          </section>

          <section className="mt-8 flex justify-center">
            <div className="text-center text-[24px] font-bold text-[#248DAC]">
              SOILAB
              <div className="mt-1 text-[10px] font-medium tracking-[0.2em] text-slate-500">COOPERATIVE</div>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
