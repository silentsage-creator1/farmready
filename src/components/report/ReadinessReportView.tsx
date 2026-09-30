import React, { useEffect, useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { calculateFinancialMetrics, computeWhatIf, formatNaira, formatNumber, generate12MonthCashFlow } from '../../utils/calculations';
import { evaluateSevenSystems } from '../../utils/readiness';
import {
  Sprout,
  Download,
  Printer,
  Edit,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  Calendar,
  DollarSign,
  TrendingUp,
  Share2
} from 'lucide-react';

export const ReadinessReportView: React.FC = () => {
  const { currentProject, activeReport, activeReportInventory, activeReportEvaluator, activeReportGeneratedAt, activeReportAction, clearActiveReportAction, setActiveView, inventoryItems, saveCurrentReport, userProfile } = useFarmProject();
  const evaluatorName = activeReport ? (activeReportEvaluator || 'Not provided') : (userProfile.fullName || 'Not provided');
  const reportProject = activeReport ?? currentProject;
  const reportInventory = activeReport ? activeReportInventory : inventoryItems;
  const metrics = calculateFinancialMetrics(reportProject);
  const systems = evaluateSevenSystems(reportProject);
  const cashFlow = generate12MonthCashFlow(reportProject);
  const quarterlyCashFlow = [0, 1, 2, 3].map(quarter => {
    const months = cashFlow.slice(quarter * 3, quarter * 3 + 3);
    return {
      label: `Q${quarter + 1}`,
      revenue: months.reduce((sum, month) => sum + month.revenue, 0),
      expenses: months.reduce((sum, month) => sum + month.expenses, 0),
      closingBalance: months.at(-1)?.cumulativeCashFlow ?? 0,
    };
  });
  const baselineScenarios = [
    { name: 'Base case', revenue: metrics.expectedRevenue, costs: metrics.annualOperatingExpenses, profit: metrics.netProfit, roi: metrics.roiPercent },
    (() => {
      const result = computeWhatIf(reportProject, { priceDeltaPercent: -10, yieldDeltaPercent: 0, inputCostDeltaPercent: 0, labourCostDeltaPercent: 0 });
      return { name: 'Low price (-10%)', revenue: result.simulatedRevenue, costs: result.simulatedExpenses, profit: result.simulatedProfit, roi: result.simulatedRoi };
    })(),
    (() => {
      const result = computeWhatIf(reportProject, { priceDeltaPercent: 0, yieldDeltaPercent: 0, inputCostDeltaPercent: 15, labourCostDeltaPercent: 15 });
      return { name: 'High cost (+15%)', revenue: result.simulatedRevenue, costs: result.simulatedExpenses, profit: result.simulatedProfit, roi: result.simulatedRoi };
    })(),
  ];
  const chartPoints = quarterlyCashFlow.map((quarter, index) => ({ x: 88 + index * 165, quarter, net: quarter.revenue - quarter.expenses }));
  const chartMax = Math.max(1, ...chartPoints.flatMap(point => [point.quarter.revenue, point.quarter.expenses, point.net, point.quarter.closingBalance].map(Math.abs)));
  const chartZero = 105;
  const chartY = (value: number) => chartZero - (value / chartMax) * 62;
  const netLine = chartPoints.map(point => `${point.x},${chartY(point.net)}`).join(' ');
  const cumulativeLine = chartPoints.map(point => `${point.x},${chartY(point.quarter.closingBalance)}`).join(' ');
  const generatedAt = new Date(activeReportGeneratedAt ?? Date.now());
  const assessmentId = reportProject.id.replace(/^project-/, 'FR-');
  const savedAnalysis = reportProject.toolAnalysis;
  const savedNumber = (record: Record<string, unknown> | undefined, key: string) => Number(record?.[key] ?? 0);
  const savedRiskFactors = savedAnalysis?.risk?.factors as { name: string; score: number; weight: number }[] | undefined;
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const priorityActions = systems
    .filter(system => system.status !== 'Prepared')
    .map(system => ({ id: system.systemName, label: `${system.systemName}: ${system.nextAction}` }));
  if (metrics.fundingGap > 0) {
    priorityActions.unshift({ id: 'funding-gap', label: `Confirm a funding source for the estimated ${formatNaira(metrics.fundingGap)} funding gap.` });
  }

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const farmName = reportProject.farmDetails.farmName || reportProject.name || 'Farm';
    const fileStem = `FarmReady_Farm_Readiness_Report_${assessmentId}_${farmName.replace(/[^a-z0-9]+/gi, '_')}`;
    const previousTitle = document.title;
    document.title = fileStem;
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
    // Keep the filename available while the browser's print dialog is open.
    window.setTimeout(restoreTitle, 5 * 60 * 1000);
  };

  const handleDownloadChecklist = () => {
    const lines = [
      'FARMREADY NIGERIA — FARM INVESTMENT READINESS CHECKLIST',
      `Farm: ${reportProject.farmDetails.farmName || reportProject.name || 'Unnamed farm'}`,
      `Assessment date: ${generatedAt.toLocaleDateString('en-NG')}`,
      '',
      'BEFORE COMMITTING MORE CAPITAL',
      ...priorityActions.map(item => `[ ] ${item.label}`),
      '[ ] Validate expected buyer demand, price, quality requirements and purchase timing.',
      '[ ] Complete and review a 12-month cash-flow projection, including downside assumptions.',
      '[ ] Agree who will verify farm records and how sales, costs, stock and production will be checked.',
      '[ ] Define measurable conditions for stopping, redesigning or expanding the farm.',
      '[ ] Compare land purchase with leasing, partnership, contract production or a smaller pilot.',
      '',
      'This checklist supports planning and does not guarantee farm performance or returns.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FarmReady_Investment_Readiness_Checklist.txt';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    if (!activeReport || !activeReportAction) return;
    const timer = window.setTimeout(() => {
      if (activeReportAction === 'download') handleDownload();
      else handlePrint();
      clearActiveReportAction();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [activeReport, activeReportAction, clearActiveReportAction]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto print-container">
      {/* Top Action Toolbar (hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Farm Investment Readiness Report</h2>
          <p className="text-xs text-neutral-500">Comprehensive structured evaluation before committing capital. Download PDF opens print preview; choose “Save as PDF”.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('new_assessment')}
            className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Assessment</span>
          </button>

          <button
            onClick={() => setActiveView('what_if')}
            className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Run What-If</span>
          </button>

          <button
            onClick={handleDownload}
            title={`Download the report for ${reportProject.farmDetails.farmName || reportProject.name || 'this farm'} as a PDF`}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button onClick={handleDownloadChecklist} className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors">
            <Download className="mr-1 inline h-3.5 w-3.5" />Download Checklist
          </button>

          <button
            onClick={() => { saveCurrentReport(reportProject); setSnapshotSaved(true); window.setTimeout(() => setSnapshotSaved(false), 2500); }}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors"
          >
            {snapshotSaved ? 'Saved to Reports' : 'Save Report Snapshot'}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="print-document bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* Document Header */}
        <div className="report-cover border border-emerald-100 pb-6 flex flex-col justify-between gap-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-black tracking-tight text-xl">
              <Sprout className="w-6 h-6 text-emerald-600" />
              <span>FARMREADY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight pt-1">
              <span className="block">Farm Investment</span><span className="block text-emerald-700">Readiness Report</span>
            </h1>
            <p className="text-sm font-semibold text-neutral-700">
              Farm: <span className="text-neutral-950 font-bold">{reportProject.farmDetails.farmName || reportProject.name || 'Unnamed farm'}</span>
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs text-neutral-500 font-mono">
            <p className="font-semibold text-neutral-900 font-sans">Date</p>
            <p>{generatedAt.toLocaleDateString('en-NG', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            <p>Assessment ID: {assessmentId}</p>
            <p>Evaluator: {evaluatorName}</p>
            <p>Location: {reportProject.farmDetails.locationState || 'Not provided'}, Nigeria</p>
            <p className="text-[11px] text-emerald-700 font-sans font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
              {reportProject.farmType} · {reportProject.farmDetails.farmSize} {reportProject.farmDetails.sizeUnit}
            </p>
          </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-emerald-100 pt-5">
            <div><p className="text-[10px] uppercase tracking-wider text-neutral-500">Investment required</p><p className="mt-1 text-lg font-extrabold font-mono text-neutral-900">{formatNaira(metrics.totalStartupCapital)}</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-neutral-500">Expected annual profit</p><p className="mt-1 text-lg font-extrabold font-mono text-emerald-800">{formatNaira(metrics.netProfit)}</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-neutral-500">Return on investment</p><p className="mt-1 text-lg font-extrabold font-mono text-neutral-900">{metrics.roiPercent == null ? 'Not available' : `${formatNumber(metrics.roiPercent, 1)}%`}</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-neutral-500">Risk indicator</p><p className="mt-1 text-lg font-extrabold font-mono text-neutral-900">{savedAnalysis?.risk?.score == null ? 'Not assessed' : `${formatNumber(savedNumber(savedAnalysis.risk, 'score'), 0)} / 100`}</p></div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="border-l-4 border-emerald-600 pl-4">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-700">1. Executive Summary &amp; Financial Snapshot</p>
            <p className="mt-1 text-sm text-neutral-700">This report organizes the current farm proposal, modelled financial outcomes, readiness gaps and assumptions to verify. It is decision support, not an investment recommendation.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Investment required', formatNaira(metrics.totalStartupCapital)],
              ['Available capital', formatNaira(reportProject.financialModel.availableCapital + reportProject.financialModel.additionalCapitalAvailable)],
              [metrics.fundingGap > 0 ? 'Funding gap' : 'Capital surplus', formatNaira(metrics.fundingGap > 0 ? metrics.fundingGap : Math.max(0, reportProject.financialModel.availableCapital + reportProject.financialModel.additionalCapitalAvailable - metrics.totalStartupCapital))],
              ['Expected annual revenue', formatNaira(metrics.expectedRevenue)],
              ['Expected net profit', formatNaira(metrics.netProfit)],
              ['ROI', metrics.roiPercent == null ? 'Not available' : `${formatNumber(metrics.roiPercent, 1)}%`],
              ['Payback period', metrics.paybackPeriodYears == null ? 'Not reached in 12-month forecast' : `${formatNumber(metrics.paybackPeriodYears, 2)} years`],
              ['Risk score', savedAnalysis?.risk?.score == null ? 'Not assessed' : `${formatNumber(savedNumber(savedAnalysis.risk, 'score'), 0)} / 100`],
            ].map(([label, value]) => <div key={label} className="rounded-xl border border-neutral-200 p-3"><p className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-1 font-mono text-sm font-bold text-neutral-900">{value}</p></div>)}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 p-5 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Farm Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <p><span className="text-neutral-500">Farmer / project:</span> <strong>{reportProject.name || 'Not provided'}</strong></p>
            <p><span className="text-neutral-500">Production type:</span> <strong>{reportProject.productionPlan.product || reportProject.farmDetails.targetProduce || 'Not provided'}</strong></p>
            <p><span className="text-neutral-500">Purpose:</span> <strong>{reportProject.farmDetails.primaryPurpose || 'Not provided'}</strong></p>
            <p><span className="text-neutral-500">Land:</span> <strong>{reportProject.farmDetails.landStatus || 'Not provided'}</strong></p>
            <p><span className="text-neutral-500">Production cycle:</span> <strong>{formatNumber(reportProject.productionPlan.cyclesPerYear, 1)} cycles/year · {formatNumber(reportProject.productionPlan.gestationMonths, 1)} months growth</strong></p>
            <p><span className="text-neutral-500">Daily manager:</span> <strong>{reportProject.farmDetails.dailyManager || 'Not provided'}</strong></p>
            <p><span className="text-neutral-500">Target buyer:</span> <strong>{reportProject.marketPlan.targetCustomer || 'Not provided'}</strong></p>
            <p><span className="text-neutral-500">Buyer validation:</span> <strong>{reportProject.marketPlan.customerValidationStatus || 'Not provided'}</strong></p>
            <p><span className="text-neutral-500">Assessment ID:</span> <strong>{assessmentId}</strong></p>
          </div>
        </section>

        {/* Readiness matrix */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            2. System Readiness Breakdown
          </h3>
          <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-y border-neutral-300 text-neutral-600"><th className="py-2 pr-3">System category</th><th className="py-2 pr-3">Score</th><th className="py-2 pr-3">Status</th><th className="py-2">Key assessment</th></tr></thead><tbody>{systems.map(system => <tr key={system.systemName} className="border-b border-neutral-200 align-top"><td className="py-2.5 pr-3 font-semibold">{system.systemName}</td><td className="py-2.5 pr-3 font-mono">{system.percentage}%</td><td className="py-2.5 pr-3"><span className={`inline-block rounded px-2 py-1 font-bold uppercase text-[9px] ${system.status === 'Prepared' ? 'bg-emerald-100 text-emerald-800' : system.status === 'Needs Attention' ? 'bg-amber-100 text-amber-800' : system.status === 'Weak' ? 'bg-red-100 text-red-800' : 'bg-neutral-100 text-neutral-700'}`}>{system.status}</span></td><td className="py-2.5">{system.evidence}{system.gap ? ` — ${system.gap}` : ''}</td></tr>)}</tbody></table></div>
        </div>

        <section className="report-page-break space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">3. 12-Month Cash Flow Projection (Quarterly Summary)</h3>
          <p className="text-[10px] text-neutral-500">Monthly timing is estimated from the assessment’s production cycles and operating cost assumptions. Closing balance includes initial investment and cumulative projected net cash flow.</p>
          <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-y border-neutral-300 text-neutral-600"><th className="py-2 pr-3">Quarter</th><th className="py-2 pr-3">Total revenue</th><th className="py-2 pr-3">Total expenses</th><th className="py-2">Closing cumulative cash</th></tr></thead><tbody>{quarterlyCashFlow.map(row => <tr key={row.label} className="border-b border-neutral-200"><td className="py-2.5 pr-3 font-semibold">{row.label}</td><td className="py-2.5 pr-3 font-mono">{formatNaira(row.revenue)}</td><td className="py-2.5 pr-3 font-mono">{formatNaira(row.expenses)}</td><td className={`py-2.5 font-mono font-semibold ${row.closingBalance < 0 ? 'text-red-700' : 'text-emerald-800'}`}>{formatNaira(row.closingBalance)}</td></tr>)}</tbody></table></div>
          <div className="rounded-xl border border-neutral-200 p-4">
            <h4 className="font-bold text-xs text-neutral-800">Projected Cash Flow</h4>
            <div className="mt-3 flex flex-wrap gap-4 text-[10px]"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" />Revenue</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rose-400" />Expenses</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-600" />Net cash flow</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-violet-600" />Cumulative cash</span></div>
            <svg className="mt-2 h-48 w-full" viewBox="0 0 720 210" role="img" aria-label="Quarterly revenue, expenses, net cash flow and cumulative cash projection">
              <line x1="45" x2="690" y1={chartZero} y2={chartZero} stroke="#94a3b8" strokeWidth="1" />
              <line x1="45" x2="690" y1="43" y2="43" stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x="4" y="47" fontSize="9" fill="#64748b">+{formatNaira(chartMax)}</text><text x="4" y="109" fontSize="9" fill="#64748b">₦0</text><text x="4" y="169" fontSize="9" fill="#64748b">-{formatNaira(chartMax)}</text>
              {chartPoints.map(({ x, quarter }, index) => <g key={quarter.label}>
                <rect x={x - 23} y={Math.min(chartZero, chartY(quarter.revenue))} width="18" height={Math.max(1, Math.abs(chartZero - chartY(quarter.revenue)))} rx="2" fill="#10b981" />
                <rect x={x + 1} y={Math.min(chartZero, chartY(quarter.expenses))} width="18" height={Math.max(1, Math.abs(chartZero - chartY(quarter.expenses)))} rx="2" fill="#fb7185" />
                <text x={x - 4} y="177" fontSize="10" fill="#475569">Q{index + 1}</text>
              </g>)}
              <polyline points={netLine} fill="none" stroke="#0284c7" strokeWidth="2.5" />
              <polyline points={cumulativeLine} fill="none" stroke="#7c3aed" strokeWidth="2.5" />
              {chartPoints.map(point => <g key={`points-${point.x}`}><circle cx={point.x} cy={chartY(point.net)} r="3" fill="#0284c7"/><circle cx={point.x} cy={chartY(point.quarter.closingBalance)} r="3" fill="#7c3aed"/></g>)}
              <text x="275" y="198" fontSize="9" fill="#64748b">Quarter (NGN, estimated)</text>
            </svg>
          </div>
        </section>



        {/* 2. Financial Summary Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            4. Core Financial Indicators
          </h3>

          <p className="text-[11px] leading-relaxed text-neutral-600 bg-blue-50/70 border border-blue-100 rounded-xl px-3 py-2.5">
            Estimates use the values entered in this assessment. Operating costs are treated as annual totals; monthly operating cost is annual cost divided by 12. Annual output is output per cycle × cycles per year, adjusted for expected losses, and revenue uses your expected selling price per unit. Review these assumptions with local buyers and technical advisers.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-[11px] text-neutral-500 font-medium">Required Investment</p>
              <p className="text-lg font-bold font-mono text-neutral-900 mt-0.5">
                {formatNaira(metrics.totalStartupCapital)}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-[11px] text-neutral-500 font-medium">Available Capital</p>
              <p className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
                {formatNaira(reportProject.financialModel.availableCapital)}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-[11px] text-neutral-500 font-medium">Funding Gap</p>
              <p className={`text-lg font-bold font-mono mt-0.5 ${
                metrics.fundingGap > 0 ? 'text-red-600' : 'text-emerald-700'
              }`}>
                {formatNaira(metrics.fundingGap)}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-[11px] text-neutral-500 font-medium">Estimated Net Profit</p>
              <p className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                {formatNaira(metrics.netProfit)}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-neutral-200 p-4 space-y-2">
              <h4 className="font-bold text-neutral-900">Investment & operating cost basis</h4>
              <div className="flex justify-between"><span>Capital expenditure (CAPEX)</span><strong>{formatNaira((reportProject.farmDetails.landStatus === 'lease_partner' ? 0 : reportProject.financialModel.landRentPurchase) + reportProject.financialModel.landPreparation + reportProject.financialModel.equipmentMachinery + reportProject.financialModel.infrastructureSetup)}</strong></div>
              <div className="flex justify-between"><span>Operating expenditure (annual OPEX)</span><strong>{formatNaira(metrics.annualOperatingExpenses)}</strong></div>
              <div className="flex justify-between"><span>Contingency provision (annual estimate)</span><strong>{formatNaira(reportProject.financialModel.insuranceContingencyCost)}</strong></div>
              <div className="flex justify-between"><span>{reportProject.farmDetails.landStatus === 'lease_partner' ? 'Annual land lease (included in OPEX)' : 'Land purchase'}</span><strong>{formatNaira(reportProject.financialModel.landRentPurchase)}</strong></div>
              <div className="flex justify-between"><span>Land preparation</span><strong>{formatNaira(reportProject.financialModel.landPreparation)}</strong></div>
              <div className="flex justify-between"><span>Equipment & machinery</span><strong>{formatNaira(reportProject.financialModel.equipmentMachinery)}</strong></div>
              <div className="flex justify-between"><span>Infrastructure setup</span><strong>{formatNaira(reportProject.financialModel.infrastructureSetup)}</strong></div>
              <div className="flex justify-between"><span>One-time setup labour</span><strong>{formatNaira(reportProject.financialModel.initialLabour)}</strong></div>
              <div className="flex justify-between"><span>Initial inputs & working capital</span><strong>{formatNaira(reportProject.financialModel.initialInputs + reportProject.financialModel.initialWorkingCapital)}</strong></div>
              <div className="flex justify-between"><span>Other startup costs</span><strong>{formatNaira(reportProject.financialModel.otherStartupCosts)}</strong></div>
              <div className="flex justify-between"><span>Startup contingency reserve</span><strong>{formatNaira(reportProject.financialModel.startupContingency)}</strong></div>
              <div className="flex justify-between border-t pt-2"><span>Total initial investment</span><strong>{formatNaira(metrics.totalStartupCapital)}</strong></div>
              <p className="text-[10px] text-neutral-500">Startup contingency is included in total investment; insurance and recurring contingency remain in annual operating expenses.</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4 space-y-2">
              <h4 className="font-bold text-neutral-900">Revenue & break-even assumptions</h4>
              <div className="flex justify-between"><span>Expected quantity (after loss)</span><strong>{formatNumber(metrics.expectedAnnualQuantity, 1)} {reportProject.productionPlan.outputUnit}</strong></div>
              <div className="flex justify-between"><span>Selling price per unit</span><strong>{formatNaira(reportProject.marketPlan.expectedSellingPrice)}</strong></div>
              <div className="flex justify-between"><span>Annual buyer demand (entered)</span><strong>{formatNumber(reportProject.marketPlan.expectedPurchaseVolumePerCycle * Math.max(1, reportProject.productionPlan.cyclesPerYear), 1)} {reportProject.productionPlan.outputUnit}</strong></div>
              <div className="flex justify-between"><span>Variable cost per unit (estimated)</span><strong>{formatNaira(metrics.expectedAnnualQuantity > 0 ? (reportProject.financialModel.inputsCost + reportProject.financialModel.transportCost + reportProject.financialModel.packagingStorageCost) / metrics.expectedAnnualQuantity : 0)}</strong></div>
              <div className="flex justify-between"><span>Contribution per unit (estimated)</span><strong>{formatNaira(reportProject.marketPlan.expectedSellingPrice - (metrics.expectedAnnualQuantity > 0 ? (reportProject.financialModel.inputsCost + reportProject.financialModel.transportCost + reportProject.financialModel.packagingStorageCost) / metrics.expectedAnnualQuantity : 0))}</strong></div>
              <p className="text-[10px] text-neutral-500">Revenue is limited to the lower of estimated output and entered buyer demand. Unit consistency depends on the units entered in the assessment.</p>
              {reportProject.marketPlan.expectedPurchaseVolumePerCycle <= 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10px] font-semibold text-amber-900">Buyer demand has not been entered. Projected revenue is shown as ₦0 until a buyer volume is specified.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="flex justify-between p-2.5 bg-neutral-50/50 rounded-lg border border-neutral-100">
              <span className="text-neutral-500">Gross Margin:</span>
              <span className="font-mono font-bold text-neutral-800">{formatNumber(metrics.grossMarginPercent, 0)}%</span>
            </div>
            <div className="flex justify-between p-2.5 bg-neutral-50/50 rounded-lg border border-neutral-100">
              <span className="text-neutral-500">Return on Inv. (ROI):</span>
              <span className="font-mono font-bold text-emerald-700">{metrics.roiPercent == null ? 'Not available' : `${formatNumber(metrics.roiPercent, 1)}%`}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-neutral-50/50 rounded-lg border border-neutral-100">
              <span className="text-neutral-500">Break-even Point:</span>
              <span className="font-mono font-bold text-neutral-800">{metrics.breakEvenQuantity == null ? 'Not available' : `${formatNumber(metrics.breakEvenQuantity)} ${reportProject.productionPlan.outputUnit}`}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-neutral-50/50 rounded-lg border border-neutral-100">
              <span className="text-neutral-500">Payback Period:</span>
              <span className="font-mono font-bold text-neutral-800">
                {metrics.paybackPeriodYears !== null ? `${formatNumber(metrics.paybackPeriodYears, 2)} yrs` : 'Not reached'}
              </span>
            </div>
          </div>
        </div>

        <section className="report-page-break space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">5. Production Analysis</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {[
              ['Production type', reportProject.productionPlan.product || reportProject.farmDetails.targetProduce || 'Not entered'],
              ['Farm area', `${formatNumber(reportProject.farmDetails.farmSize, 2)} ${reportProject.farmDetails.sizeUnit}`],
              ['Production method', reportProject.productionPlan.productionMethod || 'Not entered'],
              ['Output per cycle', `${formatNumber(reportProject.productionPlan.expectedOutputPerCycle, 2)} ${reportProject.productionPlan.outputUnit}`],
              ['Cycles per year', formatNumber(reportProject.productionPlan.cyclesPerYear, 1)],
              ['Expected loss', `${formatNumber(reportProject.productionPlan.expectedLossPercent, 1)}%`],
              ['Adjusted annual harvest', `${formatNumber(metrics.expectedAnnualQuantity, 2)} ${reportProject.productionPlan.outputUnit}`],
              ['Growth period', `${formatNumber(reportProject.productionPlan.gestationMonths, 1)} months`],
              ['Key assumptions', reportProject.productionPlan.keyAssumptions || 'Not entered'],
            ].map(([label, value]) => <div key={label} className="rounded-xl border border-neutral-200 p-3"><p className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-1 font-semibold text-neutral-900">{value}</p></div>)}
          </div>
          <p className="text-[10px] text-neutral-500">Production calculator outputs and input requirements are listed in the Farm Management &amp; Calculator Details section when those tools have been saved to this assessment.</p>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
          <div><h3 className="text-sm font-bold tracking-wider text-neutral-900">Farm Management &amp; Calculator Details</h3><p className="text-xs text-neutral-600 mt-1">Production calculator results saved to this project and current inventory status.</p></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-neutral-50 p-3"><p className="font-semibold text-sm">Production calculations</p>{Object.keys(savedAnalysis?.production ?? {}).length ? Object.entries(savedAnalysis?.production ?? {}).map(([tool,result])=><div key={tool} className="mt-2 text-xs"><span className="font-semibold capitalize">{tool}</span><dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">{Object.entries(result).map(([key,val])=><React.Fragment key={key}><dt className="break-words text-neutral-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase())}</dt><dd className="break-words text-right font-medium">{typeof val === 'number' ? formatNumber(val, 2) : String(val)}</dd></React.Fragment>)}</dl></div>) : <p className="mt-2 text-xs text-neutral-500">No production calculator outputs saved yet.</p>}</div>
            <div className="rounded-xl bg-neutral-50 p-3"><p className="font-semibold text-sm">Inventory snapshot</p><p className="mt-2 text-xs">Tracked items: {reportInventory.length} · Low stock: {reportInventory.filter(item=>item.status==='Low Stock').length} · Out of stock: {reportInventory.filter(item=>item.status==='Out of Stock').length}</p>{reportInventory.filter(item=>item.status!=='In Stock').map(item=><p key={item.id} className="mt-1 text-xs text-amber-800">{item.name}: {item.quantity} {item.unit} · {item.status} (reorder at {item.reorderPoint})</p>)}</div>
          </div>
        </section>

        <section className="report-page-break space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">6. ROI, Payback &amp; Break-Even Analysis</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 text-center"><p className="text-[10px] uppercase tracking-widest text-emerald-800">Operating Return on Investment</p><p className="my-3 text-4xl font-black font-mono text-emerald-900">{metrics.roiPercent == null ? 'Not available' : `${formatNumber(metrics.roiPercent, 1)}%`}</p><p className="text-xs text-neutral-600">Annual operating profit divided by startup capital, before loan interest, tax and depreciation.</p></div>
            <div className="rounded-2xl border border-neutral-200 p-5 text-center"><p className="text-[10px] uppercase tracking-widest text-neutral-500">Payback Period</p><p className="my-3 text-4xl font-black font-mono text-neutral-900">{metrics.paybackPeriodYears == null ? 'Not reached' : `${formatNumber(metrics.paybackPeriodYears, 2)} yrs`}</p><p className="text-xs text-neutral-600">Calculated from project cash-flow timing in the 12-month forecast.</p></div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[['Break-even units', metrics.breakEvenQuantity == null ? 'Not available' : `${formatNumber(metrics.breakEvenQuantity)} ${reportProject.productionPlan.outputUnit}`], ['Break-even revenue', metrics.breakEvenRevenue == null ? 'Not available' : formatNaira(metrics.breakEvenRevenue)], ['Capacity required', metrics.capacityUtilizationAtBreakEven == null ? 'Not available' : `${formatNumber(metrics.capacityUtilizationAtBreakEven, 1)}%`]].map(([label, value]) => <div key={label} className="rounded-xl border border-neutral-200 p-3"><p className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-1 font-mono text-sm font-bold text-neutral-900">{value}</p></div>)}
          </div>
          <div className="rounded-xl border border-neutral-200 p-4">
            <div className="flex justify-between text-[10px] text-neutral-500"><span>0 units</span><span>Expected production: {formatNumber(metrics.expectedAnnualQuantity, 1)} {reportProject.productionPlan.outputUnit}</span></div>
            <div className="relative mt-4 h-4 rounded-full bg-neutral-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, metrics.breakEvenQuantity != null && metrics.marketableAnnualQuantity > 0 ? (metrics.breakEvenQuantity / metrics.marketableAnnualQuantity) * 100 : 0)}%` }} />{metrics.breakEvenQuantity != null && metrics.marketableAnnualQuantity > 0 && <span className="absolute top-[-7px] h-7 w-1 rounded bg-rose-600" style={{ left: `${Math.min(100, (metrics.breakEvenQuantity / metrics.marketableAnnualQuantity) * 100)}%` }} />}</div>
            <p className="mt-2 text-[10px] text-neutral-600">{metrics.breakEvenQuantity == null ? 'Break-even is unavailable: confirm positive production, buyer demand, selling price and contribution per unit.' : metrics.breakEvenAttainable ? `Break-even is ${formatNumber(metrics.breakEvenQuantity)} ${reportProject.productionPlan.outputUnit}; buyer-backed annual sales are ${formatNumber(metrics.marketableAnnualQuantity, 1)}.` : `Break-even is ${formatNumber(metrics.breakEvenQuantity)} ${reportProject.productionPlan.outputUnit}, above buyer-backed annual sales of ${formatNumber(metrics.marketableAnnualQuantity, 1)}. Resolve the market gap or costs before relying on this plan.`}</p>
          </div>
        </section>

        {savedAnalysis && <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
          <div><h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Saved Tool Analysis</h3><p className="text-xs text-neutral-600 mt-1">Saved calculator outputs for this project.</p></div>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            {savedAnalysis.roi && <div className="rounded-xl bg-white p-3 border"><p className="font-semibold">ROI & Payback</p><p className="mt-2">Investment: {formatNaira(savedNumber(savedAnalysis.roi,'totalInvestment'))}</p><p>Revenue: {formatNaira(savedNumber(savedAnalysis.roi,'revenue'))}</p><p>Costs: {formatNaira(savedNumber(savedAnalysis.roi,'totalCosts'))}</p><p>Net return: {formatNaira(savedNumber(savedAnalysis.roi,'netReturn'))}</p><p>ROI: {savedAnalysis.roi.roiPercent == null || savedNumber(savedAnalysis.roi,'totalInvestment') <= 0 ? 'Not available' : `${formatNumber(savedNumber(savedAnalysis.roi,'roiPercent'),1)}%`}</p><p>Payback: {savedAnalysis.roi.paybackPeriods == null ? 'Not reached in entered periods' : `${formatNumber(savedNumber(savedAnalysis.roi,'paybackPeriods'),1)} ${savedAnalysis.roi.periodLabel ?? 'periods'}`}</p></div>}
            {savedAnalysis.loan && <div className="rounded-xl bg-white p-3 border"><p className="font-semibold">Loan Estimate</p><p className="mt-2">Repayment per {reportProject.financialModel.financing.repaymentFrequency}: {formatNaira(savedNumber(savedAnalysis.loan,'periodicPayment'))}</p><p>Total interest: {formatNaira(savedNumber(savedAnalysis.loan,'totalInterest'))}</p><p>Total repayment: {formatNaira(savedNumber(savedAnalysis.loan,'totalRepayment'))}</p></div>}
            {savedAnalysis.whatIf && <div className="rounded-xl bg-white p-3 border"><p className="font-semibold">What-If Scenario</p><p className="mt-2">Scenario revenue: {formatNaira(savedNumber(savedAnalysis.whatIf,'scenarioRevenue'))}</p><p>Scenario costs: {formatNaira(savedNumber(savedAnalysis.whatIf,'scenarioCosts'))}</p><p>Scenario profit: {formatNaira(savedNumber(savedAnalysis.whatIf,'scenarioProfit'))}</p><p>Scenario ROI: {savedAnalysis.whatIf.roiPercent == null ? 'Not available' : `${formatNumber(savedNumber(savedAnalysis.whatIf,'roiPercent'),1)}%`}</p></div>}
            {savedAnalysis.risk && <div className="rounded-xl bg-white p-3 border"><p className="font-semibold">Risk Indicator</p><p className="mt-2">Overall: {savedAnalysis.risk.score == null ? 'Not assessed' : `${formatNumber(savedNumber(savedAnalysis.risk,'score'),0)} / 100`} · {String(savedAnalysis.risk.band ?? '')}</p>{savedRiskFactors?.map(f=><p key={f.name}>{f.name}: {formatNumber(f.score,1)} / 5 ({formatNumber(f.weight,0)}%)</p>)}</div>}
          </div>
        </section>}

        <section className="report-page-break rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">7. Scenario / What-If Analysis</h3>
          <p className="text-[10px] text-neutral-500">Low-price and high-cost cases reuse the application's What-If calculation engine. These are sensitivity tests, not forecasts.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-y border-neutral-300 text-neutral-500"><th className="py-2 pr-3">Metric</th>{baselineScenarios.map(scenario => <th key={scenario.name} className="py-2 pr-3">{scenario.name}</th>)}</tr></thead><tbody>{[
            ['Revenue', ...baselineScenarios.map(s => formatNaira(s.revenue))],
            ['Operating costs', ...baselineScenarios.map(s => formatNaira(s.costs))],
            ['Net profit', ...baselineScenarios.map(s => formatNaira(s.profit))],
            ['ROI', ...baselineScenarios.map(s => s.roi == null ? 'Not available' : `${formatNumber(s.roi, 1)}%`)],
            ['Payback', ...baselineScenarios.map(s => s.profit > 0 && metrics.totalStartupCapital > 0 ? `${formatNumber(metrics.totalStartupCapital / s.profit, 1)} years` : 'Not reached')],
          ].map(row => <tr key={row[0]} className="border-b border-neutral-200"><th className="py-2 pr-3 font-semibold">{row[0]}</th>{row.slice(1).map((value, index) => <td key={`${row[0]}-${index}`} className="py-2 pr-3 font-mono">{value}</td>)}</tr>)}</tbody></table></div>
          {(reportProject.scenarios.saved ?? []).length > 0 && <div><h4 className="font-semibold text-xs">Saved custom scenarios</h4><div className="mt-2 space-y-1 text-xs">{reportProject.scenarios.saved?.map(scenario => <p key={scenario.id} className="border-b py-2"><strong>{scenario.name}:</strong> revenue {formatNaira(scenario.revenue)} · costs {formatNaira(scenario.expenses)} · profit {formatNaira(scenario.profit)} · ROI {metrics.totalStartupCapital > 0 ? `${formatNumber(scenario.roi, 1)}%` : 'Not available'}</p>)}</div></div>}
          {savedAnalysis?.whatIf && <p className="text-xs"><strong>Latest saved what-if:</strong> revenue {formatNaira(savedNumber(savedAnalysis.whatIf, 'scenarioRevenue'))} · costs {formatNaira(savedNumber(savedAnalysis.whatIf, 'scenarioCosts'))} · profit {formatNaira(savedNumber(savedAnalysis.whatIf, 'scenarioProfit'))} · ROI {savedAnalysis.whatIf.roiPercent == null ? 'Not available' : `${formatNumber(savedNumber(savedAnalysis.whatIf, 'roiPercent'), 1)}%`}</p>}
        </section>

        <section className="report-page-break rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">8. Risk Analysis</h3>
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-4"><span className="text-xs font-semibold">Overall risk indicator</span><strong className="text-xl font-mono">{savedAnalysis?.risk?.score == null ? 'Not assessed' : `${formatNumber(savedNumber(savedAnalysis.risk, 'score'), 0)} / 100`}</strong><span className="text-xs text-neutral-600">{String(savedAnalysis?.risk?.band ?? 'Score and weights are based on entered assumptions; not a validated prediction.')}</span></div>
          {savedRiskFactors?.length ? <div className="grid sm:grid-cols-2 gap-2">{savedRiskFactors.map(factor => <div key={factor.name} className="flex justify-between rounded-lg border p-3 text-xs"><span>{factor.name} · weight {formatNumber(factor.weight, 0)}%</span><strong>{formatNumber(factor.score, 1)} / 5</strong></div>)}</div> : <p className="text-xs text-neutral-500">No weighted risk factor ratings have been saved.</p>}
          <p className="text-[10px] text-neutral-500">Risk score explains entered factor ratings and weights only. It is not scientifically validated and is not a guarantee or forecast.</p>
        </section>

        {reportProject.risks.length > 0 && <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Risk Register &amp; Controls</h3>
          <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-neutral-500"><th className="py-2 pr-3">Risk</th><th className="py-2 pr-3">Exposure / impact</th><th className="py-2 pr-3">Current control</th><th className="py-2">Planned mitigation</th></tr></thead><tbody>{reportProject.risks.map(risk => <tr key={risk.id} className="border-b last:border-0 align-top"><td className="py-2 pr-3"><strong>{risk.category}</strong><br />{risk.notes || 'No detail recorded'}</td><td className="py-2 pr-3">{risk.exposure} / {risk.impact} ({risk.overall})</td><td className="py-2 pr-3">{risk.existingControl || 'Not recorded'}</td><td className="py-2">{risk.plannedControl || 'Not recorded'}</td></tr>)}</tbody></table></div>
          <p className="text-[10px] text-neutral-500">Risk scores summarize entered ratings and weights. They are not scientifically validated forecasts.</p>
        </section>}

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Management, verification &amp; decision triggers</h3>
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <p><strong>Operational responsibilities:</strong> {reportProject.farmDetails.managementResponsibilities || 'Not provided'}</p>
            <p><strong>Independent records checker:</strong> {reportProject.recordKeepingPlan?.independentVerifier || 'Not provided'}</p>
            <p><strong>Verification method:</strong> {reportProject.recordKeepingPlan?.verificationMethod || 'Not provided'}</p>
            <p><strong>Stop when:</strong> {reportProject.exitRedesignExpansion.stopConditions || 'Not provided'}</p>
            <p><strong>Redesign when:</strong> {reportProject.exitRedesignExpansion.redesignConditions || 'Not provided'}</p>
            <p><strong>Expand when:</strong> {reportProject.exitRedesignExpansion.expansionConditions || 'Not provided'}</p>
            <p><strong>Estimated expansion capital:</strong> {formatNaira(reportProject.exitRedesignExpansion.expansionCapitalRequired)}</p>
          </div>
        </section>



        {/* 3. Detailed Seven-System Analysis (Evidence, Gap, Next Action) */}
        <div className="report-page-break space-y-4 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            9. Investment Readiness Summary &amp; System Diagnostics
          </h3>

          <div className="space-y-3 text-xs">
            {systems.map((s) => (
              <div key={s.systemName} className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900">{s.systemName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      s.status === 'Prepared' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      s.status === 'Needs Attention' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-neutral-600">{s.percentage}%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
                  <div>
                    <span className="font-bold text-neutral-700 block text-[10px] uppercase">Evidence:</span>
                    <p className="text-neutral-600 mt-0.5">{s.evidence}</p>
                  </div>
                  <div>
                    <span className="font-bold text-amber-800 block text-[10px] uppercase">Identified Gap:</span>
                    <p className="text-neutral-600 mt-0.5">{s.gap}</p>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-800 block text-[10px] uppercase">Recommended Action:</span>
                    <p className="text-neutral-700 font-medium mt-0.5">{s.nextAction}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Strongest Areas vs Areas Requiring More Work */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Your Strongest Areas</span>
            </h4>
            <ul className="space-y-2 text-xs text-neutral-700">
              {systems.filter(system => system.status === 'Prepared').map(system => (
                <li key={system.systemName} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>{system.systemName}:</strong> {system.evidence}</span>
                </li>
              ))}
              {!systems.some(system => system.status === 'Prepared') && <li>No system is currently rated Prepared. Address the priority actions below and update your assessment.</li>}
            </ul>
          </div>

          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Areas Requiring More Work</span>
            </h4>
            <ul className="space-y-2 text-xs text-neutral-700">
              {systems.filter(system => system.status !== 'Prepared').map(system => (
                <li key={system.systemName} className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>{system.systemName}:</strong> {system.gap}</span>
                </li>
              ))}
              {metrics.fundingGap > 0 && <li className="flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" /><span><strong>Funding gap:</strong> {formatNaira(metrics.fundingGap)} remains uncovered by the entered available capital.</span></li>}
              {systems.every(system => system.status === 'Prepared') && metrics.fundingGap === 0 && <li>No major gaps were identified from the information entered. Validate assumptions with local buyers and technical advisers.</li>}
            </ul>
          </div>
        </div>

        {/* 5. Before Committing More Capital: Interactive Checklist */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
              9. Top Priority Action Items &amp; Advisory
          </h3>
          <p className="text-xs text-neutral-500">
            Execute these action items before releasing funds for tractor hire, seeds, or land acquisition.
          </p>

          <div className="space-y-2">
            {priorityActions.length === 0 && <p className="text-xs text-neutral-600 p-3 rounded-xl border border-emerald-200 bg-emerald-50">No priority actions were generated from the current assessment. Review assumptions before committing capital.</p>}
            {priorityActions.map((item) => (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  checkedItems[item.id] ? 'border-emerald-300 bg-emerald-50/30 text-neutral-800' : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[item.id]}
                  onChange={() => toggleCheck(item.id)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                />
                <span className={checkedItems[item.id] ? 'line-through text-neutral-400 font-medium' : 'font-medium'}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Professional Disclaimer */}
        <div className="pt-6 border-t border-neutral-200 text-[11px] text-neutral-500 leading-relaxed space-y-1">
          <p className="font-bold text-neutral-700">Important Advisory Disclaimer:</p>
          <p>
            This Farm Investment Readiness Report is an analytical decision-support tool generated from user-entered assumptions, agronomic estimates, and prevailing commodity benchmarks in Nigeria. Agricultural investments are subject to climatic volatility, biological disease, currency fluctuations, and localized market factors. FarmReady Nigeria does not guarantee agricultural yield, market prices, or financial returns. Users must conduct on-ground soil tests, water quality tests, and legal land verification before committing capital.
          </p>
        </div>
      </div>
    </div>
  );
};
