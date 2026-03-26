export default function SubmitCompletePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="max-w-xl rounded-[32px] border border-white/70 bg-white p-10 text-center shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">제출이 완료되었습니다</h1>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-500">
          강의확인서가 소이랩 담당자에게 전달되었습니다.
          {"\n"}문의사항은 053-941-9003으로 연락 주세요.
        </p>
      </div>
    </main>
  );
}
