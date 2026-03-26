import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "@/app/globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  title: "강의확인서 제출 시스템",
  description: "강사용 제출 링크 발송과 증빙서류 접수, 관리자 확인을 위한 SOILAB 시스템"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={notoSansKr.className}>{children}</body>
    </html>
  );
}
