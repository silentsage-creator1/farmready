import React from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { calculateFinancialMetrics, formatNaira, formatNumber } from '../../utils/calculations';
import { PieChart, ArrowRight, ShieldCheck, AlertCircle, TrendingUp, GitBranch } from 'lucide-react';

export const InvestmentAnalysisView: React.FC = () => {
  const { currentProject, setActiveView } = useFarmProject();
  const metrics = calculateFinancialMetrics(currentProject);
  const fin = currentProject.financialModel;
  const loan = currentProject.toolAnalysis?.loan;

  const availableCapital = (fin.availableCapital || 0) + (fin.additionalCapitalAvailable || 0);
  const totalInvestment = metrics.totalStartupCapital || 1;
  const availablePercent = Math.min(100, Math.round((availableCapital / totalInvestment) * 100));
  const gapPercent = Math.max(0, 100 - availablePercent);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          Investment Analysis
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          How much capital is required and what do your assumptions imply financially?
        </p>
      </div>

      {/* 8-Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Total Investment</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatNaira(metrics.totalStartupCapital)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Startup costs, contingency & working capital</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Available Capital</p>
          <p className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {formatNaira(availableCapital)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Self-funded equity committed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Funding Gap</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${
            metrics.fundingGap > 0 ? 'text-red-600' : 'text-emerald-700'
          }`}>
            {formatNaira(metrics.fundingGap)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            {metrics.fundingGap > 0 ? 'Financing / loan required' : 'Fully funded'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Return on Investment (ROI)</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {metrics.roiPercent == null ? 'Not available' : `${formatNumber(metrics.roiPercent, 1)}%`}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Annual net return on capex</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Expected Revenue</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatNaira(metrics.expectedRevenue)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Projected gross sales</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Total Expenses</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatNaira(metrics.annualOperatingExpenses)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Annual operating opex</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Net Profit</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatNaira(metrics.netProfit)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Retained profit per cycle</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Payback Period</p>
          <p className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {metrics.paybackPeriodYears !== null ? `${metrics.paybackPeriodYears} years` : 'Not reached in forecast'}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Estimated equity recoup time</p>
        </div>
      </div>

      {/* Capital Structure Visualization */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Capital Structure</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Available self-funded equity vs external funding gap
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('financial')}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
            >
              View Cash Flow
            </button>
            <button
              onClick={() => setActiveView('scenarios')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Run Scenario</span>
            </button>
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-8 rounded-xl bg-neutral-100 overflow-hidden flex">
            <div
              className="bg-emerald-600 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-500"
              style={{ width: `${availablePercent}%` }}
            >
              {availablePercent > 15 ? `${availablePercent}% Available` : ''}
            </div>
            {gapPercent > 0 && (
              <div
                className="bg-red-500 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-500"
                style={{ width: `${gapPercent}%` }}
              >
                {gapPercent > 15 ? `${gapPercent}% Funding Gap` : ''}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-neutral-700">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              Available Capital: <strong className="font-mono">{formatNaira(availableCapital)}</strong> ({availablePercent}%)
            </span>
            {metrics.fundingGap > 0 && (
              <span className="flex items-center gap-2 text-red-600">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                Funding Gap: <strong className="font-mono">{formatNaira(metrics.fundingGap)}</strong> ({gapPercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Financial Implication Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-100 text-xs text-neutral-600">
          <div className="p-4 rounded-xl bg-neutral-50 space-y-1.5">
            <span className="font-bold text-neutral-900 block">Debt Service Capacity</span>
            <p className="leading-relaxed">
              {fin.financing.hasLoan && loan ? <>Your saved loan assumptions estimate a {fin.financing.repaymentFrequency} repayment of {formatNaira(Number(loan.periodicPayment ?? 0))}, total interest of {formatNaira(Number(loan.totalInterest ?? 0))}, and total repayment of {formatNaira(Number(loan.totalRepayment ?? 0))}. Compare scheduled repayments with projected farm cash flow before borrowing.</> : 'No loan schedule has been applied to this project yet. Use the Agricultural Loan Calculator in Tools to save repayment and interest estimates here.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 space-y-1.5">
            <span className="font-bold text-neutral-900 block">Capital Cushion & Working Buffer</span>
            <p className="leading-relaxed">
              Initial working capital reserve is set at {formatNaira(fin.initialWorkingCapital)}. Compare this buffer with expected operating costs and seasonal cash-flow timing before committing funds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
