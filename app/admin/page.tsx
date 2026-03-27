import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { requireAdminSession } from "@/lib/auth";
import { listSessions, seedExampleSession } from "@/lib/db";

export default async function AdminPage() {
  if (!requireAdminSession()) {
    redirect("/admin/login");
  }

  await seedExampleSession();
  const sessions = await listSessions();

  return (
    <main className="min-h-screen px-4 py-10">
      <AdminDashboard initialSessions={sessions} />
    </main>
  );
}
