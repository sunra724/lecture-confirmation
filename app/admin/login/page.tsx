import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-md rounded-[32px] border border-white/70 bg-white p-8 shadow-soft">
        <div className="mb-6">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-soilab-navy">SOILAB COOP</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">강의확인서 관리자</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            관리자 비밀번호를 입력하면 강의 등록, 링크 발송, 제출 현황 확인, 삭제까지 한 화면에서 관리할 수 있습니다.
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
