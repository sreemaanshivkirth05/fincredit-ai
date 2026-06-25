"use client";

import type React from "react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  Gauge,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
  workflow: string;
  agentsUsed: string[];
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

const sampleQuestions = [
  "What is the risk outlook for MSFT?",
  "Why is TSLA risky in my portfolio?",
  "What are the main risk drivers for NVDA?",
  "How does JPM look based on SEC fundamentals?",
];

export default function AskPage() {
  const [question, setQuestion] = useState("What is the risk outlook for MSFT?");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
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

      const response = await askFinCredit(question);
      setAnswer(response);
    } catch (error) {
      console.error(error);
      setApiError(
        "Ask FinCredit API is not connected. Make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-violet-500/15 text-violet-200">
              LangGraph + LangChain + Ollama
            </Badge>

            <h1 className="text-3xl font-semibold tracking-tight">
              Ask FinCredit AI
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Ask portfolio, market, SEC fundamentals, and credit-risk questions.
              The answer is generated through a LangGraph workflow and a local
              Ollama LLM using stored PostgreSQL evidence.
            </p>

            {answer && (
              <p className="mt-2 text-xs text-emerald-300">
                Backend connected: {answer.message}
              </p>
            )}

            {apiError && (
              <p className="mt-2 text-xs text-red-300">{apiError}</p>
            )}
          </div>

          <Badge className="w-fit bg-white/10 text-slate-300">
            Multi-Agent Reasoning
          </Badge>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-violet-300" />
              Ask a Financial Risk Question
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about MSFT, TSLA, NVDA, AAPL, JPM, portfolio risk, SEC fundamentals, or market snapshots..."
              className="min-h-28 border-white/10 bg-black/30 text-white placeholder:text-slate-500"
            />

            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((sample) => (
                <Button
                  key={sample}
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white"
                  onClick={() => setQuestion(sample)}
                >
                  {sample}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleAsk}
              disabled={loading}
              className="bg-violet-500 text-white hover:bg-violet-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running LangGraph + LLM Workflow...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ask FinCredit
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {answer && (
          <>
            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-300" />
                  AI Financial Research Response
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-slate-400">Question</p>
                <p className="mt-1 font-medium text-white">{answer.question}</p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="prose prose-invert max-w-none prose-p:text-sm prose-p:leading-7 prose-li:text-sm prose-li:leading-7 prose-strong:text-white prose-headings:text-white">
                    <ReactMarkdown>{answer.answer}</ReactMarkdown>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className="border-white/10 bg-white/[0.04] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-amber-300" />
                    Risk Drivers
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {answer.riskDrivers.map((driver, index) => (
                    <div
                      key={`${driver.ticker}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">
                          {driver.ticker}
                        </p>
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
                    <FileSearch className="h-5 w-5 text-blue-300" />
                    Evidence Used
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {answer.evidence.map((item) => (
                    <div
                      key={`${item.source}-${item.claim}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-white">
                            {item.source}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            {item.claim}
                          </p>
                        </div>

                        <div className="min-w-28">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Confidence</span>
                            <span>{item.confidence}%</span>
                          </div>
                          <Progress value={item.confidence} className="mt-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className="border-white/10 bg-white/[0.04] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    Suggested Actions
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {answer.suggestedActions.map((action) => (
                    <div
                      key={action}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      <p className="text-sm text-slate-300">{action}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.04] text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-violet-300" />
                    LangGraph Audit
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-slate-400">Workflow</p>
                    <p className="mt-1 font-medium text-white">
                      {answer.audit.workflow}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">Grounding Score</p>
                      <p className="font-medium text-white">
                        {answer.audit.groundingScore}%
                      </p>
                    </div>
                    <Progress
                      value={answer.audit.groundingScore}
                      className="mt-3"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-slate-400">
                      Unsupported Claims
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {answer.audit.unsupportedClaims}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-slate-400">Status</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {answer.audit.status}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-blue-300" />
                  Agents Used
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {answer.audit.agentsUsed.map((agent) => (
                    <div
                      key={agent}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <BrainCircuit className="h-5 w-5 text-violet-300" />
                      <p className="text-sm font-medium text-white">{agent}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
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