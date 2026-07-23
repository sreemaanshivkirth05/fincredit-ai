import type { ReactNode } from "react";
import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  FileSearch,
  FileText,
  Gauge,
  History,
  Layers3,
  LineChart,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

const capabilityTags = [
  "Paper Trading",
  "SEC Fundamentals",
  "Stock News",
  "Portfolio AI",
  "Evidence Reports",
  "Playwright Tested",
  "Local Ollama",
];

const features = [
  {
    title: "Research Stocks Faster",
    description:
      "Open ticker pages with price, historical charts, market stats, fundamentals, and recent news in one focused workspace.",
    icon: <LineChart className="h-5 w-5" />,
  },
  {
    title: "Build a Paper Portfolio",
    description:
      "Simulate positions without real money, then review value, weights, cost basis, and unrealized P/L.",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    title: "Track Buy/Sell Decisions",
    description:
      "Keep a transaction history of simulated BUY and SELL activity, including realized P/L on exits.",
    icon: <History className="h-5 w-5" />,
  },
  {
    title: "Refresh Prices",
    description:
      "Update portfolio and watchlist prices from market data so the demo reflects fresh context.",
    icon: <RefreshCcw className="h-5 w-5" />,
  },
  {
    title: "Understand Risk",
    description:
      "See concentration, risk labels, and AI-generated risk drivers before making paper-trading decisions.",
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    title: "Ask Portfolio-Aware AI",
    description:
      "Ask questions that combine holdings, transactions, watchlist, market, SEC, and news context.",
    icon: <Bot className="h-5 w-5" />,
  },
  {
    title: "Review Evidence",
    description:
      "Inspect the sources and confidence signals behind an answer instead of accepting black-box output.",
    icon: <FileSearch className="h-5 w-5" />,
  },
  {
    title: "Generate Reports",
    description:
      "Turn saved AI runs into report records with governance context for a more complete analyst workflow.",
    icon: <FileText className="h-5 w-5" />,
  },
];

const productLoop = [
  "Search stock",
  "Research chart/news/fundamentals",
  "Add to watchlist/portfolio",
  "Refresh prices",
  "Ask AI",
  "Review evidence/report",
];

const howItWorks = [
  {
    number: "01",
    title: "Search a stock",
    detail: "Start from a ticker such as AAPL, MSFT, NVDA, TSLA, JPM, or AMZN.",
  },
  {
    number: "02",
    title: "Review price, chart, fundamentals, and news",
    detail:
      "Study market movement, SEC Company Facts fundamentals, and recent catalysts together.",
  },
  {
    number: "03",
    title: "Add to watchlist or simulated portfolio",
    detail:
      "Track a company for later research or create a paper-trading position.",
  },
  {
    number: "04",
    title: "Track buy/sell transactions and P/L",
    detail:
      "Review holdings, cost basis, current value, unrealized P/L, and realized P/L on sells.",
  },
  {
    number: "05",
    title: "Ask AI for portfolio fit and evidence",
    detail:
      "Use portfolio-aware AI to explain risk, fit, evidence, and next research steps.",
  },
];

const techStack = [
  "Next.js + TypeScript",
  "FastAPI + PostgreSQL",
  "SQLAlchemy",
  "yfinance",
  "SEC Company Facts API",
  "LangGraph + LangChain + Ollama",
  "Playwright E2E Testing",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f7faf7] text-slate-950">
      <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">FinCredit AI</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#product" className="transition hover:text-slate-950">
              Product
            </a>
            <a href="#features" className="transition hover:text-slate-950">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-slate-950">
              How it Works
            </a>
            <a href="#demo" className="transition hover:text-slate-950">
              Demo
            </a>
            <a href="#tech-stack" className="transition hover:text-slate-950">
              Tech Stack
            </a>
          </div>

          <Link
            href="/dashboard"
            data-testid="landing-open-app"
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Open App
          </Link>
        </div>
      </nav>

      <section
        data-testid="landing-hero"
        className="relative overflow-hidden border-b border-slate-200"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#ecfeff_48%,_#f0fdf4_100%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Paper trading only
            </div>

            <h1 className="text-5xl font-semibold tracking-tight text-slate-950 md:text-7xl">
              Learn stocks by researching, simulating, and asking AI.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
              FinCredit AI is an AI-powered stock research and paper-trading
              sandbox that helps beginner investors study stocks, build a
              simulated portfolio, track P/L, review news and fundamentals, and
              ask evidence-backed AI questions - without risking real money.
            </p>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Each account has a separate simulated portfolio, watchlist,
              transaction history, and AI evidence trail.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700"
              >
                Try Demo / Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                Create Account
              </Link>

              <Link
                href="/stock/AAPL"
                data-testid="landing-research-aapl"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                Research AAPL
              </Link>

              <Link
                href="/ask"
                data-testid="landing-ask-ai"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                Ask FinCredit AI
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-5xl rounded-lg border border-white/80 bg-white/80 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur">
            <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Demo Portfolio</p>
                  <p className="mt-1 text-3xl font-semibold">$6,096.20</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MockBadge tone="emerald">Unrealized P/L +7.8%</MockBadge>
                  <MockBadge tone="blue">Evidence backed</MockBadge>
                  <MockBadge tone="amber">Risk driver found</MockBadge>
                </div>
              </div>

              <div className="grid gap-4 pt-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-medium">Portfolio Snapshot</p>
                    <BarChart3 className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="space-y-3">
                    <MockHolding ticker="MSFT" value="$1,754" width="78%" />
                    <MockHolding ticker="AAPL" value="$1,071" width="56%" />
                    <MockHolding ticker="NVDA" value="$1,027" width="52%" />
                    <MockHolding ticker="JPM" value="$1,357" width="64%" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-400">Recent transaction</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">SELL AAPL</p>
                        <p className="text-sm text-slate-400">
                          1 simulated share
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-300">
                        +$24.25
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-400">AI risk driver</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Technology concentration is elevated because MSFT, AAPL,
                      and NVDA make up a large portion of the paper portfolio.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {capabilityTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Features"
          title="A practical research loop, not a market prediction machine."
          description="FinCredit AI focuses on learning workflows: gather evidence, simulate choices, inspect risk, and document reasoning."
        />

        <div
          data-testid="landing-feature-grid"
          className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Product Loop"
            title="From ticker curiosity to evidence-backed review."
            description="Each step maps to a working app route, so interviewers can click through the actual product instead of a static concept."
            inverted
          />

          <div className="mt-10 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {productLoop.map((step, index) => (
              <div
                key={step}
                className="rounded-lg border border-white/10 bg-white/[0.05] p-4"
              >
                <p className="text-xs font-semibold text-emerald-300">
                  Step {index + 1}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        data-testid="landing-how-it-works"
        className="mx-auto max-w-7xl px-5 py-20 lg:px-8"
      >
        <SectionIntro
          eyebrow="How it Works"
          title="Five steps for a clean demo."
          description="The flow is intentionally simple enough to explain in a few seconds and deep enough to show real engineering."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-5">
          {howItWorks.map((step) => (
            <div
              key={step.number}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-semibold text-emerald-600">
                {step.number}
              </p>
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-8 shadow-sm md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Demo
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Ready to try the demo flow?
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Login with the demo account, reset the demo data with
                confirmation on the dashboard, then walk through portfolio,
                watchlist, stock research, AI answers, evidence, and reports.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Reset Demo Data
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
              >
                Open Portfolio
              </Link>
              <Link
                href="/watchlist"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
              >
                Open Watchlist
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="tech-stack" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Tech Stack"
            title="Built as an end-to-end AI and data engineering portfolio project."
            description="The app connects a typed frontend, FastAPI backend, PostgreSQL persistence, market data, SEC data, agent orchestration, and browser-level testing."
          />

          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {techStack.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-medium text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        data-testid="landing-disclaimer"
        className="mx-auto max-w-7xl px-5 py-12 lg:px-8"
      >
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <p className="text-sm leading-6 text-amber-950">
              FinCredit AI is a simulated paper-trading and education tool. It
              is not financial advice, does not place real trades, and should
              not be used for real-money investing decisions.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-950">
                <Layers3 className="h-4 w-4" />
              </div>
              <p className="font-semibold">FinCredit AI</p>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              Built as an AI/data engineering portfolio project for stock
              research, simulated trading, evidence-backed answers, and
              browser-tested product workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/portfolio" className="hover:text-white">
              Portfolio
            </Link>
            <Link href="/watchlist" className="hover:text-white">
              Watchlist
            </Link>
            <Link href="/ask" className="hover:text-white">
              Ask AI
            </Link>
            <Link href="/reports" className="hover:text-white">
              Reports
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function MockBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "emerald" | "blue" | "amber";
}) {
  const styles = {
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    blue: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${styles[tone]}`}>
      {children}
    </span>
  );
}

function MockHolding({
  ticker,
  value,
  width,
}: {
  ticker: string;
  value: string;
  width: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-200">{ticker}</span>
        <span className="text-slate-400">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
          style={{ width }}
        />
      </div>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
  inverted = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  inverted?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p
        className={
          inverted
            ? "text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300"
            : "text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700"
        }
      >
        {eyebrow}
      </p>
      <h2
        className={
          inverted
            ? "mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl"
            : "mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl"
        }
      >
        {title}
      </h2>
      <p
        className={
          inverted
            ? "mt-4 text-sm leading-7 text-slate-400"
            : "mt-4 text-sm leading-7 text-slate-600"
        }
      >
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
