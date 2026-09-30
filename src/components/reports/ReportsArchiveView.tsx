import React, { useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { calculateFinancialMetrics, formatNaira, formatNumber } from '../../utils/calculations';
import { Search, FileText, Download, Printer, ArrowRight, Trash2 } from 'lucide-react';

export const ReportsArchiveView: React.FC = () => {
  const { savedReports, openSavedReport, deleteSavedReport, setActiveView } = useFarmProject();
  const [search, setSearch] = useState('');
  const [farmFilter, setFarmFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = savedReports.filter(r => 
    (r.projectName.toLowerCase().includes(search.toLowerCase()) || r.farmType.toLowerCase().includes(search.toLowerCase())) &&
    (farmFilter === 'all' || r.projectId === farmFilter) &&
    (!fromDate || new Date(r.date) >= new Date(`${fromDate}T00:00:00`)) &&
    (!toDate || new Date(r.date) <= new Date(`${toDate}T23:59:59`))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Saved Farm Readiness Reports
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Archived investment evaluations and readiness audits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:min-w-[560px]">
          <label className="relative"><Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" /><input type="search" aria-label="Search saved reports" placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-500/30" /></label>
          <select aria-label="Filter reports by farm" value={farmFilter} onChange={e => setFarmFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-300 text-xs"><option value="all">All farms</option>{Array.from(new Map(savedReports.map(r => [r.projectId, r.projectName])).entries()).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
          <input aria-label="Reports from date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-300 text-xs" />
          <input aria-label="Reports to date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-300 text-xs" />
        </div>
      </div>

      {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center"><FileText className="mx-auto h-8 w-8 text-neutral-400" /><h3 className="mt-3 font-semibold text-neutral-900">{savedReports.length ? 'No matching saved reports' : 'No saved report snapshots yet'}</h3><p className="mt-1 text-sm text-neutral-500">Complete an assessment or save a snapshot from the Readiness Report page to build this archive.</p>{savedReports.length === 0 && <button onClick={() => setActiveView('report')} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Open Current Report</button>}</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((rep) => (
          (() => {
            const metrics = calculateFinancialMetrics(rep.projectSnapshot);
            const riskScore = rep.projectSnapshot.toolAnalysis?.risk?.score;
            return (
          <div
            key={rep.id}
            className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {rep.farmType}
                  </span>
                  <h3 className="text-lg font-bold text-neutral-900 mt-1.5">{rep.projectName}</h3>
                </div>
                <span className="text-xs font-mono text-neutral-400">{new Date(rep.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-neutral-500 text-[11px]">Total Investment</span>
                  <p className="font-mono font-bold text-neutral-900 mt-0.5">{formatNaira(rep.investment)}</p>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px]">Readiness Status</span>
                  <p className="font-semibold text-emerald-700 mt-0.5">{rep.status}</p>
                </div>
                <div><span className="text-neutral-500 text-[11px]">ROI</span><p className="font-mono font-bold mt-0.5">{metrics.roiPercent == null ? 'Not available' : `${formatNumber(metrics.roiPercent, 1)}%`}</p></div>
                <div><span className="text-neutral-500 text-[11px]">Risk indicator</span><p className="font-mono font-bold mt-0.5">{riskScore == null ? 'Not assessed' : `${formatNumber(Number(riskScore), 0)} / 100`}</p></div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    openSavedReport(rep.id);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>View / Print</span>
                </button>
              </div>

              <button
                onClick={() => {
                  openSavedReport(rep.id);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>View Full Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { openSavedReport(rep.id); }} aria-label={`Open ${rep.projectName} report to download`} title="Open this report to download its PDF" className="p-2 text-neutral-500 hover:text-emerald-700 rounded-lg"><Download className="w-4 h-4" /></button>
              <button onClick={() => { if (window.confirm(`Delete the saved report for ${rep.projectName}?`)) deleteSavedReport(rep.id); }} aria-label={`Delete ${rep.projectName} report`} className="p-2 text-neutral-500 hover:text-red-700 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
            );
          })()
        ))}
      </div>}
    </div>
  );
};
