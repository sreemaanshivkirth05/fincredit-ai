"use client";

import type React from "react";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  ShieldCheck,
  Sparkles,
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const reports = [
  {
    id: "RPT-1042",
    company: "Microsoft",
    ticker: "MSFT",
    type: "Credit Risk + Filing Analysis",
    status: "Approved",
    grounding: 94,
    unsupported: 0,
    model: "ChatGPT API",
    created: "Jun 15, 2026",
  },
  {
    id: "RPT-1041",
    company: "Tesla",
    ticker: "TSLA",
    type: "Red Flag Review",
    status: "Needs Review",
    grounding: 87,
    unsupported: 2,
    model: "ChatGPT API + Ollama",
    created: "Jun 14, 2026",
  },
  {
    id: "RPT-1040",
    company: "NVIDIA",
    ticker: "NVDA",
    type: "Peer Benchmark",
    status: "Draft",
    grounding: 91,
    unsupported: 1,
    model: "ChatGPT API",
    created: "Jun 13, 2026",
  },
  {
    id: "RPT-1039",
    company: "JPMorgan Chase",
    ticker: "JPM",
    type: "Portfolio Impact Memo",
    status: "Approved",
    grounding: 96,
    unsupported: 0,
    model: "ChatGPT API + Ollama",
    created: "Jun 12, 2026",
  },
];

const reportQuality = [
  { report: "MSFT", grounding: 94 },
  { report: "TSLA", grounding: 87 },
  { report: "NVDA", grounding: 91 },
  { report: "JPM", grounding: 96 },
];

const workflow = [
  {
    title: "Data Collection",
    detail: "SEC filings, financial ratios, portfolio exposure, and news radar data collected.",
    status: "Complete",
  },
  {
    title: "Agent Analysis",
    detail: "Specialist agents generated credit risk, filing, peer, and red flag analysis.",
    status: "Complete",
  },
  {
    title: "Citation Validation",
    detail: "Evidence panel checked claims, source coverage, and unsupported statements.",
    status: "Complete",
  },
  {
    title: "Analyst Approval",
    detail: "Reports can be approved, revised, exported as PDF, or sent as an email digest.",
    status: "In Review",
  },
];

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              AI Analyst Reports
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Generate, review, approve, export, and audit evidence-backed
              financial intelligence reports across companies, portfolios,
              filings, risk events, and peer benchmarks.
            </p>
          </div>

          <Button className="bg-blue-500 hover:bg-blue-600">
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Reports"
            value="18"
            change="+4 this week"
            icon={<FileText className="h-5 w-5 text-blue-300" />}
          />
          <MetricCard
            title="Approved"
            value="12"
            change="Ready"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />}
          />
          <MetricCard
            title="Needs Review"
            value="3"
            change="Analyst queue"
            icon={<AlertTriangle className="h-5 w-5 text-amber-300" />}
          />
          <MetricCard
            title="Avg Grounding"
            value="92%"
            change="Evidence-backed"
            icon={<ShieldCheck className="h-5 w-5 text-violet-300" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle>Grounding Score by Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportQuality}>
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
                      fill="#60a5fa"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle>Report Generation Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workflow.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.title}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.detail}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Report ID</TableHead>
                  <TableHead className="text-slate-400">Company</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Grounding</TableHead>
                  <TableHead className="text-slate-400">Unsupported</TableHead>
                  <TableHead className="text-slate-400">Model</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                  <TableHead className="text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="border-white/10">
                    <TableCell className="font-medium text-white">
                      {report.id}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div>
                        <p className="font-medium text-white">
                          {report.ticker}
                        </p>
                        <p className="text-xs text-slate-500">
                          {report.company}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {report.type}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="min-w-28">
                        <div className="mb-1 flex justify-between text-xs">
                          <span>{report.grounding}%</span>
                        </div>
                        <Progress value={report.grounding} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <UnsupportedBadge count={report.unsupported} />
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {report.model}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {report.created}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          Open
                          <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle>Citation Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <QualityMetric label="SEC filing citations" value={96} />
              <QualityMetric label="Financial metric citations" value={93} />
              <QualityMetric label="News source citations" value={88} />
              <QualityMetric label="Portfolio data traceability" value={98} />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle>Export & Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <ExportCard
                  title="PDF Export"
                  value="Ready"
                  detail="Jinja2 + WeasyPrint report rendering"
                />
                <ExportCard
                  title="Email Digest"
                  value="Enabled"
                  detail="Weekly Gmail SMTP delivery"
                />
                <ExportCard
                  title="Approval Flow"
                  value="Active"
                  detail="Draft, needs review, approved"
                />
                <ExportCard
                  title="Audit Trail"
                  value="Logged"
                  detail="Model, prompt, sources, citations"
                />
              </div>
            </CardContent>
          </Card>
        </div>
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

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Approved" || status === "Complete" || status === "Ready"
      ? "bg-emerald-500/15 text-emerald-200"
      : status === "Needs Review" || status === "In Review"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-blue-500/15 text-blue-200";

  return <Badge className={styles}>{status}</Badge>;
}

function UnsupportedBadge({ count }: { count: number }) {
  const styles =
    count === 0
      ? "bg-emerald-500/15 text-emerald-200"
      : count === 1
        ? "bg-amber-500/15 text-amber-200"
        : "bg-red-500/15 text-red-200";

  return <Badge className={styles}>{count}</Badge>;
}

function QualityMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function ExportCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}