"use client";

import type React from "react";
import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Database,
  DollarSign,
  FileCheck2,
  Gauge,
  Layers3,
  ServerCog,
  ShieldCheck,
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
import { getGovernanceData } from "@/lib/api";

type ModelUsage = {
  model: string;
  task: string;
  calls: number;
  cost: number;
  status: string;
};

type QualityMetric = {
  metric: string;
  value: number;
};

type AgentRun = {
  agent: string;
  company: string;
  status: string;
  model: string;
  duration: string;
  grounding: number;
};

type DataSource = {
  source: string;
  status: string;
  lastSync: string;
  latency: string;
};

type AuditLog = {
  time: string;
  event: string;
  detail: string;
  severity: string;
};

type GovernanceApiData = {
  totalModelCalls: number;
  estimatedCost: number;
  avgGrounding: number;
  auditEvents: number;
  modelUsage: ModelUsage[];
  qualityMetrics: QualityMetric[];
  agentRuns: AgentRun[];
  dataSources: DataSource[];
  auditLogs: AuditLog[];
  message: string;
};

const fallbackModelUsage: ModelUsage[] = [
  {
    model: "ChatGPT API",
    task: "Final reasoning, report writing, investment thesis synthesis",
    calls: 42,
    cost: 3.84,
    status: "Active",
  },
  {
    model: "Ollama Qwen Local",
    task: "Sentiment classification, red flag tagging, filing extraction",
    calls: 128,
    cost: 0,
    status: "Active",
  },
];

const fallbackQualityMetrics: QualityMetric[] = [
  { metric: "Citation Coverage", value: 91 },
  { metric: "Grounding Score", value: 92 },
  { metric: "Model Agreement", value: 84 },
  { metric: "Unsupported Claim Rate", value: 6 },
];

const fallbackAgentRuns: AgentRun[] = [
  {
    agent: "Credit Risk Agent",
    company: "TSLA",
    status: "Completed",
    model: "ChatGPT API",
    duration: "18.4s",
    grounding: 87,
  },
  {
    agent: "Filing Analysis Agent",
    company: "MSFT",
    status: "Completed",
    model: "Ollama + ChatGPT API",
    duration: "22.1s",
    grounding: 94,
  },
  {
    agent: "News Sentiment Agent",
    company: "NVDA",
    status: "Completed",
    model: "Ollama Qwen Local",
    duration: "8.7s",
    grounding: 89,
  },
  {
    agent: "Report Writer Agent",
    company: "JPM",
    status: "In Review",
    model: "ChatGPT API",
    duration: "31.5s",
    grounding: 96,
  },
];

const fallbackDataSources: DataSource[] = [
  {
    source: "SEC EDGAR",
    status: "Healthy",
    lastSync: "2 minutes ago",
    latency: "420ms",
  },
  {
    source: "SEC Company Facts",
    status: "Healthy",
    lastSync: "5 minutes ago",
    latency: "510ms",
  },
  {
    source: "Yahoo Finance",
    status: "Healthy",
    lastSync: "1 minute ago",
    latency: "380ms",
  },
  {
    source: "GDELT News",
    status: "Delayed",
    lastSync: "18 minutes ago",
    latency: "1.8s",
  },
];

const fallbackAuditLogs: AuditLog[] = [
  {
    time: "10:42 AM",
    event: "Report generated",
    detail: "TSLA red flag review generated with 87% grounding score.",
    severity: "Info",
  },
  {
    time: "10:39 AM",
    event: "Unsupported claim detected",
    detail: "Two statements required analyst review before approval.",
    severity: "Warning",
  },
  {
    time: "10:31 AM",
    event: "Local model routed",
    detail: "Ollama handled 18 sentiment classification tasks.",
    severity: "Info",
  },
  {
    time: "10:24 AM",
    event: "Data source delay",
    detail: "GDELT news refresh exceeded latency threshold.",
    severity: "Warning",
  },
];

export default function GovernancePage() {
  const [governanceData, setGovernanceData] =
    useState<GovernanceApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    async function loadGovernanceData() {
      try {
        const data = await getGovernanceData();
        setGovernanceData(data);
      } catch (error) {
        console.error(error);
        setApiError("Backend governance API is not connected.");
      } finally {
        setLoading(false);
      }
    }

    loadGovernanceData();
  }, []);

  const modelUsage = governanceData?.modelUsage ?? fallbackModelUsage;
  const qualityMetrics =
    governanceData?.qualityMetrics ?? fallbackQualityMetrics;
  const agentRuns = governanceData?.agentRuns ?? fallbackAgentRuns;
  const dataSources = governanceData?.dataSources ?? fallbackDataSources;
  const auditLogs = governanceData?.auditLogs ?? fallbackAuditLogs;

  const totalModelCalls = governanceData?.totalModelCalls ?? 170;
  const estimatedCost = governanceData?.estimatedCost ?? 3.84;
  const avgGrounding = governanceData?.avgGrounding ?? 92;
  const auditEvents = governanceData?.auditEvents ?? 24;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Badge className="mb-3 bg-blue-500/15 text-blue-200">
            AI Governance
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            Governance Dashboard
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Monitor model routing, cost usage, agent runs, source health,
            grounding quality, and audit events across the FinCredit AI
            platform.
          </p>

          {loading && (
            <p className="mt-2 text-xs text-blue-300">
              Loading backend governance data...
            </p>
          )}

          {!loading && governanceData && (
            <p className="mt-2 text-xs text-emerald-300">
              Backend connected: {governanceData.message}
            </p>
          )}

          {apiError && <p className="mt-2 text-xs text-red-300">{apiError}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Model Calls"
            value={String(totalModelCalls)}
            change="Today"
            icon={<Bot className="h-5 w-5 text-blue-300" />}
          />
          <MetricCard
            title="Estimated Cost"
            value={`$${estimatedCost.toFixed(2)}`}
            change="Local-first"
            icon={<DollarSign className="h-5 w-5 text-emerald-300" />}
          />
          <MetricCard
            title="Avg Grounding"
            value={`${avgGrounding}%`}
            change="Evidence-backed"
            icon={<ShieldCheck className="h-5 w-5 text-violet-300" />}
          />
          <MetricCard
            title="Audit Events"
            value={String(auditEvents)}
            change="Tracked"
            icon={<FileCheck2 className="h-5 w-5 text-amber-300" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-blue-300" />
                Dual-LLM Routing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {modelUsage.map((model) => (
                <div
                  key={model.model}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{model.model}</p>
                    <StatusBadge status={model.status} />
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {model.task}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-xs text-slate-500">Calls</p>
                      <p className="mt-1 font-semibold">{model.calls}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-xs text-slate-500">Cost</p>
                      <p className="mt-1 font-semibold">
                        ${model.cost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-emerald-300" />
                Quality Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="metric" stroke="#94a3b8" />
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
                      dataKey="value"
                      fill="#34d399"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {qualityMetrics.map((metric) => (
                  <QualityMetric
                    key={metric.metric}
                    label={metric.metric}
                    value={metric.value}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-300" />
              Agent Run Monitor
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Agent</TableHead>
                  <TableHead className="text-slate-400">Company</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Model</TableHead>
                  <TableHead className="text-slate-400">Duration</TableHead>
                  <TableHead className="text-slate-400">Grounding</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {agentRuns.map((run) => (
                  <TableRow
                    key={`${run.agent}-${run.company}`}
                    className="border-white/10"
                  >
                    <TableCell className="font-medium text-white">
                      {run.agent}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {run.company}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={run.status} />
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {run.model}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {run.duration}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={run.grounding} className="w-24" />
                        <span className="text-sm text-slate-300">
                          {run.grounding}%
                        </span>
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
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-violet-300" />
                Data Source Health
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {dataSources.map((source) => (
                <div
                  key={source.source}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{source.source}</p>
                    <SourceStatusBadge status={source.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Last sync</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {source.lastSync}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Latency</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {source.latency}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ServerCog className="h-5 w-5 text-amber-300" />
                Audit Trail
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={`${log.time}-${log.event}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{log.event}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.time}
                      </p>
                    </div>
                    <SeverityBadge severity={log.severity} />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {log.detail}
                  </p>
                </div>
              ))}
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

function QualityMetric({ label, value }: { label: string; value: number }) {
  const shownValue = label === "Unsupported Claim Rate" ? 100 - value : value;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-slate-300">{label}</p>
        <p className="text-sm text-slate-400">{value}%</p>
      </div>
      <Progress value={shownValue} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Active" || status === "Completed"
      ? "bg-emerald-500/15 text-emerald-200"
      : status === "In Review"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-slate-500/15 text-slate-200";

  return <Badge className={styles}>{status}</Badge>;
}

function SourceStatusBadge({ status }: { status: string }) {
  const styles =
    status === "Healthy"
      ? "bg-emerald-500/15 text-emerald-200"
      : "bg-amber-500/15 text-amber-200";

  const Icon = status === "Healthy" ? CheckCircle2 : AlertTriangle;

  return (
    <Badge className={styles}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {status}
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles =
    severity === "Warning"
      ? "bg-amber-500/15 text-amber-200"
      : "bg-blue-500/15 text-blue-200";

  return <Badge className={styles}>{severity}</Badge>;
}