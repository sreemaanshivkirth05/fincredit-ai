"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  BarChart3,
  CheckCircle2,
  FileText,
  Gauge,
  Loader2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getReportsData } from "@/lib/api";

type ReportItem = {
  id: string;
  company: string;
  ticker: string;
  type: string;
  status: string;
  grounding: number;
  unsupported: number;
  model: string;
  created: string;
};

type ReportQuality = {
  report: string;
  grounding: number;
};

type WorkflowStep = {
  title: string;
  detail: string;
  status: string;
};

type ReportsData = {
  totalReports: number;
  approvedReports: number;
  needsReview: number;
  avgGrounding: number;
  reports: ReportItem[];
  reportQuality: ReportQuality[];
  workflow: WorkflowStep[];
  message: string;
};

const fallbackReports: ReportsData = {
  totalReports: 0,
  approvedReports: 0,
  needsReview: 0,
  avgGrounding: 0,
  reports: [],
  reportQuality: [],
  workflow: [
    {
      title: "Data Collection",
      detail:
        "Market snapshots, SEC fundamentals, portfolio holdings, and saved agent runs are collected.",
      status: "Complete",
    },
    {
      title: "LangGraph Agent Analysis",
      detail:
        "Portfolio, market, SEC, risk, evidence, and LLM answer agents generate the research response.",
      status: "Complete",
    },
    {
      title: "Report Generation",
      detail:
        "Saved LangGraph runs can be converted into analyst report records.",
      status: "Ready",
    },
    {
      title: "Governance Review",
      detail:
        "Grounding score, unsupported claims, evidence, and model workflow metadata are available for audit review.",
      status: "In Review",
    },
  ],
  message: "Fallback reports data loaded",
};

export default function ReportsPage() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [groundingFilter, setGroundingFilter] = useState("All");
  const [sortMode, setSortMode] = useState("Latest");

  useEffect(() => {
    async function loadReportsData() {
      try {
        setLoading(true);
        setApiError("");

        const response = await getReportsData();
        setReportsData(response);
      } catch (error) {
        console.error(error);
        setApiError("Reports API is not connected. Showing fallback data.");
      } finally {
        setLoading(false);
      }
    }

    loadReportsData();
  }, []);

  const reports = reportsData ?? fallbackReports;

  const aiGeneratedReports = reports.reports.filter((report) =>
    report.type.toLowerCase().includes("ai")
  );

  const filteredReports = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    let output = reports.reports.filter((report) => {
      const matchesSearch =
        search.length === 0 ||
        report.id.toLowerCase().includes(search) ||
        report.ticker.toLowerCase().includes(search) ||
        report.company.toLowerCase().includes(search) ||
        report.type.toLowerCase().includes(search) ||
        report.status.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || report.status === statusFilter;

      const matchesGrounding =
        groundingFilter === "All" ||
        (groundingFilter === "90+" && report.grounding >= 90) ||
        (groundingFilter === "80-89" &&
          report.grounding >= 80 &&
          report.grounding < 90) ||
        (groundingFilter === "Below 80" && report.grounding < 80);

      return matchesSearch && matchesStatus && matchesGrounding;
    });

    output = [...output].sort((a, b) => {
      if (sortMode === "Grounding High") {
        return b.grounding - a.grounding;
      }

      if (sortMode === "Grounding Low") {
        return a.grounding - b.grounding;
      }

      if (sortMode === "Ticker") {
        return a.ticker.localeCompare(b.ticker);
      }

      return b.id.localeCompare(a.id);
    });

    return output;
  }, [reports.reports, searchText, statusFilter, groundingFilter, sortMode]);

  const latestReport = filteredReports[0] ?? reports.reports[0];

  const visibleReportQuality = filteredReports.map((report) => ({
    report: report.ticker,
    grounding: report.grounding,
  }));

  function resetFilters() {
    setSearchText("");
    setStatusFilter("All");
    setGroundingFilter("All");
    setSortMode("Latest");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-[#e8eee8] text-[#285b4b]">
              AI Reports
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight">
              Reports & Analyst Outputs
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review, search, filter, approve, export, and audit AI-generated
              analyst reports created from saved LangGraph agent runs.
            </p>

            {loading && (
              <p className="mt-2 flex items-center gap-2 text-xs text-[#285b4b]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading reports from PostgreSQL...
              </p>
            )}

            {!loading && reportsData && (
              <p className="mt-2 text-xs text-emerald-800">
                Reports connected: {reportsData.message}
              </p>
            )}

            {apiError && (
              <p className="mt-2 text-xs text-red-800">{apiError}</p>
            )}
          </div>

          <Badge className="w-fit bg-[#eeefe9] text-slate-700">
            LangGraph Report Workflow
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Reports"
            value={String(reports.totalReports)}
            change="PostgreSQL"
            icon={<FileText className="h-5 w-5 text-[#285b4b]" />}
          />
          <MetricCard
            title="AI Agent Reports"
            value={String(aiGeneratedReports.length)}
            change="Generated"
            icon={<Sparkles className="h-5 w-5 text-[#285b4b]" />}
          />
          <MetricCard
            title="Needs Review"
            value={String(reports.needsReview)}
            change="Analyst queue"
            icon={<Gauge className="h-5 w-5 text-amber-800" />}
          />
          <MetricCard
            title="Avg Stored Score"
            value={`${reports.avgGrounding}%`}
            change="Availability / legacy scores; not accuracy"
            icon={<ShieldCheck className="h-5 w-5 text-emerald-800" />}
          />
        </div>

        <Card className="border-[#dedfd6] bg-white text-[#202c29]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#285b4b]" />
              Search & Filter Reports
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search report ID, ticker, company, type, or status..."
                  className="border-[#dedfd6] bg-black/30 pl-9 text-[#202c29] placeholder:text-slate-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-md border border-[#dedfd6] bg-black/30 px-3 text-sm text-[#202c29] outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={groundingFilter}
                onChange={(event) => setGroundingFilter(event.target.value)}
                className="h-10 rounded-md border border-[#dedfd6] bg-black/30 px-3 text-sm text-[#202c29] outline-none"
              >
                <option value="All">All Grounding</option>
                <option value="90+">90%+</option>
                <option value="80-89">80% - 89%</option>
                <option value="Below 80">Below 80%</option>
              </select>

              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
                className="h-10 rounded-md border border-[#dedfd6] bg-black/30 px-3 text-sm text-[#202c29] outline-none"
              >
                <option value="Latest">Latest First</option>
                <option value="Grounding High">Grounding High</option>
                <option value="Grounding Low">Grounding Low</option>
                <option value="Ticker">Ticker A-Z</option>
              </select>

              <Button
                type="button"
                variant="outline"
                className="border-[#dedfd6] bg-white text-slate-700 hover:bg-[#eeefe9] hover:text-[#202c29]"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <Badge className="bg-[#eeefe9] text-slate-700">
                Showing {filteredReports.length} of {reports.reports.length}
              </Badge>
              {searchText && (
                <Badge className="bg-[#e8eee8] text-[#285b4b]">
                  Search: {searchText}
                </Badge>
              )}
              {statusFilter !== "All" && (
                <Badge className="bg-amber-500/15 text-amber-800">
                  Status: {statusFilter}
                </Badge>
              )}
              {groundingFilter !== "All" && (
                <Badge className="bg-emerald-500/15 text-emerald-800">
                  Grounding: {groundingFilter}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {latestReport && (
          <Card className="border-[#dedfd6] bg-white text-[#202c29]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#285b4b]" />
                Top Matching Report
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-xl border border-[#dedfd6] bg-[#f4f5f0] p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-[#e8eee8] text-[#285b4b]">
                      {latestReport.ticker}
                    </Badge>
                    <StatusBadge status={latestReport.status} />
                    <Badge className="bg-[#e8eee8] text-[#285b4b]">
                      {latestReport.type}
                    </Badge>
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-[#202c29]">
                    {latestReport.company}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    Report ID: {latestReport.id}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    This is the top report matching your current filters. Open
                    it to review the full AI report, approval history, comments,
                    and PDF export.
                  </p>

                  <div className="mt-4">
                    <Link href={`/reports/${latestReport.id}`}>
                      <Button
                        type="button"
                        className="bg-[#245544] text-[#202c29] hover:bg-[#245544]"
                      >
                        View Report
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <MiniMetric
                    label="Grounding"
                    value={`${latestReport.grounding}%`}
                  />
                  <MiniMetric
                    label="Unsupported Claims"
                    value={String(latestReport.unsupported)}
                  />
                  <MiniMetric label="Created" value={latestReport.created} />
                  <MiniMetric label="Model" value={latestReport.model} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-[#dedfd6] bg-white text-[#202c29]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#285b4b]" />
              Generated Report Records
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-[#dedfd6]">
                  <TableHead className="text-slate-600">Report ID</TableHead>
                  <TableHead className="text-slate-600">Ticker</TableHead>
                  <TableHead className="text-slate-600">Report Name</TableHead>
                  <TableHead className="text-slate-600">Type</TableHead>
                  <TableHead className="text-slate-600">Status</TableHead>
                  <TableHead className="text-slate-600">Stored score</TableHead>
                  <TableHead className="text-slate-600">Unsupported</TableHead>
                  <TableHead className="text-slate-600">Created</TableHead>
                  <TableHead className="text-slate-600">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="border-[#dedfd6]">
                    <TableCell className="font-medium text-[#202c29]">
                      {report.id}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-[#e8eee8] text-[#285b4b]">
                        {report.ticker}
                      </Badge>
                    </TableCell>

                    <TableCell className="max-w-[280px] text-slate-700">
                      {report.company}
                    </TableCell>

                    <TableCell className="text-slate-700">
                      {report.type}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={report.grounding} className="w-20" />
                        <span className="text-sm text-slate-700">
                          {report.grounding}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-slate-700">
                      {report.unsupported}
                    </TableCell>

                    <TableCell className="text-slate-700">
                      {report.created}
                    </TableCell>

                    <TableCell>
                      <Link href={`/reports/${report.id}`}>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-[#245544] text-[#202c29] hover:bg-[#245544]"
                        >
                          View Report
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredReports.length === 0 && (
              <p className="mt-4 text-sm text-slate-600">
                No reports match the current filters. Reset filters or generate
                more reports from the Governance page.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-[#dedfd6] bg-white text-[#202c29]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-800" />
                Filtered Stored Scores
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="h-[320px] min-h-[320px] min-w-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visibleReportQuality}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e6d8" />
                    <XAxis dataKey="report" stroke="#7b8870" />
                    <YAxis stroke="#7b8870" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #d5ddcc",
                        borderRadius: "12px",
                        color: "#283b2d",
                      }}
                    />
                    <Bar
                      dataKey="grounding"
                      fill="#6b9162"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {visibleReportQuality.length === 0 && (
                <p className="mt-4 text-sm text-slate-600">
                  Report grounding chart will appear when matching reports are
                  available.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#dedfd6] bg-white text-[#202c29]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-[#285b4b]" />
                Report Workflow
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {reports.workflow.map((step) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-[#dedfd6] bg-[#f4f5f0] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-[#202c29]">{step.title}</p>
                    <StatusBadge status={step.status} />
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.detail}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#dedfd6] bg-white text-[#202c29]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-800" />
              How Reports Are Created
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <ProcessStep
                step="1"
                title="Ask FinCredit"
                detail="User asks a financial risk question."
              />
              <ProcessStep
                step="2"
                title="LangGraph Run"
                detail="Agents collect portfolio, market, SEC, and evidence context."
              />
              <ProcessStep
                step="3"
                title="LLM Response"
                detail="LangChain/Ollama generates an analyst-style response."
              />
              <ProcessStep
                step="4"
                title="Report Review"
                detail="Governance action converts the run into a report with comments, approval history, and PDF export."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-[#dedfd6] bg-white text-[#202c29]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          {icon}
          <Badge className="bg-[#eeefe9] text-slate-700">{change}</Badge>
        </div>
        <p className="mt-5 text-sm text-slate-600">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#dedfd6] bg-[#f4f5f0] p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-[#202c29]">{value}</p>
    </div>
  );
}

function ProcessStep({
  step,
  title,
  detail,
}: {
  step: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[#dedfd6] bg-[#f4f5f0] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8eee8] text-sm font-semibold text-[#285b4b]">
        {step}
      </div>

      <p className="mt-4 font-medium text-[#202c29]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Approved" || status === "Complete" || status === "Ready"
      ? "bg-emerald-500/15 text-emerald-800"
      : status === "Rejected"
        ? "bg-red-500/15 text-red-800"
        : status === "Needs Review" || status === "In Review"
          ? "bg-amber-500/15 text-amber-800"
          : "bg-[#e8eee8] text-[#285b4b]";

  return <Badge className={styles}>{status}</Badge>;
}