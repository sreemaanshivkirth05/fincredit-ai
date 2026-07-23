"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  BriefcaseBusiness,
  Eye,
  History,
  Loader2,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminOverview,
  getAdminUserDetail,
  getAdminUsers,
  getCurrentUser,
} from "@/lib/api";

type AdminOverview = {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  totalHoldings: number;
  totalTransactions: number;
  totalWatchlistItems: number;
  totalAgentRuns: number;
  totalPortfolioValue: number;
  message: string;
};

type AdminUserSummary = {
  id: number;
  email: string;
  fullName?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  holdingsCount: number;
  transactionsCount: number;
  watchlistCount: number;
  agentRunsCount: number;
  portfolioValue: number;
  totalCost: number;
  unrealizedPL: number;
};

type AdminUserDetail = {
  user: AdminUserSummary;
  holdings: Array<{
    ticker: string;
    company: string;
    shares: number;
    value: number;
    weight: number;
  }>;
  transactions: Array<{
    id: number;
    ticker: string;
    action: string;
    shares: number;
    totalAmount: number;
    createdAt?: string | null;
  }>;
  watchlist: Array<{
    ticker: string;
    company: string;
    status: string;
  }>;
  agentRuns: Array<{
    id: number;
    question: string;
    ticker?: string | null;
    groundingScore: number;
    createdAt: string;
  }>;
  message: string;
};

export default function AdminPage() {
  return (
    <AppShell>
      <AdminConsole />
    </AppShell>
  );
}

function AdminConsole() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        setError("");
        const currentUser = await getCurrentUser();

        if (currentUser.role !== "admin") {
          setLoading(false);
          setError("ACCESS_DENIED");
          return;
        }

        const [overviewResponse, usersResponse] = await Promise.all([
          getAdminOverview(),
          getAdminUsers(),
        ]);
        setOverview(overviewResponse);
        setUsers(usersResponse.users ?? []);
        setSelectedUserId(usersResponse.users?.[0]?.id ?? null);
      } catch (loadError) {
        console.error(loadError);
        setError("Unable to load admin data. Confirm you are logged in as admin.");
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    const userId = selectedUserId;

    async function loadDetail() {
      try {
        setLoadingDetail(true);
        setDetail(await getAdminUserDetail(userId));
      } catch (detailError) {
        console.error(detailError);
        setDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    }

    loadDetail();
  }, [selectedUserId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  return (
    <div data-testid="admin-page" className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge className="mb-3 bg-amber-500/15 text-amber-200">
            Admin Console
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            User Management
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Read-only admin view. This page does not modify user data.
          </p>
        </div>

        <Link href="/dashboard">
          <Button className="bg-white/10 text-white hover:bg-white/20">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {loading && (
        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardContent className="flex items-center gap-3 p-5 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
            Loading admin overview...
          </CardContent>
        </Card>
      )}

      {error === "ACCESS_DENIED" && (
        <Card
          data-testid="admin-access-denied"
          className="border-amber-500/30 bg-amber-500/10 text-amber-100"
        >
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">Access denied</h2>
            <p className="mt-2 text-sm leading-6 text-amber-100/80">
              This read-only console requires an admin account. Your normal
              portfolio and watchlist remain isolated to your account.
            </p>
            <Link href="/dashboard">
              <Button className="mt-5 bg-amber-500 text-white hover:bg-amber-600">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {error && error !== "ACCESS_DENIED" && (
        <p className="text-sm text-red-300">{error}</p>
      )}

      {overview && (
        <div
          data-testid="admin-overview"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            title="Total Users"
            value={String(overview.totalUsers)}
            detail={`${overview.activeUsers} active, ${overview.adminUsers} admin`}
            icon={<Users className="h-5 w-5 text-blue-300" />}
          />
          <MetricCard
            title="Portfolio Value"
            value={formatCurrency(overview.totalPortfolioValue)}
            detail={`${overview.totalHoldings} holdings`}
            icon={<Wallet className="h-5 w-5 text-emerald-300" />}
          />
          <MetricCard
            title="Transactions"
            value={String(overview.totalTransactions)}
            detail={`${overview.totalWatchlistItems} watchlist rows`}
            icon={<History className="h-5 w-5 text-amber-300" />}
          />
          <MetricCard
            title="AI Runs"
            value={String(overview.totalAgentRuns)}
            detail="Saved agent history"
            icon={<Bot className="h-5 w-5 text-violet-300" />}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card
          data-testid="admin-users-table"
          className="border-white/10 bg-white/[0.04] text-white"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-300" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400">Portfolio</TableHead>
                  <TableHead className="text-slate-400">Usage</TableHead>
                  <TableHead className="text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-white/10">
                    <TableCell>
                      <p className="font-medium text-white">
                        {user.fullName || user.email}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-amber-500/15 text-amber-200"
                            : "bg-blue-500/15 text-blue-200"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-300">
                        {formatCurrency(user.portfolioValue)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user.holdingsCount} holdings
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-300">
                        {user.transactionsCount} transactions
                      </p>
                      <p className="text-xs text-slate-500">
                        {user.agentRunsCount} AI runs
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setSelectedUserId(user.id)}
                        className="bg-white/10 text-white hover:bg-white/20"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card
          data-testid="admin-user-detail"
          className="border-white/10 bg-white/[0.04] text-white"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              User Detail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDetail && (
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                Loading user detail...
              </div>
            )}

            {!loadingDetail && selectedUser && (
              <>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:border-emerald-300/25">
                  <p className="text-sm font-semibold text-white">
                    {selectedUser.fullName || selectedUser.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedUser.email}
                  </p>
                  <p className="mt-3 text-sm text-slate-300">
                    Portfolio: {formatCurrency(selectedUser.portfolioValue)} |
                    Unrealized P/L: {formatCurrency(selectedUser.unrealizedPL)}
                  </p>
                </div>

                <DetailSection
                  title="Holdings"
                  items={
                    detail?.holdings.map(
                      (holding) =>
                        `${holding.ticker} - ${formatCurrency(holding.value)} (${holding.weight.toFixed(2)}%)`
                    ) ?? []
                  }
                  empty="No holdings for this user."
                  icon={<BriefcaseBusiness className="h-4 w-4 text-blue-300" />}
                />
                <DetailSection
                  title="Latest Transactions"
                  items={
                    detail?.transactions.map(
                      (transaction) =>
                        `${transaction.action} ${transaction.ticker} - ${formatCurrency(transaction.totalAmount)}`
                    ) ?? []
                  }
                  empty="No transactions for this user."
                  icon={<History className="h-4 w-4 text-amber-300" />}
                />
                <DetailSection
                  title="Watchlist"
                  items={
                    detail?.watchlist.map(
                      (item) => `${item.ticker} - ${item.status}`
                    ) ?? []
                  }
                  empty="No watchlist items for this user."
                  icon={<Eye className="h-4 w-4 text-emerald-300" />}
                />
                <DetailSection
                  title="Latest AI Runs"
                  items={
                    detail?.agentRuns.map(
                      (run) =>
                        `#${run.id} ${run.ticker || "Portfolio"} - ${run.groundingScore}% grounding`
                    ) ?? []
                  }
                  empty="No AI runs for this user."
                  icon={<Bot className="h-4 w-4 text-violet-300" />}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-[#0d1424]/80 text-white shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/25">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
            {icon}
          </div>
          <Badge className="bg-white/10 text-slate-300">Admin</Badge>
        </div>
        <p className="mt-5 text-sm text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function DetailSection({
  title,
  items,
  empty,
  icon,
}: {
  title: string;
  items: string[];
  empty: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:border-blue-300/25">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
          {icon}
        </div>
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.slice(0, 6).map((item) => (
            <p key={item} className="text-sm leading-6 text-slate-300">
              {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-slate-500">{empty}</p>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value: number | null | undefined) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}
