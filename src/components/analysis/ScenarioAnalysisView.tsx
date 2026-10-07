import React, { useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { calculateFinancialMetrics, computeScenarios, formatNaira, formatNumber } from '../../utils/calculations';
import { Edit2, Check, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';

export const ScenarioAnalysisView: React.FC = () => {
  const { currentProject, updateCurrentProject } = useFarmProject();
  const scenarios = computeScenarios(currentProject);
  const financialMetrics = calculateFinancialMetrics(currentProject);
  const [editingCase, setEditingCase] = useState<'conservative' | 'expected' | 'optimistic' | null>(null);

  const [editYield, setEditYield] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);

  const startEdit = (key: 'conservative' | 'expected' | 'optimistic') => {
    setEditingCase(key);
    setEditYield(scenarios[key].yield);
    setEditPrice(scenarios[key].price);
  };

  const saveEdit = () => {
    if (!editingCase) return;
    updateCurrentProject({
      scenarios: {
        ...currentProject.scenarios,
        [editingCase]: {
          ...currentProject.scenarios[editingCase],
          yield: editYield,
          price: editPrice,
        }
      }
    });
    setEditingCase(null);
  };

  const unit = currentProject.productionPlan.outputUnit;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          Scenario Analysis
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Compare different possible outcomes for your farm project across yield and market pricing.
        </p>
      </div>

      {/* 3 Columns Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Conservative */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Stress Case
              </span>
              <h3 className="text-lg font-bold text-neutral-900 mt-0.5">Conservative</h3>
              <p className="text-xs text-neutral-500">Lower yield and market price discount</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Expected Yield</span>
                <span className="font-mono font-bold text-neutral-900">{scenarios.conservative.yield} {unit}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Selling Price (per {unit})</span>
                <span className="font-mono font-bold text-neutral-900">{formatNaira(scenarios.conservative.price)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Total Revenue</span>
                <span className="font-mono font-bold text-neutral-900">{formatNaira(scenarios.conservative.revenue)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Total Expenses</span>
                <span className="font-mono font-bold text-neutral-900">{formatNaira(scenarios.conservative.expenses)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-700 font-semibold">Estimated Profit</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {formatNaira(scenarios.conservative.profit)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500">ROI</span>
                <span className="font-mono font-bold text-neutral-800">{scenarios.conservative.roi == null ? 'Not available' : `${formatNumber(scenarios.conservative.roi, 1)}%`}</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => startEdit('conservative')}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Scenario</span>
            </button>
          </div>
        </div>

        {/* 2. Expected (Current Plan) */}
        <div className="bg-white rounded-2xl border-2 border-emerald-600 shadow-md p-6 flex flex-col justify-between relative ring-4 ring-emerald-500/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
            Current Plan
          </div>

          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Baseline Model
              </span>
              <h3 className="text-lg font-bold text-neutral-900 mt-0.5">Expected</h3>
              <p className="text-xs text-neutral-500">Based on current assessment inputs</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Expected Yield</span>
                <span className="font-mono font-bold text-neutral-900">{scenarios.expected.yield} {unit}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Selling Price (per {unit})</span>
                <span className="font-mono font-bold text-neutral-900">{formatNaira(scenarios.expected.price)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Total Revenue</span>
                <span className="font-mono font-bold text-neutral-900">{formatNaira(scenarios.expected.revenue)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Total Expenses</span>
                <span className="font-mono font-bold text-neutral-900">{formatNaira(scenarios.expected.expenses)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-700 font-semibold">Estimated Profit</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {formatNaira(scenarios.expected.profit)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500">ROI</span>
                <span className="font-mono font-bold text-emerald-700">{scenarios.expected.roi == null ? 'Not available' : `${formatNumber(scenarios.expected.roi, 1)}%`}</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => startEdit('expected')}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Scenario</span>
            </button>
          </div>
        </div>

        {/* 3. Optimistic */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Upside Potential
              </span>
              <h3 className="text-lg font-bold text-neutral-900 mt-0.5">Optimistic</h3>
              <p className="text-xs text-neutral-500">Higher yield and premium market price</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Expected Yield</span>
                <span className="font-mono font-bold text-neutral-900">{scenarios.optimistic.yield} {unit}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Selling Price (per {unit})</span>
                <span className="font-mono font-bold text-neutral-900">{formatNaira(scenarios.optimistic.price)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Total Revenue</span>
                <span className="font-mono font-bold text-neutral-900">{formatNaira(scenarios.optimistic.revenue)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">Total Expenses</span>
                <span className="font-mono font-bold text-neutral-900">{formatNaira(scenarios.optimistic.expenses)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-700 font-semibold">Estimated Profit</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {formatNaira(scenarios.optimistic.profit)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500">ROI</span>
                <span className="font-mono font-bold text-emerald-700">{scenarios.optimistic.roi == null ? 'Not available' : `${formatNumber(scenarios.optimistic.roi, 1)}%`}</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => startEdit('optimistic')}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Scenario</span>
            </button>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
        <div><h3 className="font-bold text-neutral-900">Saved What-If Scenarios</h3><p className="text-xs text-neutral-500 mt-1">Saved sensitivity runs from the What-If Simulator.</p></div>
        {(currentProject.scenarios.saved ?? []).length === 0 ? <p className="text-sm text-neutral-500">No custom scenarios saved yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="text-neutral-500 border-b"><th className="py-2">Scenario</th><th className="py-2">Revenue</th><th className="py-2">Costs</th><th className="py-2">Profit</th><th className="py-2">ROI</th><th className="py-2">Break-even</th><th className="py-2">Action</th></tr></thead><tbody className="divide-y">{(currentProject.scenarios.saved ?? []).map(saved=><tr key={saved.id}><td className="py-3 font-semibold">{saved.name}</td><td className="py-3">{formatNaira(saved.revenue)}</td><td className="py-3">{formatNaira(saved.expenses)}</td><td className={`py-3 font-semibold ${saved.profit<0?'text-red-600':'text-emerald-700'}`}>{formatNaira(saved.profit)}</td><td className="py-3">{financialMetrics.totalStartupCapital > 0 ? `${formatNumber(saved.roi,1)}%` : 'Not available'}</td><td className="py-3">{saved.breakEvenUnits==null?'N/A':`${formatNumber(saved.breakEvenUnits,0)} ${unit}`}</td><td className="py-3"><button aria-label={`Delete ${saved.name}`} title="Delete scenario" onClick={()=>updateCurrentProject({scenarios:{...currentProject.scenarios,saved:(currentProject.scenarios.saved??[]).filter(item=>item.id!==saved.id)}})} className="p-1 text-neutral-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></td></tr>)}</tbody></table></div>}
      </section>

      {/* Edit Scenario Modal */}
      {editingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="text-base font-bold text-neutral-900 capitalize">
                Edit {editingCase} Scenario
              </h4>
              <button
                onClick={() => setEditingCase(null)}
                className="text-neutral-400 hover:text-neutral-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Expected Yield ({unit})
                </label>
                <input
                  type="number" placeholder="Enter value"
                  min="0"
                  step="any"
                  onKeyDown={event => { if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault(); }}
                  value={editYield || ''}
                  onChange={(e) => setEditYield(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Selling Price per {unit} (₦)
                </label>
                <input
                  type="number" placeholder="Enter value"
                  min="0"
                  step="any"
                  onKeyDown={event => { if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault(); }}
                  value={editPrice || ''}
                  onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                onClick={() => setEditingCase(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
