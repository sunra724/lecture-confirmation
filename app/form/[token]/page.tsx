import { LectureForm } from "@/components/LectureForm";
import { getSessionByToken } from "@/lib/db";

export default function PublicFormPage({ params }: { params: { token: string } }) {
  const session = getSessionByToken(params.token);

  if (!session) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-16">
        <div className="rounded-[32px] border border-white/70 bg-white p-8 shadow-soft">
          <h1 className="text-3xl font-bold text-slate-900">유효하지 않은 링크입니다</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">링크가 잘못되었거나 만료되었습니다.</p>
        </div>
      </main>
    );
  }

  if (session.status !== "pending") {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-16">
        <div className="rounded-[32px] border border-white/70 bg-white p-8 shadow-soft">
          <h1 className="text-3xl font-bold text-slate-900">이미 제출된 강의확인서입니다</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">이미 제출이 완료된 건으로 확인됩니다. 담당자에게 문의해주세요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-16">
      <div className="rounded-[32px] border border-white/70 bg-white p-8 shadow-soft">
        <div className="mb-8">
          <div className="text-sm font-semibold uppercase tracking-[0.28em] text-soilab-navy">SOILAB COOP</div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">강의확인서 제출</h1>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
            <p>강의 정보와 계좌 정보, 증빙 서류, 서명을 제출해주세요.</p>
            <p>제출 서류: 신분증사본, 통장사본 또는 계좌개설확인서, 이력서, 강의계획서, 기타 증빙서류</p>
          </div>
        </div>
        <LectureForm session={session} />
      </div>
    </main>
  );
}
