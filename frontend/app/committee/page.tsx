"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Download, Play, Square, RefreshCw, Check, Circle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CommitteeRun, getCommitteeRun, getCommitteeRuns, createCommitteeRun, cancelCommitteeRun } from "@/lib/api";

const roles = ["Supervisor", "Fundamental analyst", "Quant analyst", "Portfolio risk officer", "Bull analyst", "Bear analyst", "Evidence auditor", "Synthesizer"];
const active = (run: CommitteeRun | null) => !!run && ["queued", "running"].includes(run.status);
const when = (date: string) => new Date(date).toLocaleString();

export default function CommitteePage() {
  const [runs, setRuns] = useState<CommitteeRun[]>([]);
  const [run, setRun] = useState<CommitteeRun | null>(null);
  const [question, setQuestion] = useState("");
  const [ticker, setTicker] = useState("");
  const [tab, setTab] = useState("Brief");
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selection = useRef(0);
  async function load(id: string) {
    const seq = ++selection.current;
    setError("");
    try { const data = await getCommitteeRun(id); if (seq === selection.current) { setRun(data); window.history.replaceState(null, "", `?run=${id}`); } }
    catch { if (seq === selection.current) setError("Could not open this research. Check your connection and sign-in."); }
  }
  async function refresh() {
    try { setRuns(await getCommitteeRuns()); } catch { setError("Saved research could not load. Check your connection and try Refresh."); }
  }
  useEffect(() => {
    setAdvanced(localStorage.getItem("fincredit_advanced") === "true");
    void refresh();
    const id = new URLSearchParams(window.location.search).get("run");
    if (id) void load(id);
  }, []);
  useEffect(() => {
    if (!active(run)) return;
    const id = run!.id;
    let stopped = false;
    const timer = setInterval(async () => {
      try { const data = await getCommitteeRun(id); if (!stopped) { setRun(data); if (!active(data)) void refresh(); } }
      catch { if (!stopped) setError("Live updates paused. Your run remains saved; reopen it to reconnect."); }
    }, 3000);
    return () => { stopped = true; clearInterval(timer); };
  }, [run?.id, run?.status]);
  async function start(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const data = await createCommitteeRun(question.trim(), ticker.trim().toUpperCase()); ++selection.current; setRun(data); setTab("Brief"); window.history.replaceState(null, "", `?run=${data.id}`); await refresh(); }
    catch (e) { setError(e instanceof Error && e.message.includes("409") ? "A review is already active. Open it from Saved research." : "Could not start the review. Check your connection and server configuration."); }
    finally { setBusy(false); }
  }
  async function cancel() {
    if (!run) return; setBusy(true);
    try { setRun(await cancelCommitteeRun(run.id)); await refresh(); } catch { setError("Cancellation could not be confirmed. Refresh the run before trying again."); }
    finally { setBusy(false); }
  }
  function download() {
    if (!run) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(run, null, 2)], {type: "application/json"}));
    const a = document.createElement("a"); a.href = url; a.download = `fincredit-research-${run.id}.json`; a.click(); URL.revokeObjectURL(url);
  }
  const evidence = run?.snapshot?.evidence ?? [];
  const perspectives = run?.result?.perspectives ?? [];
  return <AppShell><div className="workstation">
    <div className="ws-heading"><div><p className="ws-eyebrow">RESEARCH / INVESTMENT COMMITTEE</p><h1>Conviction needs a counterargument.</h1><p className="ws-muted">One evidence snapshot. Opposing perspectives. A decision you control.</p></div>
      <button className="ws-button" aria-pressed={advanced} onClick={() => {setAdvanced(!advanced); localStorage.setItem("fincredit_advanced", String(!advanced));}}>{advanced ? "Advanced view" : "Guided view"}</button></div>
    <div className="ws-notice"><span className="ws-dot"/> Paper research workspace <span className="ws-muted">• No autonomous trades • Ollama / Hugging Face only</span></div>
    {error && <div className="ws-error" role="alert">{error}</div>}
    <form onSubmit={start} className="ws-panel ws-composer">
      <div><label htmlFor="research-question">What should the committee challenge?</label><textarea id="research-question" required minLength={8} maxLength={2000} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Review my portfolio’s concentration and challenge the strongest investment thesis." rows={2}/></div>
      <div className="ws-compose-actions"><div><label htmlFor="research-ticker">Ticker <span className="ws-muted">(optional)</span></label><input id="research-ticker" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} maxLength={20} pattern="[A-Z0-9.\^=\-]*" placeholder="e.g. AAPL"/></div>
        <button className="ws-button ws-primary" disabled={busy || active(run)}><Play size={15}/>{busy ? "Saving…" : "Convene committee"}</button></div>
      <p className="ws-muted ws-small">Uses stored holdings and available company facts. Two model calls run sequentially; cloud queues can take several minutes.</p>
    </form>
    <div className="ws-layout"><aside className="ws-panel ws-history"><div className="ws-panel-title"><h2>Saved research</h2><button className="ws-icon" aria-label="Refresh saved research" onClick={() => void refresh()}><RefreshCw size={15}/></button></div>
      {!runs.length && <p className="ws-muted ws-pad">Your reviews will appear here. Start with a question above.</p>}
      {runs.map(item => <button key={item.id} className={`ws-history-item ${run?.id === item.id ? "selected" : ""}`} onClick={() => void load(item.id)}><span className="ws-small ws-muted">{item.ticker || "PORTFOLIO"} · {item.status}</span><strong>{item.question}</strong><span className="ws-small ws-muted">{when(item.createdAt)}</span></button>)}
      <div className="ws-pad ws-small ws-muted">Latest 50 reviews. Completed packets retain the original evidence and workflow version.</div>
    </aside><section className="ws-panel ws-main">
      {!run ? <div className="ws-empty"><p className="ws-eyebrow">YOUR RESEARCH DESK</p><h2>A stronger thesis starts here.</h2><p>Ask a question, inspect the evidence, and compare the strongest case with its counterargument.</p><div className="ws-example-grid">{["Where is my portfolio most concentrated?", "Challenge my investment thesis for AAPL", "What would a broad market decline do to my holdings?"].map(q => <button className="ws-button" key={q} onClick={() => setQuestion(q)}>{q}<ArrowUpRight size={16}/></button>)}</div><Link href="/portfolio" className="ws-link">Review your portfolio first →</Link></div> : <>
      <div className="ws-report-header"><div><span className="ws-eyebrow">{run.ticker || "PORTFOLIO"} / {run.status}</span><h2>{run.question}</h2><p className="ws-muted ws-small">{when(run.createdAt)} · {run.version}</p></div><div className="ws-actions">{active(run) && <button className="ws-button" onClick={cancel} disabled={busy}><Square size={14}/>Stop</button>}<button className="ws-button" onClick={download}><Download size={14}/>Export</button></div></div>
      <div className="ws-tabs" role="tablist" aria-label="Research views">{["Brief", "Debate", "Evidence", "Scenarios", "Timeline"].map(name => <button role="tab" aria-selected={tab === name} key={name} onClick={() => setTab(name)}>{name}{name === "Evidence" && ` (${evidence.length})`}</button>)}</div>
      <div className="ws-pad" role="tabpanel" aria-label={tab}>
      <div className="ws-status" aria-live="polite">{run.status === "queued" ? "Queued — waiting for the committee worker. If this persists, check that the worker service is running." : run.status === "running" ? `In progress — ${run.events.at(-1)?.role ?? "preparing"}. You can leave this page and return later.` : run.status === "partial" ? "Partial result — model interpretation was unavailable. Saved evidence and scenarios are still available." : run.status === "cancelled" ? "Cancelled. Any in-flight model call may finish, but its result will not be published." : run.result.error ?? "Research packet saved. Human review required."}</div>
      {tab === "Brief" && <><h3>Decision brief</h3><p className="ws-body">{run.result.summary || "The committee is collecting the material for this review."}</p>{run.result.missingSources?.length ? <div className="ws-warning">Missing sources: {run.result.missingSources.join(", ")}. Conclusions are limited by these gaps.</div> : null}<h3>Questions before conviction</h3><ul className="ws-list">{run.result.nextSteps?.map(s => <li key={s}>{s}</li>)}</ul>{run.result.limitations?.map(s => <p className="ws-small ws-muted" key={s}>{s}</p>)}<div className="ws-actions"><Link className="ws-button" href="/portfolio">Inspect portfolio</Link><Link className="ws-button" href={run.ticker ? `/stock/${encodeURIComponent(run.ticker)}` : "/watchlist"}>Review source data</Link></div></>}
      {tab === "Debate" && <><p className="ws-muted">These are interpretations from the same model, not independent votes. The bear reviews the bull’s case in one bounded round.</p><div className="ws-debate">{perspectives.map(p => <article key={p.role} className="ws-perspective"><p className="ws-eyebrow">{p.role}</p><p className="ws-prose">{p.text}</p>{p.notice && <p className="ws-warning">{p.notice}</p>}<div className="ws-actions">{p.audit.citedEvidence.map(id => <button key={id} className="ws-button" onClick={() => {setTab("Evidence"); setTimeout(() => document.getElementById(id)?.scrollIntoView({block: "center"}), 0);}}>{id}</button>)}</div>{(p.audit.missingCitations || p.audit.unknownReferences.length > 0 || p.audit.percentageReview.findings.length > 0) && <p className="ws-warning">Audit flags: {p.audit.missingCitations ? "Missing citations. " : ""}{p.audit.unknownReferences.length ? `Unknown references: ${p.audit.unknownReferences.join(", ")}. ` : ""}{p.audit.percentageReview.findings.join(" ")}</p>}<p className="ws-muted ws-small">{p.audit.limitation}</p>{advanced && <p className="ws-muted ws-small">{p.provider || "No provider response"} · {p.model || p.status}</p>}</article>)}</div>{!perspectives.length && <p className="ws-muted">Perspectives appear after the bounded review completes.</p>}</>}
      {tab === "Evidence" && <><p className="ws-muted">{run.snapshot.freshness || "Evidence has not been captured yet."}</p>{evidence.map(e => <article id={e.id} className="ws-evidence" key={e.id}><span className="ws-evidence-id">{e.id}</span><div><h3>{e.source}</h3><p className="ws-body">{e.claim}</p></div></article>)}{advanced && <details><summary>Inspect original snapshot</summary><pre className="ws-json">{JSON.stringify(run.snapshot, null, 2)}</pre></details>}</>}
      {tab === "Scenarios" && <><p className="ws-muted">Hypothetical price shocks, calculated separately for each currency. Not probabilities. No FX conversion, correlation or liquidity model.</p><div className="ws-table-wrap"><table><caption>Stored portfolio stress scenarios</caption><thead><tr><th>Scenario</th><th>Currency</th><th>Remaining value</th><th>Change</th><th>Change %</th></tr></thead><tbody>{run.snapshot.research?.scenarios?.flatMap(s => s.groups.map(g => <tr key={`${s.name}-${g.currency}`}><td>{s.name}</td><td>{g.currency}</td><td>{g.scenarioValue.toLocaleString()}</td><td>{g.scenarioChange.toLocaleString()}</td><td>{g.scenarioChangePercent}%</td></tr>))}</tbody></table></div>{!run.snapshot.research?.scenarios?.some(s => s.groups.length) && <p className="ws-muted">No valid priced holdings available. Add positions in Portfolio to calculate scenarios.</p>}</>}
      {tab === "Timeline" && <><p className="ws-muted">Recorded execution events and tool summaries. Roles include deterministic services and model interpretations.</p><ol className="ws-timeline">{roles.map(role => {const events = run.events.filter(e => e.role === role); return <li key={role}>{events.length ? <Check size={17}/> : <Circle size={17}/>}<div><h3>{role}</h3>{events.length ? events.map((e,i) => <p className="ws-muted ws-small" key={i}>{when(e.at)} — {e.detail}</p>) : <p className="ws-muted ws-small">No event recorded</p>}</div></li>;})}</ol></>}
      </div></>}
    </section></div>
  </div></AppShell>;
}
