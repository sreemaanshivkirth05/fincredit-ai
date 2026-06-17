"use client";

import type React from "react";

import {
  Bell,
  Bot,
  Database,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const modelSettings = [
  {
    title: "Primary Reasoning Model",
    value: "ChatGPT API",
    detail: "Used for final report writing, Ask FinCredit answers, and credit synthesis.",
  },
  {
    title: "Local Classification Model",
    value: "Ollama Qwen",
    detail: "Used for sentiment classification, red flag detection, and section tagging.",
  },
  {
    title: "Vector Store",
    value: "ChromaDB",
    detail: "Stores filing chunks, evidence snippets, and retrieved context.",
  },
];

const notificationSettings = [
  {
    title: "Weekly Portfolio Digest",
    status: "Enabled",
    detail: "Send weekly portfolio risk summary by email.",
  },
  {
    title: "High-Risk Alerts",
    status: "Enabled",
    detail: "Notify when a holding moves into high-risk status.",
  },
  {
    title: "New SEC Filing Alerts",
    status: "Enabled",
    detail: "Notify when watchlist companies publish new filings.",
  },
];

const dataSources = [
  {
    title: "SEC EDGAR",
    status: "Connected",
    detail: "Company filings and filing metadata.",
  },
  {
    title: "SEC Company Facts",
    status: "Connected",
    detail: "Financial metrics and standardized company facts.",
  },
  {
    title: "GDELT News",
    status: "Connected",
    detail: "News radar and sentiment source.",
  },
  {
    title: "Yahoo Finance",
    status: "Connected",
    detail: "Market prices and portfolio valuation.",
  },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-blue-500/15 text-blue-200">
              Product Configuration
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Manage user profile details, AI model routing, cost limits,
              notifications, report preferences, and data source connections.
            </p>
          </div>

          <Button className="bg-blue-500 hover:bg-blue-600">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Plan"
            value="Local MVP"
            change="Low cost"
            icon={<Settings className="h-5 w-5 text-blue-300" />}
          />
          <MetricCard
            title="Monthly Limit"
            value="$20"
            change="$4.54 used"
            icon={<Wallet className="h-5 w-5 text-emerald-300" />}
          />
          <MetricCard
            title="Models"
            value="2"
            change="OpenAI + Ollama"
            icon={<Bot className="h-5 w-5 text-violet-300" />}
          />
          <MetricCard
            title="Notifications"
            value="3"
            change="Enabled"
            icon={<Bell className="h-5 w-5 text-amber-300" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-300" />
                Profile
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Name</label>
                <Input
                  defaultValue="Sreemaan Shivkirth"
                  className="mt-2 border-white/10 bg-black/20 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Email</label>
                <Input
                  defaultValue="sreemaanshivkirthvenkatesh@gmail.com"
                  className="mt-2 border-white/10 bg-black/20 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Default Role</label>
                <Input
                  defaultValue="Analyst"
                  className="mt-2 border-white/10 bg-black/20 text-white"
                />
              </div>

              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                <p className="text-sm font-medium text-blue-100">
                  Role-Based Access
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Current permissions allow portfolio analysis, report creation,
                  AI questions, and evidence review.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-violet-300" />
                AI Model Routing
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {modelSettings.map((item) => (
                <SettingCard
                  key={item.title}
                  title={item.title}
                  value={item.value}
                  detail={item.detail}
                />
              ))}

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-300">Monthly cost usage</span>
                  <span className="text-slate-400">$4.54 / $20</span>
                </div>
                <Progress value={23} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-300" />
                Notifications
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {notificationSettings.map((item) => (
                <SettingCard
                  key={item.title}
                  title={item.title}
                  value={item.status}
                  detail={item.detail}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-300" />
                Data Sources
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {dataSources.map((item) => (
                <SettingCard
                  key={item.title}
                  title={item.title}
                  value={item.status}
                  detail={item.detail}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              Governance Defaults
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <GovernanceDefault title="Citation Required" value="Yes" />
              <GovernanceDefault title="Audit Logging" value="Enabled" />
              <GovernanceDefault title="Fallback Model" value="Ollama" />
              <GovernanceDefault title="Report Approval" value="Required" />
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

function SettingCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p>
      </div>

      <Badge className="shrink-0 bg-emerald-500/15 text-emerald-200">
        {value}
      </Badge>
    </div>
  );
}

function GovernanceDefault({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  );
}