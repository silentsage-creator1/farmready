import React, { useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { ShieldAlert, Plus, AlertTriangle, Pencil, Trash2, Save, X } from 'lucide-react';
import { RiskItem } from '../../types';
import { formatNumber } from '../../utils/calculations';

export const RiskAnalysisView: React.FC = () => {
  const { currentProject, updateCurrentProject, setActiveView } = useFarmProject();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);

  const [newCategory, setNewCategory] = useState('');
  const [newExposure, setNewExposure] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newImpact, setNewImpact] = useState<'Low' | 'Medium' | 'High'>('High');
  const [newPlannedControl, setNewPlannedControl] = useState('');

  const risks = currentProject.risks || [];
  const riskIndicator = currentProject.toolAnalysis?.risk;

  const handleAddRisk = () => {
    if (!newCategory.trim()) return;
    const overall = (newExposure === 'High' || newImpact === 'High') ? 'High' : (newExposure === 'Medium' || newImpact === 'Medium') ? 'Medium' : 'Low';
    const newRiskItem: RiskItem = {
      id: `risk-${Date.now()}`,
      category: newCategory,
      exposure: newExposure,
      impact: newImpact,
      overall,
      existingControl: 'Initial review',
      plannedControl: newPlannedControl || 'Active operational monitoring',
    };
    updateCurrentProject({
      risks: [...risks, newRiskItem]
    });
    setIsAddModalOpen(false);
    setNewCategory('');
    setNewPlannedControl('');
  };

  const getBadgeClass = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Risk Analysis
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Identify and assess key risks to your farm project and establish active control protocols.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Risk Factor</span>
        </button>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
        <div><p className="text-xs font-bold uppercase tracking-wider text-amber-900">Weighted Farm Risk Indicator</p><p className="mt-1 text-sm text-amber-950">{riskIndicator?.score == null ? 'Not assessed' : `${formatNumber(Number(riskIndicator.score), 0)} / 100 · ${String(riskIndicator.band ?? 'Risk score')}`}</p><p className="mt-1 text-xs text-amber-900">Rates market, production, financial, climate, operational and supply-chain exposures. Higher scores indicate higher risk.</p></div>
        <button onClick={() => setActiveView('tools')} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100">{riskIndicator?.score == null ? 'Complete Risk Indicator' : 'Update Risk Ratings'}</button>
      </section>

      {/* Structured Risk Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Risk Category</th>
                <th className="py-3 px-4">Likelihood</th>
                <th className="py-3 px-4">Impact</th>
                <th className="py-3 px-4">Overall Risk</th>
                <th className="py-3 px-4">Control Measures</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {risks.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50/50 transition-colors">
                  {editingRisk?.id === r.id ? <>
                    <td className="py-3 px-4"><input aria-label="Risk category" value={editingRisk.category} onChange={event => setEditingRisk({ ...editingRisk, category: event.target.value })} className="w-36 rounded border px-2 py-1" /></td>
                    <td className="py-3 px-4"><select aria-label="Likelihood" value={editingRisk.exposure} onChange={event => setEditingRisk({ ...editingRisk, exposure: event.target.value as RiskItem['exposure'] })} className="rounded border px-2 py-1"><option>Low</option><option>Medium</option><option>High</option></select></td>
                    <td className="py-3 px-4"><select aria-label="Impact" value={editingRisk.impact} onChange={event => setEditingRisk({ ...editingRisk, impact: event.target.value as RiskItem['impact'] })} className="rounded border px-2 py-1"><option>Low</option><option>Medium</option><option>High</option></select></td>
                    <td className="py-3 px-4 text-neutral-500">Calculated on save</td>
                    <td className="py-3 px-4"><input aria-label="Planned control" value={editingRisk.plannedControl} onChange={event => setEditingRisk({ ...editingRisk, plannedControl: event.target.value })} className="w-48 rounded border px-2 py-1" /></td>
                    <td className="py-3 px-4 text-right whitespace-nowrap"><button aria-label="Save risk" onClick={() => { const overall = editingRisk.exposure === 'High' || editingRisk.impact === 'High' ? 'High' : editingRisk.exposure === 'Medium' || editingRisk.impact === 'Medium' ? 'Medium' : 'Low'; updateCurrentProject({ risks: risks.map(item => item.id === r.id ? { ...editingRisk, overall } : item) }); setEditingRisk(null); }} className="p-1 text-emerald-700" title="Save"><Save className="w-4 h-4" /></button><button aria-label="Cancel risk edit" onClick={() => setEditingRisk(null)} className="p-1 text-neutral-500" title="Cancel"><X className="w-4 h-4" /></button></td>
                  </> : <>
                  <td className="py-3.5 px-4 font-semibold text-neutral-900">{r.category}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getBadgeClass(r.exposure)}`}>
                      {r.exposure}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getBadgeClass(r.impact)}`}>
                      {r.impact}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getBadgeClass(r.overall)}`}>
                      {r.overall}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 max-w-sm leading-relaxed">
                    {r.plannedControl || r.existingControl}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap"><button aria-label={`Edit ${r.category}`} onClick={() => setEditingRisk({ ...r })} className="p-1 text-neutral-500 hover:text-neutral-900"><Pencil className="w-4 h-4" /></button><button aria-label={`Delete ${r.category}`} onClick={() => updateCurrentProject({ risks: risks.filter(item => item.id !== r.id) })} className="p-1 text-neutral-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Actions */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">Priority Risk Actions</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Recommended interventions based on high-exposure vulnerabilities.</p>
        </div>

        {risks.filter(risk => risk.overall === 'High').length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.filter(risk => risk.overall === 'High').map(risk => <div key={risk.id} className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2"><div className="flex items-center gap-2 text-red-900 font-bold text-xs uppercase tracking-wide"><AlertTriangle className="w-4 h-4 text-red-600" /><span>{risk.category}</span></div><p className="text-xs text-neutral-700 leading-relaxed">{risk.plannedControl || 'Define and assign a control before proceeding.'}</p></div>)}
        </div> : <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">No high-rated risks are recorded for this project. Add project-specific risks and controls to generate priority actions.</div>}
      </div>

      {/* Add Risk Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="text-base font-bold text-neutral-900">Add Risk Factor</h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Risk Category / Name</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Fertilizer Supply Disruption"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Likelihood</label>
                  <select
                    value={newExposure}
                    onChange={(e) => setNewExposure(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Impact</label>
                  <select
                    value={newImpact}
                    onChange={(e) => setNewImpact(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Planned Control Measures</label>
                <textarea
                  rows={2}
                  value={newPlannedControl}
                  onChange={(e) => setNewPlannedControl(e.target.value)}
                  placeholder="e.g. Contract dual supplier channels in advance"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRisk}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                Add Risk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
