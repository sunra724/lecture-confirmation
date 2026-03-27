import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { listReviewedTaxRows } from "@/lib/db";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function GET() {
  if (!requireAdminSession()) {
    return NextResponse.json({ message: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const rows = await listReviewedTaxRows();
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      이름: row.lecturer_name,
      주민번호: row.resident_id,
      "강사료(세전)": row.fee
    }))
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, "검토완료");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="reviewed-tax-report.xlsx"'
    }
  });
}
