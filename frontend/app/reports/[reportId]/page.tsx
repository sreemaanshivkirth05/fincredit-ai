"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Download,
  FileSearch,
  FileText,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getReportDocument, getReportPdfUrl } from "@/lib/api";

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

type ReportDocument = {
  reportId: string;
  agentRunId: number;
  ticker: string | null;
  question: string;
  answer: string;
  riskDrivers: RiskDriver[];
  evidence: EvidenceItem[];
  suggestedActions: string[];
  createdAt: string;
  message: string;
};

export default function ReportDocumentPage() {
  const params = useParams();
  const reportId = params.reportId as string;

  const [reportDocument, setReportDocument] =
    useState<ReportDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    async function loadReportDocument() {
      if (!reportId) return;

      try {
        setLoading(true);
        setApiError("");

        const response = await getReportDocument(reportId);
        setReportDocument(response);
      } catch (error) {
        console.error(error);
        setApiError(
          "Could not load this report document. This report may have been generated before full report documents were added."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReportDocument();
  }, [reportId]);

  const averageEvidenceConfidence =
    reportDocument && reportDocument.evidence.length > 0
      ? Math.round(
          reportDocument.evidence.reduce(
            (sum, item) => sum + item.confidence,
            0
          ) / reportDocument.evidence.length
        )
      : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link href="/reports">
              <Button
                type="button"
                variant="outline"
                className="mb-4 border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Button>
            </Link>

            <Badge className="mb-3 bg-violet-500/15 text-violet-200">
              Full AI Report
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight">
              {reportId}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Full AI analyst report document generated from a saved
              LangGraph/LLM agent run.
            </p>

            {loading && (
              <p className="mt-2 flex items-center gap-2 text-xs text-blue-300">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading report document from PostgreSQL...
              </p>
            )}

            {!loading && reportDocument && (
              <p className="mt-2 text-xs text-emerald-300">
                Report document connected: {reportDocument.message}
              </p>
            )}

            {apiError && (
              <p className="mt-2 text-xs text-red-300">{apiError}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={getReportPdfUrl(reportId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                type="button"
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </a>

            <Badge className="w-fit bg-white/10 text-slate-300">
              Stored Report Document
            </Badge>
          </div>
        </div>

        {reportDocument && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                title="Ticker"
                value={reportDocument.ticker ?? "Portfolio"}
                change="Scope"
                icon={<Target className="h-5 w-5 text-blue-300" />}
              />

              <MetricCard
                title="Agent Run"
                value={`#${reportDocument.agentRunId}`}
                change="Traceable"
                icon={<Sparkles className="h-5 w-5 text-violet-300" />}
              />

              <MetricCard
                title="Evidence Items"
                value={String(reportDocument.evidence.length)}
                change="Grounded"
                icon={<FileSearch className="h-5 w-5 text-emerald-300" />}
              />

              <MetricCard
                title="Avg Confidence"
                value={`${averageEvidenceConfidence}%`}
                change="Evidence"
                icon={<ShieldCheck className="h-5 w-5 text-amber-300" />}
              />
            </div>

            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-300" />
                  Analyst Question
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm leading-7 text-slate-200">
                    {reportDocument.question}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-emerald-300" />
                  AI Analyst Report
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <ReactMarkdown
                    components={{
                      strong: ({ children }) => (
                        <strong className="font-semibold text-white">
                          {children}
                        </strong>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm leading-7 text-slate-200">
                          {children}
                        </p>
                      ),
                      ol: ({ children }) => (
                        <ol className="ml-5 list-decimal space-y-2 text-sm leading-7 text-slate-200">
                          {children}
                        </ol>
                      ),
                      ul: ({ children }) => (
                        <ul className="ml-5 list-disc space-y-2 text-sm leading-7 text-slate-200">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm leading-7 text-slate-200">
                          {children}
                        </li>
                      ),
                    }}
                  >
                    {reportDocument.answer}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className="border-white/10 bg-white/[0.04] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-300" />
                    Risk Drivers
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {reportDocument.riskDrivers.map((risk, index) => (
                    <div
                      key={`${risk.ticker}-${risk.driver}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <Badge className="bg-blue-500/15 text-blue-200">
                          {risk.ticker}
                        </Badge>

                        <RiskImpactBadge impact={risk.impact} />
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {risk.driver}
                      </p>
                    </div>
                  ))}

                  {reportDocument.riskDrivers.length === 0 && (
                    <p className="text-sm text-slate-400">
                      No risk drivers were stored for this report.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.04] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-300" />
                    Suggested Actions
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {reportDocument.suggestedActions.map((action, index) => (
                    <div
                      key={`${action}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-200">
                          {index + 1}
                        </div>

                        <p className="text-sm leading-6 text-slate-300">
                          {action}
                        </p>
                      </div>
                    </div>
                  ))}

                  {reportDocument.suggestedActions.length === 0 && (
                    <p className="text-sm text-slate-400">
                      No suggested actions were stored for this report.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-emerald-300" />
                  Evidence Used
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {reportDocument.evidence.map((item, index) => (
                  <div
                    key={`${item.source}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge className="bg-emerald-500/15 text-emerald-200">
                        {item.source}
                      </Badge>

                      <div className="flex items-center gap-3">
                        <Progress value={item.confidence} className="w-24" />
                        <span className="text-sm text-slate-300">
                          {item.confidence}%
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {item.claim}
                    </p>
                  </div>
                ))}

                {reportDocument.evidence.length === 0 && (
                  <p className="text-sm text-slate-400">
                    No evidence items were stored for this report.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-violet-300" />
                  Report Metadata
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <MiniMetric
                    label="Report ID"
                    value={reportDocument.reportId}
                  />

                  <MiniMetric
                    label="Agent Run ID"
                    value={String(reportDocument.agentRunId)}
                  />

                  <MiniMetric
                    label="Created"
                    value={new Date(reportDocument.createdAt).toLocaleString()}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
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
      <p className="mt-2 break-words text-sm font-medium leading-6 text-white">
        {value}
      </p>
    </div>
  );
}

function RiskImpactBadge({ impact }: { impact: string }) {
  const styles =
    impact === "High"
      ? "bg-red-500/15 text-red-200"
      : impact === "Medium"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-emerald-500/15 text-emerald-200";

  return <Badge className={styles}>{impact}</Badge>;
}