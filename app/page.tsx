import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-white/80 bg-white/90 p-10 shadow-soft backdrop-blur">
        <div className="inline-flex rounded-full bg-soilab-paper px-4 py-1 text-sm font-semibold text-soilab-navy">
          강의확인서 제출 시스템
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-soilab-navy">
          대상자에게 제출 링크를 보내고 증빙서류 접수부터 검토까지 한 화면에서 관리합니다.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          새로 복구 중인 프로젝트 골격입니다. 관리자 인증, 제출현황, 삭제 기능을 우선 복원했습니다.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            className="rounded-full bg-soilab-navy px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            href="/admin"
          >
            관리자 화면으로 이동
          </Link>
          <Link
            className="rounded-full border border-soilab-navy/20 px-6 py-3 text-sm font-semibold text-soilab-navy transition hover:border-soilab-navy hover:bg-soilab-paper"
            href="/admin/login"
          >
            관리자 로그인
          </Link>
        </div>
      </div>
    </main>
  );
}
