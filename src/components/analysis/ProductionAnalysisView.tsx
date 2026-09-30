import React from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { formatNaira, formatNumber } from '../../utils/calculations';

const labels: Record<string, string[]> = {
  crop: ['Seed required', 'Seed bags', 'Expected harvest', 'Adjusted harvest', 'Potential revenue'],
  fertilizer: ['Basal fertilizer', 'Top-dressing fertilizer', 'Total quantity', 'Bags to purchase', 'Purchase cost'],
  feed: ['Daily feed', 'Total feed', 'Bags to purchase', 'Feed cost', 'Expected survivors'],
  fish: ['Expected survivors', 'Harvest biomass', 'Feed required', 'Feed cost', 'Expected revenue', 'Total production costs', 'Estimated profit'],
};
const fields: Record<string, string[]> = {
  crop: ['seedKg', 'seedBags', 'expectedHarvestTonnes', 'adjustedHarvestTonnes', 'potentialRevenue'],
  fertilizer: ['basalKg', 'topdressKg', 'requiredKg', 'bags', 'purchaseCost'],
  feed: ['dailyKg', 'totalKg', 'bags', 'totalCost', 'survivors'],
  fish: ['survivors', 'biomassKg', 'feedKg', 'feedCost', 'revenue', 'totalCosts', 'profit'],
};

export const ProductionAnalysisView: React.FC = () => {
  const { currentProject, setActiveView } = useFarmProject();
  const production = currentProject.toolAnalysis?.production ?? {};
  const toolNames: Record<string, string> = { crop: 'Crop Yield & Seed', fertilizer: 'Fertilizer & Bag', feed: 'Livestock Feed', fish: 'Fish Farming Economics' };
  const formatOutput = (key: string, val: unknown) => {
    const amount = Number(val ?? 0);
    if (['potentialRevenue', 'purchaseCost', 'totalCost', 'feedCost', 'revenue', 'totalCosts', 'profit'].includes(key)) return formatNaira(amount);
    if (key.toLowerCase().includes('tonnes')) return `${formatNumber(amount, 2)} tonnes`;
    if (key.toLowerCase().includes('kg')) return `${formatNumber(amount, 1)} kg`;
    return formatNumber(amount, 1);
  };

  return <div className="max-w-7xl mx-auto space-y-6">
    <header><h2 className="text-2xl font-bold text-neutral-900">Production Analysis</h2><p className="text-sm text-neutral-500 mt-1">Production estimates saved from the project’s crop, fertilizer, feed and fish calculators.</p></header>
    {Object.keys(production).length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center"><h3 className="font-semibold">No production calculations saved yet</h3><p className="text-sm text-neutral-500 mt-2">Run a production calculator in Tools, then choose its Apply action to add the result here.</p><button onClick={() => setActiveView('tools')} className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm">Open Tools</button></div> : <div className="grid md:grid-cols-2 gap-4">{Object.entries(production).map(([tool, result]) => <section key={tool} className="rounded-2xl border bg-white p-5"><h3 className="font-bold text-neutral-900">{toolNames[tool] ?? tool}</h3><dl className="mt-4 grid grid-cols-2 gap-3">{(fields[tool] ?? Object.keys(result)).map((field, index) => field in result && <div key={field} className="rounded-lg bg-neutral-50 p-3"><dt className="text-xs text-neutral-500">{labels[tool]?.[index] ?? field}</dt><dd className="mt-1 font-mono font-semibold text-sm">{formatOutput(field, result[field])}</dd></div>)}</dl></section>)}</div>}
  </div>;
};
