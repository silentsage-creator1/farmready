import React, { useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { useCalculator } from '../../hooks/useCalculator';
import { calculateFinancialMetrics, formatNaira, formatNumber } from '../../utils/calculations';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Scale,
  DollarSign,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const FinancialAnalysisView: React.FC = () => {
  const { currentProject, userProfile } = useFarmProject();
  const [activeTab, setActiveTab] = useState<'overview' | 'cash_flow' | 'cost_breakdown' | 'break_even' | 'profitability'>('overview');
  
  const metrics = calculateFinancialMetrics(currentProject);
  const signInDate = new Date(userProfile.signedInAt || Date.now());
  const cashFlowStartDate = `${signInDate.getFullYear()}-${String(signInDate.getMonth() + 1).padStart(2, '0')}-01`;
  const cashFlowCalculation = useCalculator('cashflow', { project: { financialModel: currentProject.financialModel, productionPlan: currentProject.productionPlan, marketPlan: currentProject.marketPlan, farmDetails: { expectedStartDate: cashFlowStartDate } } });
  const cashFlowMonths = (((cashFlowCalculation.result?.months as {monthName:string;monthIndex:number;year?:number;periodLabel?:string;revenue:number;expenses:number;netCashFlow:number;cumulativeCashFlow:number;harvest:boolean}[] | undefined) ?? [])).slice().sort((a, b) => a.monthIndex - b.monthIndex);
  const cashFlowMetrics = cashFlowCalculation.result as (Record<string, unknown> & { estimatedPreHarvestCashNeed?: number; initialWorkingCapital?: number; workingCapitalShortfall?: number }) | null;
  const fin = currentProject.financialModel;

  const maxBarValue = Math.max(...cashFlowMonths.map(m => Math.max(m.revenue, m.expenses, Math.abs(m.netCashFlow))), 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl max-w-fit overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('cash_flow')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'cash_flow' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Cash Flow
        </button>
        <button
          onClick={() => setActiveTab('cost_breakdown')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'cost_breakdown' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Cost Breakdown
        </button>
        <button
          onClick={() => setActiveTab('break_even')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'break_even' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Break-even
        </button>
        <button
          onClick={() => setActiveTab('profitability')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'profitability' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Profitability
        </button>
      </div>

      {/* Top 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Total Startup Capital</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatNaira(metrics.totalStartupCapital)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Land prep, setup, equipment & buffer</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Monthly Operating Cost</p>
          <p className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {formatNaira(metrics.monthlyOperatingCost)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Annual total: {formatNaira(metrics.annualOperatingExpenses)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Expected Revenue</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatNaira(metrics.expectedRevenue)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            {formatNumber(metrics.marketableAnnualQuantity, 1)} buyer-backed {currentProject.productionPlan.outputUnit} @ {formatNaira(currentProject.marketPlan.expectedSellingPrice)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Estimated Profit</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatNaira(metrics.netProfit)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Net profit after all operating costs</p>
        </div>
      </div>

      {/* Main Analysis Content by Tab */}
      {(activeTab === 'overview' || activeTab === 'cash_flow') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cash Flow Projection (12 Months) Chart (col-span-8) */}
          <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Production-Timed Cash Flow (12 Months)</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Calendar months begin with the month you entered the workspace. Annual operating costs are spread evenly by month; Month 1 includes startup capital (including working capital), and scheduled loan repayments reduce cash flow.</p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-neutral-600">
                  <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-neutral-600">
                  <span className="w-3 h-3 rounded-xs bg-red-500 inline-block" /> Expenses
                </span>
                <span className="flex items-center gap-1.5 text-neutral-600">
                  <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" /> Net Cash Flow
                </span>
              </div>
            </div>

            {/* Custom Responsive SVG / HTML Bar Chart */}
            {cashFlowCalculation.error ? <p role="alert" className="text-sm text-red-700">Could not calculate cash flow: {cashFlowCalculation.error}</p> : cashFlowCalculation.loading || !cashFlowMonths.length ? <p className="h-64 flex items-center justify-center text-sm text-neutral-500">Calculating cash flow from project assumptions…</p> : <div className="h-64 sm:h-72 w-full pt-4 flex items-stretch gap-1.5 sm:gap-3 border-b border-neutral-200 pb-2">
              {cashFlowMonths.map((m) => {
                const revHeight = Math.max(m.revenue > 0 ? 2 : 0, (m.revenue / maxBarValue) * 44);
                const expHeight = Math.max(m.expenses > 0 ? 2 : 0, (m.expenses / maxBarValue) * 44);
                const netHeight = Math.max(m.netCashFlow !== 0 ? 2 : 0, (Math.abs(m.netCashFlow) / maxBarValue) * 44);

                return (
                  <div key={m.monthName} className="flex-1 flex flex-col items-center h-full group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-neutral-900 text-white text-[10px] p-2 rounded-lg pointer-events-none whitespace-nowrap shadow-md">
                  <p className="font-bold">{m.periodLabel ?? `Month ${m.monthIndex} · ${m.monthName}`}</p>
                      {m.harvest && <p className="text-emerald-300">Harvest / sales month</p>}
                      <p>Revenue: {formatNaira(m.revenue)}</p>
                      <p>Expenses: {formatNaira(m.expenses)}</p>
                      <p className={m.netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        Net: {formatNaira(m.netCashFlow)}
                      </p>
                    </div>

                    <div className="relative w-full h-5/6"><div className="absolute left-0 right-0 top-1/2 border-t border-neutral-400" />
                      <div className="absolute left-[5%] w-[25%] max-w-[12px] bg-emerald-600 rounded-t-sm" style={{ bottom: '50%', height: `${revHeight}%` }} />
                      <div className="absolute left-[37%] w-[25%] max-w-[12px] bg-red-500 rounded-b-sm" style={{ top: '50%', height: `${expHeight}%` }} />
                      <div className={`absolute left-[69%] w-[25%] max-w-[12px] bg-blue-600 ${m.netCashFlow >= 0 ? 'rounded-t-sm' : 'rounded-b-sm'}`} style={m.netCashFlow >= 0 ? { bottom: '50%', height: `${netHeight}%` } : { top: '50%', height: `${netHeight}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-neutral-500 mt-2 block">
                      <span title={m.periodLabel ?? `Month ${m.monthIndex} · ${m.monthName}`}>M{m.monthIndex}</span>
                    </span>
                  </div>
                );
              })}
            </div>}

            {/* Cash Flow Table View */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-semibold">
                    <th className="py-2 px-2.5">Month</th>
                    <th className="py-2 px-2.5 text-right">Revenue</th>
                    <th className="py-2 px-2.5 text-right">Expenses</th>
                    <th className="py-2 px-2.5 text-right">Net Flow</th>
                    <th className="py-2 px-2.5 text-right">Cumulative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono">
                  {cashFlowMonths.map((m) => (
                    <tr key={m.monthIndex} className="hover:bg-neutral-50/50">
                      <td className="py-1.5 px-2.5 font-sans font-medium text-neutral-800" title={m.periodLabel ?? `Month ${m.monthIndex} · ${m.monthName}`}>M{m.monthIndex} <span className="text-neutral-500">({m.monthName}{m.year ? ` ${m.year}` : ''})</span></td>
                      <td className="py-1.5 px-2.5 text-right text-emerald-700">{m.revenue > 0 ? formatNaira(m.revenue) : '—'}</td>
                      <td className="py-1.5 px-2.5 text-right text-neutral-600">{formatNaira(m.expenses)}</td>
                      <td className={`py-1.5 px-2.5 text-right font-bold ${
                        m.netCashFlow > 0 ? 'text-emerald-600' : m.netCashFlow < 0 ? 'text-neutral-700' : 'text-neutral-400'
                      }`}>
                        {formatNaira(m.netCashFlow)}
                      </td>
                      <td className={`py-1.5 px-2.5 text-right ${m.cumulativeCashFlow >= 0 ? 'text-emerald-700' : 'text-neutral-500'}`}>
                        {formatNaira(m.cumulativeCashFlow)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Financial Indicators Card (col-span-4) */}
          <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-neutral-900">Key Financial Indicators</h3>
                <span className="p-1 rounded-full text-neutral-400 hover:text-neutral-600" title="Key benchmark metrics">
                  <HelpCircle className="w-4 h-4" />
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {cashFlowMetrics && <div className={`rounded-xl border p-3 ${Number(cashFlowMetrics.workingCapitalShortfall ?? 0) > 0 ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
                  <p className="font-semibold">Pre-harvest working capital</p>
                  <p className="mt-1">Estimated need: {formatNaira(Number(cashFlowMetrics.estimatedPreHarvestCashNeed ?? 0))} · Entered buffer: {formatNaira(Number(cashFlowMetrics.initialWorkingCapital ?? 0))}</p>
                  {Number(cashFlowMetrics.workingCapitalShortfall ?? 0) > 0 && <p className="mt-1 font-semibold">Estimated shortfall: {formatNaira(Number(cashFlowMetrics.workingCapitalShortfall))}</p>}
                </div>}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <p className="font-semibold text-neutral-800">Gross Margin</p>
                    <p className="text-[11px] text-neutral-500">Revenue minus estimated variable production costs</p>
                  </div>
                  <span className="text-base font-bold font-mono text-neutral-900">
                    {formatNumber(metrics.grossMarginPercent, 0)}%
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <p className="font-semibold text-neutral-800">Net Margin</p>
                    <p className="text-[11px] text-neutral-500">Net profit divided by total revenue</p>
                  </div>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    {formatNumber(metrics.netMarginPercent, 0)}%
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <p className="font-semibold text-neutral-800">Return on Investment (ROI)</p>
                    <p className="text-[11px] text-neutral-500">Annual net profit on total startup capital</p>
                  </div>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    {metrics.roiPercent == null ? 'Not available' : `${formatNumber(metrics.roiPercent, 1)}%`}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <p className="font-semibold text-neutral-800">Break-even Point</p>
                    <p className="text-[11px] text-neutral-500">Required harvest volume to clear all costs</p>
                  </div>
                  <span className="text-base font-bold font-mono text-neutral-900">
                    {metrics.breakEvenQuantity == null ? 'Not available' : `${metrics.breakEvenQuantity} ${currentProject.productionPlan.outputUnit}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-800">Payback Period</p>
                    <p className="text-[11px] text-neutral-500">Recovery of startup capital within the 12-month forecast</p>
                  </div>
                  <span className="text-base font-bold font-mono text-emerald-800">
                    {metrics.paybackPeriodYears !== null ? `${metrics.paybackPeriodYears} years` : 'Not reached in forecast'}
                  </span>
                </div>
              </div>
            </div>

            {/* Investor Takeaway */}
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 leading-relaxed">
              <span className="font-bold text-neutral-900 block mb-0.5">Capital Structure Takeaway</span>
              {metrics.breakEvenQuantity == null ? 'Break-even cannot be calculated until output, buyer demand, price and positive contribution per unit are entered.' : metrics.breakEvenAttainable ? `Estimated break-even is ${metrics.breakEvenQuantity} ${currentProject.productionPlan.outputUnit}. Buyer-backed annual sales are ${formatNumber(metrics.marketableAnnualQuantity, 1)} ${currentProject.productionPlan.outputUnit}.` : `Estimated break-even is ${metrics.breakEvenQuantity} ${currentProject.productionPlan.outputUnit}, above buyer-backed sales of ${formatNumber(metrics.marketableAnnualQuantity, 1)} ${currentProject.productionPlan.outputUnit}. Reduce costs or validate more demand.`}
            </div>
          </div>
        </div>
      )}

      {/* Cost Breakdown Tab */}
      {activeTab === 'cost_breakdown' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Operating Cost Breakdown</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Annual categorized expenditures required to sustain operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">Direct Inputs (Fertilizer, Feed, Chemicals)</span>
                <span className="text-xs font-mono font-bold text-neutral-900">{formatNaira(fin.inputsCost)}</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${(fin.inputsCost / (metrics.annualOperatingExpenses || 1)) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-500">
                {formatNumber((fin.inputsCost / (metrics.annualOperatingExpenses || 1)) * 100, 1)}% of annual expenses
              </span>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">Farm Labour (Manager & Seasonal Workers)</span>
                <span className="text-xs font-mono font-bold text-neutral-900">{formatNaira(fin.labourCost)}</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${(fin.labourCost / (metrics.annualOperatingExpenses || 1)) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-500">
                {formatNumber((fin.labourCost / (metrics.annualOperatingExpenses || 1)) * 100, 1)}% of annual expenses
              </span>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">Packaging & Storage</span>
                <span className="text-xs font-mono font-bold text-neutral-900">{formatNaira(fin.packagingStorageCost)}</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${(fin.packagingStorageCost / (metrics.annualOperatingExpenses || 1)) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-500">
                {formatNumber((fin.packagingStorageCost / (metrics.annualOperatingExpenses || 1)) * 100, 1)}% of annual expenses
              </span>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">Transportation & Logistics</span>
                <span className="text-xs font-mono font-bold text-neutral-900">{formatNaira(fin.transportCost)}</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${(fin.transportCost / (metrics.annualOperatingExpenses || 1)) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-500">
                {formatNumber((fin.transportCost / (metrics.annualOperatingExpenses || 1)) * 100, 1)}% of annual expenses
              </span>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">Utilities, Fuel & Generator</span>
                <span className="text-xs font-mono font-bold text-neutral-900">{formatNaira(fin.utilitiesCost)}</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${(fin.utilitiesCost / (metrics.annualOperatingExpenses || 1)) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-500">
                {formatNumber((fin.utilitiesCost / (metrics.annualOperatingExpenses || 1)) * 100, 1)}% of annual expenses
              </span>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">Maintenance, Insurance & Contingency</span>
                <span className="text-xs font-mono font-bold text-neutral-900">
                  {formatNaira(fin.maintenanceCost + fin.insuranceContingencyCost)}
                </span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${((fin.maintenanceCost + fin.insuranceContingencyCost) / (metrics.annualOperatingExpenses || 1)) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-500">
                {formatNumber(((fin.maintenanceCost + fin.insuranceContingencyCost) / (metrics.annualOperatingExpenses || 1)) * 100, 1)}% of annual expenses
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Break-Even Tab */}
      {activeTab === 'break_even' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Break-Even Analysis</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Determine the threshold yield and revenue required to avert loss.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-xs text-neutral-500 font-medium">Break-Even Quantity</p>
              <p className="text-2xl font-bold font-mono text-neutral-900 mt-1">
                {metrics.breakEvenQuantity == null ? 'Not available' : `${metrics.breakEvenQuantity} ${currentProject.productionPlan.outputUnit}`}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Required production volume</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-xs text-neutral-500 font-medium">Break-Even Revenue</p>
              <p className="text-2xl font-bold font-mono text-neutral-900 mt-1">
                {metrics.breakEvenRevenue == null ? 'Not available' : formatNaira(metrics.breakEvenRevenue)}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Revenue required to cover costs</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-xs text-neutral-500 font-medium">Capacity Cushion</p>
              <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {metrics.capacityUtilizationAtBreakEven == null ? 'Not available' : `${formatNumber(100 - metrics.capacityUtilizationAtBreakEven, 0)}%`}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Safety buffer against lower yields</p>
            </div>
          </div>
        </div>
      )}

      {/* Profitability Tab */}
      {activeTab === 'profitability' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Profitability & Margin Architecture</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Revenue and margin economics at full capacity.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-900">Total Expected Inflow</p>
                <p className="text-[11px] text-neutral-500">{formatNumber(metrics.marketableAnnualQuantity, 1)} tonnes sold at entered buyer demand and price</p>
              </div>
              <span className="text-base font-bold font-mono text-neutral-900">{formatNaira(metrics.expectedRevenue)}</span>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-900">Total Annual Operating Outflows</p>
                <p className="text-[11px] text-neutral-500">Wages, fertilizer, seed, transport, generator fuel</p>
              </div>
              <span className="text-base font-bold font-mono text-neutral-900">{formatNaira(metrics.annualOperatingExpenses)}</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-950">Net Operating Profit</p>
                <p className="text-[11px] text-emerald-800">Retained profit for reinvestment or dividend distributions</p>
              </div>
              <span className="text-xl font-bold font-mono text-emerald-700">{formatNaira(metrics.netProfit)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
