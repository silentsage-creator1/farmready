import React from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { formatNaira, formatNumber } from '../../utils/calculations';

const toolNames: Record<string, string> = { crop: 'Crop Yield & Seed', fertilizer: 'Fertilizer & Bag', feed: 'Livestock Feed', fish: 'Fish Farming Economics' };
const fields: Record<string, string[]> = {
  crop: ['cropType', 'areaHectares', 'seedKgPerHa', 'seedKg', 'expectedYieldKgPerHa', 'expectedHarvestKgPerHa', 'expectedHarvestKg', 'expectedHarvestTonnes'],
  fertilizer: ['cropType', 'fertilizerType', 'areaHectares', 'requiredKgPerHa', 'requiredKgPerApplicationPerHa', 'requiredKgPerApplication', 'requiredKg', 'exactBags', 'bags', 'bagSizeKg', 'purchaseCost'],
  feed: ['livestockType', 'areaHectares', 'stockingRatePerHa', 'animalsPerHa', 'animalCount', 'dailyFeedPerAnimalKg', 'dailyKgPerHa', 'dailyKg', 'monthlyKg', 'days', 'totalKg', 'exactBags', 'bags', 'bagSizeKg', 'totalCost'],
  fish: ['survivors', 'biomassKg', 'feedKg', 'feedCost', 'revenue', 'totalCosts', 'profit'],
};
const labels: Record<string, Record<string, string>> = {
  crop: { cropType: 'Crop type', areaHectares: 'Farm area', seedKgPerHa: 'Seed required per hectare', seedKg: 'Total seed required', expectedYieldKgPerHa: 'Expected yield per hectare', expectedHarvestKgPerHa: 'Expected harvest per hectare', expectedHarvestKg: 'Total expected harvest', expectedHarvestTonnes: 'Expected harvest in tonnes' },
  fertilizer: { cropType: 'Crop', fertilizerType: 'Fertilizer type', areaHectares: 'Farm area', requiredKgPerHa: 'Fertilizer required per hectare', requiredKgPerApplicationPerHa: 'Per hectare, per application', requiredKgPerApplication: 'Total amount per application', requiredKg: 'Total fertilizer required', exactBags: 'Calculated bags', bags: 'Whole bags to purchase', bagSizeKg: 'Bag size', purchaseCost: 'Estimated purchase cost' },
  feed: { livestockType: 'Livestock type', areaHectares: 'Farm area', stockingRatePerHa: 'Stocking rate per hectare', animalsPerHa: 'Estimated animals per hectare', animalCount: 'Total estimated animals', dailyFeedPerAnimalKg: 'Feed per animal per day', dailyKgPerHa: 'Daily feed per hectare', dailyKg: 'Total daily feed', monthlyKg: 'Monthly feed requirement (30 days)', days: 'Production period', totalKg: 'Feed for production period', exactBags: 'Calculated bags', bags: 'Whole bags to purchase', bagSizeKg: 'Bag size', totalCost: 'Estimated feed cost' },
  fish: { survivors: 'Expected survivors', biomassKg: 'Harvest biomass', feedKg: 'Feed required', feedCost: 'Feed cost', revenue: 'Expected revenue', totalCosts: 'Total production costs', profit: 'Estimated profit' },
};

export const ProductionAnalysisView: React.FC = () => {
  const { currentProject, setActiveView } = useFarmProject();
  const production = currentProject.toolAnalysis?.production ?? {};
  const formatOutput = (key: string, val: unknown) => {
    if (typeof val === 'string') return val || '—';
    const amount = Number(val ?? 0);
    if (['potentialRevenue', 'purchaseCost', 'totalCost', 'feedCost', 'revenue', 'totalCosts', 'profit'].includes(key)) return formatNaira(amount);
    if (key.toLowerCase().includes('bag')) return `${formatNumber(amount, 2)} bags`;
    if (key.toLowerCase().includes('hectare')) return `${formatNumber(amount, 2)} ha`;
    if (key.toLowerCase().includes('tonnes')) return `${formatNumber(amount, 2)} tonnes`;
    if (key.toLowerCase().includes('kg')) return `${formatNumber(amount, 1)} kg`;
    if (key === 'days') return `${formatNumber(amount, 0)} days`;
    return formatNumber(amount, 1);
  };

  return <div className="max-w-7xl mx-auto space-y-6">
    <header><h2 className="text-2xl font-bold text-neutral-900">Production Analysis</h2><p className="text-sm text-neutral-500 mt-1">Production estimates saved from the project’s crop, fertilizer, feed and fish calculators.</p></header>
    {Object.keys(production).length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center"><h3 className="font-semibold">No production calculations saved yet</h3><p className="text-sm text-neutral-500 mt-2">Run a production calculator in Tools, then choose its Apply action to add the result here.</p><button onClick={() => setActiveView('tools')} className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm">Open Tools</button></div> : <div className="grid md:grid-cols-2 gap-4">{Object.entries(production).map(([tool, result]) => <section key={tool} className="rounded-2xl border bg-white p-5"><h3 className="font-bold text-neutral-900">{toolNames[tool] ?? tool}</h3><dl className="mt-4 grid grid-cols-2 gap-3">{(fields[tool] ?? Object.keys(result)).map(field => field in result && <div key={field} className="rounded-lg bg-neutral-50 p-3"><dt className="text-xs text-neutral-500">{labels[tool]?.[field] ?? field}</dt><dd className="mt-1 font-mono font-semibold text-sm">{formatOutput(field, result[field])}</dd></div>)}</dl></section>)}</div>}
  </div>;
};
