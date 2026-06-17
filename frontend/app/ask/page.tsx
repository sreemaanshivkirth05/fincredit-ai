"use client";

import type React from "react";
import { useState } from "react";

import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  FileText,
  Gauge,
  Lightbulb,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  Area,
  AreaChart,
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
import { askFinCredit } from "@/lib/api";

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

type AskAudit = {
  primaryModel: string;
  localModel: string;
  groundingScore: number;
  unsupportedClaims: number;
  status: string;
};

type AskResponse = {
  question: string;
  answer: string;
  riskDrivers: RiskDriver[];
  evidence: EvidenceItem[];
  suggestedActions: string[];
  audit: AskAudit;
  message: string;
};

const riskTrend = [
  { month: "Jan", risk: 34 },
  { month: "Feb", risk: 38 },
  { month: "Mar", risk: 42 },
  { month: "Apr", risk: 51 },
  { month: "May", risk: 46 },
  { month: "Jun", risk: 57 },
];

const fallbackAnswer: AskResponse = {
  question: "Why did my portfolio risk increase?",
  answer:
    "Your portfolio risk increased mainly because TSLA moved into a high-risk range, NVDA remains a large concentration position, and recent filing/news signals show higher uncertainty around margins, regulation, and market volatility.",
  riskDrivers: [
    {
      ticker: "TSLA",
      driver: "Margin pressure and negative sentiment increased",
      impact: "High",
    },
    {
      ticker: "NVDA",
      driver: "Portfolio concentration remains above target threshold",
      impact: "Medium",
    },
    {
      ticker: "MSFT",
      driver: "Regulatory language expanded in latest filing",
      impact: "Medium",
    },
  ],
  evidence: [
    {
      source: "TSLA 10-Q",
      claim: "Competition and pricing pressure language increased.",
      confidence: 86,
    },
    {
      source: "Portfolio Holdings",
      claim: "NVDA and MSFT represent the largest portfolio weights.",
      confidence: 94,
    },
    {
      source: "News Radar",
      claim: "TSLA sentiment became more mixed over the last 30 days.",
      confidence: 82,
    },
  ],
  suggestedActions: [
    "Run a TSLA red flag report",
    "Review NVDA concentration exposure",
    "Generate a portfolio downside scenario",
  ],
  audit: {
    primaryModel: "ChatGPT API",
    localModel: "Ollama Qwen Local",
    groundingScore: 89,
    unsupportedClaims: 1,
    status: "Needs analyst review before final report export",
  },
  message: "Fallback Ask FinCredit data loaded",
};

export default function AskPage() {
  const [question, setQuestion] = useState(
    "Why did my portfolio risk increase?"
  );
  const [answerData, setAnswerData] = useState<AskResponse>(fallbackAnswer);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function handleAsk() {
    if (!question.trim()) {
      setApiError("Please enter a question.");
      return;
    }

    try {
      setLoading(true);
      setApiError("");

      const data = await askFinCredit(question);
      setAnswerData(data);
    } catch (error) {
      console.error(error);
      setApiError("Backend Ask FinCredit API is not connected.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              AI Command Center
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              Ask FinCredit
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Ask portfolio, company, credit risk, filing, or news intelligence
              questions. The system returns an evidence-backed answer with risk
              drivers, citations, and an audit trace.
            </p>

            {answerData.message && (
              <p className="mt-2 text-xs text-emerald-300">
                Backend connected: {answerData.message}
              </p>
            )}

            {apiError && (
              <p className="mt-2 text-xs text-red-300">{apiError}</p>
            )}
          </div>

          <Badge className="bg-emerald-500/15 text-emerald-200">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Dual-LLM Ready
          </Badge>
        </div>

        <Card className="border-blue-400/20 bg-blue-500/10 text-white">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAsk();
                  }
                }}
                className="h-12 border-white/10 bg-black/20 text-white placeholder:text-slate-500"
                placeholder="Ask: Why did my portfolio risk increase?"
              />

              <Button
                onClick={handleAsk}
                disabled={loading}
                className="h-12 bg-blue-500 px-6 hover:bg-blue-600"
              >
                {loading ? (
                  "Thinking..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ask
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Which company has the highest credit risk?",
                "Summarize TSLA red flags",
                "Explain NVDA concentration risk",
                "Generate a portfolio downside scenario",
              ].map((sample) => (
                <button
                  key={sample}
                  onClick={() => setQuestion(sample)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                >
                  {sample}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-pink-300" />
                Answer
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs text-slate-500">Question</p>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {answerData.question}
                </p>

                <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-blue-100">
                    <Lightbulb className="h-4 w-4" />
                    AI Analyst Response
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-200">
                    {answerData.answer}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <MiniMetric
                    title="Grounding"
                    value={`${answerData.audit.groundingScore}%`}
                    icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}
                  />
                  <MiniMetric
                    title="Unsupported"
                    value={String(answerData.audit.unsupportedClaims)}
                    icon={<AlertTriangle className="h-4 w-4 text-amber-300" />}
                  />
                  <MiniMetric
                    title="Status"
                    value="Review"
                    icon={<CheckCircle2 className="h-4 w-4 text-blue-300" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-amber-300" />
                Portfolio Risk Movement
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskTrend}>
                    <defs>
                      <linearGradient id="askRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#f59e0b"
                          stopOpacity={0.45}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f59e0b"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="#f59e0b"
                      fill="url(#askRisk)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-300" />
                Risk Drivers
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {answerData.riskDrivers.map((driver) => (
                <div
                  key={`${driver.ticker}-${driver.driver}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{driver.ticker}</p>
                    <RiskBadge risk={driver.impact} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {driver.driver}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-300" />
                Evidence Panel
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {answerData.evidence.map((item) => (
                <div
                  key={`${item.source}-${item.claim}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.source}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {item.claim}
                      </p>
                    </div>

                    <Badge className="bg-emerald-500/15 text-emerald-200">
                      {item.confidence}%
                    </Badge>
                  </div>

                  <Progress value={item.confidence} className="mt-4" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-300" />
                Suggested Actions
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {answerData.suggestedActions.map((action) => (
                <div
                  key={action}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-sm text-slate-300">{action}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    Start
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                AI Audit Trace
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <AuditRow label="Primary model" value={answerData.audit.primaryModel} />
                <AuditRow label="Local model" value={answerData.audit.localModel} />
                <AuditRow
                  label="Grounding score"
                  value={`${answerData.audit.groundingScore}%`}
                />
                <AuditRow
                  label="Unsupported claims"
                  value={String(answerData.audit.unsupportedClaims)}
                />
                <AuditRow label="Status" value={answerData.audit.status} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function MiniMetric({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between">
        {icon}
        <Badge className="bg-white/10 text-slate-300">{title}</Badge>
      </div>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function AuditRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="max-w-[60%] text-right text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
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