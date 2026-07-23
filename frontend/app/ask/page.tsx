"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

import {
  BrainCircuit,
  CheckCircle2,
  Eye,
  FileSearch,
  FileText,
  Loader2,
  MessageSquareText,
  Newspaper,
  PieChart,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { askFinCredit, generateReportFromAgentRun } from "@/lib/api";

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
  workflow: string;
  agentsUsed: string[];
  groundingScore: number;
  unsupportedClaims: number;
  status: string;
};

type AskResponse = {
  agentRunId: number;
  question: string;
  answer: string;
  riskDrivers: RiskDriver[];
  evidence: EvidenceItem[];
  suggestedActions: string[];
  audit: AskAudit;
  message: string;
};

const EXAMPLE_QUESTIONS = [
  {
    label: "Should I add more AAPL?",
    question:
      "Should I add more AAPL to my simulated portfolio? Use my current holdings, cost basis, P/L, recent buy and sell transactions, watchlist, market data, SEC fundamentals, recent news, risk drivers, and evidence.",
  },
  {
    label: "Highest concentration risk?",
    question:
      "Which holding has the highest concentration risk? Use my simulated portfolio weights, market context, SEC fundamentals, recent news, and evidence.",
  },
  {
    label: "Recent buy/sell activity",
    question:
      "Summarize my recent buy/sell activity. Include realized P/L where available and explain what changed in the simulated portfolio.",
  },
  {
    label: "Watchlist stock to research",
    question:
      "Which watchlist stock should I research next? Use portfolio fit, market context, SEC fundamentals, recent news, and risk drivers.",
  },
];

const LOADING_STAGES = [
  "Loading portfolio context...",
  "Reading transaction history...",
  "Checking market and SEC data...",
  "Reviewing news...",
  "Generating AI answer or fallback...",
];

export default function AskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledQuestion = searchParams.get("question") ?? "";

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [apiError, setApiError] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  useEffect(() => {
    if (prefilledQuestion) {
      setQuestion(prefilledQuestion);
    }
  }, [prefilledQuestion]);

  useEffect(() => {
    if (!loading) {
      setLoadingStageIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setLoadingStageIndex((currentIndex) =>
        (currentIndex + 1) % LOADING_STAGES.length
      );
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [loading]);

  async function handleAsk() {
    if (!question.trim()) {
      setApiError("Please enter a question before running FinCredit AI.");
      return;
    }

    try {
      setLoading(true);
      setApiError("");
      setReportMessage("");
      setAnswer(null);

      const response = await askFinCredit(question);
      setAnswer(response);
    } catch (error) {
      console.error(error);
      setApiError(
        "Could not generate an AI answer. Make sure the backend is running. If Ollama is unavailable, the backend should still return a deterministic fallback answer."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReportFromAnswer() {
    if (!answer?.agentRunId) {
      setApiError("No saved agent run is available for this answer.");
      return;
    }

    try {
      setGeneratingReport(true);
      setApiError("");
      setReportMessage("");

      const response = await generateReportFromAgentRun(answer.agentRunId);

      setReportMessage(response.message);
      router.push(`/reports/${response.reportId}`);
    } catch (error) {
      console.error(error);
      setApiError("Could not generate a report from this AI answer.");
    } finally {
      setGeneratingReport(false);
    }
  }

  function fillExampleQuestion(exampleQuestion: string) {
    setQuestion(exampleQuestion);
    setAnswer(null);
    setApiError("");
    setReportMessage("");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-violet-500/15 text-violet-200">
              Ask FinCredit AI
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Portfolio-Aware AI Assistant
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Ask questions about your simulated portfolio, watchlist, market
              data, SEC fundamentals, stock news, risk drivers, and beginner
              investing decisions. The assistant uses a LangGraph workflow with
              structured evidence and a local Ollama/LangChain answer when
              available.
            </p>

            {prefilledQuestion && (
              <p className="mt-2 text-xs text-emerald-300">
                Question prefilled from the stock research page.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="w-fit bg-white/10 text-slate-300">
              LangGraph
            </Badge>
            <Badge className="w-fit bg-white/10 text-slate-300">
              Portfolio
            </Badge>
            <Badge className="w-fit bg-white/10 text-slate-300">
              Watchlist
            </Badge>
            <Badge className="w-fit bg-white/10 text-slate-300">
              News
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <FeatureCard
            title="Portfolio"
            detail="Uses simulated holdings, average cost, value, weight, and P/L."
            icon={<Wallet className="h-5 w-5 text-emerald-300" />}
          />

          <FeatureCard
            title="Watchlist"
            detail="Uses saved stocks you are monitoring for future research."
            icon={<Star className="h-5 w-5 text-yellow-300" />}
          />

          <FeatureCard
            title="Market + SEC"
            detail="Uses stored price snapshots and SEC fundamentals."
            icon={<TrendingUp className="h-5 w-5 text-blue-300" />}
          />

          <FeatureCard
            title="News Context"
            detail="Uses recent stock news to explain possible catalysts."
            icon={<Newspaper className="h-5 w-5 text-violet-300" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-violet-300" />
                Ask a Portfolio-Aware Question
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                data-testid="ask-question-input"
                placeholder="Example: Should I add more AAPL to my simulated portfolio? Use my current holdings, watchlist, market data, SEC fundamentals, recent news, risk drivers, and evidence."
                className="min-h-[180px] border-white/10 bg-black/30 text-slate-100 placeholder:text-slate-500"
              />

              <p className="text-xs leading-5 text-slate-400">
                Answers are evidence-backed and may use fallback if local
                Ollama is slow.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="bg-violet-500 text-white hover:bg-violet-600"
                  onClick={handleAsk}
                  disabled={loading}
                  data-testid="ask-submit-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Agents
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Ask FinCredit AI
                    </>
                  )}
                </Button>

                {EXAMPLE_QUESTIONS.map((example) => (
                  <Button
                    key={example.label}
                    type="button"
                    variant="outline"
                    disabled={loading}
                    className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white"
                    onClick={() => fillExampleQuestion(example.question)}
                  >
                    {example.label}
                  </Button>
                ))}
              </div>

              {loading && (
                <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-200" />
                    <div>
                      <p className="text-sm font-medium text-violet-100">
                        {LOADING_STAGES[loadingStageIndex]}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        FinCredit is gathering evidence first. If the local LLM
                        is slow, a deterministic fallback will return after the
                        timeout.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {apiError && (
                <p className="text-sm leading-6 text-red-300">{apiError}</p>
              )}

              {answer && (
                <p className="text-sm leading-6 text-emerald-300">
                  {answer.message}
                </p>
              )}

              {reportMessage && (
                <p className="text-sm leading-6 text-emerald-300">
                  {reportMessage}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-blue-300" />
                Agent Workflow
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <WorkflowStep
                title="Portfolio Agent"
                detail="Loads simulated holdings, average cost, value, P/L, weights, and risk labels."
              />

              <WorkflowStep
                title="Watchlist Agent"
                detail="Loads stocks being monitored for future research."
              />

              <WorkflowStep
                title="Transaction Agent"
                detail="Loads recent simulated BUY and SELL history, including realized P/L from sells."
              />

              <WorkflowStep
                title="Market Agent"
                detail="Uses latest stored market snapshots from PostgreSQL."
              />

              <WorkflowStep
                title="SEC Agent"
                detail="Uses latest stored SEC Company Facts fundamentals."
              />

              <WorkflowStep
                title="News Agent"
                detail="Uses recent stock news from the news service."
              />

              <WorkflowStep
                title="Risk + Evidence + Answer"
                detail="Builds risk drivers, evidence claims, suggested actions, and AI/fallback answer."
              />
            </CardContent>
          </Card>
        </div>

        {answer && (
          <>
            <Card className="border-emerald-500/20 bg-emerald-500/[0.05] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-300" />
                  Create Report from This Answer
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm leading-6 text-slate-300">
                    This AI answer has been saved as agent run{" "}
                    <span className="font-semibold text-white">
                      #{answer.agentRunId}
                    </span>
                    . Generate a full report document with approval workflow,
                    evidence, comments, history, and PDF export.
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-fit bg-emerald-500 text-white hover:bg-emerald-600"
                  disabled={generatingReport}
                  onClick={handleGenerateReportFromAnswer}
                >
                  {generatingReport ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Report
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report from This Answer
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                title="Grounding Score"
                value={`${answer.audit.groundingScore}%`}
                change="Evidence quality"
                icon={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
              />

              <MetricCard
                title="Unsupported Claims"
                value={String(answer.audit.unsupportedClaims)}
                change="Governance"
                icon={<FileSearch className="h-5 w-5 text-amber-300" />}
              />

              <MetricCard
                title="Risk Drivers"
                value={String(answer.riskDrivers.length)}
                change="Detected"
                icon={<Target className="h-5 w-5 text-red-300" />}
              />

              <MetricCard
                title="Agent Run"
                value={`#${answer.agentRunId}`}
                change="Saved"
                icon={<BrainCircuit className="h-5 w-5 text-violet-300" />}
              />
            </div>

            <Card
              data-testid="ask-answer-card"
              className="border-white/10 bg-white/[0.04] text-white"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-300" />
                  AI Analyst Answer
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <h2 className="pt-2 text-lg font-semibold text-white">
                          {children}
                        </h2>
                      ),
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
                    {answer.answer}
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
                  {answer.riskDrivers.map((risk, index) => (
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

                  {answer.riskDrivers.length === 0 && (
                    <p className="text-sm text-slate-400">
                      No risk drivers were detected for this question.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.04] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    Suggested Actions
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {answer.suggestedActions.map((action, index) => (
                    <div
                      key={`${action}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-200">
                          {index + 1}
                        </div>

                        <p className="text-sm leading-6 text-slate-300">
                          {action}
                        </p>
                      </div>
                    </div>
                  ))}

                  {answer.suggestedActions.length === 0 && (
                    <p className="text-sm text-slate-400">
                      No suggested actions were returned.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card
              data-testid="ask-evidence-card"
              className="border-white/10 bg-white/[0.04] text-white"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-emerald-300" />
                  Evidence Used
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {answer.evidence.map((item, index) => (
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
              </CardContent>
            </Card>

            <Card
              data-testid="ask-audit-card"
              className="border-white/10 bg-white/[0.04] text-white"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-300" />
                  Governance Audit
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <MiniMetric label="Workflow" value={answer.audit.workflow} />
                  <MiniMetric label="Status" value={answer.audit.status} />
                  <MiniMetric
                    label="Grounding Score"
                    value={`${answer.audit.groundingScore}%`}
                  />
                  <MiniMetric
                    label="Unsupported Claims"
                    value={String(answer.audit.unsupportedClaims)}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-slate-400">Agents Used</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {answer.audit.agentsUsed.map((agent) => (
                      <Badge
                        key={agent}
                        className="bg-violet-500/15 text-violet-200"
                      >
                        {agent}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

function FeatureCard({
  title,
  detail,
  icon,
}: {
  title: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.04] text-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          {icon}
          <Eye className="h-4 w-4 text-slate-500" />
        </div>
        <p className="mt-4 font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
      </CardContent>
    </Card>
  );
}

function WorkflowStep({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
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
