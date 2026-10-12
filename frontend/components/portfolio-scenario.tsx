"use client";

import { useState } from "react";
import { runPortfolioScenario, type PortfolioAnalytics } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function money(value: number, currency: string) {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function PortfolioScenario({ sectors }: { sectors: string[] }) {
  const [shock, setShock] = useState("-10");
  const [sector, setSector] = useState("");
  const [sectorShock, setSectorShock] = useState("-20");
  const [result, setResult] = useState<PortfolioAnalytics | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    const market = Number(shock);
    const override = Number(sectorShock);
    if (!shock.trim() || !Number.isFinite(market) || market < -100 || market > 100 ||
        (sector && (!sectorShock.trim() || !Number.isFinite(override) || override < -100 || override > 100))) {
      setError("Enter a percentage between -100 and 100.");
      setResult(null);
      return;
    }
    setPending(true);
    setError("");
    setResult(null);
    try {
      setResult(await runPortfolioScenario(market, sector ? { [sector]: override } : {}));
    } catch {
      setError("Unable to calculate the scenario. Try again.");
    } finally {
      setPending(false);
    }
  }

  function clearResult() { setResult(null); setError(""); }

  return (
    <Card className="border-white/10 bg-white/[0.04] text-white">
      <CardHeader><CardTitle>Portfolio scenario lab</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">Explore a hypothetical price move using stored holdings. A sector override replaces the market shock for that sector. Your holdings stay unchanged.</p>
        <div className="flex flex-wrap items-end gap-4">
          <label className="space-y-2 text-sm">Market shock (%)
            <input aria-label="Market shock (%)" type="number" min={-100} max={100} step="any" value={shock} disabled={pending}
              onChange={(event) => { setShock(event.target.value); clearResult(); }} className="block w-32 rounded border border-white/20 bg-slate-900 p-2" />
          </label>
          <label className="space-y-2 text-sm">Sector override
            <select aria-label="Sector override" value={sector} disabled={pending} onChange={(event) => { setSector(event.target.value); clearResult(); }} className="block rounded border border-white/20 bg-slate-900 p-2">
              <option value="">No override</option>
              {sectors.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          {sector && <label className="space-y-2 text-sm">Sector shock (%)
            <input aria-label="Sector shock (%)" type="number" min={-100} max={100} step="any" value={sectorShock} disabled={pending}
              onChange={(event) => { setSectorShock(event.target.value); clearResult(); }} className="block w-32 rounded border border-white/20 bg-slate-900 p-2" />
          </label>}
          <Button onClick={run} disabled={pending} className="bg-blue-500 text-white">{pending ? "Calculating…" : "Run scenario"}</Button>
        </div>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        {result && <div aria-live="polite" className="space-y-4">
          {!result.groups.length && <p>No holdings with valid prices are available for this scenario.</p>}
          {result.groups.map((group) => <div key={group.currency} className="space-y-3">
            <h3 className="font-medium">{group.currency} scenario results</h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-slate-400">Scenario value</dt><dd>{money(group.scenarioValue, group.currency)}</dd></div>
              <div><dt className="text-slate-400">Value change</dt><dd>{money(group.scenarioChange, group.currency)} ({group.scenarioChangePercent}%)</dd></div>
              <div><dt className="text-slate-400">Largest / top three positions</dt><dd>{group.largestPositionPercent}% / {group.topThreePercent}%</dd></div>
              <div><dt className="text-slate-400">Effective holdings</dt><dd>{group.effectiveHoldings} (equal-weight equivalent)</dd></div>
            </dl>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm">
              <caption className="sr-only">Hypothetical impact by holding in {group.currency}</caption>
              <thead className="text-slate-400"><tr><th className="py-2">Ticker</th><th>Weight</th><th>Shock</th><th>Value change</th><th>Scenario value</th></tr></thead>
              <tbody>{group.positions.map((position, index) => <tr key={`${position.ticker}-${index}`} className="border-t border-white/10">
                <td className="py-2">{position.ticker}</td><td>{position.weight}%</td><td>{position.shockPercent}%</td><td>{money(position.change, group.currency)}</td><td>{money(position.scenarioValue, group.currency)}</td>
              </tr>)}</tbody>
            </table></div>
          </div>)}
          {result.warnings.map((warning) => <p key={warning} className="text-sm text-amber-300">{warning}</p>)}
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">{result.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul>
        </div>}
      </CardContent>
    </Card>
  );
}
