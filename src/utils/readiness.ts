import { FarmProject, SystemReadiness, SystemStatus } from '../types';
import { calculateFinancialMetrics, formatNaira } from './calculations';

interface AnswerCheck {
  answered: boolean;
  required: boolean;
  quality: number;
}

function answer(value: unknown, required = false): AnswerCheck {
  const answered = typeof value === 'number'
    ? Number.isFinite(value) && value > 0
    : typeof value === 'boolean'
      ? true
      : Array.isArray(value)
        ? value.length > 0
        : typeof value === 'string'
          ? value.trim().length > 0
          : value !== null && value !== undefined;

  if (!answered) return { answered: false, required, quality: 0 };

  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  const quality = normalized === 'not decided' || normalized === 'not decided yet'
    ? 0.2
    : normalized === 'none yet'
      ? 0.35
      : normalized === 'assumed customer'
        ? 0.45
        : 1;

  return { answered: true, required, quality };
}

function answerNonNegative(value: number | null | undefined, required = false): AnswerCheck {
  const answered = typeof value === 'number' && Number.isFinite(value) && value >= 0;
  return { answered, required, quality: answered ? 1 : 0 };
}

function evaluateSystem(
  systemName: string,
  checks: AnswerCheck[],
  evidence: string,
  gap: string,
  nextAction: string,
): SystemReadiness {
  const answered = checks.filter(check => check.answered).length;
  const percentage = checks.length ? Math.round((checks.reduce((sum, check) => sum + check.quality, 0) / checks.length) * 100) : 0;
  const missingRequired = checks.some(check => check.required && !check.answered);
  let status: SystemStatus;

  if (missingRequired) status = 'Insufficient Information';
  else if (percentage >= 75) status = 'Prepared';
  else if (percentage >= 45) status = 'Needs Attention';
  else status = 'Weak';

  const missingCount = checks.length - answered;
  const missingNote = missingCount > 0 ? ` ${missingCount} diagnostic answer${missingCount === 1 ? ' is' : 's are'} missing.` : '';
  return {
    systemName,
    status,
    percentage,
    evidence: `${evidence}${missingNote}`,
    gap,
    nextAction,
  };
}

function riskChecks(project: FarmProject): AnswerCheck[] {
  const risks = project.risks || [];
  return [
    answer(risks.length ? 'risks entered' : '', true),
    answer(risks.length && risks.every(risk => !!risk.category.trim()) ? 'categories entered' : '', true),
    answer(risks.length && risks.every(risk => !!risk.exposure) ? 'exposure rated' : '', true),
    answer(risks.length && risks.every(risk => !!risk.impact) ? 'impact rated' : '', true),
    answer(risks.length && risks.every(risk => !!risk.plannedControl.trim()) ? 'controls planned' : '', true),
    answer(project.exitRedesignExpansion?.stopConditions, true),
    answer(project.exitRedesignExpansion?.redesignConditions),
    answer(project.exitRedesignExpansion?.expansionConditions),
  ];
}

function getSystemChecks(project: FarmProject): AnswerCheck[][] {
  const { farmDetails, productionPlan, marketPlan, financialModel } = project;
  const metrics = calculateFinancialMetrics(project);
  const records = project.recordKeepingPlan || { method: '', reviewFrequency: '' };

  return [
    // Market
    [
      answer(marketPlan.targetCustomer, true),
      answer(marketPlan.buyerType, true),
      answer(marketPlan.customerValidationStatus, true),
      answer(marketPlan.expectedSellingPrice, true),
      answer(marketPlan.expectedPurchaseVolumePerCycle, true),
      answerNonNegative(marketPlan.distanceToMarketKm),
      answer(marketPlan.salesMethod),
    ],
    // Production
    [
      answer(farmDetails.targetProduce, true),
      answer(farmDetails.primaryPurpose, true),
      answer(farmDetails.expectedStartDate, true),
      answer(productionPlan.productionMethod, true),
      answer(farmDetails.farmSize, true),
      answer(productionPlan.capacity, true),
      answer(productionPlan.expectedOutputPerCycle, true),
      answer(productionPlan.cyclesPerYear, true),
      answer(productionPlan.gestationMonths, true),
      answer(productionPlan.salesFrequencyMonths, true),
      answerNonNegative(productionPlan.expectedLossPercent),
    ],
    // Financial
    [
      answerNonNegative(financialModel.availableCapital, true),
      answerNonNegative(financialModel.maxAffordableLoss, true),
      answerNonNegative(financialModel.monthsUntilPositiveCashFlow, true),
      answer(metrics.totalStartupCapital, true),
      answer(metrics.annualOperatingExpenses, true),
      answer(marketPlan.expectedSellingPrice, true),
      answer(productionPlan.expectedOutputPerCycle, true),
    ],
    // People
    [
      answer(farmDetails.dailyManager, true),
      answer(farmDetails.farmingExperience, true),
      answer(farmDetails.managementResponsibilities, true),
    ],
    // Information
    [
      answer(records.method, true),
      answer(records.reviewFrequency, true),
      answer(records.independentVerifier, true),
      answer(records.verificationMethod, true),
    ],
    // Infrastructure
    [
      answer(farmDetails.locationState, true),
      answer(farmDetails.landStatus, true),
      answer(farmDetails.farmSize, true),
      answer(farmDetails.waterAvailability, true),
    ],
    // Risk-control
    riskChecks(project),
  ];
}

export function calculateAssessmentProgress(project: FarmProject): number {
  const checks = getSystemChecks(project).flat();
  if (!checks.length) return 0;
  return Math.round((checks.filter(check => check.answered).length / checks.length) * 100);
}

export function evaluateSevenSystems(project: FarmProject): SystemReadiness[] {
  const metrics = calculateFinancialMetrics(project);
  const { farmDetails, productionPlan, marketPlan, financialModel } = project;
  const checks = getSystemChecks(project);
  const highRisks = (project.risks || []).filter(risk => risk.overall === 'High');

  const systems = [
    evaluateSystem(
      'Market System', checks[0],
      marketPlan.targetCustomer ? `Targeting ${marketPlan.targetCustomer}; buyer validation is ${marketPlan.customerValidationStatus || 'not specified'}.` : 'Target customer is not specified.',
      'Buyer demand and price assumptions should be validated before production.',
      'Speak with prospective buyers and record expected volume, quality, price and purchase timing.',
    ),
    evaluateSystem(
      'Production System', checks[1],
      `${farmDetails.targetProduce || 'Produce not selected'}; expected output ${productionPlan.expectedOutputPerCycle || 0} ${productionPlan.outputUnit || 'units'} per cycle.`,
      'Production capacity and output assumptions need a realistic local basis.',
      'Confirm the production method, cycle count and output estimate with local technical guidance.',
    ),
    evaluateSystem(
      'Financial System', checks[2],
      `Estimated investment ${formatNaira(metrics.totalStartupCapital)}; available capital ${formatNaira(financialModel.availableCapital)}; projected annual operating result ${formatNaira(metrics.netProfit)}.`,
      metrics.fundingGap > 0 ? `${formatNaira(metrics.fundingGap)} of startup funding is not covered by entered capital.` : 'Check cost timing, contingency and funding assumptions.',
      metrics.fundingGap > 0 ? 'Confirm the source and terms for the remaining capital before committing funds.' : 'Review the annual cash-flow timing and test lower yield and price scenarios.',
    ),
    evaluateSystem(
      'People System', checks[3],
      `Daily manager: ${farmDetails.dailyManager || 'not selected'}; experience: ${farmDetails.farmingExperience || 'not specified'}; responsibilities: ${farmDetails.managementResponsibilities || 'not defined'}.`,
      'Daily accountability and relevant operational skills must be clear.',
      'Assign a responsible farm manager and define their duties, reporting and support needs.',
    ),
    evaluateSystem(
      'Information System', checks[4],
      `Records: ${project.recordKeepingPlan?.method || 'not selected'}; review: ${project.recordKeepingPlan?.reviewFrequency || 'not selected'}; verifier: ${project.recordKeepingPlan?.independentVerifier || 'not assigned'}.`,
      'Performance cannot be compared with the plan unless records are maintained and reviewed.',
      'Set up records for production, sales, costs, inventory and losses, with a regular review schedule.',
    ),
    evaluateSystem(
      'Infrastructure System', checks[5],
      `Land status: ${farmDetails.landStatus === 'owned' ? 'owned' : farmDetails.landStatus === 'lease_partner' ? 'leased or partnered' : 'purchase planned'}; water: ${farmDetails.waterAvailability || 'not specified'}.`,
      farmDetails.landStatus === 'plan_to_buy' ? 'Land purchase is planned; compare alternatives and verify suitability before paying.' : 'Confirm essential site access, water and equipment arrangements.',
      farmDetails.landStatus === 'plan_to_buy' ? 'Compare purchase with leasing, partnership or a smaller pilot, and verify title and suitability.' : 'Confirm water access, storage, transport and equipment availability for the selected site.',
    ),
    evaluateSystem(
      'Risk-Control System', checks[6],
      `${project.risks?.length || 0} risks recorded; ${highRisks.length} are rated high.`,
      highRisks.length ? 'High-exposure risks need feasible controls and response plans.' : 'Review the main biological, weather, market, security and operational risks.',
      highRisks.length ? 'Confirm funded controls for high risks and define who will act if they occur.' : 'List the main farm risks and assign a practical mitigation and owner for each.',
    ),
  ];

  const applyScoreCeiling = (system: SystemReadiness, ceiling: number) => {
    if (system.status === 'Insufficient Information') return;
    system.percentage = Math.min(system.percentage, ceiling);
    system.status = system.percentage >= 75 ? 'Prepared' : system.percentage >= 45 ? 'Needs Attention' : 'Weak';
  };

  if (metrics.fundingGap > 0) {
    applyScoreCeiling(systems[2], 74);
    systems[2].gap = `${formatNaira(metrics.fundingGap)} of startup funding is not covered by entered capital.`;
  }
  if (marketPlan.customerValidationStatus === 'Assumed customer') applyScoreCeiling(systems[0], 74);
  if (metrics.netProfit <= 0 && checks[2].every(check => check.answered)) {
    applyScoreCeiling(systems[2], 44);
    systems[2].gap = 'Projected annual operating expenses equal or exceed expected annual revenue.';
    systems[2].nextAction = 'Review yield, sales price and cost assumptions, then compare conservative and expected scenarios.';
  }
  if (financialModel.monthsUntilPositiveCashFlow != null && financialModel.monthsUntilPositiveCashFlow < productionPlan.gestationMonths) {
    applyScoreCeiling(systems[2], 74);
    systems[2].gap = `The stated ${financialModel.monthsUntilPositiveCashFlow}-month cash-flow runway is shorter than the ${productionPlan.gestationMonths}-month production growth period.`;
    systems[2].nextAction = 'Confirm how the farm will cover operating costs until the first expected sale, and extend the available cash runway if needed.';
  }
  const projectedOperatingLoss = Math.max(0, -metrics.netProfit);
  if (financialModel.maxAffordableLoss != null && projectedOperatingLoss > financialModel.maxAffordableLoss) {
    applyScoreCeiling(systems[2], 74);
    systems[2].gap = `Projected annual operating loss of ${formatNaira(projectedOperatingLoss)} exceeds the stated affordable loss of ${formatNaira(financialModel.maxAffordableLoss)}.`;
    systems[2].nextAction = 'Revise the price, buyer volume, yield and cost assumptions, then compare a downside case with your stated loss limit.';
  }
  if (productionPlan.expectedLossPercent > 15) applyScoreCeiling(systems[1], 74);
  if (highRisks.length >= 2) applyScoreCeiling(systems[6], 74);
  if (farmDetails.landStatus === 'plan_to_buy') applyScoreCeiling(systems[5], 74);

  // Land purchase can dominate the project budget even when other infrastructure answers are complete.
  const landShare = farmDetails.landStatus !== 'lease_partner' && metrics.totalStartupCapital > 0 ? (financialModel.landRentPurchase / metrics.totalStartupCapital) * 100 : 0;
  const infrastructure = systems[5];
  if (landShare > 40) {
    infrastructure.status = infrastructure.status === 'Insufficient Information' ? infrastructure.status : 'Needs Attention';
    infrastructure.gap = `Land cost is ${Math.round(landShare)}% of startup investment; compare leasing and partnership options.`;
    infrastructure.nextAction = 'Compare the total cost of buying with leasing, partnership or contract production before committing capital.';
  }

  return systems;
}
