import type React from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  FileSearch,
  LineChart,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-[-10rem] top-[20rem] h-[26rem] w-[26rem] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-400/30">
              <LineChart className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">
                FinCredit AI
              </p>
              <p className="text-xs text-slate-400">
                Financial research intelligence
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#architecture" className="hover:text-white">
              Architecture
            </a>
            <a href="#cost" className="hover:text-white">
              Cost
            </a>
          </nav>

          <Button className="bg-white text-slate-950 hover:bg-slate-200">
            Launch Demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <Badge className="mb-6 border-blue-400/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/10">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Multi-agent AI for financial research
          </Badge>

          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
            Credit risk, SEC filings, portfolio intelligence, and analyst
            reports in one AI workspace.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            FinCredit AI uses ChatGPT API, Ollama, LangGraph, SEC filings,
            news data, and financial metrics to help users monitor portfolios,
            detect red flags, compare peers, and generate evidence-backed
            research reports.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
              Start Company Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              View Architecture
            </Button>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
            <Metric label="Projected cost" value="$5–$20/mo" />
            <Metric label="LLM setup" value="2 models" />
            <Metric label="Data sources" value="Free APIs" />
          </div>
        </div>

        {/* Dashboard mock */}
        <Card className="border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur">
          <CardContent className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Portfolio Risk</p>
                <h2 className="text-2xl font-semibold text-white">
                  Moderate
                </h2>
              </div>
              <Badge className="bg-amber-500/15 text-amber-200">
                +12 this week
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MiniCard
                icon={<TrendingUp className="h-5 w-5 text-emerald-300" />}
                label="Watchlist Sentiment"
                value="68% Positive"
              />
              <MiniCard
                icon={<ShieldCheck className="h-5 w-5 text-blue-300" />}
                label="Grounding Score"
                value="94%"
              />
              <MiniCard
                icon={<FileSearch className="h-5 w-5 text-violet-300" />}
                label="New Filings"
                value="3"
              />
              <MiniCard
                icon={<Brain className="h-5 w-5 text-pink-300" />}
                label="AI Reports"
                value="18"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium text-white">Top Red Flags</p>
                <Badge variant="outline" className="border-red-400/30 text-red-200">
                  4 detected
                </Badge>
              </div>

              <div className="space-y-3">
                {[
                  ["TSLA", "Negative sentiment spike", "High"],
                  ["NVDA", "Portfolio concentration risk", "Medium"],
                  ["MSFT", "Regulatory language increased", "Medium"],
                ].map(([ticker, issue, severity]) => (
                  <div
                    key={ticker}
                    className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{ticker}</p>
                      <p className="text-xs text-slate-400">{issue}</p>
                    </div>
                    <Badge
                      className={
                        severity === "High"
                          ? "bg-red-500/15 text-red-200"
                          : "bg-amber-500/15 text-amber-200"
                      }
                    >
                      {severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
              <p className="text-sm font-medium text-blue-100">
                Ask FinCredit
              </p>
              <p className="mt-2 text-sm text-slate-300">
                “Why did my portfolio risk increase this week?”
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                  Ask
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  View Evidence
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
            Product Features
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Built like a real financial intelligence platform.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Portfolio Monitoring"
            description="Track user-specific portfolios, sector exposure, concentration risk, and company-level credit risk changes."
          />
          <FeatureCard
            icon={<FileSearch className="h-6 w-6" />}
            title="SEC Filing Intelligence"
            description="Analyze 10-K and 10-Q filings with RAG, compare filing changes, and surface evidence-backed risk factors."
          />
          <FeatureCard
            icon={<Brain className="h-6 w-6" />}
            title="Dual-LLM Agent Workflow"
            description="Use ChatGPT API for reasoning and Ollama locally for red flags, sentiment tagging, and structured extraction."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Citation Validation"
            description="Check AI claims against source evidence, calculate grounding scores, and reduce hallucination risk."
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Peer Benchmarking"
            description="Compare companies against peers using risk scores, financial ratios, sentiment, and filing risk signals."
          />
          <FeatureCard
            icon={<Lock className="h-6 w-6" />}
            title="Governance & Audit"
            description="Log agent runs, models used, prompts, citations, unsupported claims, data health, and user actions."
          />
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <Card className="border-white/10 bg-white/[0.04]">
          <CardContent className="p-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
              Architecture
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Local-first, low-cost, production-style AI stack.
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                "Next.js UI",
                "FastAPI Backend",
                "LangGraph Agents",
                "PostgreSQL",
                "ChromaDB RAG",
                "ChatGPT API",
                "Ollama Local",
                "SEC + GDELT",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center text-sm font-medium text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Cost */}
      <section id="cost" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          <CostCard title="Local Development" price="$5–$20/mo" detail="Only OpenAI API cost. Everything else local or free." />
          <CostCard title="Careful Build Target" price="< $10/mo" detail="Use Ollama, caching, RAG, and usage limits." />
          <CostCard title="Public Demo Later" price="$10–$30/mo" detail="Vercel, Clerk, Neon free tiers + OpenAI API." />
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      {icon}
      <p className="mt-3 text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.04] text-white">
      <CardContent className="p-6">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}

function CostCard({
  title,
  price,
  detail,
}: {
  title: string;
  price: string;
  detail: string;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.04] text-white">
      <CardContent className="p-6">
        <p className="text-sm text-slate-400">{title}</p>
        <p className="mt-3 text-3xl font-semibold">{price}</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
      </CardContent>
    </Card>
  );
}