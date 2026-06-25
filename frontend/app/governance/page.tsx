"use client";

import type React from "react";
import { useEffect, useState } from "react";

import {
  Activity,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Database,
  FileSearch,
  Loader2,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

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
import {
  generateReportFromAgentRun,
  getAgentRuns,
  getGovernanceData,
} from "@/lib/api";

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

type GovernanceData = {
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

type RiskDriver = {
  ticker: string;
  driver: string;
  impact: string;
};

type EvidenceItem = {
  source: string;
  claim: string;
  confidence: number;
};

type StoredAgentRun = {
  id: number;
  question: string;
  ticker: string | null;
  answer: string;
  workflow: string;
  agentsUsed: string[];
  groundingScore: number;
  unsupportedClaims: number;
  status: string;
  riskDrivers: RiskDriver[];
  evidence: EvidenceItem[];
  suggestedActions: string[];
  createdAt: string;
};

type AgentRunsResponse = {
  totalRuns: number;
  runs: StoredAgentRun[];
  message: string;
};

type GeneratedReportResponse = {
  reportId: string;
  agentRunId: number;
  ticker: string;
  company: string;
  reportType: string;
  status: string;
  grounding: number;
  unsupported: number;
  model: string;
  created: string;
  message: string;
};

const fallbackGovernance: GovernanceData = {
  totalModelCalls: 170,
  estimatedCost: 3.84,
  avgGrounding: 92,
  auditEvents: 4,
  modelUsage: [
    {
      model: "LangChain ChatOllama",
      task: "Local LLM answer generation for financial research responses",
      calls: 42,
      cost: 0,
      status: "Active",
    },
    {
      model: "LangGraph Workflow",
      task: "Portfolio, market, SEC, risk, evidence, and answer orchestration",
      calls: 42,
      cost: 0,
      status: "Active",
    },
  ],
  qualityMetrics: [
    { metric: "Citation Coverage", value: 91 },
    { metric: "Grounding Score", value: 92 },
    { metric: "Model Agreement", value: 84 },
    { metric: "Unsupported Claim Rate", value: 6 },
  ],
  agentRuns: [
    {
      agent: "Credit Risk Agent",
      company: "TSLA",
      status: "Completed",
      model: "LangGraph + Ollama",
      duration: "18.4s",
      grounding: 87,
    },
    {
      agent: "Filing Analysis Agent",
      company: "MSFT",
      status: "Completed",
      model: "LangGraph + Ollama",
      duration: "22.1s",
      grounding: 94,
    },
  ],
  dataSources: [
    {
      source: "SEC Company Facts API",
      status: "Healthy",
      lastSync: "2 minutes ago",
      latency: "420ms",
    },
    {
      source: "Yahoo Finance / yfinance",
      status: "Healthy",
      lastSync: "1 minute ago",
      latency: "380ms",
    },
    {
      source: "PostgreSQL",
      status: "Healthy",
      lastSync: "Live",
      latency: "Local",
    },
  ],
  auditLogs: [
    {
      time: "10:12 AM",
      event: "Fallback audit event",
      detail: "Governance fallback data loaded.",
      severity: "Low",
    },
  ],
  message: "Fallback governance data loaded",
};

export default function GovernancePage() {
  const [governanceData, setGovernanceData] =
    useState<GovernanceData | null>(null);
  const [agentRunsData, setAgentRunsData] =
    useState<AgentRunsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [generatingReportId, setGeneratingReportId] = useState<number | null>(
    null
  );
  const [generatedReport, setGeneratedReport] =
    useState<GeneratedReportResponse | null>(null);

  useEffect(() => {
    async function loadGovernanceData() {
      try {
        setLoading(true);
        setApiError("");

        const [governanceResponse, agentRunsResponse] = await Promise.all([
          getGovernanceData(),
          getAgentRuns(),
        ]);

        setGovernanceData(governanceResponse);
        setAgentRunsData(agentRunsResponse);
      } catch (error) {
        console.error(error);
        setApiError(
          "Governance or agent runs API is not connected. Showing fallback data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadGovernanceData();
  }, []);

  async function handleGenerateReport(agentRunId: number) {
    try {
      setGeneratingReportId(agentRunId);
      setGeneratedReport(null);
      setApiError("");

      const response = await generateReportFromAgentRun(agentRunId);
      setGeneratedReport(response);
    } catch (error) {
      console.error(error);
      setApiError("Failed to generate report from this agent run.");
    } finally {
      setGeneratingReportId(null);
    }
  }

  const governance = governanceData ?? fallbackGovernance;
  const storedAgentRuns = agentRunsData?.runs ?? [];

  const totalStoredRuns = agentRunsData?.totalRuns ?? storedAgentRuns.length;

  const avgStoredGrounding =
    storedAgentRuns.length > 0
      ? Math.round(
          storedAgentRuns.reduce((sum, run) => sum + run.groundingScore, 0) /
            storedAgentRuns.length
        )
      : governance.avgGrounding;

  const totalUnsupportedClaims =
    storedAgentRuns.reduce((sum, run) => sum + run.unsupportedClaims, 0) ?? 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-violet-500/15 text-violet-200">
              AI Governance
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight">
              Governance & Agent Audit
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Monitor model usage, data sources, grounding quality, audit logs,
              saved LangGraph/LLM agent runs, and report generation workflows
              from PostgreSQL.
            </p>

            {loading && (
              <p className="mt-2 text-xs text-blue-300">
                Loading governance metrics and stored agent runs...
              </p>
            )}

            {!loading && governanceData && (
              <p className="mt-2 text-xs text-emerald-300">
                Governance connected: {governanceData.message}
              </p>
            )}

            {!loading && agentRunsData && (
              <p className="mt-1 text-xs text-violet-300">
                Agent runs connected: {agentRunsData.message}
              </p>
            )}

            {generatedReport && (
              <p className="mt-1 text-xs text-emerald-300">
                Report generated: {generatedReport.message}
              </p>
            )}

            {apiError && (
              <p className="mt-2 text-xs text-red-300">{apiError}</p>
            )}
          </div>

          <Badge className="w-fit bg-white/10 text-slate-300">
            Audit-Ready AI
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Stored Agent Runs"
            value={String(totalStoredRuns)}
            change="PostgreSQL"
            icon={<Workflow className="h-5 w-5 text-violet-300" />}
          />
          <MetricCard
            title="Avg Grounding"
            value={`${avgStoredGrounding}%`}
            change="Evidence quality"
            icon={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
          />
          <MetricCard
            title="Unsupported Claims"
            value={String(totalUnsupportedClaims)}
            change="LLM audit"
            icon={<FileSearch className="h-5 w-5 text-amber-300" />}
          />
          <MetricCard
            title="Estimated Cost"
            value={`$${governance.estimatedCost.toFixed(2)}`}
            change="Local LLM"
            icon={<Activity className="h-5 w-5 text-blue-300" />}
          />
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-300" />
              Stored LangGraph / LLM Agent Runs
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Time</TableHead>
                  <TableHead className="text-slate-400">Ticker</TableHead>
                  <TableHead className="text-slate-400">Question</TableHead>
                  <TableHead className="text-slate-400">Grounding</TableHead>
                  <TableHead className="text-slate-400">Unsupported</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {storedAgentRuns.slice(0, 10).map((run) => (
                  <TableRow key={run.id} className="border-white/10">
                    <TableCell className="text-slate-300">
                      {new Date(run.createdAt).toLocaleString()}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-blue-500/15 text-blue-200">
                        {run.ticker ?? "Portfolio"}
                      </Badge>
                    </TableCell>

                    <TableCell className="max-w-[360px] text-slate-300">
                      {run.question}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={run.groundingScore} className="w-20" />
                        <span className="text-sm text-slate-300">
                          {run.groundingScore}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-slate-300">
                      {run.unsupportedClaims}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-emerald-500/15 text-emerald-200">
                        LLM Generated
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        disabled={generatingReportId === run.id}
                        className="bg-violet-500 text-white hover:bg-violet-600"
                        onClick={() => handleGenerateReport(run.id)}
                      >
                        {generatingReportId === run.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating
                          </>
                        ) : (
                          "Generate Report"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {storedAgentRuns.length === 0 && (
              <p className="mt-4 text-sm text-slate-400">
                No stored agent runs yet. Ask a question on the Ask FinCredit
                page to create an audit record.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-violet-300" />
                Model Usage
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {governance.modelUsage.map((item) => (
                <div
                  key={item.model}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{item.model}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {item.task}
                      </p>
                    </div>

                    <Badge className="bg-emerald-500/15 text-emerald-200">
                      {item.status}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MiniMetric label="Calls" value={String(item.calls)} />
                    <MiniMetric
                      label="Cost"
                      value={`$${item.cost.toFixed(2)}`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                Quality Metrics
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {governance.qualityMetrics.map((metric) => (
                <div
                  key={metric.metric}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">{metric.metric}</p>
                    <p className="font-medium text-white">{metric.value}%</p>
                  </div>
                  <Progress value={metric.value} className="mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-300" />
                Data Sources
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {governance.dataSources.map((source) => (
                <div
                  key={source.source}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{source.source}</p>
                    <StatusBadge status={source.status} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MiniMetric label="Last Sync" value={source.lastSync} />
                    <MiniMetric label="Latency" value={source.latency} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-300" />
                Audit Logs
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {governance.auditLogs.map((log) => (
                <div
                  key={`${log.time}-${log.event}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{log.event}</p>
                    <RiskBadge risk={log.severity} />
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {log.detail}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">{log.time}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-300" />
              Agents Used in Latest Runs
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(storedAgentRuns[0]?.agentsUsed ??
                [
                  "Portfolio Agent",
                  "Market Data Agent",
                  "SEC Fundamentals Agent",
                  "Risk Analysis Agent",
                  "Evidence Agent",
                  "LLM Answer Agent",
                ]
              ).map((agent) => (
                <div
                  key={agent}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <p className="text-sm font-medium text-white">{agent}</p>
                </div>
              ))}
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Healthy" || status === "Active"
      ? "bg-emerald-500/15 text-emerald-200"
      : status === "Delayed" || status === "In Review"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-red-500/15 text-red-200";

  return <Badge className={styles}>{status}</Badge>;
}

function RiskBadge({ risk }: { risk: string }) {
  const styles =
    risk === "High"
      ? "bg-red-500/15 text-red-200"
      : risk === "Medium"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-emerald-500/15 text-emerald-200";

  return <Badge className={styles}>{risk}</Badge>;
}