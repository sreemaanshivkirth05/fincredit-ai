import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { TopBar } from "@/components/top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#070B14] text-white">
        <div className="flex min-h-screen">
          <AppSidebar />

          <section className="flex-1">
            <TopBar />
            <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
