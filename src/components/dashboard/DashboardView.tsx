import React, { useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { calculateFinancialMetrics, formatNaira, formatNumber } from '../../utils/calculations';
import { calculateAssessmentProgress, evaluateSevenSystems } from '../../utils/readiness';
import {
  ArrowRight, ArrowUpRight, BadgePercent, Beef, BookOpenCheck, Check, CheckCircle2,
  ChevronDown, CircleDollarSign, Clock3, FileText, Fish, Leaf, Plus, ShieldAlert,
  Sprout, TriangleAlert, TrendingUp, Wallet, Wheat,
} from 'lucide-react';

type ChartPeriod = 'Monthly' | 'Production Cycle' | 'Annual';

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

const labelize = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase());

export const DashboardView: React.FC = () => {
  const {
    currentProject, allProjects, selectProject, setActiveView, createNewAssessment,
    userProfile, savedReports, openSavedReport,
  } = useFarmProject();
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('Annual');

  if (allProjects.length === 0) {
    return <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-white px-6 py-12 text-center shadow-sm sm:px-12 sm:py-16">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Sprout className="h-8 w-8" aria-hidden="true" /></div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Welcome to FarmReady</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-950">Your farm investment planning starts here.</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-600">Create an assessment to organize your farm plan and calculate its financial, production, and readiness indicators.</p>
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 text-left sm:grid-cols-3 lg:grid-cols-4">
          {['Investment requirements', 'Farm budget', 'Expected revenue', 'Expected profit', 'Break-even', 'ROI and payback', 'Production requirements', 'Risk review', 'What-if scenarios', 'Readiness report'].map(item => <div key={item} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 text-xs font-medium text-neutral-700"><Check className="h-4 w-4 shrink-0 text-emerald-600" />{item}</div>)}
        </div>
        <button onClick={() => createNewAssessment()} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"><Plus className="h-4 w-4" />Create New Assessment</button>
      </section>
    </div>;
  }

  const metrics = calculateFinancialMetrics(currentProject);
  const systems = evaluateSevenSystems(currentProject);
  const progress = calculateAssessmentProgress(currentProject);
  const isComplete = progress >= 100;
  const fin = currentProject.financialModel;
  const committedCapital = fin.availableCapital + fin.additionalCapitalAvailable + (fin.financing.hasLoan ? fin.financing.loanAmount : 0);
  const prod = currentProject.productionPlan;
  const details = currentProject.farmDetails;
  const cycles = Math.max(1, prod.cyclesPerYear || 1);
  const projectName = details.farmName || currentProject.name || 'Untitled farm assessment';
  const riskResult = currentProject.toolAnalysis?.risk;
  const riskFactors = Array.isArray(riskResult?.factors)
    ? riskResult.factors as { name: string; score: number; weight?: number }[]
    : [];
  const sortedRiskFactors = [...riskFactors].sort((a, b) => b.score - a.score);
  const latestScenario = [...(currentProject.scenarios.saved ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const whatIfResult = currentProject.toolAnalysis?.whatIf;
  const reportSnapshot = savedReports.filter(report => report.projectId === currentProject.id).sort((a, b) => b.date.localeCompare(a.date))[0];
  const reportMetrics = reportSnapshot ? calculateFinancialMetrics(reportSnapshot.projectSnapshot) : null;
  const hasFinancialInputs = [
    fin.landRentPurchase, fin.landPreparation, fin.equipmentMachinery, fin.infrastructureSetup,
    fin.initialInputs, fin.initialLabour, fin.initialWorkingCapital, fin.otherStartupCosts,
    fin.startupContingency, fin.availableCapital, fin.labourCost, fin.inputsCost,
    fin.transportCost, fin.utilitiesCost, fin.maintenanceCost, fin.packagingStorageCost,
    currentProject.marketPlan.expectedSellingPrice, prod.expectedOutputPerCycle,
  ].some(value => Number(value) > 0);
  const shown = (value: number, formatted: (input: number) => string = formatNaira) => hasFinancialInputs ? formatted(value) : 'Not entered';
  const fundedAmount = Math.max(0, Math.min(committedCapital, metrics.totalStartupCapital));
  const fundingPercent = metrics.totalStartupCapital > 0 ? Math.min(100, (fundedAmount / metrics.totalStartupCapital) * 100) : 0;
  const surplus = Math.max(0, committedCapital - metrics.totalStartupCapital);
  const expectedAboveBreakEven = metrics.breakEvenAttainable === true;
  const validBreakEven = metrics.breakEvenQuantity != null && metrics.expectedAnnualQuantity > 0;
  const breakEvenQuantity = metrics.breakEvenQuantity ?? 0;
  const profileName = userProfile.fullName?.trim().split(/\s+/)[0] || 'Farmer';
  const assessmentDate = new Date(currentProject.updatedAt || currentProject.createdAt);
  const dateLabel = Number.isNaN(assessmentDate.getTime()) ? 'Date unavailable' : assessmentDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  const periodValues = chartPeriod === 'Monthly'
    ? { revenue: metrics.expectedRevenue / 12, costs: metrics.annualOperatingExpenses / 12, profit: metrics.netProfit / 12, caption: 'Average month, based on annual projections' }
    : chartPeriod === 'Production Cycle'
      ? { revenue: metrics.expectedRevenue / cycles, costs: metrics.annualOperatingExpenses / cycles, profit: metrics.netProfit / cycles, caption: `Per cycle · ${cycles} cycle${cycles === 1 ? '' : 's'} assumed per year` }
      : { revenue: metrics.expectedRevenue, costs: metrics.annualOperatingExpenses, profit: metrics.netProfit, caption: 'Annual estimate from current assessment assumptions' };
  const chartMax = Math.max(Math.abs(periodValues.revenue), Math.abs(periodValues.costs), Math.abs(periodValues.profit), 1);
  const productionResults = currentProject.toolAnalysis?.production ?? {};
  const resultNumber = (record: Record<string, unknown> | undefined, key: string) => Number(record?.[key] ?? 0);
  const inputRows: { name: string; requirement: string; cost: number }[] = [];
  const cropResult = productionResults.crop;
  const fertilizerResult = productionResults.fertilizer;
  const feedResult = productionResults.feed;
  const fishResult = productionResults.fish;
  if (cropResult && resultNumber(cropResult, 'seedKg') > 0) inputRows.push({ name: 'Seed', requirement: `${formatNumber(resultNumber(cropResult, 'seedKg'), 1)} kg · ${formatNumber(resultNumber(cropResult, 'seedBags'))} bags`, cost: 0 });
  if (fertilizerResult && resultNumber(fertilizerResult, 'requiredKg') > 0) inputRows.push({ name: 'Fertilizer', requirement: `${formatNumber(resultNumber(fertilizerResult, 'requiredKg'), 1)} kg · ${formatNumber(resultNumber(fertilizerResult, 'bags'))} bags`, cost: resultNumber(fertilizerResult, 'purchaseCost') });
  if (feedResult && resultNumber(feedResult, 'totalKg') > 0) inputRows.push({ name: 'Feed', requirement: `${formatNumber(resultNumber(feedResult, 'totalKg'), 1)} kg · ${formatNumber(resultNumber(feedResult, 'bags'))} bags`, cost: resultNumber(feedResult, 'totalCost') });
  if (fishResult && resultNumber(fishResult, 'feedKg') > 0) inputRows.push({ name: 'Fish feed', requirement: `${formatNumber(resultNumber(fishResult, 'feedKg'), 1)} kg`, cost: resultNumber(fishResult, 'feedCost') });
  if (fin.labourCost > 0) inputRows.push({ name: 'Labour', requirement: 'Operating budget', cost: fin.labourCost });
  if (inputRows.length < 4 && fin.inputsCost > 0 && !inputRows.some(row => ['Fertilizer', 'Feed', 'Fish feed'].includes(row.name))) inputRows.push({ name: 'Other farm inputs', requirement: 'Operating budget', cost: fin.inputsCost });
  const strongestRisk = sortedRiskFactors[0];
  const riskLabel = riskResult?.band ? String(riskResult.band) : typeof riskResult?.score === 'number' ? Number(riskResult.score) > 60 ? 'High risk' : Number(riskResult.score) > 40 ? 'Moderate risk' : 'Low risk' : 'Not assessed';
  const alerts: { icon: React.ReactNode; text: string; action: string; view: 'investment_analysis' | 'risk_analysis' | 'what_if' | 'tools' | 'new_assessment' }[] = [];
  if (metrics.fundingGap > 0) alerts.push({ icon: <TriangleAlert className="h-4 w-4 text-amber-600" />, text: `Funding gap of ${formatNaira(metrics.fundingGap)} identified.`, action: 'Review budget', view: 'investment_analysis' });
  if (strongestRisk && strongestRisk.score >= 4) alerts.push({ icon: <ShieldAlert className="h-4 w-4 text-amber-600" />, text: `${strongestRisk.name} risk is high (${formatNumber(strongestRisk.score, 1)} / 5).`, action: 'Review risk', view: 'risk_analysis' });
  if (hasFinancialInputs && metrics.expectedRevenue > 0 && metrics.netProfit <= 0) alerts.push({ icon: <TriangleAlert className="h-4 w-4 text-amber-600" />, text: 'Current assumptions show no positive annual operating profit.', action: 'Test assumptions', view: 'what_if' });
  if (systems.find(system => system.systemName.startsWith('Market'))?.status === 'Insufficient Information') alerts.push({ icon: <TriangleAlert className="h-4 w-4 text-amber-600" />, text: 'Market validation details are incomplete.', action: 'Continue assessment', view: 'new_assessment' });
  const readinessReportAction = () => reportSnapshot ? openSavedReport(reportSnapshot.id) : setActiveView('report');

  const StatusBadge = ({ children, good = false }: { children: React.ReactNode; good?: boolean }) => <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${good ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{good ? <CheckCircle2 className="h-3 w-3" /> : <TriangleAlert className="h-3 w-3" />}{children}</span>;
  const SectionHeading = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: { label: string; view: Parameters<typeof setActiveView>[0] } }) => <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-neutral-900">{title}</h2>{subtitle && <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>}</div>{action && <button onClick={() => setActiveView(action.view)} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950">{action.label}<ArrowUpRight className="h-3.5 w-3.5" /></button>}</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">{greeting()}, {profileName} <span aria-hidden="true">👋</span></h1><p className="mt-1 text-sm text-neutral-500">Here&apos;s an overview of your current farm investment assessment.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {!isComplete ? <button onClick={() => setActiveView('new_assessment')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"><ArrowRight className="h-4 w-4" />Continue Assessment</button> : <><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" />Assessment Complete</span><button onClick={readinessReportAction} className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50">View Readiness Report</button></>}
          <button onClick={() => createNewAssessment()} aria-label="Create new assessment" className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"><Plus className="h-4 w-4" />New</button>
        </div>
        <label className="relative sm:ml-auto sm:max-w-[18rem]">
          <span className="sr-only">Select farm project</span><select aria-label="Select farm project" value={currentProject.id} onChange={event => selectProject(event.target.value)} className="w-full appearance-none rounded-lg border border-neutral-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-neutral-700 shadow-sm sm:w-auto sm:max-w-[18rem]
            "><option disabled value="">Select a project</option>{allProjects.map(project => <option key={project.id} value={project.id}>{project.farmDetails.farmName || project.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-neutral-500" />
        </label>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Sprout className="h-6 w-6" /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-neutral-950">{projectName}</h2><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">{currentProject.farmType}</span></div><p className="mt-1 text-xs text-neutral-500">{details.locationState || 'Location not entered'}{details.locationState ? ' State' : ''} · {details.farmSize > 0 ? `${formatNumber(details.farmSize, 2)} ${details.sizeUnit}` : 'Farm size not entered'} · Updated {dateLabel}</p></div></div>
          <div className="flex flex-wrap items-center gap-2"><button onClick={() => setActiveView('new_assessment')} className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Edit details</button>{!isComplete ? <button onClick={() => setActiveView('new_assessment')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800">Continue Assessment<ArrowRight className="h-4 w-4" /></button> : <button onClick={readinessReportAction} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800">View Readiness Report</button>}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionHeading title="Assessment Progress" subtitle={`${progress}% of diagnostic questions answered`} />
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex-1"><div className="h-3 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs font-semibold text-neutral-700">{progress}% Complete</p></div>{isComplete ? <button onClick={readinessReportAction} className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" />View Full Report</button> : <button onClick={() => setActiveView('new_assessment')} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800">Continue Assessment<ArrowRight className="h-3.5 w-3.5" /></button>}</div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{systems.map(system => { const completed = system.status !== 'Insufficient Information'; return <div key={system.systemName} className="flex items-center gap-1.5 text-[10px] text-neutral-600"><span className={completed ? 'text-emerald-600' : 'text-neutral-300'}>{completed ? <Check className="h-3.5 w-3.5" /> : <span className="block h-3 w-3 rounded-full border border-neutral-300" />}</span><span>{system.systemName.replace(' System', '')}</span></div>; })}</div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { title: 'Total Investment', value: shown(metrics.totalStartupCapital), note: 'Total estimated startup capital', icon: <Wallet className="h-4 w-4" />, color: 'text-emerald-800' },
          { title: 'Expected Revenue', value: shown(metrics.expectedRevenue), note: 'Projected annual sales', icon: <TrendingUp className="h-4 w-4" />, color: 'text-sky-800' },
          { title: 'Expected Profit', value: shown(metrics.netProfit), note: 'Revenue less annual operating costs', icon: <CircleDollarSign className="h-4 w-4" />, color: metrics.netProfit >= 0 ? 'text-emerald-800' : 'text-red-700' },
          { title: 'ROI', value: metrics.totalStartupCapital > 0 ? `${formatNumber(metrics.roiPercent, 1)}%` : 'Not available', note: 'Estimated annual return on startup capital', icon: <BadgePercent className="h-4 w-4" />, color: 'text-violet-800' },
          { title: 'Payback Period', value: metrics.totalStartupCapital > 0 ? metrics.paybackPeriodYears != null ? `${formatNumber(metrics.paybackPeriodYears, 2)} years` : 'Not reached in 12-month forecast' : 'Not available', note: 'Recovery timing from projected cash flow', icon: <Clock3 className="h-4 w-4" />, color: 'text-amber-800' },
          { title: 'Risk Score', value: typeof riskResult?.score === 'number' ? `${formatNumber(Number(riskResult.score), 0)} / 100` : 'Not assessed', note: typeof riskResult?.score === 'number' ? riskLabel : 'Enter all risk ratings to calculate', icon: <ShieldAlert className="h-4 w-4" />, color: 'text-rose-800' },
        ].map(card => <article key={card.title} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-neutral-500">{card.title}</p><span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 ${card.color}`}>{card.icon}</span></div><p className={`mt-3 truncate text-2xl font-extrabold tracking-tight ${card.color}`}>{card.value}</p><p className="mt-1 text-[10px] text-neutral-500">{card.note}</p></article>)}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm xl:col-span-3">
          <SectionHeading title="Financial Overview" subtitle="Your projected financial performance." action={{ label: 'View Investment Analysis', view: 'investment_analysis' }} />
          <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-neutral-50 p-1">{(['Monthly', 'Production Cycle', 'Annual'] as ChartPeriod[]).map(period => <button key={period} onClick={() => setChartPeriod(period)} aria-pressed={chartPeriod === period} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${chartPeriod === period ? 'bg-white text-emerald-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}>{period}</button>)}</div>
          <p className="mb-3 text-[10px] text-neutral-500">{periodValues.caption}</p>
          <div className="space-y-4">{[
            { label: 'Revenue', value: periodValues.revenue, color: 'bg-emerald-500' },
            { label: 'Total Costs', value: periodValues.costs, color: 'bg-rose-400' },
            { label: 'Net Profit', value: periodValues.profit, color: periodValues.profit >= 0 ? 'bg-sky-600' : 'bg-red-600' },
          ].map(row => <div key={row.label}><div className="mb-1.5 flex justify-between gap-2 text-xs"><span className="font-semibold text-neutral-700">{row.label}</span><span className="font-mono font-bold text-neutral-900">{shown(row.value)}</span></div><div className="h-3 overflow-hidden rounded-full bg-neutral-100"><div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.max(row.value === 0 ? 0 : 2, Math.min(100, (Math.abs(row.value) / chartMax) * 100))}%` }} /></div></div>)}</div>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm xl:col-span-2">
          <SectionHeading title="Funding Status" subtitle="Capital committed toward startup investment." />
          <div className="grid grid-cols-2 gap-3 text-xs"><div><p className="text-neutral-500">Total required</p><p className="mt-1 font-mono font-bold">{shown(metrics.totalStartupCapital)}</p></div><div><p className="text-neutral-500">Available capital</p><p className="mt-1 font-mono font-bold">{shown(fin.availableCapital)}</p></div></div>
          <div className="mt-5"><div className="mb-1.5 flex justify-between text-[10px] font-semibold"><span>Available capital</span><span>{hasFinancialInputs ? `${formatNumber(fundingPercent, 0)}% funded` : 'Not entered'}</span></div><div className="h-3 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${fundingPercent}%` }} /></div></div>
          <div className="mt-4 flex items-center justify-between gap-2">{!hasFinancialInputs ? <StatusBadge>Enter your budget</StatusBadge> : metrics.totalStartupCapital <= 0 ? <StatusBadge>Investment not estimated</StatusBadge> : metrics.fundingGap > 0 ? <StatusBadge>{formatNaira(metrics.fundingGap)} funding gap</StatusBadge> : surplus > 0 ? <StatusBadge good>Capital surplus {formatNaira(surplus)}</StatusBadge> : <StatusBadge good>Fully funded</StatusBadge>}<button onClick={() => setActiveView('investment_analysis')} className="text-xs font-bold text-emerald-800">Review Budget →</button></div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <SectionHeading title="Break-Even" action={{ label: 'View Break-Even Analysis', view: 'financial' }} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[
            ['Break-even quantity', hasFinancialInputs && metrics.breakEvenQuantity != null ? `${formatNumber(metrics.breakEvenQuantity)} ${prod.outputUnit}` : 'Not available'],
            ['Expected production', hasFinancialInputs ? `${formatNumber(metrics.expectedAnnualQuantity, 1)} ${prod.outputUnit}` : 'Not entered'],
            ['Break-even revenue', hasFinancialInputs && metrics.breakEvenRevenue != null ? formatNaira(metrics.breakEvenRevenue) : 'Not available'],
            ['Capacity required', validBreakEven && metrics.capacityUtilizationAtBreakEven != null ? `${formatNumber(metrics.capacityUtilizationAtBreakEven, 1)}%` : 'Not available'],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-neutral-50 p-3"><p className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-1 text-sm font-bold text-neutral-900">{value}</p></div>)}</div>
          <div className="mt-5"><div className="flex justify-between text-[10px] text-neutral-500"><span>0</span><span>{hasFinancialInputs ? `${formatNumber(metrics.marketableAnnualQuantity, 1)} ${prod.outputUnit} marketable` : 'Production not entered'}</span></div><div className="relative mt-2 h-4 rounded-full bg-neutral-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${validBreakEven && metrics.marketableAnnualQuantity > 0 ? Math.min(100, breakEvenQuantity / metrics.marketableAnnualQuantity * 100) : 0}%` }} />{validBreakEven && metrics.marketableAnnualQuantity > 0 && <span className="absolute top-[-5px] h-6 w-1 rounded bg-amber-600" style={{ left: `${Math.min(100, breakEvenQuantity / metrics.marketableAnnualQuantity * 100)}%` }} />}</div></div>
          <div className="mt-4">{!validBreakEven ? <p className="text-xs text-neutral-500">Break-even is unavailable until output, buyer demand, selling price and positive contribution per unit are entered.</p> : expectedAboveBreakEven ? <StatusBadge good>Expected buyer-backed sales volume is above break-even.</StatusBadge> : <StatusBadge>Break-even exceeds expected buyer-backed sales volume.</StatusBadge>}</div>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <SectionHeading title="Production Overview" action={{ label: 'View Production Analysis', view: 'production_analysis' }} />
          <div className="grid grid-cols-2 gap-3">{currentProject.farmType === 'Fish Farming' ? <>
            <DashboardData label="Species" value={prod.product || details.targetProduce || 'Not entered'} icon={<Fish className="h-4 w-4" />} />
            <DashboardData label="Fish stocked" value={formatNumber(resultNumber(fishResult, 'stocked') || prod.capacity)} icon={<Fish className="h-4 w-4" />} />
            <DashboardData label="Expected survivors" value={fishResult ? formatNumber(resultNumber(fishResult, 'survivors')) : 'Not calculated'} icon={<CheckCircle2 className="h-4 w-4" />} />
            <DashboardData label="Harvest biomass" value={fishResult ? `${formatNumber(resultNumber(fishResult, 'biomassKg'), 1)} kg` : `${formatNumber(metrics.expectedAnnualQuantity, 1)} ${prod.outputUnit}`} icon={<TrendingUp className="h-4 w-4" />} />
            <DashboardData label="Feed requirement" value={fishResult ? `${formatNumber(resultNumber(fishResult, 'feedKg'), 1)} kg` : 'Not calculated'} icon={<Leaf className="h-4 w-4" />} />
            <DashboardData label="Production cycle" value={`${formatNumber(prod.gestationMonths, 1)} months`} icon={<Clock3 className="h-4 w-4" />} />
          </> : ['Livestock', 'Poultry'].includes(currentProject.farmType) ? <>
            <DashboardData label="Animal type" value={prod.product || details.targetProduce || currentProject.farmType} icon={<Beef className="h-4 w-4" />} />
            <DashboardData label="Number stocked" value={feedResult ? formatNumber(resultNumber(feedResult, 'animals') || prod.capacity) : formatNumber(prod.capacity)} icon={<Beef className="h-4 w-4" />} />
            <DashboardData label="Expected survivors" value={feedResult ? formatNumber(resultNumber(feedResult, 'survivors')) : 'Not calculated'} icon={<CheckCircle2 className="h-4 w-4" />} />
            <DashboardData label="Feed requirement" value={feedResult ? `${formatNumber(resultNumber(feedResult, 'totalKg'), 1)} kg` : 'Not calculated'} icon={<Leaf className="h-4 w-4" />} />
            <DashboardData label="Production cycle" value={`${formatNumber(prod.gestationMonths, 1)} months`} icon={<Clock3 className="h-4 w-4" />} />
          </> : <>
            <DashboardData label="Farm area" value={details.farmSize > 0 ? `${formatNumber(details.farmSize, 2)} ${details.sizeUnit}` : 'Not entered'} icon={<Sprout className="h-4 w-4" />} />
            <DashboardData label="Main crop / product" value={prod.product || details.targetProduce || 'Not entered'} icon={<Wheat className="h-4 w-4" />} />
            <DashboardData label="Expected yield" value={cropResult && details.farmSize > 0 ? `${formatNumber(resultNumber(cropResult, 'expectedHarvestTonnes') * 1000 / details.farmSize, 1)} kg/${details.sizeUnit} (calculator)` : prod.expectedOutputPerCycle > 0 && details.farmSize > 0 ? `${formatNumber(prod.expectedOutputPerCycle / details.farmSize, 1)} ${prod.outputUnit}/${details.sizeUnit}` : 'Not entered'} icon={<TrendingUp className="h-4 w-4" />} />
            <DashboardData label="Expected harvest" value={hasFinancialInputs ? `${formatNumber(metrics.expectedAnnualQuantity, 1)} ${prod.outputUnit}` : 'Not entered'} icon={<Wheat className="h-4 w-4" />} />
            <DashboardData label="Production cycle" value={`${formatNumber(prod.gestationMonths, 1)} months`} icon={<Clock3 className="h-4 w-4" />} />
          </>}</div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <SectionHeading title="Input Requirements" subtitle="Key inputs from saved calculator results and the current budget." action={{ label: 'View Input Analysis', view: 'production_analysis' }} />
          {inputRows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-[10px] uppercase tracking-wide text-neutral-500"><th className="py-2">Input</th><th className="py-2">Requirement</th><th className="py-2 text-right">Estimated cost</th></tr></thead><tbody>{inputRows.slice(0, 4).map(row => <tr key={row.name} className="border-b last:border-0"><td className="py-2.5 font-semibold">{row.name}</td><td className="py-2.5 text-neutral-600">{row.requirement}</td><td className="py-2.5 text-right font-mono">{row.cost > 0 ? formatNaira(row.cost) : 'See budget'}</td></tr>)}</tbody></table></div> : <EmptySummary text="No production input calculators have been applied to this assessment yet." />}
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <SectionHeading title="Farm Risk" action={{ label: 'View Risk Analysis', view: 'risk_analysis' }} />
          {typeof riskResult?.score === 'number' ? <><div className="flex items-baseline gap-2"><p className="text-4xl font-extrabold font-mono text-neutral-950">{formatNumber(Number(riskResult.score), 0)}<span className="text-lg text-neutral-400"> / 100</span></p><StatusBadge>{riskLabel}</StatusBadge></div><div className="mt-4 space-y-3">{riskFactors.map(factor => <div key={factor.name}><div className="mb-1 flex justify-between text-[10px]"><span>{factor.name} risk</span><span className="font-mono">{formatNumber(factor.score, 1)} / 5</span></div><div className="h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.max(0, Math.min(100, factor.score * 20))}%` }} /></div></div>)}</div><p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">{strongestRisk ? `Key risk: ${strongestRisk.name} is the highest-scored factor at ${formatNumber(strongestRisk.score, 1)} / 5.` : 'No individual risk factors were returned by the assessment.'}</p></> : <EmptySummary text="No scored risk assessment has been saved yet." action="Run Risk Indicator" onClick={() => setActiveView('tools')} />}
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <SectionHeading title={latestScenario || whatIfResult ? 'What-If Scenario' : 'What-If Simulator'} action={{ label: 'Open What-If Simulator', view: 'what_if' }} />
          {latestScenario ? <><div className="flex flex-wrap gap-2 text-[10px]">{Object.entries(latestScenario.deltas).map(([key, value]) => <span key={key} className="rounded-full bg-neutral-100 px-2.5 py-1 font-semibold text-neutral-600">{labelize(key).replace(' Percent', '')}: {Number(value) > 0 ? '+' : ''}{formatNumber(Number(value), 0)}%</span>)}</div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><DashboardData label="Revenue" value={formatNaira(latestScenario.revenue)} /><DashboardData label="Profit" value={formatNaira(latestScenario.profit)} /><DashboardData label="ROI" value={metrics.totalStartupCapital > 0 && latestScenario.roi != null ? `${formatNumber(latestScenario.roi, 1)}%` : 'Not available'} /><DashboardData label="Payback" value={latestScenario.profit > 0 && metrics.totalStartupCapital > 0 ? `${formatNumber(metrics.totalStartupCapital / latestScenario.profit, 1)} years` : 'Not reached'} /></div></> : whatIfResult ? <div className="grid grid-cols-2 gap-3 text-xs"><DashboardData label="Revenue" value={formatNaira(Number(whatIfResult.scenarioRevenue ?? 0))} /><DashboardData label="Profit" value={formatNaira(Number(whatIfResult.scenarioProfit ?? 0))} /><DashboardData label="ROI" value={whatIfResult.roiPercent == null ? 'Not available' : `${formatNumber(Number(whatIfResult.roiPercent), 1)}%`} /><DashboardData label="Payback" value={Number(whatIfResult.paybackPeriods) > 0 ? `${formatNumber(Number(whatIfResult.paybackPeriods), 1)} years` : 'Not reached'} /></div> : <><p className="text-xs leading-relaxed text-neutral-600">Test how changes in selling price, yield, input costs, labour, feed, fertilizer, and mortality could affect your investment.</p><button onClick={() => setActiveView('what_if')} className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">Run First Scenario<ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button></>}
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <SectionHeading title="Attention Required" subtitle="Only current, assessment-based items are shown." />
          {alerts.length ? <div className="space-y-2">{alerts.map((alert, index) => <div key={`${alert.action}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3"><div className="flex items-start gap-2">{alert.icon}<p className="text-xs text-neutral-800">{alert.text}</p></div><button onClick={() => setActiveView(alert.view)} className="shrink-0 text-[10px] font-bold text-emerald-800">{alert.action} →</button></div>)}</div> : <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-900"><CheckCircle2 className="h-4 w-4" />No priority alerts from the information currently entered.</div>}
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <SectionHeading title="Farm Investment Readiness Report" subtitle="Latest saved report for this farm." />
          {reportSnapshot && reportMetrics ? <><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-neutral-900">{reportSnapshot.projectName}</h3><p className="mt-1 text-xs text-neutral-500">Last generated {new Date(reportSnapshot.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600">{reportSnapshot.status}</span></div><div className="mt-4 grid grid-cols-3 gap-3 text-xs"><div><span className="text-neutral-500">Investment</span><p className="mt-1 font-mono font-bold">{formatNaira(reportMetrics.totalStartupCapital)}</p></div><div><span className="text-neutral-500">ROI</span><p className="mt-1 font-mono font-bold">{reportMetrics.roiPercent == null ? 'Not available' : `${formatNumber(reportMetrics.roiPercent, 1)}%`}</p></div><div><span className="text-neutral-500">Risk</span><p className="mt-1 font-mono font-bold">{reportSnapshot.projectSnapshot.toolAnalysis?.risk?.score == null ? 'Not assessed' : `${formatNumber(Number(reportSnapshot.projectSnapshot.toolAnalysis.risk.score), 0)} / 100`}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => openSavedReport(reportSnapshot.id)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">View Report</button><button onClick={() => openSavedReport(reportSnapshot.id, 'download')} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700"><FileText className="mr-1 inline h-3.5 w-3.5" />Download PDF</button><button onClick={() => openSavedReport(reportSnapshot.id, 'print')} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700">Print</button></div></> : <div className="rounded-xl border border-dashed border-neutral-200 p-5 text-center"><p className="font-semibold text-neutral-800">Your readiness report is not ready</p><p className="mt-1 text-xs text-neutral-500">Complete the assessment to generate your Farm Investment Readiness Report.</p><button onClick={() => setActiveView(isComplete ? 'report' : 'new_assessment')} className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">{isComplete ? 'Generate Report' : 'Complete Assessment'}</button></div>}
        </article>
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <SectionHeading title="Quick Actions" />
          <div className="grid grid-cols-2 gap-2">{[
            { label: 'New Assessment', view: null, action: () => createNewAssessment(), icon: <Plus className="h-4 w-4" /> },
            { label: 'Budget Builder', view: 'tools' as const, action: () => setActiveView('tools'), icon: <Wallet className="h-4 w-4" /> },
            { label: 'Run What-If', view: 'what_if' as const, action: () => setActiveView('what_if'), icon: <TrendingUp className="h-4 w-4" /> },
            { label: 'Risk Analysis', view: 'risk_analysis' as const, action: () => setActiveView('risk_analysis'), icon: <ShieldAlert className="h-4 w-4" /> },
            { label: 'Investment Analysis', view: 'investment_analysis' as const, action: () => setActiveView('investment_analysis'), icon: <CircleDollarSign className="h-4 w-4" /> },
            { label: 'Generate Report', view: 'report' as const, action: () => setActiveView('report'), icon: <BookOpenCheck className="h-4 w-4" /> },
          ].map(item => <button key={item.label} onClick={item.action} className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-left text-xs font-semibold text-neutral-700 transition hover:border-emerald-200 hover:bg-emerald-50/60"><span className="text-emerald-700">{item.icon}</span>{item.label}</button>)}</div>
        </article>
      </section>
    </div>
  );
};

function DashboardData({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div className="rounded-xl bg-neutral-50 p-3">{icon && <span className="mb-2 inline-flex text-emerald-700">{icon}</span>}<p className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-1 break-words text-xs font-bold text-neutral-900">{value}</p></div>;
}

function EmptySummary({ text, action, onClick }: { text: string; action?: string; onClick?: () => void }) {
  return <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-xs text-neutral-500">{text}{action && onClick && <button onClick={onClick} className="ml-2 font-bold text-emerald-800">{action} →</button>}</div>;
}
