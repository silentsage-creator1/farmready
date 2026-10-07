export type CalculatorInput = Record<string, unknown>;
import { calculateFinancialMetrics, computeWhatIf, generate12MonthCashFlow } from '../src/utils/calculations.js';

const n = (input: CalculatorInput, key: string, fallback = 0) => {
  const value = Number(input[key]);
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
};
const percent = (value: number) => Math.min(100, Math.max(0, value)) / 100;

export function calculate(type: string, input: CalculatorInput): Record<string, unknown> {
  switch (type) {
    case 'budget': {
      const capexItems = (input.capexItems as Record<string, unknown>[] | undefined) ?? [];
      const opexItems = (input.opexItems as Record<string, unknown>[] | undefined) ?? [];
      const capex = capexItems.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
      const opex = opexItems.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
      const workingCapital = n(input, 'initialWorkingCapital');
      const baseCost = capex + workingCapital;
      const contingency = baseCost * percent(n(input, 'contingencyPercent'));
      const totalRequired = baseCost + opex + contingency;
      const capital = n(input, 'availableCapital');
      return { capex, opex, workingCapital, baseCost, contingency, totalRequired, fundingGap: Math.max(0, totalRequired - capital), surplus: Math.max(0, capital - totalRequired) };
    }
    case 'profit': {
      const quantity = n(input, 'quantity'); const price = n(input, 'price');
      const costs = (input.costs && typeof input.costs === 'object' ? input.costs : {}) as Record<string, unknown>;
      const costValue = (key: string) => Math.max(0, Number(costs[key]) || 0);
      const productionCostKeys = ['seeds','seedlings','fertilizerManure','pesticides','herbicides','animalFeed','medicine','vaccines','farmLabour','waterIrrigation','fuel','electricity','harvesting','processing','packaging'];
      const totalCostKeys = [...productionCostKeys,'transportToMarket','marketFees','sellingAgentFees','otherFarmCosts'];
      const productionCosts = productionCostKeys.reduce((sum, key) => sum + costValue(key), 0);
      const totalExpenses = totalCostKeys.reduce((sum, key) => sum + costValue(key), 0);
      const revenue = quantity * price; const grossProfit = revenue - productionCosts; const netProfit = revenue - totalExpenses;
      return { revenue, productionCosts, totalExpenses, grossProfit, grossMargin: revenue ? grossProfit / revenue * 100 : 0, netProfit, netMargin: revenue ? netProfit / revenue * 100 : 0, profitPerUnit: quantity ? netProfit / quantity : 0 };
    }
    case 'breakeven': {
      const price = Math.max(0, n(input, 'price'));
      const capacity = Math.max(0, n(input, 'capacity'));
      const productionCosts = input.productionCosts && typeof input.productionCosts === 'object' ? input.productionCosts as Record<string, unknown> : {};
      const farmCosts = input.farmCosts && typeof input.farmCosts === 'object' ? input.farmCosts as Record<string, unknown> : {};
      const sumCosts = (items: Record<string, unknown>) => Object.values(items).reduce<number>((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
      const totalProductionCosts = sumCosts(productionCosts);
      const totalFarmCosts = sumCosts(farmCosts);
      const hasCostInputs = Object.values(productionCosts).some(value => Number(value) > 0) || Object.values(farmCosts).some(value => Number(value) > 0);
      const productionCostPerUnit = capacity > 0 ? totalProductionCosts / capacity : null;
      const contributionPerUnit = productionCostPerUnit == null ? null : price - productionCostPerUnit;
      const units = hasCostInputs && contributionPerUnit != null && contributionPerUnit > 0 ? Math.ceil(totalFarmCosts / contributionPerUnit) : null;
      const capacityPercent = units != null && capacity > 0 ? units / capacity * 100 : null;
      const reachable = units != null && units <= capacity;
      return { capacity, periodMonths: Math.max(1, n(input, 'periodMonths', 12)), price, hasCostInputs, totalProductionCosts, totalFarmCosts, totalCosts: totalProductionCosts + totalFarmCosts, productionCostPerUnit, contributionPerUnit, units, revenue: units == null ? null : units * price, capacityPercent, reachable, revenueAtCapacity: capacity * price, profitAtCapacity: capacity * price - totalProductionCosts - totalFarmCosts };
    }
    case 'loan': {
      const principal = n(input, 'principal'); const annualRate = n(input, 'annualRate') / 100;
      const duration = Math.max(1, Math.floor(n(input, 'durationPeriods'))); const grace = Math.min(duration, Math.floor(n(input, 'gracePeriods')));
      const frequency = input.frequency === 'quarterly' ? 4 : input.frequency === 'annual' ? 1 : 12;
      const rate = annualRate / frequency; const treatment = input.graceTreatment === 'capitalize' ? 'capitalize' : input.graceTreatment === 'defer' ? 'defer' : 'pay';
      let balance = principal; let graceInterest = 0;
      for (let i = 0; i < grace; i++) { const interest = balance * rate; graceInterest += interest; if (treatment === 'capitalize') balance += interest; }
      const repaymentPeriods = Math.max(1, duration - grace); const payment = rate === 0 ? balance / repaymentPeriods : balance * rate * (1 + rate) ** repaymentPeriods / ((1 + rate) ** repaymentPeriods - 1);
      const amortized = payment * repaymentPeriods; const paidGrace = treatment === 'pay' ? graceInterest : 0;
      const totalRepayment = amortized + paidGrace; const totalInterest = totalRepayment - principal;
      return { periodicPayment: payment, totalRepayment, totalInterest, graceInterest, graceTreatment: treatment, balanceAfterGrace: balance, repaymentPeriods };
    }
    case 'roi': {
      const project = input.project as { financialModel?: Record<string, unknown>; productionPlan?: Record<string, unknown>; marketPlan?: Record<string, unknown>; farmDetails?: Record<string, unknown> } | undefined;
      const financial = project?.financialModel ?? {};
      const initialInvestment = n(input, 'initialInvestment', ['landPurchaseCost','landPreparation','equipmentMachinery','infrastructureSetup','animalPenCost','storageShedCost','startupSeedsCost','startupSeedlingsCost','startupAnimalsCost','startupFingerlingsCost','initialLabour','initialWorkingCapital','otherStartupCosts','startupContingency'].reduce((sum, key) => sum + n(financial, key), 0));
      const additionalInvestment = n(input, 'additionalInvestment');
      const investment = initialInvestment + additionalInvestment;
      const production = project?.productionPlan ?? {}; const market = project?.marketPlan ?? {};
      const cycles = Math.max(0, Math.floor(n(production, 'cyclesPerYear', 0)));
      const producedQuantity = n(production, 'expectedOutputPerCycle') * cycles * (1 - percent(n(production, 'expectedLossPercent')));
      const buyerDemand = n(market, 'expectedPurchaseVolumePerCycle') * cycles;
      const quantity = Math.min(producedQuantity, buyerDemand);
      const revenue = n(input, 'revenue', quantity * n(market, 'expectedSellingPrice'));
      const customCosts = ((financial.customExpenses as { amount?: number; isMonthly?: boolean }[] | undefined) ?? []).reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0) * (item.isMonthly ? 12 : 1), 0);
      const operatingCosts = n(input, 'operatingCosts', ['landRentLeaseCost','labourCost','inputsCost','seedCost','seedlingsCost','fertilizerCost','manureCost','pesticidesCost','herbicidesCost','feedCost','fishFeedCost','medicineCost','vaccineCost','fuelCost','transportCost','utilitiesCost','electricityCost','waterCost','irrigationCost','maintenanceCost','securityCost','packagingStorageCost','harvestingCost','processingCost','marketFeesCost','sellingAgentFeesCost','insuranceContingencyCost','miscellaneousCost'].reduce((sum, key) => sum + n(financial, key), 0) + customCosts);
      const otherCosts = n(input, 'otherCosts');
      const costs = operatingCosts + otherCosts;
      const netReturn = revenue - costs; const netCashFlow = revenue - n(input, 'cashExpenses', costs);
      const cashFlows = (input.periodicCashFlows as number[] | undefined) ?? [];
      const periods = cashFlows.length ? cashFlows.map(value => Number.isFinite(Number(value)) ? Number(value) : 0) : [n(input, 'averagePeriodicNetCashflow', netCashFlow)];
      let cumulative = 0; let paybackPeriods: number | null = null;
      const cumulativeCashFlows = periods.map((cashFlow, index) => {
        const previous = cumulative; cumulative += cashFlow;
        if (paybackPeriods === null && cumulative >= initialInvestment && cashFlow > 0) paybackPeriods = index + (initialInvestment - previous) / cashFlow;
        return { period: index + 1, netCashFlow: cashFlow, cumulativeCashFlow: cumulative };
      });
      return { initialInvestment, additionalInvestment, totalInvestment: investment, revenue, operatingCosts, otherCosts, totalCosts: costs, netReturn, roiPercent: investment > 0 ? netReturn / investment * 100 : null, netCashFlow, cumulativeCashFlows, paybackPeriods, periodLabel: input.periodLabel === 'season' ? 'season' : 'year' };
    }
    case 'crop': {
      const area = Math.max(0, n(input, 'area')); const seedRateKgHa = Math.max(0, n(input, 'seedRateKgHa')); const seedKgPerHa = seedRateKgHa;
      const yieldKgHa = Math.max(0, n(input, 'yieldKgHa', n(input, 'yieldTonnesHa') * 1000));
      const seedKg = area * seedRateKgHa; const bagSize = Math.max(1, n(input, 'seedBagKg', 25));
      const expectedHarvestKgPerHa = yieldKgHa; const expectedHarvestKg = area * yieldKgHa;
      const harvest = expectedHarvestKg / 1000; const adjustedHarvest = harvest * (1 - percent(n(input, 'lossPercent')));
      const price = n(input, 'sellingPrice'); const priceUnit = input.priceUnit === 'tonne' ? 'tonne' : 'kg'; const saleQuantity = priceUnit === 'kg' ? adjustedHarvest * 1000 : adjustedHarvest;
      return { cropType: String(input.cropType ?? ''), areaHectares: area, seedKgPerHa, seedKg, seedBags: Math.ceil(seedKg / bagSize), expectedYieldKgPerHa: yieldKgHa, expectedHarvestKgPerHa, expectedHarvestKg, expectedHarvestTonnes: harvest, adjustedHarvestTonnes: adjustedHarvest, potentialRevenue: saleQuantity * price, saleQuantity, priceUnit };
    }
    case 'fertilizer': {
      const area = Math.max(0, n(input, 'area')); const rateKgHa = Math.max(0, n(input, 'rateKgHa', n(input, 'basalRateKgHa') + n(input, 'topdressRateKgHa')));
      const applications = Math.max(1, Math.floor(n(input, 'applications', 1))); const requiredKgPerApplicationPerHa = rateKgHa / applications;
      const requiredKg = area * rateKgHa; const bagSize = Math.max(1, n(input, 'bagSizeKg', 50)); const exactBags = requiredKg / bagSize; const bags = Math.ceil(exactBags);
      return { cropType: String(input.cropType ?? ''), fertilizerType: String(input.fertilizerType ?? ''), areaHectares: area, requiredKgPerHa: rateKgHa, requiredKgPerApplicationPerHa, applications, requiredKgPerApplication: requiredKg / applications, requiredKg, exactBags, bags, bagSizeKg: bagSize, purchaseCost: bags * n(input, 'pricePerBag') };
    }
    case 'feed': {
      const area = Math.max(0, n(input, 'areaHectares')); const stockingRate = Math.max(0, n(input, 'stockingRatePerHa'));
      const animalsPerHa = stockingRate; const animals = Math.floor(area * stockingRate); const dailyFeedPerAnimal = Math.max(0, n(input, 'dailyFeedKg'));
      const days = Math.max(0, n(input, 'days')); const dailyKgPerHa = animalsPerHa * dailyFeedPerAnimal; const dailyKg = animals * dailyFeedPerAnimal;
      const totalKg = dailyKg * days; const monthlyKg = dailyKg * 30; const bagSize = Math.max(1, n(input, 'bagSizeKg', 25)); const exactBags = totalKg / bagSize; const bags = Math.ceil(exactBags); const cost = bags * n(input, 'pricePerBag');
      const survivors = animals * (1 - percent(n(input, 'mortalityPercent')));
      return { livestockType: String(input.livestockType ?? ''), areaHectares: area, stockingRatePerHa: stockingRate, animalsPerHa, animalCount: animals, survivors, dailyFeedPerAnimalKg: dailyFeedPerAnimal, dailyKgPerHa, dailyKg, monthlyKg, days, totalKg, exactBags, bags, bagSizeKg: bagSize, totalCost: cost, costPerAnimal: animals ? cost / animals : 0, costPerSurvivor: survivors ? cost / survivors : 0 };
    }
    case 'fish': {
      const stocked = n(input, 'stocked'); const survivors = Math.round(stocked * percent(n(input, 'survivalPercent'))); const weight = n(input, 'harvestWeightKg'); const biomass = survivors * weight;
      const gain = Math.max(0, biomass - stocked * n(input, 'fingerlingWeightKg')); const feedKg = gain * n(input, 'fcr'); const feedCost = feedKg * n(input, 'feedPricePerKg');
      const revenue = biomass * n(input, 'pricePerKg'); const otherCosts = ['fingerlingCosts','labourCosts','medicationCosts','electricityCosts','waterCosts','transportCosts','otherCosts'].reduce((sum, key) => sum + n(input, key), 0);
      return { survivors, biomassKg: biomass, feedKg, feedCost, revenue, totalCosts: feedCost + otherCosts, profit: revenue - feedCost - otherCosts };
    }
    case 'whatif': {
      const project = input.project as { financialModel?: Record<string, unknown>; productionPlan?: Record<string, unknown>; marketPlan?: Record<string, unknown> } | undefined;
      if (!project?.financialModel || !project.productionPlan || !project.marketPlan) throw new Error('Project financial, production and market assumptions are required.');
      const projectModel = project as Parameters<typeof calculateFinancialMetrics>[0];
      const base = calculateFinancialMetrics(projectModel);
      const result = computeWhatIf(projectModel, {
        priceDeltaPercent: Number(input.priceChangePercent) || 0,
        yieldDeltaPercent: Number(input.yieldChangePercent) || 0,
        inputCostDeltaPercent: Number(input.costChangePercent) || 0,
        labourCostDeltaPercent: Number(input.labourCostChangePercent) || 0,
      });
      const investment = n(input, 'investment', base.totalStartupCapital);
      const scenarioPayback = result.simulatedProfit > 0 ? investment / result.simulatedProfit : null;
      return {
        baseRevenue: base.expectedRevenue, baseCosts: base.annualOperatingExpenses, baseProfit: base.netProfit,
        baseRoiPercent: base.roiPercent, basePaybackPeriods: base.paybackPeriodYears,
        scenarioRevenue: result.simulatedRevenue, scenarioCosts: result.simulatedExpenses, scenarioProfit: result.simulatedProfit,
        profitChange: result.simulatedProfit - base.netProfit, roiPercent: result.simulatedRoi, paybackPeriods: scenarioPayback,
        baseBreakEvenUnits: base.breakEvenQuantity, scenarioBreakEvenUnits: result.simulatedBreakEvenQuantity,
        scenarioPrice: n(project.marketPlan, 'expectedSellingPrice') * Math.max(0, 1 + (Number(input.priceChangePercent) || 0) / 100),
        scenarioQuantity: Math.min(base.expectedAnnualQuantity * Math.max(0, 1 + (Number(input.yieldChangePercent) || 0) / 100), n(project.marketPlan, 'expectedPurchaseVolumePerCycle') * Math.max(0, n(project.productionPlan, 'cyclesPerYear'))),
        simulatedRevenue: result.simulatedRevenue, simulatedExpenses: result.simulatedExpenses,
        simulatedProfit: result.simulatedProfit, simulatedRoi: result.simulatedRoi,
        simulatedBreakEvenQuantity: result.simulatedBreakEvenQuantity,
        deltas: result.deltas,
      };
    }
    case 'risk': {
      const factors = (input.factors as { name: string; score: number; weight: number }[] | undefined) ?? [];
      const valid = factors.filter(f => Number.isFinite(Number(f.score)) && Number(f.score) >= 1 && Number(f.score) <= 5 && Number(f.weight) > 0);
      const totalWeight = valid.reduce((sum, f) => sum + Number(f.weight), 0);
      const averageRating = factors.length > 0 && valid.length === factors.length && totalWeight > 0
        ? valid.reduce((sum, f) => sum + Number(f.score) * Number(f.weight), 0) / totalWeight
        : null;
      const score = averageRating === null ? null : averageRating * 20;
      const band = score === null ? 'Not assessed' : score <= 20 ? 'Very Low' : score <= 40 ? 'Low' : score <= 60 ? 'Moderate' : score <= 80 ? 'High' : 'Very High';
      const mitigation: Record<string, string> = { Market: 'Validate buyers, compare prices and avoid relying on one customer.', Production: 'Pilot the production plan and strengthen water, disease and weather controls.', Financial: 'Reduce borrowing, confirm funding and maintain an emergency reserve.', Operational: 'Confirm staffing, input suppliers, transport, storage and management cover.' };
      const assessed = valid.map(f => ({ name: f.name, score: Number(f.score), weight: Number(f.weight), weightedScore: Number(f.score) * Number(f.weight) }));
      return { score, averageRating, band, factors: assessed, mitigations: assessed.filter(f => f.score >= 3).map(f => ({ factor: f.name, action: mitigation[f.name] ?? 'Review and strengthen controls for this risk.' })) };
    }
    case 'inventory': {
      const opening = n(input, 'openingStock'); const purchased = n(input, 'purchased'); const used = n(input, 'used'); const lost = n(input, 'lost');
      const currentStock = Math.max(0, opening + purchased - used - lost); const reorderPoint = n(input, 'averageDailyUse') * n(input, 'leadTimeDays') + n(input, 'safetyStock');
      return { currentStock, inventoryValue: currentStock * n(input, 'unitCost'), reorderPoint, reorderRecommended: currentStock <= reorderPoint };
    }
    case 'cashflow': {
      const project = input.project as { financialModel?: Record<string, unknown>; productionPlan?: Record<string, unknown>; marketPlan?: Record<string, unknown>; farmDetails?: Record<string, unknown> } | undefined;
      if (!project?.financialModel || !project.productionPlan || !project.marketPlan) throw new Error('Project financial, production and market assumptions are required.');
      const projectModel = project as Parameters<typeof calculateFinancialMetrics>[0];
      const metrics = calculateFinancialMetrics(projectModel);
      const months = generate12MonthCashFlow(projectModel);
      const gestationMonths = Math.max(1, Math.floor(n(project.productionPlan, 'gestationMonths', 1)));
      const estimatedPreHarvestCashNeed = metrics.monthlyOperatingCost * Math.max(0, Math.min(12, gestationMonths - 1));
      return {
        months: months.map(month => ({ ...month, periodLabel: `Month ${month.monthIndex} · ${month.monthName} ${month.year}` })),
        gestationMonths,
        salesFrequencyMonths: Math.max(1, Math.floor(n(project.productionPlan, 'salesFrequencyMonths', 12))),
        monthlyOperatingExpenses: metrics.monthlyOperatingCost,
        setupOutlay: metrics.totalStartupCapital,
        estimatedPreHarvestCashNeed,
        initialWorkingCapital: n(project.financialModel, 'initialWorkingCapital'),
        workingCapitalShortfall: Math.max(0, estimatedPreHarvestCashNeed - n(project.financialModel, 'initialWorkingCapital')),
        expectedYieldPerSale: Math.min(n(project.productionPlan, 'expectedOutputPerCycle') * (1 - percent(n(project.productionPlan, 'expectedLossPercent'))), n(project.marketPlan, 'expectedPurchaseVolumePerCycle')),
        sellingPrice: n(project.marketPlan, 'expectedSellingPrice'),
      };
    }
    default: throw new Error('Unknown calculator');
  }
}
