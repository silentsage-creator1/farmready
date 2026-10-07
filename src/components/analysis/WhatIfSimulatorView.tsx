import React, { useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { useCalculator } from '../../hooks/useCalculator';
import { formatNaira, formatNumber } from '../../utils/calculations';
import { RotateCcw, Save, Sliders } from 'lucide-react';

type SensitivityKey = 'priceDeltaPercent' | 'yieldDeltaPercent' | 'inputCostDeltaPercent' | 'labourCostDeltaPercent';
const sliderFields: { key: SensitivityKey; title: string; min: number; max: number; positiveIsGood: boolean; left: string; right: string }[] = [
  { key: 'priceDeltaPercent', title: 'Selling Price', min: -20, max: 20, positiveIsGood: true, left: '−20% (lower price)', right: '+20% (higher price)' },
  { key: 'yieldDeltaPercent', title: 'Expected Yield / Production', min: -30, max: 30, positiveIsGood: true, left: '−30% (lower yield)', right: '+30% (higher yield)' },
  { key: 'inputCostDeltaPercent', title: 'Input Costs', min: -20, max: 30, positiveIsGood: false, left: '−20% (lower costs)', right: '+30% (higher costs)' },
  { key: 'labourCostDeltaPercent', title: 'Labour Costs', min: -20, max: 30, positiveIsGood: false, left: '−20% (lower costs)', right: '+30% (higher costs)' },
];
const zeroDeltas = (): Record<SensitivityKey, number> => ({ priceDeltaPercent: 0, yieldDeltaPercent: 0, inputCostDeltaPercent: 0, labourCostDeltaPercent: 0 });

export const WhatIfSimulatorView: React.FC = () => {
  const { currentProject, updateWhatIf, updateCurrentProject } = useFarmProject();
  const [deltas, setDeltas] = useState(zeroDeltas);
  const [scenarioName, setScenarioName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const projectInputs = { financialModel: currentProject.financialModel, productionPlan: currentProject.productionPlan, marketPlan: currentProject.marketPlan };
  const calculation = useCalculator('whatif', { project: projectInputs, priceChangePercent: deltas.priceDeltaPercent, yieldChangePercent: deltas.yieldDeltaPercent, costChangePercent: deltas.inputCostDeltaPercent, labourCostChangePercent: deltas.labourCostDeltaPercent });
  const result = calculation.result;
  const number = (key: string) => Number(result?.[key] ?? 0);
  const unit = currentProject.productionPlan.outputUnit || 'units';

  const handleSaveScenario = () => {
    if (!result) return;
    const scenario = {
      id: `scenario-${Date.now()}`,
      name: scenarioName.trim() || `Scenario ${(currentProject.scenarios.saved?.length ?? 0) + 1}`,
      createdAt: new Date().toISOString(),
      deltas: { ...deltas },
      revenue: number('simulatedRevenue'),
      expenses: number('simulatedExpenses'),
      profit: number('simulatedProfit'),
      roi: result.simulatedRoi == null ? null : number('simulatedRoi'),
      breakEvenUnits: result.simulatedBreakEvenQuantity == null ? null : number('simulatedBreakEvenQuantity'),
    };
    updateCurrentProject({
      whatIf: { ...deltas },
      scenarios: { ...currentProject.scenarios, saved: [...(currentProject.scenarios.saved ?? []), scenario] },
      toolAnalysis: { ...currentProject.toolAnalysis, whatIf: result },
    });
    setSaveSuccess(true);
    window.setTimeout(() => setSaveSuccess(false), 2500);
  };

  const renderDelta = (delta: number, positiveIsGood = true) => {
    const isGood = positiveIsGood ? delta >= 0 : delta <= 0;
    return <span className={`font-mono text-xs font-semibold ${delta === 0 ? 'text-neutral-500' : isGood ? 'text-emerald-700' : 'text-red-700'}`}>{delta > 0 ? '+' : ''}{formatNumber(delta, 0)}%</span>;
  };
  const breakEven = result?.simulatedBreakEvenQuantity;

  return <div className="space-y-6 max-w-7xl mx-auto">
    <header><h2 className="text-2xl font-bold tracking-tight text-neutral-900">What-If Simulator</h2><p className="text-sm text-neutral-500 mt-1">Change the project’s assumptions to explore their effect on revenue, costs and investment performance. Sliders start at the active project’s base values.</p></header>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <section className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-7">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3"><h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-2"><Sliders className="w-4 h-4 text-emerald-600" />Sensitivity Variables</h3><span className="text-xs text-neutral-400">0% = project base</span></div>
        {sliderFields.map(field => <div key={field.key} className="space-y-2"><div className="flex items-center justify-between text-xs"><label htmlFor={field.key} className="font-bold text-neutral-800">{field.title}</label><div className="flex items-center gap-2">{renderDelta(deltas[field.key], field.positiveIsGood)}<label className="sr-only" htmlFor={`${field.key}-number`}>{field.title} change percentage</label><input id={`${field.key}-number`} aria-label={`${field.title} change percentage`} type="number" placeholder="Enter value" min={field.min} max={field.max} step={5} value={deltas[field.key] || ''} onKeyDown={event => { if (['e', 'E', '+'].includes(event.key)) event.preventDefault(); }} onChange={event => setDeltas(previous => ({ ...previous, [field.key]: Math.min(field.max, Math.max(field.min, Number(event.target.value) || 0)) }))} className="w-24 rounded-lg border border-neutral-300 px-2 py-1 font-mono" /></div></div><input id={field.key} aria-label={`${field.title} sensitivity`} type="range" min={field.min} max={field.max} step={5} value={deltas[field.key]} onChange={e => setDeltas(previous => ({ ...previous, [field.key]: Number(e.target.value) }))} className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" /><div className="flex justify-between text-[10px] text-neutral-400 font-mono"><span>{field.left}</span><span>0% (Base)</span><span>{field.right}</span></div></div>)}
        <label className="block text-xs font-semibold text-neutral-700">Scenario name (optional)<input value={scenarioName} onChange={e => setScenarioName(e.target.value)} placeholder="e.g. Low-price, high-cost" className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" /></label>
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100"><button onClick={() => { setDeltas(zeroDeltas()); setScenarioName(''); updateWhatIf(zeroDeltas()); }} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"><RotateCcw className="w-3.5 h-3.5" />Reset Variables</button><button onClick={handleSaveScenario} disabled={!result || calculation.loading} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 disabled:bg-neutral-300 text-white rounded-lg"><Save className="w-3.5 h-3.5" />{saveSuccess ? 'Saved to Project!' : 'Save Scenario'}</button></div>
      </section>
      <section className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3"><h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700">Updated Live Results</h3><span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Project assumptions</span></div>
        {calculation.error ? <p role="alert" className="text-sm text-red-700">Could not calculate this scenario: {calculation.error}</p> : calculation.loading || !result ? <p className="text-sm text-neutral-500">Calculating project scenario…</p> : <>
          <div className="grid grid-cols-2 gap-4">{[
            ['Revenue', 'simulatedRevenue', 'revenueDelta', true], ['Expenses', 'simulatedExpenses', 'expensesDelta', false], ['Estimated Profit', 'simulatedProfit', 'profitDelta', true], ['ROI', 'simulatedRoi', 'roiDelta', true],
          ].map(([label, key, deltaKey, good]) => <div key={String(key)} className="border-b border-neutral-100 pb-3"><p className="text-xs text-neutral-500">{String(label)}</p><p className={`text-lg font-bold font-mono ${key === 'simulatedProfit' && number(String(key)) < 0 ? 'text-red-600' : 'text-neutral-900'}`}>{key === 'simulatedRoi' ? result.simulatedRoi == null ? 'Not available' : `${formatNumber(number(String(key)), 1)}%` : formatNaira(number(String(key)))}</p>{renderDelta(number(String(deltaKey)), Boolean(good))}</div>)}</div>
          <div><p className="text-xs text-neutral-500">Break-even point</p><p className="font-mono font-bold text-neutral-900">{breakEven == null ? 'Not available: adjusted selling price does not cover variable cost per unit' : `${formatNumber(number('simulatedBreakEvenQuantity'), 0)} ${unit}`}</p></div>
          <div className={`p-4 rounded-xl border text-xs leading-relaxed ${number('simulatedProfit') > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : number('simulatedProfit') < 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}><span className="font-bold block mb-1">Sensitivity Takeaway</span>{number('simulatedProfit') > 0 ? `The scenario remains profitable with an estimated ${formatNaira(number('simulatedProfit'))} operating surplus. Validate these assumptions and preserve adequate working capital.` : number('simulatedProfit') < 0 ? `This scenario produces an estimated cash deficit of ${formatNaira(Math.abs(number('simulatedProfit')))}. Review price, costs and production assumptions, and avoid committing additional capital until the downside is addressed.` : 'This scenario is at estimated break-even with no operating surplus. Keep a cash buffer and validate assumptions before committing more capital.'}</div>
        </>}
      </section>
    </div>
  </div>;
};
