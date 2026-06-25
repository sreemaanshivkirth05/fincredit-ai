"use client";

import { useEffect, useState } from "react";

import {
  BarChart3,
  CheckCircle2,
  FileText,
  Gauge,
  Loader2,
  ShieldCheck,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const latestReport = reports.reports[0];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              AI Reports
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight">
              Reports & Analyst Outputs
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Review AI-generated analyst reports created from saved LangGraph
              agent runs, including grounding scores, unsupported claims, model
              workflow metadata, and report status.
            </p>

            {loading && (
              <p className="mt-2 flex items-center gap-2 text-xs text-blue-300">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading reports from PostgreSQL...
              </p>
            )}

            {!loading && reportsData && (
              <p className="mt-2 text-xs text-emerald-300">
                Reports connected: {reportsData.message}
              </p>
            )}

            {apiError && (
              <p className="mt-2 text-xs text-red-300">{apiError}</p>
            )}
          </div>

          <Badge className="w-fit bg-white/10 text-slate-300">
            LangGraph Report Workflow
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Reports"
            value={String(reports.totalReports)}
            change="PostgreSQL"
            icon={<FileText className="h-5 w-5 text-blue-300" />}
          />
          <MetricCard
            title="AI Agent Reports"
            value={String(aiGeneratedReports.length)}
            change="Generated"
            icon={<Sparkles className="h-5 w-5 text-violet-300" />}
          />
          <MetricCard
            title="Needs Review"
            value={String(reports.needsReview)}
            change="Analyst queue"
            icon={<Gauge className="h-5 w-5 text-amber-300" />}
          />
          <MetricCard
            title="Avg Grounding"
            value={`${reports.avgGrounding}%`}
            change="Evidence quality"
            icon={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
          />
        </div>

        {latestReport && (
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-300" />
                Latest Generated Report
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-blue-500/15 text-blue-200">
                      {latestReport.ticker}
                    </Badge>
                    <StatusBadge status={latestReport.status} />
                    <Badge className="bg-violet-500/15 text-violet-200">
                      {latestReport.type}
                    </Badge>
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-white">
                    {latestReport.company}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Report ID: {latestReport.id}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    This report was generated from a saved LangGraph/LLM agent
                    run and is currently marked as{" "}
                    <span className="font-medium text-white">
                      {latestReport.status}
                    </span>
                    .
                  </p>
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

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-300" />
              Generated Report Records
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Report ID</TableHead>
                  <TableHead className="text-slate-400">Ticker</TableHead>
                  <TableHead className="text-slate-400">Report Name</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Grounding</TableHead>
                  <TableHead className="text-slate-400">Unsupported</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reports.reports.map((report) => (
                  <TableRow key={report.id} className="border-white/10">
                    <TableCell className="font-medium text-white">
                      {report.id}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-blue-500/15 text-blue-200">
                        {report.ticker}
                      </Badge>
                    </TableCell>

                    <TableCell className="max-w-[280px] text-slate-300">
                      {report.company}
                    </TableCell>

                    <TableCell className="text-slate-300">
                      {report.type}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={report.grounding} className="w-20" />
                        <span className="text-sm text-slate-300">
                          {report.grounding}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-slate-300">
                      {report.unsupported}
                    </TableCell>

                    <TableCell className="text-slate-300">
                      {report.created}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {reports.reports.length === 0 && (
              <p className="mt-4 text-sm text-slate-400">
                No reports generated yet. Go to the Governance page and click
                Generate Report on a saved agent run.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-300" />
                Report Grounding Quality
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports.reportQuality}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="report" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                    <Bar
                      dataKey="grounding"
                      fill="#34d399"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {reports.reportQuality.length === 0 && (
                <p className="mt-4 text-sm text-slate-400">
                  Report grounding chart will appear after reports are generated.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-violet-300" />
                Report Workflow
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {reports.workflow.map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{step.title}</p>
                    <StatusBadge status={step.status} />
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {step.detail}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
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
                title="Report Record"
                detail="Governance action converts the agent run into a saved report."
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
    <Card className="border-white/10 bg-white/[0.04] text-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          {icon}
          <Badge className="bg-white/10 text-slate-300">{change}</Badge>
        </div>
        <p className="mt-5 text-sm text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-white">{value}</p>
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
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-200">
        {step}
      </div>

      <p className="mt-4 font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Approved" || status === "Complete" || status === "Ready"
      ? "bg-emerald-500/15 text-emerald-200"
      : status === "Needs Review" || status === "In Review"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-blue-500/15 text-blue-200";

  return <Badge className={styles}>{status}</Badge>;
}