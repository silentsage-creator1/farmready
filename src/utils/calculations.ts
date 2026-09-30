import type { FarmProject, FinancialMetrics } from '../types/index.js';

/**
 * Format currency in Nigerian Naira (₦) with commas
 */
export function formatNaira(amount: number | null | undefined, includeSymbol: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? '₦0' : '0';
  }
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('en-NG').format(rounded);
  return includeSymbol ? `₦${formatted}` : formatted;
}

/**
 * Format decimal numbers
 */
export function formatNumber(val: number | null | undefined, decimals: number = 0): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

/**
 * Calculate full financial metrics for a FarmProject
 */
export function calculateFinancialMetrics(project: FarmProject): FinancialMetrics {
  const fin = project.financialModel;
  const prod = project.productionPlan;
  const mkt = project.marketPlan;
  const cost = (amount: number | null | undefined) => Math.max(0, Number(amount) || 0);
  // A lease is an annual operating commitment, while a purchase is an initial investment.
  const annualLeaseCost = project.farmDetails?.landStatus === 'lease_partner' ? Math.max(0, fin.landRentPurchase || 0) : 0;
  const upfrontLandCost = project.farmDetails?.landStatus === 'lease_partner' ? 0 : Math.max(0, fin.landRentPurchase || 0);

  // Initial investment: land + equipment + infrastructure + initial working capital buffer.
  const totalStartupCapital = 
    upfrontLandCost +
    cost(fin.landPreparation) +
    cost(fin.equipmentMachinery) +
    cost(fin.infrastructureSetup) +
    cost(fin.initialInputs) +
    cost(fin.initialLabour) +
    cost(fin.otherStartupCosts) +
    cost(fin.startupContingency) +
    cost(fin.initialWorkingCapital);

  // Annual Operating Expenses
  const baseOperating = 
    cost(fin.labourCost) +
    cost(fin.inputsCost) +
    cost(fin.transportCost) +
    cost(fin.utilitiesCost) +
    cost(fin.maintenanceCost) +
    cost(fin.packagingStorageCost) +
    cost(fin.insuranceContingencyCost);

  // Custom expenses
  const customAnnual = (fin.customExpenses || []).reduce((acc, item) => {
    return acc + cost(item.amount) * (item.isMonthly ? 12 : 1);
  }, 0);

  const annualOperatingExpenses = baseOperating + customAnnual + annualLeaseCost;
  const monthlyOperatingCost = annualOperatingExpenses / 12;

  // Expected Production Quantity
  const cycles = Math.max(0, Math.floor(prod.cyclesPerYear || 0));
  const outputPerCycle = Math.max(0, prod.expectedOutputPerCycle || 0);
  const lossPercent = Math.min(99, Math.max(0, prod.expectedLossPercent || 0));
  const expectedAnnualQuantity = outputPerCycle * cycles * (1 - lossPercent / 100);

  // Expected Revenue
  const sellingPrice = Math.max(0, mkt.expectedSellingPrice || 0);
  const marketDemand = Math.max(0, mkt.expectedPurchaseVolumePerCycle || 0) * cycles;
  // Missing buyer demand is not evidence that the market can absorb all output.
  const marketableAnnualQuantity = Math.min(expectedAnnualQuantity, marketDemand);
  const expectedRevenue = marketableAnnualQuantity * sellingPrice;

  // Direct Input / Variable costs vs Fixed Costs estimation:
  // Inputs, packaging, transport are considered variable; equipment, land rent, management/permanent labour considered fixed.
  const variableCosts = cost(fin.inputsCost) + cost(fin.transportCost) + cost(fin.packagingStorageCost);
  const fixedCosts = Math.max(0, annualOperatingExpenses - variableCosts);

  const grossProfit = expectedRevenue - variableCosts;
  const grossMarginPercent = expectedRevenue > 0 ? (grossProfit / expectedRevenue) * 100 : 0;

  const netProfit = expectedRevenue - annualOperatingExpenses;
  const netMarginPercent = expectedRevenue > 0 ? (netProfit / expectedRevenue) * 100 : 0;

  const roiPercent = totalStartupCapital > 0 ? (netProfit / totalStartupCapital) * 100 : null;

  // Break-even
  const variableCostPerUnit = expectedAnnualQuantity > 0 ? variableCosts / expectedAnnualQuantity : 0;
  const contributionMarginPerUnit = sellingPrice - variableCostPerUnit;
  
  let breakEvenQuantity: number | null = null;
  let breakEvenRevenue: number | null = null;
  let capacityUtilizationAtBreakEven: number | null = null;
  let breakEvenAttainable: boolean | null = null;

  if (sellingPrice > 0 && expectedAnnualQuantity > 0 && marketableAnnualQuantity > 0 && contributionMarginPerUnit > 0) {
    breakEvenQuantity = fixedCosts > 0 ? Math.ceil(fixedCosts / contributionMarginPerUnit) : 0;
    breakEvenRevenue = breakEvenQuantity * sellingPrice;
    capacityUtilizationAtBreakEven = (breakEvenQuantity / expectedAnnualQuantity) * 100;
    breakEvenAttainable = breakEvenQuantity <= marketableAnnualQuantity;
  }

  // Funding Gap
  const loanFunds = fin.financing?.hasLoan ? Math.max(0, fin.financing.loanAmount || 0) : 0;
  const committedCapital = cost(fin.availableCapital) + cost(fin.additionalCapitalAvailable) + loanFunds;
  const fundingGap = Math.max(0, totalStartupCapital - committedCapital);

  const cashFlow = buildMonthlyCashFlow(project, { totalStartupCapital, monthlyOperatingCost, expectedAnnualQuantity });
  const paybackPeriodYears = findPaybackPeriodYears(cashFlow, totalStartupCapital);

  return {
    totalStartupCapital,
    monthlyOperatingCost,
    annualOperatingExpenses,
    expectedAnnualQuantity,
    expectedRevenue,
    grossProfit,
    grossMarginPercent,
    netProfit,
    netMarginPercent,
    roiPercent,
    breakEvenQuantity,
    breakEvenRevenue,
    fundingGap,
    paybackPeriodYears,
    capacityUtilizationAtBreakEven,
    breakEvenAttainable,
    marketableAnnualQuantity,
    annualVariableCosts: variableCosts,
    annualFixedCosts: fixedCosts,
  };
}

/**
 * 12-Month Cash Flow projection generator based on seasonal production cycles
 */
export interface CashFlowMonth {
  monthName: string;
  monthIndex: number;
  revenue: number;
  expenses: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  year: number;
  harvest: boolean;
}

interface CashFlowInputs {
  totalStartupCapital: number;
  monthlyOperatingCost: number;
  expectedAnnualQuantity: number;
}

function buildMonthlyCashFlow(project: FarmProject, inputs: CashFlowInputs): CashFlowMonth[] {
  const fin = project.financialModel;
  const prod = project.productionPlan;
  const market = project.marketPlan;
  const cyclesPerYear = Math.max(0, Math.floor(prod.cyclesPerYear || 0));
  const frequency = Math.max(1, Math.floor(prod.salesFrequencyMonths || (cyclesPerYear ? 12 / cyclesPerYear : 12)));
  const gestation = Math.max(1, Math.floor(prod.gestationMonths || 1));
  const outputPerCycle = Math.max(0, prod.expectedOutputPerCycle || 0) * (1 - Math.min(99, Math.max(0, prod.expectedLossPercent || 0)) / 100);
  const buyerVolumePerCycle = Math.max(0, market.expectedPurchaseVolumePerCycle || 0);
  const salePerCycle = Math.min(outputPerCycle, buyerVolumePerCycle);
  const rawStart = project.farmDetails?.expectedStartDate;
  const parsedStart = rawStart ? new Date(`${rawStart}T00:00:00`) : new Date();
  const start = Number.isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const repayMonths = fin.financing?.repaymentFrequency === 'quarterly' ? 3 : fin.financing?.repaymentFrequency === 'annual' ? 12 : 1;
  const annualRate = Math.max(0, fin.financing?.interestRatePercent || 0) / 100;
  const principal = fin.financing?.hasLoan ? Math.max(0, fin.financing.loanAmount || 0) : 0;
  const duration = Math.max(1, Math.floor(fin.financing?.durationMonths || 1));
  const grace = Math.max(0, Math.floor(fin.financing?.gracePeriodMonths || 0));
  const ratePerPayment = annualRate * repayMonths / 12;
  const remainingPeriods = Math.max(1, Math.ceil(Math.max(0, duration - grace) / repayMonths));
  const periodicPayment = principal === 0 ? 0 : ratePerPayment === 0 ? principal / remainingPeriods : principal * ratePerPayment * (1 + ratePerPayment) ** remainingPeriods / ((1 + ratePerPayment) ** remainingPeriods - 1);
  const months: CashFlowMonth[] = [];
  let cumulative = 0;
  let harvests = 0;

  for (let index = 0; index < 12; index += 1) {
    const monthNumber = index + 1;
    const isScheduledHarvest = monthNumber >= gestation && (monthNumber - gestation) % frequency === 0 && harvests < cyclesPerYear;
    const harvest = isScheduledHarvest && salePerCycle > 0;
    const revenue = harvest ? salePerCycle * Math.max(0, market.expectedSellingPrice || 0) : 0;
    if (isScheduledHarvest) harvests += 1;
    const startup = monthNumber === 1 ? inputs.totalStartupCapital : 0;
    let debtService = 0;
    const loanPeriodDue = monthNumber % repayMonths === 0 || monthNumber === 12;
    if (principal > 0 && loanPeriodDue && monthNumber <= duration) {
      debtService = monthNumber <= grace ? principal * ratePerPayment : periodicPayment;
    }
    const expenses = inputs.monthlyOperatingCost + startup + debtService;
    const netCashFlow = revenue - expenses;
    cumulative += netCashFlow;
    const calendar = new Date(startYear, startMonth + index, 1);
    months.push({
      monthName: calendar.toLocaleString('en', { month: 'short' }),
      monthIndex: monthNumber,
      year: calendar.getFullYear(),
      revenue,
      expenses,
      netCashFlow,
      cumulativeCashFlow: cumulative,
      harvest,
    });
  }
  return months;
}

function findPaybackPeriodYears(months: CashFlowMonth[], startupInvestment: number): number | null {
  let cumulative = -startupInvestment;
  for (let index = 0; index < months.length; index += 1) {
    const month = months[index];
    const periodNetFlow = month.revenue - month.expenses + (index === 0 ? startupInvestment : 0);
    const previous = cumulative;
    cumulative += periodNetFlow;
    if (previous < 0 && cumulative >= 0 && periodNetFlow > 0) {
      return Number(((index + (-previous / periodNetFlow)) / 12).toFixed(2));
    }
  }
  return null;
}

export function generate12MonthCashFlow(project: FarmProject): CashFlowMonth[] {
  const metrics = calculateFinancialMetrics(project);
  return buildMonthlyCashFlow(project, metrics);
}

/**
 * Compute Scenarios (Conservative, Expected, Optimistic)
 */
export function computeScenarios(project: FarmProject) {
  const baseMetrics = calculateFinancialMetrics(project);
  const fin = project.financialModel;
  const scenarios = project.scenarios;
  const cycles = Math.max(0, Math.floor(project.productionPlan.cyclesPerYear || 0));
  const annualBuyerDemand = Math.max(0, project.marketPlan.expectedPurchaseVolumePerCycle || 0) * cycles;
  const variableAnnualCosts = Math.max(0, fin.inputsCost || 0) + Math.max(0, fin.transportCost || 0) + Math.max(0, fin.packagingStorageCost || 0);
  const variableCostPerUnit = baseMetrics.expectedAnnualQuantity > 0 ? variableAnnualCosts / baseMetrics.expectedAnnualQuantity : 0;
  const fixedAnnualCosts = Math.max(0, baseMetrics.annualOperatingExpenses - variableAnnualCosts);

  const basePrice = Math.max(0, project.marketPlan.expectedSellingPrice || 0);
  const calculateCase = (yieldAmount: number, pricePerUnit: number, label: string, yieldFactor: number, priceFactor: number) => {
    const produced = yieldAmount > 0 ? yieldAmount : baseMetrics.expectedAnnualQuantity * yieldFactor;
    const casePrice = pricePerUnit > 0 ? pricePerUnit : basePrice * priceFactor;
    const sold = Math.min(produced, annualBuyerDemand);
    const revenue = sold * Math.max(0, casePrice);
    const totalExpenses = fixedAnnualCosts + (variableCostPerUnit * produced);
    const profit = revenue - totalExpenses;
    const roi = baseMetrics.totalStartupCapital > 0 ? (profit / baseMetrics.totalStartupCapital) * 100 : null;
    
    const contrib = casePrice - variableCostPerUnit;
    const breakEven = contrib > 0 && produced > 0 && sold > 0 ? Math.ceil(fixedAnnualCosts / contrib) : null;

    return {
      label,
      yield: produced,
      price: casePrice,
      revenue,
      expenses: totalExpenses,
      profit,
      roi,
      breakEven,
    };
  };

  return {
    conservative: calculateCase(scenarios.conservative.yield, scenarios.conservative.price, scenarios.conservative.label, 0.7, 0.9),
    expected: calculateCase(scenarios.expected.yield, scenarios.expected.price, scenarios.expected.label, 1, 1),
    optimistic: calculateCase(scenarios.optimistic.yield, scenarios.optimistic.price, scenarios.optimistic.label, 1.2, 1.1),
  };
}

/**
 * Compute What-If Simulation outcomes
 */
export function computeWhatIf(project: FarmProject, whatIfDeltas: FarmProject['whatIf']) {
  const base = calculateFinancialMetrics(project);
  const fin = project.financialModel;

  const priceMultiplier = Math.max(0, 1 + (whatIfDeltas.priceDeltaPercent / 100));
  const yieldMultiplier = Math.max(0, 1 + (whatIfDeltas.yieldDeltaPercent / 100));
  const inputCostMultiplier = Math.max(0, 1 + (whatIfDeltas.inputCostDeltaPercent / 100));
  const labourCostMultiplier = Math.max(0, 1 + (whatIfDeltas.labourCostDeltaPercent / 100));

  const cycles = Math.max(0, Math.floor(project.productionPlan.cyclesPerYear || 0));
  const buyerDemand = Math.max(0, project.marketPlan.expectedPurchaseVolumePerCycle || 0) * cycles;
  const simulatedProduction = base.expectedAnnualQuantity * Math.max(0, yieldMultiplier);
  const simulatedRevenue = Math.round(Math.min(simulatedProduction, buyerDemand) * project.marketPlan.expectedSellingPrice * Math.max(0, priceMultiplier));
  
  const producedRatio = base.expectedAnnualQuantity > 0 ? simulatedProduction / base.expectedAnnualQuantity : 0;
  const variableTransportPackaging = Math.max(0, fin.transportCost || 0) + Math.max(0, fin.packagingStorageCost || 0);
  const updatedInputs = Math.max(0, fin.inputsCost || 0) * inputCostMultiplier * producedRatio;
  const baseLabour = Math.max(0, fin.labourCost || 0);
  const updatedLabour = baseLabour * labourCostMultiplier;
  const fixedCosts = Math.max(0, base.annualOperatingExpenses - base.annualVariableCosts);
  const adjustedVariableCosts = updatedInputs + variableTransportPackaging * producedRatio;
  const simulatedExpenses = Math.round(fixedCosts - baseLabour + updatedLabour + adjustedVariableCosts);
  const simulatedProfit = simulatedRevenue - simulatedExpenses;
  const simulatedRoi = base.totalStartupCapital > 0 ? (simulatedProfit / base.totalStartupCapital) * 100 : null;

  // Break-even shift
  const simulatedVariableCostPerUnit = simulatedProduction > 0 ? adjustedVariableCosts / simulatedProduction : 0;
  const simulatedFixedCosts = Math.max(0, fixedCosts - baseLabour + updatedLabour);
  const contribution = Math.max(0, project.marketPlan.expectedSellingPrice || 0) * priceMultiplier - simulatedVariableCostPerUnit;
  const newBreakEvenQuantity = contribution > 0 && base.expectedAnnualQuantity > 0 ? Math.ceil(simulatedFixedCosts / contribution) : null;

  // Delta percentages relative to base
  const revenueDelta = base.expectedRevenue > 0 ? Math.round(((simulatedRevenue - base.expectedRevenue) / base.expectedRevenue) * 100) : 0;
  const expensesDelta = base.annualOperatingExpenses > 0 ? Math.round(((simulatedExpenses - base.annualOperatingExpenses) / base.annualOperatingExpenses) * 100) : 0;
  const profitDelta = base.netProfit !== 0 ? Math.round(((simulatedProfit - base.netProfit) / Math.abs(base.netProfit)) * 100) : 0;
  const roiDelta = Math.round((simulatedRoi ?? 0) - (base.roiPercent ?? 0));
  const breakEvenDelta = base.breakEvenQuantity != null && base.breakEvenQuantity > 0 && newBreakEvenQuantity != null ? Math.round(((newBreakEvenQuantity - base.breakEvenQuantity) / base.breakEvenQuantity) * 100) : 0;

  return {
    simulatedRevenue,
    simulatedExpenses,
    simulatedProfit,
    simulatedRoi,
    simulatedBreakEvenQuantity: newBreakEvenQuantity,
    simulatedBreakEvenAttainable: newBreakEvenQuantity != null && newBreakEvenQuantity <= Math.min(simulatedProduction, buyerDemand),
    deltas: {
      revenueDelta,
      expensesDelta,
      profitDelta,
      roiDelta,
      breakEvenDelta,
    }
  };
}

/**
 * Loan Payment Calculator
 */
export function calculateLoanSchedule(
  principal: number,
  annualRatePercent: number,
  durationMonths: number,
  repaymentFrequency: 'monthly' | 'quarterly' | 'annual' = 'monthly',
  gracePeriodMonths: number = 0
) {
  if (!principal || principal <= 0 || !durationMonths || durationMonths <= 0) {
    return { periodicPayment: 0, totalInterest: 0, totalRepayment: 0, periodsCount: 0 };
  }

  const periodsPerYear = repaymentFrequency === 'monthly' ? 12 : repaymentFrequency === 'quarterly' ? 4 : 1;
  const monthsPerPeriod = 12 / periodsPerYear;
  const totalPeriods = Math.ceil(durationMonths / monthsPerPeriod);
  const gracePeriods = Math.floor(gracePeriodMonths / monthsPerPeriod);
  const activePeriods = Math.max(1, totalPeriods - gracePeriods);

  const periodicRate = (annualRatePercent / 100) / periodsPerYear;

  let periodicPayment = 0;
  if (periodicRate === 0) {
    periodicPayment = principal / activePeriods;
  } else {
    periodicPayment = (principal * periodicRate * Math.pow(1 + periodicRate, activePeriods)) / 
                      (Math.pow(1 + periodicRate, activePeriods) - 1);
  }

  const totalRepayment = periodicPayment * activePeriods;
  const totalInterest = Math.max(0, totalRepayment - principal);

  return {
    periodicPayment: Math.round(periodicPayment),
    totalInterest: Math.round(totalInterest),
    totalRepayment: Math.round(totalRepayment),
    periodsCount: activePeriods,
    repaymentFrequency
  };
}
