"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getModelConfiguration } from "@/lib/api";
export default function SettingsPage() {
  const [config, setConfig] = useState<Awaited<ReturnType<typeof getModelConfiguration>> | null>(null);
  const [error, setError] = useState("");
  async function load() { setError(""); try {setConfig(await getModelConfiguration());} catch {setError("Configuration could not load. Check your connection and sign-in.");} }
  useEffect(() => { void load(); }, []);
  return <AppShell><div className="workstation"><div className="ws-heading"><div><p className="ws-eyebrow">WORKSPACE / SETTINGS</p><h1>Your research environment</h1><p className="ws-muted">Actual server configuration. Secrets stay on the server.</p></div><button className="ws-button" onClick={load}>Refresh</button></div>{error && <p role="alert" className="ws-error">{error}</p>}<div className="ws-panel ws-pad">{!config ? <p>Loading configuration…</p> : <><h2>Model routing</h2><dl className="grid gap-5 py-6 sm:grid-cols-2">{[["Provider",config.provider],["Model",config.model],["Cloud credentials", config.cloudCredentialsConfigured ? "Configured; connectivity not verified" : "Not configured"],["Local fallback",config.fallbackEnabled ? "Enabled" : "Disabled"],["Execution", config.execution],["Workflow",config.version]].map(([label,value]) => <div key={label}><dt className="ws-muted ws-small">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}</dl><p className="ws-warning">Configuration is not a health check. Validate model availability and any Hugging Face quota before relying on a review.</p><p className="ws-muted">Change deployment environment variables to select Ollama or your Hugging Face Space. No paid inference provider is configured. Free cloud availability depends on your account and quota.</p></>}</div><div className="ws-panel ws-pad mt-6"><h2>Research preferences</h2><p className="ws-muted my-3">Guided and advanced views use the same calculations. Switch views in the committee; your preference is saved in this browser.</p><div className="ws-actions"><Link className="ws-button" href="/committee">Open committee</Link><Link className="ws-button" href="/profile">Account profile</Link></div></div></div></AppShell>;
}
