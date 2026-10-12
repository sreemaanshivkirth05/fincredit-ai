import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ResearchDetails = {
  intent: string;
  scope: string;
  coveragePercent: number;
  checks: { name: string; available: boolean; reason: string }[];
  scenarios: { name: string; marketShockPercent: number; sectorShocks: Record<string, number>; groups: { currency: string; scenarioValue: number; scenarioChange: number; scenarioChangePercent: number }[]; warnings: string[] }[];
  scenarioAssumptions?: string[];
  challenges: string[];
  review: { status: string; findings: string[]; checkedPercentages: number; limitations: string; answerReplaced: boolean };
};

export function ResearchWorkbench({ details }: { details: ResearchDetails }) {
  return <Card data-testid="research-workbench" className="border-white/10 bg-white/[0.04] text-white">
    <CardHeader><CardTitle>Research agent workbench</CardTitle></CardHeader>
    <CardContent className="space-y-6">
      <div><p className="font-medium">{details.intent}</p><p className="mt-1 text-sm text-slate-400">{details.scope}</p></div>
      <div>
        <h3 className="font-medium">Planner · evidence availability {details.coveragePercent}%</h3>
        <p className="mt-1 text-xs text-slate-400">Source availability is not answer accuracy or data freshness.</p>
        <ul className="mt-3 space-y-2 text-sm">{details.checks.map((check) => <li key={check.name} className="border-l-2 border-slate-600 pl-3"><span className={check.available ? "text-emerald-300" : "text-amber-300"}>{check.name}: {check.available ? "Available" : "Missing"}</span><p className="text-slate-400">{check.reason}</p></li>)}</ul>
      </div>
      <div>
        <h3 className="font-medium">Stress-test agent · hypothetical scenarios</h3>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm">
          <caption className="sr-only">Portfolio stress scenarios grouped by currency</caption>
          <thead className="text-slate-400"><tr><th className="py-2">Scenario</th><th>Value change</th><th>Remaining value</th></tr></thead>
          <tbody>{details.scenarios.flatMap((scenario) => scenario.groups.map((group) => <tr key={`${scenario.name}-${group.currency}`} className="border-t border-white/10"><td className="py-2 pr-4">{scenario.name} · {group.currency}</td><td className="pr-4">{group.scenarioChange.toLocaleString()} {group.currency} ({group.scenarioChangePercent}%)</td><td>{group.scenarioValue.toLocaleString()} {group.currency}</td></tr>))}</tbody>
        </table></div>
        {!details.scenarios.some((scenario) => scenario.groups.length) && <p className="text-sm text-slate-400">No valid holdings available for stress testing.</p>}
        {details.scenarios.map((scenario) => <p key={scenario.name} className="mt-2 text-xs text-slate-400">{scenario.name}: market {scenario.marketShockPercent}%; {Object.keys(scenario.sectorShocks).length ? Object.entries(scenario.sectorShocks).map(([sector, shock]) => `${sector} override ${shock}%`).join(", ") : "no sector overrides"}.</p>)}
        {[...new Set(details.scenarios.flatMap((scenario) => scenario.warnings))].map((warning) => <p key={warning} className="text-xs text-amber-300">{warning}</p>)}
        <p className="mt-2 text-xs text-slate-400">Linear price shocks; no probabilities, correlations, cash, fees, or FX conversion.</p>
      </div>
      <div><h3 className="font-medium">Skeptical reviewer · challenge the thesis</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">{details.challenges.map((challenge) => <li key={challenge}>{challenge}</li>)}</ul></div>
      <div><h3 className="font-medium">Percentage review · {details.review.checkedPercentages} values checked</h3>
        <p className="mt-2 text-sm text-slate-300">{details.review.answerReplaced ? "The model draft contained unmatched percentages. A deterministic answer replaced it." : details.review.findings.length ? "Review flags require attention." : "No unmatched percentage values were found."}</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-amber-300">{details.review.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul>
        <p className="mt-2 text-xs text-slate-400">{details.review.limitations}</p>
      </div>
    </CardContent>
  </Card>;
}
