import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { TopBar } from "@/components/top-bar";
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="fc-app">
        <a className="fc-skip" href="#workspace-content">
          Skip to content
        </a>
        <AppSidebar />
        <div className="fc-app-body">
          <TopBar />
          <main id="workspace-content" className="fc-content">
            {children}
          </main>
          <footer className="fc-app-footer">
            <span>FinCredit AI · Independent research workspace</span>
            <span>Simulated investing. Human decisions.</span>
          </footer>
        </div>
      </div>
    </AuthGuard>
  );
}
