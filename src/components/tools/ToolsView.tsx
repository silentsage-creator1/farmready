import React, { useEffect, useRef, useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { calculateFinancialMetrics, formatNaira, formatNumber } from '../../utils/calculations';
import { useCalculator } from '../../hooks/useCalculator';
import {
  Calculator,
  Search,
  Check,
  AlertTriangle,
  TrendingUp,
  Scale,
  CreditCard,
  Sprout,
  Wheat,
  Fish,
  Boxes,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => <div><p className="text-[11px] text-neutral-500">{label}</p><p className="font-mono font-bold text-neutral-900 text-lg">{value}</p></div>;

function restrictNumericEntry(event: React.KeyboardEvent<HTMLElement>) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== 'number') return;
  if (['e', 'E', '+'].includes(event.key) || (event.key === '-' && target.min !== '' && Number(target.min) >= 0)) event.preventDefault();
}

function restrictNegativePaste(event: React.ClipboardEvent<HTMLElement>) {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.type === 'number' && target.min !== '' && Number(target.min) >= 0 && event.clipboardData.getData('text').includes('-')) event.preventDefault();
}

const profitCostFields = [
  { group: 'Production Costs', key: 'seeds', label: 'Seeds (₦)', financialKey: 'seedCost' },
  { group: 'Production Costs', key: 'seedlings', label: 'Seedlings (₦)', financialKey: 'seedlingsCost' },
  { group: 'Production Costs', key: 'fertilizerManure', label: 'Fertilizer / Manure (₦)', financialKey: 'fertilizerCost' },
  { group: 'Production Costs', key: 'pesticides', label: 'Pesticides (₦)', financialKey: 'pesticidesCost' },
  { group: 'Production Costs', key: 'herbicides', label: 'Herbicides (₦)', financialKey: 'herbicidesCost' },
  { group: 'Production Costs', key: 'animalFeed', label: 'Animal Feed (₦)', financialKey: 'feedCost' },
  { group: 'Production Costs', key: 'medicine', label: 'Medicine (₦)', financialKey: 'medicineCost' },
  { group: 'Production Costs', key: 'vaccines', label: 'Vaccines (₦)', financialKey: 'vaccineCost' },
  { group: 'Production Costs', key: 'farmLabour', label: 'Farm Labour (₦)', financialKey: 'labourCost' },
  { group: 'Production Costs', key: 'waterIrrigation', label: 'Water / Irrigation (₦)', financialKey: 'waterCost' },
  { group: 'Production Costs', key: 'fuel', label: 'Fuel (₦)', financialKey: 'fuelCost' },
  { group: 'Production Costs', key: 'electricity', label: 'Electricity (₦)', financialKey: 'electricityCost' },
  { group: 'Harvest & Processing', key: 'harvesting', label: 'Harvesting Cost (₦)', financialKey: 'harvestingCost' },
  { group: 'Harvest & Processing', key: 'processing', label: 'Processing Cost (₦)', financialKey: 'processingCost' },
  { group: 'Harvest & Processing', key: 'packaging', label: 'Packaging Cost (₦)', financialKey: 'packagingStorageCost' },
  { group: 'Selling & Delivery', key: 'transportToMarket', label: 'Transport to Market (₦)', financialKey: 'transportCost' },
  { group: 'Selling & Delivery', key: 'marketFees', label: 'Market Fees (₦)', financialKey: 'marketFeesCost' },
  { group: 'Selling & Delivery', key: 'sellingAgentFees', label: 'Selling / Agent Fees (₦)', financialKey: 'sellingAgentFeesCost' },
  { group: 'Other', key: 'otherFarmCosts', label: 'Other Farm Costs (₦)', financialKey: 'miscellaneousCost' },
] as const;

const breakEvenProductionFields = [
  { key: 'seeds', label: 'Seeds (₦)', financialKey: 'seedCost', farmTypes: ['Crop Production', 'Greenhouse Farming', 'Irrigation Project', 'Farm Expansion'] },
  { key: 'seedlings', label: 'Seedlings (₦)', financialKey: 'seedlingsCost', farmTypes: ['Crop Production', 'Greenhouse Farming', 'Irrigation Project', 'Farm Expansion'] },
  { key: 'fertilizer', label: 'Fertilizer (₦)', financialKey: 'fertilizerCost', farmTypes: ['Crop Production', 'Greenhouse Farming', 'Irrigation Project', 'Farm Expansion'] },
  { key: 'manure', label: 'Manure (₦)', financialKey: 'manureCost', farmTypes: ['Crop Production', 'Greenhouse Farming', 'Irrigation Project', 'Farm Expansion'] },
  { key: 'pesticides', label: 'Pesticides (₦)', financialKey: 'pesticidesCost', farmTypes: ['Crop Production', 'Greenhouse Farming', 'Irrigation Project', 'Farm Expansion'] },
  { key: 'herbicides', label: 'Herbicides (₦)', financialKey: 'herbicidesCost', farmTypes: ['Crop Production', 'Greenhouse Farming', 'Irrigation Project', 'Farm Expansion'] },
  { key: 'animalFeed', label: 'Animal Feed (₦)', financialKey: 'feedCost', farmTypes: ['Livestock', 'Poultry'] },
  { key: 'fishFeed', label: 'Fish Feed (₦)', financialKey: 'fishFeedCost', farmTypes: ['Fish Farming'] },
  { key: 'medicine', label: 'Medicine (₦)', financialKey: 'medicineCost', farmTypes: ['Livestock', 'Poultry', 'Fish Farming'] },
  { key: 'vaccines', label: 'Vaccines (₦)', financialKey: 'vaccineCost', farmTypes: ['Livestock', 'Poultry', 'Fish Farming'] },
  { key: 'farmLabour', label: 'Farm Labour (₦)', financialKey: 'labourCost', farmTypes: null },
  { key: 'water', label: 'Water (₦)', financialKey: 'waterCost', farmTypes: null },
  { key: 'irrigation', label: 'Irrigation (₦)', financialKey: 'irrigationCost', farmTypes: ['Crop Production', 'Greenhouse Farming', 'Irrigation Project', 'Farm Expansion'] },
  { key: 'fuel', label: 'Fuel (₦)', financialKey: 'fuelCost', farmTypes: null },
  { key: 'electricity', label: 'Electricity (₦)', financialKey: 'electricityCost', farmTypes: null },
] as const;

const breakEvenFarmCostFields = [
  { key: 'landRent', label: 'Land Rent / Lease (₦)', financialKey: 'landRentLeaseCost', capital: false },
  { key: 'farmBuilding', label: 'Farm Building (₦)', financialKey: 'infrastructureSetup', capital: true },
  { key: 'animalPen', label: 'Animal Pen / House (₦)', financialKey: 'animalPenCost', capital: true, animalsOnly: true },
  { key: 'storageShed', label: 'Storage / Farm Shed (₦)', financialKey: 'storageShedCost', capital: true },
  { key: 'equipment', label: 'Equipment & Machines (₦)', financialKey: 'equipmentMachinery', capital: true },
  { key: 'repairs', label: 'Equipment Repairs & Maintenance (₦)', financialKey: 'maintenanceCost', capital: false },
  { key: 'security', label: 'Security (₦)', financialKey: 'securityCost', capital: false },
  { key: 'insurance', label: 'Insurance (₦)', financialKey: 'insuranceContingencyCost', capital: false },
  { key: 'transport', label: 'Transport (₦)', financialKey: 'transportCost', capital: false },
  { key: 'marketFees', label: 'Market Fees (₦)', financialKey: 'marketFeesCost', capital: false },
  { key: 'otherFarmCosts', label: 'Other Farm Costs (₦)', financialKey: 'miscellaneousCost', capital: false },
] as const;

export const ToolsView: React.FC = () => {
  const { currentProject, updateCurrentProject, setActiveView } = useFarmProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const lastProjectUpdateAccepted = useRef<boolean | null>(null);

  // Tool 1: Farm Budget State
  const [budgetLandPurchase, setBudgetLandPurchase] = useState(currentProject.financialModel.landPurchaseCost);
  const [budgetLandRent, setBudgetLandRent] = useState(currentProject.financialModel.landRentLeaseCost);
  const [budgetLandPrep, setBudgetLandPrep] = useState(currentProject.financialModel.landPreparation);
  const [budgetInfrastructure, setBudgetInfrastructure] = useState(currentProject.financialModel.infrastructureSetup);
  const [budgetWorkingCapital, setBudgetWorkingCapital] = useState(currentProject.financialModel.initialWorkingCapital);
  const [budgetStartupSeeds, setBudgetStartupSeeds] = useState(currentProject.financialModel.startupSeedsCost);
  const [budgetStartupSeedlings, setBudgetStartupSeedlings] = useState(currentProject.financialModel.startupSeedlingsCost);
  const [budgetStartupAnimals, setBudgetStartupAnimals] = useState(currentProject.financialModel.startupAnimalsCost);
  const [budgetStartupFingerlings, setBudgetStartupFingerlings] = useState(currentProject.financialModel.startupFingerlingsCost);
  const [budgetInitialLabour, setBudgetInitialLabour] = useState(currentProject.financialModel.initialLabour);
  const [budgetLabour, setBudgetLabour] = useState(currentProject.financialModel.labourCost);
  const [budgetEquipment, setBudgetEquipment] = useState(currentProject.financialModel.equipmentMachinery);
  const [budgetSeeds, setBudgetSeeds] = useState(currentProject.financialModel.seedCost);
  const [budgetFertilizer, setBudgetFertilizer] = useState(currentProject.financialModel.fertilizerCost);
  const [budgetFeed, setBudgetFeed] = useState(currentProject.financialModel.feedCost);
  const [budgetFuel, setBudgetFuel] = useState(currentProject.financialModel.fuelCost);
  const [budgetTransport, setBudgetTransport] = useState(currentProject.financialModel.transportCost);
  const [budgetElectricity, setBudgetElectricity] = useState(currentProject.financialModel.electricityCost);
  const [budgetWater, setBudgetWater] = useState(currentProject.financialModel.waterCost);
  const [budgetMiscellaneous, setBudgetMiscellaneous] = useState(currentProject.financialModel.miscellaneousCost);
  const [budgetCapital, setBudgetCapital] = useState(currentProject.financialModel.availableCapital);
  const [budgetContingency, setBudgetContingency] = useState(10);

  // Tool 2: Profit Calculator State
  const [profitQty, setProfitQty] = useState(currentProject.productionPlan.expectedOutputPerCycle);
  const [profitPrice, setProfitPrice] = useState(currentProject.marketPlan.expectedSellingPrice);
  const [profitCostBreakdown, setProfitCostBreakdown] = useState<Record<string, number>>(() => {
    const cycles = Math.max(1, currentProject.productionPlan.cyclesPerYear || 1);
    return Object.fromEntries(profitCostFields.map(field => [field.key, currentProject.financialModel[field.financialKey] / cycles]));
  });

  // Tool 3: Break-Even Calculator State
  const [bePrice, setBePrice] = useState(currentProject.marketPlan.expectedSellingPrice);
  const [bePeriodMonths, setBePeriodMonths] = useState<1 | 3 | 6 | 12>(() => [1, 3, 6, 12].includes(currentProject.productionPlan.salesFrequencyMonths as 1 | 3 | 6 | 12) ? currentProject.productionPlan.salesFrequencyMonths as 1 | 3 | 6 | 12 : 12);
  const [beCapacity, setBeCapacity] = useState(currentProject.productionPlan.expectedOutputPerCycle);
  const [beCostBreakdown, setBeCostBreakdown] = useState<Record<string, number>>({});

  // Tool 4: Loan Calculator State
  const [loanPrincipal, setLoanPrincipal] = useState(currentProject.financialModel.financing.loanAmount);
  const [loanRate, setLoanRate] = useState(currentProject.financialModel.financing.interestRatePercent);
  const [loanDuration, setLoanDuration] = useState(currentProject.financialModel.financing.durationMonths);
  const [loanFreq, setLoanFreq] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [loanGrace, setLoanGrace] = useState(currentProject.financialModel.financing.gracePeriodMonths);
  const [loanGraceTreatment, setLoanGraceTreatment] = useState<'pay' | 'capitalize' | 'defer'>('pay');

  // Tool 5: Crop Calculator State
  const [cropArea, setCropArea] = useState(currentProject.farmDetails.farmSize);
  const [cropType, setCropType] = useState(currentProject.productionPlan.product || '');
  const [cropYieldPerHa, setCropYieldPerHa] = useState(0);
  const [cropSeedRateKg, setCropSeedRateKg] = useState(0);

  // Tool 6: Fertilizer Calculator State
  const [fertArea, setFertArea] = useState(currentProject.farmDetails.farmSize);
  const [fertCropType, setFertCropType] = useState(currentProject.productionPlan.product || '');
  const [fertilizerType, setFertilizerType] = useState('');
  const [fertRateKgHa, setFertRateKgHa] = useState(0);
  const [fertPriceBag, setFertPriceBag] = useState(0);
  const [fertApplications, setFertApplications] = useState(0);
  const [fertBagKg, setFertBagKg] = useState(0);

  // Tool 7: Livestock Feed Calculator State
  const [livestockType, setLivestockType] = useState(currentProject.productionPlan.product || '');
  const [feedArea, setFeedArea] = useState(currentProject.farmDetails.farmSize);
  const [stockingRatePerHa, setStockingRatePerHa] = useState(0);
  const [animalDays, setAnimalDays] = useState(0);
  const [dailyFeedKg, setDailyFeedKg] = useState(0);
  const [feedPricePerBag, setFeedPricePerBag] = useState(0);
  const [feedBagKg, setFeedBagKg] = useState(0);
  const [feedMortalityPercent] = useState(0);

  // Tool 8: Fish Farming Calculator State
  const [fishStocked, setFishStocked] = useState(currentProject.productionPlan.capacity);
  const [fishSurvivalRate, setFishSurvivalRate] = useState(0);
  const [fishHarvestKg, setFishHarvestKg] = useState(0);
  const [fishPricePerKg, setFishPricePerKg] = useState(currentProject.marketPlan.expectedSellingPrice);
  const [fishFcr, setFishFcr] = useState(0);
  const [fishFeedPricePerKg, setFishFeedPricePerKg] = useState(0);
  const [fishCosts, setFishCosts] = useState({ fingerlingCosts: 0, labourCosts: 0, medicationCosts: 0, electricityCosts: 0, waterCosts: 0, transportCosts: 0, otherCosts: 0 });
  const [roiCashflows, setRoiCashflows] = useState<string[]>([]);
  const [roiPeriod, setRoiPeriod] = useState<'year' | 'season'>('year');
  const [scenarioPrice, setScenarioPrice] = useState(currentProject.whatIf.priceDeltaPercent);
  const [scenarioYield, setScenarioYield] = useState(currentProject.whatIf.yieldDeltaPercent);
  const [scenarioCostChange, setScenarioCostChange] = useState(currentProject.whatIf.inputCostDeltaPercent);
  const riskCategories = ['Market', 'Production', 'Financial', 'Climate', 'Operational', 'Supply Chain'];
  const defaultRiskWeights = [20, 20, 20, 15, 15, 10];
  const [riskScores, setRiskScores] = useState([0, 0, 0, 0, 0, 0]);
  const [riskWeights, setRiskWeights] = useState(defaultRiskWeights);

  useEffect(() => {
    const fin = currentProject.financialModel;
    const prod = currentProject.productionPlan;
    const market = currentProject.marketPlan;
    const area = currentProject.farmDetails.farmSize;
    setBudgetLandPurchase(fin.landPurchaseCost); setBudgetLandRent(fin.landRentLeaseCost); setBudgetLandPrep(fin.landPreparation); setBudgetInfrastructure(fin.infrastructureSetup);
    setBudgetWorkingCapital(fin.initialWorkingCapital); setBudgetLabour(fin.labourCost);
    setBudgetStartupSeeds(fin.startupSeedsCost); setBudgetStartupSeedlings(fin.startupSeedlingsCost); setBudgetStartupAnimals(fin.startupAnimalsCost); setBudgetStartupFingerlings(fin.startupFingerlingsCost); setBudgetInitialLabour(fin.initialLabour);
    setBudgetEquipment(fin.equipmentMachinery); setBudgetSeeds(fin.seedCost); setBudgetFertilizer(fin.fertilizerCost); setBudgetFeed(fin.feedCost);
    setBudgetFuel(fin.fuelCost); setBudgetTransport(fin.transportCost); setBudgetElectricity(fin.electricityCost); setBudgetWater(fin.waterCost);
    setBudgetMiscellaneous(fin.miscellaneousCost); setBudgetCapital(fin.availableCapital);
    setProfitQty(prod.expectedOutputPerCycle); setProfitPrice(market.expectedSellingPrice);
    const cycles = Math.max(1, prod.cyclesPerYear || 1);
    setProfitCostBreakdown(Object.fromEntries(profitCostFields.map(field => [field.key, fin[field.financialKey] / cycles])));
    setBePrice(market.expectedSellingPrice);
    setBeCapacity(prod.expectedOutputPerCycle);
    const periodMonths: 1 | 3 | 6 | 12 = [1, 3, 6, 12].includes(prod.salesFrequencyMonths as 1 | 3 | 6 | 12) ? prod.salesFrequencyMonths as 1 | 3 | 6 | 12 : 12;
    setBePeriodMonths(periodMonths);
    const periodScale = periodMonths / 12;
    setBeCostBreakdown(Object.fromEntries([
      ...breakEvenProductionFields.map(field => [field.key, fin[field.financialKey] * periodScale]),
      ...breakEvenFarmCostFields.map(field => [field.key, fin[field.financialKey] * (field.capital ? 1 : periodScale)]),
    ]));
    setLoanPrincipal(fin.financing.loanAmount); setLoanRate(fin.financing.interestRatePercent);
    setLoanDuration(fin.financing.durationMonths); setLoanGrace(fin.financing.gracePeriodMonths);
    setCropArea(area); setCropType(prod.product || ''); setCropYieldPerHa(0); setCropSeedRateKg(0);
    setFertArea(area); setFertCropType(prod.product || ''); setFertilizerType(''); setFertRateKgHa(0); setFertApplications(0); setFertBagKg(0); setFertPriceBag(0);
    setFeedArea(area); setLivestockType(prod.product || ''); setStockingRatePerHa(0); setAnimalDays(0); setDailyFeedKg(0); setFeedBagKg(0); setFeedPricePerBag(0);
    setFishStocked(prod.capacity); setFishPricePerKg(market.expectedSellingPrice);
    setRoiCashflows(((currentProject.toolAnalysis?.roi?.cumulativeCashFlows as { netCashFlow?: number }[] | undefined) ?? []).map(item => String(item.netCashFlow ?? 0)));
    setScenarioPrice(currentProject.whatIf.priceDeltaPercent); setScenarioYield(currentProject.whatIf.yieldDeltaPercent);
    setScenarioCostChange(currentProject.whatIf.inputCostDeltaPercent);
    const savedFactors = currentProject.toolAnalysis?.risk?.factors as { name: string; score: number; weight: number }[] | undefined;
    if (savedFactors?.length) {
      const byName = new Map(savedFactors.map(factor => [factor.name, factor]));
      setRiskScores(riskCategories.map(name => byName.get(name)?.score ?? 0));
      setRiskWeights(riskCategories.map((name, index) => byName.get(name)?.weight ?? defaultRiskWeights[index]));
    } else { setRiskScores([0, 0, 0, 0, 0, 0]); setRiskWeights(defaultRiskWeights); }
    setSelectedTool(null);
    setAppliedNotice(null);
  }, [currentProject.id]);

  // These fields now hold only previously saved, unallocated amounts. Once the
  // budget is applied, they remain separate from the newly itemized categories.
  const legacyInputRemainder = Math.max(0, currentProject.financialModel.inputsCost);
  const legacyUtilitiesRemainder = Math.max(0, currentProject.financialModel.utilitiesCost);
  const budgetCalc = useCalculator('budget', { capexItems: [{ amount: budgetLandPurchase }, { amount: budgetLandPrep }, { amount: budgetEquipment }, { amount: budgetInfrastructure }, { amount: currentProject.financialModel.animalPenCost }, { amount: currentProject.financialModel.storageShedCost }, { amount: budgetStartupSeeds }, { amount: budgetStartupSeedlings }, { amount: budgetStartupAnimals }, { amount: budgetStartupFingerlings }, { amount: budgetInitialLabour }], opexItems: [{ amount: budgetLandRent }, { amount: budgetSeeds }, { amount: budgetFertilizer }, { amount: budgetFeed }, { amount: legacyInputRemainder }, { amount: budgetLabour }, { amount: budgetFuel }, { amount: budgetTransport }, { amount: budgetElectricity }, { amount: budgetWater }, { amount: legacyUtilitiesRemainder }, { amount: budgetMiscellaneous }, ...[currentProject.financialModel.manureCost, currentProject.financialModel.fishFeedCost, currentProject.financialModel.irrigationCost, currentProject.financialModel.pesticidesCost, currentProject.financialModel.herbicidesCost, currentProject.financialModel.medicineCost, currentProject.financialModel.vaccineCost, currentProject.financialModel.harvestingCost, currentProject.financialModel.processingCost, currentProject.financialModel.marketFeesCost, currentProject.financialModel.sellingAgentFeesCost, currentProject.financialModel.maintenanceCost, currentProject.financialModel.securityCost, currentProject.financialModel.insuranceContingencyCost].map(amount => ({ amount }))], initialWorkingCapital: budgetWorkingCapital, contingencyPercent: budgetContingency, availableCapital: budgetCapital });
  const profitCalc = useCalculator('profit', { quantity: profitQty, price: profitPrice, costs: profitCostBreakdown });
  const isAnimalFarm = currentProject.farmType === 'Livestock' || currentProject.farmType === 'Poultry';
  const visibleBreakEvenProductionFields = breakEvenProductionFields.filter(field => field.farmTypes === null || field.farmTypes.some(type => type === currentProject.farmType));
  const visibleBreakEvenFarmCostFields = breakEvenFarmCostFields.filter(field => !('animalsOnly' in field) || !field.animalsOnly || isAnimalFarm);
  const breakEvenProductionCosts = Object.fromEntries(visibleBreakEvenProductionFields.map(field => [field.key, beCostBreakdown[field.key] ?? 0]));
  const breakEvenFarmCosts = Object.fromEntries(visibleBreakEvenFarmCostFields.map(field => [field.key, beCostBreakdown[field.key] ?? 0]));
  const breakEvenCalc = useCalculator('breakeven', { price: bePrice, capacity: beCapacity, periodMonths: bePeriodMonths, productionCosts: breakEvenProductionCosts, farmCosts: breakEvenFarmCosts });
  const frequencyFactor = loanFreq === 'quarterly' ? 3 : loanFreq === 'annual' ? 12 : 1;
  const loanCalc = useCalculator('loan', { principal: loanPrincipal, annualRate: loanRate, durationPeriods: Math.ceil(loanDuration / frequencyFactor), gracePeriods: Math.floor(loanGrace / frequencyFactor), frequency: loanFreq, graceTreatment: loanGraceTreatment });
  const cropCalc = useCalculator('crop', { cropType, area: cropArea, yieldKgHa: cropYieldPerHa, seedRateKgHa: cropSeedRateKg });
  const fertilizerCalc = useCalculator('fertilizer', { cropType: fertCropType, fertilizerType, area: fertArea, rateKgHa: fertRateKgHa, applications: fertApplications, bagSizeKg: fertBagKg, pricePerBag: fertPriceBag });
  const feedCalc = useCalculator('feed', { livestockType, areaHectares: feedArea, stockingRatePerHa, days: animalDays, dailyFeedKg, bagSizeKg: feedBagKg, pricePerBag: feedPricePerBag, mortalityPercent: feedMortalityPercent });
  const cropInputsReady = cropType.trim().length > 0 && cropArea > 0 && cropYieldPerHa > 0 && cropSeedRateKg > 0;
  const fertilizerInputsReady = fertCropType.trim().length > 0 && fertilizerType.trim().length > 0 && fertArea > 0 && fertRateKgHa > 0 && fertBagKg > 0 && fertApplications > 0;
  const feedInputsReady = livestockType.trim().length > 0 && feedArea > 0 && stockingRatePerHa > 0 && animalDays > 0 && dailyFeedKg > 0 && feedBagKg > 0 && feedPricePerBag > 0;
  const fishCalc = useCalculator('fish', { stocked: fishStocked, survivalPercent: fishSurvivalRate, harvestWeightKg: fishHarvestKg, pricePerKg: fishPricePerKg, fcr: fishFcr, feedPricePerKg: fishFeedPricePerKg, ...fishCosts });
  const projectMetrics = calculateFinancialMetrics(currentProject);
  const calculatorProject = { financialModel: currentProject.financialModel, productionPlan: currentProject.productionPlan, marketPlan: currentProject.marketPlan, farmDetails: currentProject.farmDetails };
  const roiCalc = useCalculator('roi', { project: calculatorProject, periodicCashFlows: roiCashflows.map(value => value.trim()).filter(Boolean).map(Number).filter(Number.isFinite), periodLabel: roiPeriod });
  const scenarioCalc = useCalculator('whatif', { project: calculatorProject, revenue: projectMetrics.expectedRevenue, costs: projectMetrics.annualOperatingExpenses, investment: projectMetrics.totalStartupCapital, priceChangePercent: scenarioPrice, yieldChangePercent: scenarioYield, costChangePercent: scenarioCostChange, quantity: projectMetrics.marketableAnnualQuantity, price: currentProject.marketPlan.expectedSellingPrice, variableCostPerUnit: 0, fixedCosts: projectMetrics.annualOperatingExpenses });
  const riskCalc = useCalculator('risk', { factors: riskCategories.map((name, index) => ({ name, score: riskScores[index], weight: riskWeights[index] })) });
  const value = (result: Record<string, unknown> | null, key: string) => Number(result?.[key] ?? 0);

  const updateToolProject = (updates: Parameters<typeof updateCurrentProject>[0]) => {
    lastProjectUpdateAccepted.current = updateCurrentProject(updates);
  };

  const showApplied = (msg: string) => {
    const editedInputs = Array.from(document.querySelectorAll<HTMLInputElement>('.farmready-selected-tool input[type="number"][data-user-edited="true"]'));
    const hasEnteredValues = editedInputs.some(input => input.value.trim() !== '');
    const updateAccepted = lastProjectUpdateAccepted.current;
    lastProjectUpdateAccepted.current = null;
    if (!hasEnteredValues) return;
    if (!updateAccepted) {
      setAppliedNotice({ type: 'error', message: 'This result was not saved. Check the workspace message above for the reason.' });
      return;
    }
    setAppliedNotice({ type: 'success', message: `${msg} Saved in this project workspace. Account sync runs automatically; any sync issue will appear above.` });
  };

  const toolsList = [
    {
      id: 'budget',
      name: 'Farm Budget Builder',
      category: 'Financial',
      icon: Calculator,
      description: 'Categorize capital expenditure and monthly operational expenses with running totals.',
    },
    {
      id: 'profit',
      name: 'Profit & Margin Calculator',
      category: 'Financial',
      icon: TrendingUp,
      description: 'Calculate expected revenue, gross profit, net profit, and profit margin per unit.',
    },
    {
      id: 'breakeven',
      name: 'Break-Even Calculator',
      category: 'Financial',
      icon: Scale,
      description: 'Determine minimum sales volume and capacity utilization needed to clear fixed costs.',
    },
    {
      id: 'loan',
      name: 'Agricultural Loan Calculator',
      category: 'Financial',
      icon: CreditCard,
      description: 'Model periodic loan repayments, grace periods, and interest costs for farm credit.',
    },
    {
      id: 'crop',
      name: 'Crop Yield & Seed Calculator',
      category: 'Production',
      icon: Wheat,
      description: 'Estimate total harvest yield and certified seed requirements based on farm area.',
    },
    {
      id: 'fertilizer',
      name: 'Fertilizer & Bag Calculator',
      category: 'Production',
      icon: Sprout,
      description: 'Calculate basal and top-dressing fertilizer bag requirements and estimated purchase cost.',
    },
    {
      id: 'feed',
      name: 'Livestock Feed Calculator',
      category: 'Production',
      icon: Calculator,
      description: 'Model daily feed intake, total bags required over cycle, and feed cost for birds or cattle.',
    },
    {
      id: 'fish',
      name: 'Fish Farming Economics',
      category: 'Production',
      icon: Fish,
      description: 'Calculate catfish/tilapia survival, harvest biomass, revenue, and feed conversion costs.',
    },
    {
      id: 'inventory',
      name: 'Farm Inventory Manager',
      category: 'Management',
      icon: Boxes,
      description: 'Track seed bags, fertilizers, chemicals, and equipment stock levels on site.',
    },
    { id: 'roi', name: 'Farm ROI & Payback', category: 'Financial', icon: TrendingUp, description: 'Review investment return and estimated payback from entered projections.' },
    { id: 'whatif', name: 'What-If Simulator', category: 'Planning', icon: Sparkles, description: 'Explore how price, yield, and cost changes affect projected farm profit.' },
    { id: 'risk', name: 'Farm Risk Indicator', category: 'Risk', icon: Scale, description: 'Build a transparent weighted risk indicator from scored farm factors.'
    }
  ];

  const filteredTools = toolsList.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Practical Tools for Farm Planning
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Dedicated agricultural calculators grounded in Nigerian unit economics.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search farm tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* Tools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;

          return (
            <div
              key={tool.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                    {tool.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-neutral-900 text-base">{tool.name}</h3>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{tool.description}</p>
                </div>
              </div>

              <div className="pt-5">
                <button
                  onClick={() => {
                    if (tool.id === 'inventory') {
                      setActiveView('inventory');
                    } else {
                      setSelectedTool(tool.id);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <span>{tool.id === 'inventory' ? 'Open Inventory' : isSelected ? 'Tool Active' : 'Open Calculator'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Tool Interactive Card */}
      {selectedTool && (
        <div className="farmready-selected-tool bg-white rounded-3xl border border-neutral-200 shadow-md p-6 sm:p-8 space-y-6" onKeyDown={restrictNumericEntry} onPaste={restrictNegativePaste} onChange={(event) => {
          setAppliedNotice(null);
          const target = event.target;
          if (target instanceof HTMLInputElement && target.type === 'number') target.dataset.userEdited = 'true';
        }}>
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <div>
              <h3 className="text-xl font-bold text-neutral-900">
                {toolsList.find(t => t.id === selectedTool)?.name}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Adjust parameters and apply calculated values directly to your current project.
              </p>
            </div>
            <button
              onClick={() => setSelectedTool(null)}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
            >
              Close
            </button>
          </div>

          {appliedNotice && (
            <div role={appliedNotice.type === 'error' ? 'alert' : 'status'} aria-live={appliedNotice.type === 'error' ? 'assertive' : 'polite'} className={`flex items-start gap-2 rounded-xl border p-3.5 text-sm font-medium ${appliedNotice.type === 'error' ? 'border-red-200 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
              {appliedNotice.type === 'error' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{appliedNotice.message}{appliedNotice.type === 'success' ? ' This message stays visible until you change an input or save another calculation.' : ''}</span>
            </div>
          )}

          {/* 1. Farm Budget Builder */}
          {selectedTool === 'budget' && (
            <div className="space-y-6">
              {(legacyInputRemainder > 0 || legacyUtilitiesRemainder > 0) && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Previously saved combined costs remain included until you allocate them to the specific fields below. Unallocated input costs: {formatNaira(legacyInputRemainder)}. Unallocated electricity and water costs: {formatNaira(legacyUtilitiesRemainder)}.</p>}

              <section className="space-y-3">
                <h4 className="text-sm font-bold text-neutral-900">Startup & setup costs</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {[
                    ['Land Purchase (₦)', budgetLandPurchase, setBudgetLandPurchase],
                    ['Land Rent / Lease (₦)', budgetLandRent, setBudgetLandRent],
                    ['Land Clearing & Preparation (₦)', budgetLandPrep, setBudgetLandPrep],
                    ['Farm Building / Structure (₦)', budgetInfrastructure, setBudgetInfrastructure],
                    ['Seeds (₦)', budgetStartupSeeds, setBudgetStartupSeeds],
                    ['Seedlings (₦)', budgetStartupSeedlings, setBudgetStartupSeedlings],
                    ['Animals to Start With (₦)', budgetStartupAnimals, setBudgetStartupAnimals],
                    ['Fish / Fingerlings to Start With (₦)', budgetStartupFingerlings, setBudgetStartupFingerlings],
                    ['Farm Setup Labour (₦)', budgetInitialLabour, setBudgetInitialLabour],
                    ['Farm Tools & Equipment (₦)', budgetEquipment, setBudgetEquipment],
                    ['Money Kept for Running the Farm (₦)', budgetWorkingCapital, setBudgetWorkingCapital],
                  ].map(([label, amount, setAmount]) => (
                    <label key={String(label)} className="block font-semibold text-neutral-700">
                      <span className="mb-1 block">{String(label)}</span>
                      <input type="number" placeholder="Enter value" min="0" value={Number(amount) || ''} onChange={e => (setAmount as (value: number) => void)(Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" />
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-bold text-neutral-900">Operating costs</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {[
                    ['Seeds (₦)', budgetSeeds, setBudgetSeeds],
                    ['Fertilizer (₦)', budgetFertilizer, setBudgetFertilizer],
                    ['Feed (₦)', budgetFeed, setBudgetFeed],
                    ["Farm Workers' Pay (₦)", budgetLabour, setBudgetLabour],
                    ['Fuel (₦)', budgetFuel, setBudgetFuel],
                    ['Transport (₦)', budgetTransport, setBudgetTransport],
                    ['Electricity (₦)', budgetElectricity, setBudgetElectricity],
                    ['Water (₦)', budgetWater, setBudgetWater],
                    ['Other Farm Costs (₦)', budgetMiscellaneous, setBudgetMiscellaneous],
                  ].map(([label, amount, setAmount]) => (
                    <label key={String(label)} className="block font-semibold text-neutral-700">
                      <span className="mb-1 block">{String(label)}</span>
                      <input type="number" placeholder="Enter value" min="0" value={Number(amount) || ''} onChange={e => (setAmount as (value: number) => void)(Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" />
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-bold text-neutral-900">Funding & contingency</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <label className="block font-semibold text-neutral-700"><span className="mb-1 block">Money Available to Invest (₦)</span><input type="number" placeholder="Enter value" min="0" value={budgetCapital || ''} onChange={e => setBudgetCapital(Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" /></label>
                  <label className="block font-semibold text-neutral-700"><span className="mb-1 block">Extra Money for Unexpected Costs (%)</span><input type="number" placeholder="Enter value" min="0" max="100" step="any" value={budgetContingency || ''} onChange={e => setBudgetContingency(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" /></label>
                </div>
              </section>

              {/* Calculated Total */}
              <div className="p-4 bg-neutral-50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-neutral-500 font-medium">Total Estimated Budget</span>
                  <p className="text-2xl font-bold font-mono text-emerald-800">
                    {budgetCalc.loading ? 'Calculating…' : budgetCalc.error ? 'Calculation unavailable' : formatNaira(value(budgetCalc.result, 'totalRequired'))}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">{budgetCalc.error ? budgetCalc.error : <>Funding gap: {formatNaira(value(budgetCalc.result, 'fundingGap'))} · Surplus: {formatNaira(value(budgetCalc.result, 'surplus'))}</>}</p>
                </div>

                <button
                  onClick={() => {
                    updateToolProject({
                      financialModel: {
                        ...currentProject.financialModel,
                        landRentPurchase: 0,
                        landPurchaseCost: budgetLandPurchase,
                        landRentLeaseCost: budgetLandRent,
                        landPreparation: budgetLandPrep,
                        inputsCost: legacyInputRemainder,
                        seedCost: budgetSeeds,
                        fertilizerCost: budgetFertilizer,
                        feedCost: budgetFeed,
                        labourCost: budgetLabour,
                        equipmentMachinery: budgetEquipment,
                        infrastructureSetup: budgetInfrastructure,
                        initialWorkingCapital: budgetWorkingCapital,
                        initialInputs: 0,
                        startupSeedsCost: budgetStartupSeeds,
                        startupSeedlingsCost: budgetStartupSeedlings,
                        startupAnimalsCost: budgetStartupAnimals,
                        startupFingerlingsCost: budgetStartupFingerlings,
                        initialLabour: budgetInitialLabour,
                        otherStartupCosts: 0,
                        startupContingency: value(budgetCalc.result, 'contingency'),
                        fuelCost: budgetFuel,
                        transportCost: budgetTransport,
                        utilitiesCost: legacyUtilitiesRemainder,
                        electricityCost: budgetElectricity,
                        waterCost: budgetWater,
                        miscellaneousCost: budgetMiscellaneous,
                      }
                    });
                    showApplied('Farm budget values applied to current project financial model!');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  Apply to Project
                </button>
              </div>
            </div>
          )}

          {/* 2. Profit Calculator */}
          {selectedTool === 'profit' && (
            <div className="space-y-6">
              <p className="text-xs text-neutral-600">Enter the expected quantity sold and costs for one production cycle. Leave costs at ₦0 when they do not apply. The result updates as you edit.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Quantity Sold</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="any"
                    value={profitQty || ''}
                    onChange={(e) => setProfitQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Selling Price per Unit (₦)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="any"
                    value={profitPrice || ''}
                    onChange={(e) => setProfitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              </div>
              {(['Production Costs', 'Harvest & Processing', 'Selling & Delivery', 'Other'] as const).map(group => <section key={group} className="space-y-3"><h4 className="text-sm font-bold text-neutral-900">{group}</h4><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">{profitCostFields.filter(field => field.group === group).map(field => <label key={field.key} className="block font-semibold text-neutral-700">{field.label}<input type="number" placeholder="Enter value" min="0" step="any" value={profitCostBreakdown[field.key] || ''} onChange={event => setProfitCostBreakdown(current => ({ ...current, [field.key]: Math.max(0, Number(event.target.value) || 0) }))} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" /></label>)}</div></section>)}

              {/* Outcome */}
              {(() => {
                const rev = value(profitCalc.result, 'revenue');
                const exp = value(profitCalc.result, 'totalExpenses');
                const net = value(profitCalc.result, 'netProfit');
                const margin = value(profitCalc.result, 'netMargin');
                return (
                  <div className="p-4 bg-neutral-50 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-[11px] text-neutral-500">Expected Revenue</p>
                      <p className="font-mono font-bold text-neutral-900 text-lg">{formatNaira(rev)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Total Expenses</p>
                      <p className="font-mono font-bold text-neutral-900 text-lg">{formatNaira(exp)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Gross Profit</p>
                      <p className="font-mono font-bold text-neutral-900 text-lg">{formatNaira(value(profitCalc.result, 'grossProfit'))}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Net Profit</p>
                      <p className={`font-mono font-bold text-lg ${net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatNaira(net)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Profit Margin</p>
                      <p className="font-mono font-bold text-neutral-900 text-lg">{formatNumber(margin, 1)}%</p>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    updateToolProject({
                      marketPlan: {
                        ...currentProject.marketPlan,
                        expectedSellingPrice: profitPrice,
                        expectedPurchaseVolumePerCycle: profitQty,
                      },
                      productionPlan: {
                        ...currentProject.productionPlan,
                        expectedOutputPerCycle: profitQty,
                      },
                      financialModel: {
                        ...currentProject.financialModel,
                        ...Object.fromEntries(profitCostFields.map(field => [field.financialKey, (profitCostBreakdown[field.key] ?? 0) * Math.max(1, currentProject.productionPlan.cyclesPerYear)])),
                      }
                    });
                    showApplied('Applied revenue & price assumptions to current project!');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Apply to Project
                </button>
              </div>
            </div>
          )}

          {/* 3. Break-Even Calculator */}
          {selectedTool === 'breakeven' && (
            <div className="space-y-6">
              <p className="text-xs leading-relaxed text-neutral-600">Enter production and farm costs for the same period as your production capacity. Farm-specific costs are shown based on the selected farm type.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <label className="block font-semibold text-neutral-700">Selling Price per Unit (₦)<input type="number" placeholder="Enter value" min="0" value={bePrice || ''} onChange={event => setBePrice(Number(event.target.value) || 0)} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" /></label>
                <label className="block font-semibold text-neutral-700">Maximum Quantity You Can Produce<input type="number" placeholder="Enter value" min="0" value={beCapacity || ''} onChange={event => setBeCapacity(Number(event.target.value) || 0)} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" /></label>
                <label className="block font-semibold text-neutral-700">Production Period<select value={bePeriodMonths} onChange={event => setBePeriodMonths(Number(event.target.value) as 1 | 3 | 6 | 12)} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300"><option value={1}>Per Month</option><option value={3}>Per 3 Months</option><option value={6}>Per 6 Months</option><option value={12}>Per Year</option></select></label>
              </div>
              <section className="space-y-3"><h4 className="text-sm font-bold text-neutral-900">Production Costs</h4><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">{visibleBreakEvenProductionFields.map(field => <label key={field.key} className="block font-semibold text-neutral-700">{field.label}<input type="number" placeholder="Enter value" min="0" value={beCostBreakdown[field.key] || ''} onChange={event => setBeCostBreakdown(current => ({ ...current, [field.key]: Math.max(0, Number(event.target.value) || 0) }))} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" /></label>)}</div></section>
              <section className="space-y-3"><h4 className="text-sm font-bold text-neutral-900">Farm Costs</h4><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">{visibleBreakEvenFarmCostFields.map(field => <label key={field.key} className="block font-semibold text-neutral-700">{field.label}<input type="number" placeholder="Enter value" min="0" value={beCostBreakdown[field.key] || ''} onChange={event => setBeCostBreakdown(current => ({ ...current, [field.key]: Math.max(0, Number(event.target.value) || 0) }))} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" /></label>)}</div></section>

              {(() => {
                const beResult = breakEvenCalc.result;
                const beQty = beResult?.units == null ? null : value(beResult, 'units');
                const beRev = beResult?.revenue == null ? null : value(beResult, 'revenue');
                const util = beResult?.capacityPercent == null ? null : value(beResult, 'capacityPercent');
                const reachable = beResult?.reachable === true;
                const hasCostInputs = beResult?.hasCostInputs === true;

                return (
                  <div className="space-y-4 p-4 bg-neutral-50 rounded-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[11px] text-neutral-500">Break-Even Quantity</p>
                      <p className="font-mono font-bold text-neutral-900 text-xl">{beQty == null ? 'Not reachable' : `${formatNumber(beQty)} ${currentProject.productionPlan.outputUnit}`}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Break-Even Revenue</p>
                      <p className="font-mono font-bold text-neutral-900 text-xl">{beRev == null ? 'Not available' : formatNaira(beRev)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Capacity Needed</p>
                      <p className="font-mono font-bold text-neutral-900 text-xl">{util == null ? 'Not available' : `${formatNumber(util, 0)}%`}</p>
                    </div>
                    </div>
                    <p className={`text-sm font-semibold ${reachable ? 'text-emerald-800' : 'text-amber-800'}`}>{beResult ? !hasCostInputs ? 'Enter at least one cost estimate to calculate a meaningful break-even point.' : reachable ? 'Expected production is above break-even for this period.' : 'Break-even is above the production capacity or costs exceed the selling price.' : 'Enter a selling price, production capacity and cost estimates to calculate break-even.'}</p>
                  </div>
                );
              })()}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    updateToolProject({
                      marketPlan: {
                        ...currentProject.marketPlan,
                        expectedSellingPrice: bePrice,
                        expectedPurchaseVolumePerCycle: beCapacity,
                      },
                      productionPlan: {
                        ...currentProject.productionPlan,
                        expectedOutputPerCycle: beCapacity,
                        salesFrequencyMonths: bePeriodMonths,
                        cyclesPerYear: 12 / bePeriodMonths,
                      },
                      financialModel: {
                        ...currentProject.financialModel,
                        ...Object.fromEntries([
                          ...visibleBreakEvenProductionFields.map(field => [field.financialKey, (beCostBreakdown[field.key] ?? 0) * 12 / bePeriodMonths]),
                          ...visibleBreakEvenFarmCostFields.map(field => [field.financialKey, (beCostBreakdown[field.key] ?? 0) * (field.capital ? 1 : 12 / bePeriodMonths)]),
                        ]),
                      }
                    });
                    showApplied('Applied break-even price parameters to project!');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Apply to Project
                </button>
              </div>
            </div>
          )}

          {/* 4. Loan Calculator */}
          {selectedTool === 'loan' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Loan Amount (₦)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="any"
                    value={loanPrincipal || ''}
                    onChange={(e) => setLoanPrincipal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="any"
                    value={loanRate || ''}
                    onChange={(e) => setLoanRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Duration (Months)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="1"
                    step="1"
                    value={loanDuration || ''}
                    onChange={(e) => setLoanDuration(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Frequency</label>
                  <select
                    value={loanFreq}
                    onChange={(e) => setLoanFreq(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Grace Period (Months)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="1"
                    value={loanGrace || ''}
                    onChange={(e) => setLoanGrace(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div><label className="block font-semibold text-neutral-700 mb-1">Grace Period Treatment</label><select value={loanGraceTreatment} onChange={(e) => setLoanGraceTreatment(e.target.value as 'pay' | 'capitalize' | 'defer')} className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"><option value="pay">Pay interest during grace</option><option value="capitalize">Capitalize interest</option><option value="defer">Defer principal and interest</option></select></div>
              </div>

              {(() => {
                const sched = loanCalc.result ?? {};
                return (
                  <div className="p-4 bg-neutral-50 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[11px] text-neutral-500">Periodic Repayment ({loanFreq})</p>
                      <p className="font-mono font-bold text-neutral-900 text-xl">{loanCalc.loading ? 'Calculating…' : formatNaira(value(sched, 'periodicPayment'))}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Total Interest Cost</p>
                      <p className="font-mono font-bold text-neutral-900 text-xl">{formatNaira(value(sched, 'totalInterest'))}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Total Repayment Amount</p>
                      <p className="font-mono font-bold text-emerald-800 text-xl">{formatNaira(value(sched, 'totalRepayment'))}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    updateToolProject({
                      financialModel: {
                        ...currentProject.financialModel,
                        financing: {
                          hasLoan: true,
                          loanAmount: loanPrincipal,
                          interestRatePercent: loanRate,
                          durationMonths: loanDuration,
                          repaymentFrequency: loanFreq,
                          gracePeriodMonths: loanGrace,
                        }
                      },
                      toolAnalysis: { ...currentProject.toolAnalysis, loan: loanCalc.result ?? {} }
                    });
                    showApplied('Loan schedule applied to project financing plan!');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Apply to Financing Plan
                </button>
              </div>
            </div>
          )}

          {/* 5. Crop Calculator */}
          {selectedTool === 'crop' && (
            <div className="space-y-6">
              <p className="text-sm text-neutral-600">Enter the crop, planted area, seed rate, and expected yield per hectare to estimate seed requirements and total harvest.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div><label className="block font-semibold text-neutral-700 mb-1">Crop Type</label><input required type="text" placeholder="Enter crop type" value={cropType} onChange={e => setCropType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-300" /></div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Farm Area (Hectares)</label>
                  <input
                    type="number" required placeholder="Enter farm area"
                    min="0"
                    step="any"
                    value={cropArea || ''}
                    onChange={(e) => setCropArea(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Expected Yield (kg / hectare)</label>
                  <input
                    type="number" required placeholder="Enter expected yield"
                    min="0"
                    step="any"
                    value={cropYieldPerHa || ''}
                    onChange={(e) => setCropYieldPerHa(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Seed Rate (Kg / Ha)</label>
                  <input
                    type="number" required placeholder="Enter seed rate"
                    min="0"
                    step="any"
                    value={cropSeedRateKg || ''}
                    onChange={(e) => setCropSeedRateKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              </div>

              {cropCalc.error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not calculate crop predictions: {cropCalc.error}</p> : cropInputsReady ? (() => {
                const seedPerHa = value(cropCalc.result, 'seedKgPerHa');
                const totalSeedKg = value(cropCalc.result, 'seedKg');
                const yieldPerHa = value(cropCalc.result, 'expectedYieldKgPerHa');
                const totalHarvestKg = value(cropCalc.result, 'expectedHarvestKg');
                const totalHarvestTonnes = value(cropCalc.result, 'expectedHarvestTonnes');

                return (
                  <div className="p-4 bg-neutral-50 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Metric label="Seed required per hectare" value={`${formatNumber(seedPerHa, 1)} kg`} />
                    <Metric label="Total seed required" value={`${formatNumber(totalSeedKg, 1)} kg`} />
                    <Metric label="Expected yield per hectare" value={`${formatNumber(yieldPerHa, 1)} kg`} />
                    <Metric label="Total expected harvest" value={`${formatNumber(totalHarvestKg, 1)} kg`} />
                    <Metric label="Expected harvest in tonnes" value={`${formatNumber(totalHarvestTonnes, 2)} tonnes`} />
                  </div>
                );
              })() : <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">Fill in the crop, farm area, seed rate, and expected yield to see predictions.</p>}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    updateToolProject({
                      farmDetails: { ...currentProject.farmDetails, farmSize: cropArea },
                      productionPlan: {
                        ...currentProject.productionPlan,
                        product: cropType,
                        capacity: value(cropCalc.result, 'expectedHarvestTonnes'),
                        capacityUnit: 'tonnes',
                        expectedOutputPerCycle: value(cropCalc.result, 'expectedHarvestTonnes'),
                        outputUnit: 'tonnes',
                      },
                      toolAnalysis: { ...currentProject.toolAnalysis, production: { ...currentProject.toolAnalysis?.production, crop: cropCalc.result ?? {} } }
                    });
                    showApplied('Crop output & seed parameters updated in project!');
                  }}
                  disabled={!cropInputsReady || cropCalc.loading || !!cropCalc.error}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Apply to Project
                </button>
              </div>
            </div>
          )}

          {/* 6. Fertilizer Calculator */}
          {selectedTool === 'fertilizer' && (
            <div className="space-y-6">
              <p className="text-sm text-neutral-600">Enter the fertilizer rate per hectare, bag size, and number of applications to calculate the total quantity and whole bags to buy.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div><label className="block font-semibold text-neutral-700 mb-1">Crop</label><input required type="text" placeholder="Enter crop type" value={fertCropType} onChange={e => setFertCropType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-300" /></div>
                <div><label className="block font-semibold text-neutral-700 mb-1">Fertilizer Type</label><input required type="text" placeholder="Enter fertilizer type" value={fertilizerType} onChange={e => setFertilizerType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-300" /></div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Farm Area (Hectares)</label>
                  <input
                    type="number" required placeholder="Enter farm area"
                    min="0"
                    step="any"
                    value={fertArea || ''}
                    onChange={(e) => setFertArea(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Fertilizer Required per Hectare (kg)</label>
                  <input
                    type="number" required placeholder="Enter fertilizer rate"
                    min="0"
                    step="any"
                    value={fertRateKgHa || ''}
                    onChange={(e) => setFertRateKgHa(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Bag Size (kg)</label>
                  <input required type="number" placeholder="Enter bag size" min="1" value={fertBagKg || ''} onChange={e => setFertBagKg(Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Applications in Production Period</label>
                  <input required type="number" placeholder="Enter number of applications" min="1" step="1" value={fertApplications || ''} onChange={e => setFertApplications(Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Price per Bag (₦, optional)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="any"
                    value={fertPriceBag || ''}
                    onChange={(e) => setFertPriceBag(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              </div>

              {fertilizerCalc.error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not calculate fertilizer requirements: {fertilizerCalc.error}</p> : fertilizerInputsReady ? (() => {
                const requiredPerHa = value(fertilizerCalc.result, 'requiredKgPerHa');
                const totalKg = value(fertilizerCalc.result, 'requiredKg');
                const totalBags = value(fertilizerCalc.result, 'bags');
                const perApplication = value(fertilizerCalc.result, 'requiredKgPerApplication');
                const totalCost = value(fertilizerCalc.result, 'purchaseCost');

                return (
                  <div className="p-4 bg-neutral-50 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Metric label="Fertilizer required per hectare" value={`${formatNumber(requiredPerHa, 1)} kg`} />
                    <Metric label="Total fertilizer required" value={`${formatNumber(totalKg, 1)} kg`} />
                    <Metric label="Whole bags to purchase" value={`${formatNumber(totalBags, 0)} bags (${formatNumber(value(fertilizerCalc.result, 'bagSizeKg'), 0)} kg each)`} />
                    <Metric label="Amount per application" value={`${formatNumber(perApplication, 1)} kg`} />
                    <Metric label="Estimated purchase cost" value={fertPriceBag > 0 ? formatNaira(totalCost) : 'Enter bag price to calculate'} />
                  </div>
                );
              })() : <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">Fill in the crop, fertilizer type, farm area, application rate, bag size, and number of applications to see predictions.</p>}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const totalCost = value(fertilizerCalc.result, 'purchaseCost');
                    updateToolProject({
                      financialModel: {
                        ...currentProject.financialModel,
                        fertilizerCost: totalCost,
                      },
                      toolAnalysis: { ...currentProject.toolAnalysis, production: { ...currentProject.toolAnalysis?.production, fertilizer: fertilizerCalc.result ?? {} } }
                    });
                    showApplied('Fertilizer cost applied to project input expenses!');
                  }}
                  disabled={!fertilizerInputsReady || fertilizerCalc.loading || !!fertilizerCalc.error}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Apply to Farm Budget
                </button>
              </div>
            </div>
          )}

          {/* 7. Livestock Feed Calculator */}
          {selectedTool === 'feed' && (
            <div className="space-y-6">
              <p className="text-sm text-neutral-600">Estimate feed needs from the farm area, stocking rate, daily feed per animal, and production period.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div><label className="block font-semibold text-neutral-700 mb-1">Livestock Type</label><input required type="text" placeholder="Enter livestock type" value={livestockType} onChange={e => setLivestockType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-300" /></div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Farm Area (Hectares)</label>
                  <input required type="number" placeholder="Enter area" min="0" step="any" value={feedArea || ''} onChange={e => setFeedArea(Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Animals per Hectare (Stocking Rate)</label>
                  <input
                    type="number" required placeholder="Enter stocking rate"
                    min="0"
                    step="any"
                    value={stockingRatePerHa || ''}
                    onChange={(e) => setStockingRatePerHa(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Feed per Animal per Day (kg)</label>
                  <input
                    type="number" required placeholder="Enter daily feed amount"
                    min="0"
                    step="any"
                    value={dailyFeedKg || ''}
                    onChange={(e) => setDailyFeedKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Production Period (Days)</label>
                  <input
                    type="number" required placeholder="Enter production period"
                    min="0"
                    step="1"
                    value={animalDays || ''}
                    onChange={(e) => setAnimalDays(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Feed Bag Size (kg)</label>
                  <input required type="number" placeholder="Enter bag size" min="1" value={feedBagKg || ''} onChange={e => setFeedBagKg(Number(e.target.value) || 0)} className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Price per Feed Bag (₦)</label>
                  <input
                    type="number" required placeholder="Enter price"
                    min="0"
                    step="any"
                    value={feedPricePerBag || ''}
                    onChange={(e) => setFeedPricePerBag(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              </div>

              {feedCalc.error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not calculate feed requirements: {feedCalc.error}</p> : feedInputsReady ? (() => {
                const totalKg = value(feedCalc.result, 'totalKg');
                const bags = value(feedCalc.result, 'bags');
                const cost = value(feedCalc.result, 'totalCost');
                const animalsPerHa = value(feedCalc.result, 'animalsPerHa');
                const animals = value(feedCalc.result, 'animalCount');
                const dailyKg = value(feedCalc.result, 'dailyKg');
                const monthlyKg = value(feedCalc.result, 'monthlyKg');

                return (
                  <div className="p-4 bg-neutral-50 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Metric label="Estimated animals per hectare" value={formatNumber(animalsPerHa, 1)} />
                    <Metric label="Total estimated animals supported" value={formatNumber(animals, 0)} />
                    <Metric label="Daily feed requirement" value={`${formatNumber(dailyKg, 1)} kg`} />
                    <Metric label="Monthly feed requirement (30 days)" value={`${formatNumber(monthlyKg, 1)} kg`} />
                    <Metric label="Feed for production period" value={`${formatNumber(totalKg, 1)} kg`} />
                    <Metric label="Whole feed bags to purchase" value={`${formatNumber(bags, 0)} bags (${formatNumber(value(feedCalc.result, 'bagSizeKg'), 0)} kg each)`} />
                    <Metric label="Estimated feed cost" value={formatNaira(cost)} />
                  </div>
                );
              })() : <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">Fill in the livestock type, farm area, stocking rate, daily feed, production period, bag size, and price per bag to see predictions.</p>}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const cost = value(feedCalc.result, 'totalCost');
                    updateToolProject({
                      financialModel: {
                        ...currentProject.financialModel,
                        feedCost: cost,
                      },
                      toolAnalysis: { ...currentProject.toolAnalysis, production: { ...currentProject.toolAnalysis?.production, feed: feedCalc.result ?? {} } }
                    });
                    showApplied('Feed costs applied to project input budget!');
                  }}
                  disabled={!feedInputsReady || feedCalc.loading || !!feedCalc.error}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Apply to Farm Budget
                </button>
              </div>
            </div>
          )}

          {/* 8. Fish Farming Calculator */}
          {selectedTool === 'fish' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Number Stocked</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="1"
                    value={fishStocked || ''}
                    onChange={(e) => setFishStocked(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Survival Rate (%)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    max="100"
                    step="any"
                    value={fishSurvivalRate || ''}
                    onChange={(e) => setFishSurvivalRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Harvest Wt (kg)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="0.1"
                    value={fishHarvestKg || ''}
                    onChange={(e) => setFishHarvestKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Selling Price / kg (₦)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="any"
                    value={fishPricePerKg || ''}
                    onChange={(e) => setFishPricePerKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Feed Conv. Ratio (FCR)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="0.1"
                    value={fishFcr || ''}
                    onChange={(e) => setFishFcr(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Feed Cost / kg (₦)</label>
                  <input
                    type="number" placeholder="Enter value"
                    min="0"
                    step="any"
                    value={fishFeedPricePerKg || ''}
                    onChange={(e) => setFishFeedPricePerKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">{Object.entries({ fingerlingCosts: 'Fingerling costs', labourCosts: 'Labour costs', medicationCosts: 'Medication', electricityCosts: 'Electricity', waterCosts: 'Water', transportCosts: 'Transport', otherCosts: 'Equipment / other allocated costs' }).map(([key, label]) => <label key={key} className="font-semibold text-neutral-700">{label} (₦)<input type="number" placeholder="Enter value" min="0" value={fishCosts[key as keyof typeof fishCosts] || ''} onChange={(e) => setFishCosts({ ...fishCosts, [key]: Number(e.target.value) || 0 })} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" /></label>)}</div>

              {(() => {
                const survivors = value(fishCalc.result, 'survivors');
                const totalBiomassKg = value(fishCalc.result, 'biomassKg');
                const rev = value(fishCalc.result, 'revenue');
                const feedCost = value(fishCalc.result, 'feedCost');

                return (
                  <div className="p-4 bg-neutral-50 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[11px] text-neutral-500">Expected Survivors</p>
                      <p className="font-mono font-bold text-neutral-900 text-lg">{survivors} fish</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Total Harvest Biomass</p>
                      <p className="font-mono font-bold text-neutral-900 text-lg">{formatNumber(totalBiomassKg, 0)} kg</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Expected Revenue</p>
                      <p className="font-mono font-bold text-emerald-800 text-lg">{formatNaira(rev)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Est. Feed Cost</p>
                      <p className="font-mono font-bold text-neutral-900 text-lg">{formatNaira(feedCost)}</p>
                    </div>
                    <div><p className="text-[11px] text-neutral-500">Estimated Profit</p><p className="font-mono font-bold text-emerald-800 text-lg">{formatNaira(value(fishCalc.result, 'profit'))}</p></div>
                  </div>
                );
              })()}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const survivors = value(fishCalc.result, 'survivors');
                    const totalBiomassKg = value(fishCalc.result, 'biomassKg');
                    const feedCost = value(fishCalc.result, 'feedCost');

                    updateToolProject({
                      farmType: 'Fish Farming',
                      productionPlan: {
                        ...currentProject.productionPlan,
                        capacity: fishStocked,
                        capacityUnit: 'fingerlings',
                        expectedOutputPerCycle: totalBiomassKg,
                        outputUnit: 'kg',
                      },
                      marketPlan: {
                        ...currentProject.marketPlan,
                        expectedSellingPrice: fishPricePerKg,
                      },
                      financialModel: {
                        ...currentProject.financialModel,
                        feedCost,
                      },
                      toolAnalysis: { ...currentProject.toolAnalysis, production: { ...currentProject.toolAnalysis?.production, fish: fishCalc.result ?? {} } }
                    });
                    showApplied('Applied aquaculture parameters to project!');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Apply to Project
                </button>
              </div>
            </div>
          )}

          {selectedTool === 'roi' && <div className="space-y-5">
            <p className="text-sm text-neutral-600">ROI uses this project’s production, price and cost assumptions. Add optional net cash flow amounts by period to check seasonal or irregular payback. Negative amounts are allowed for deficit periods.</p>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <label className="font-semibold text-neutral-700">Cash-flow period<select value={roiPeriod} onChange={e => setRoiPeriod(e.target.value as 'year' | 'season')} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300"><option value="year">Annual</option><option value="season">Seasonal</option></select></label>
              <div className="sm:col-span-2 space-y-2"><div className="flex items-center justify-between"><span className="font-semibold text-neutral-700">Expected net cash flow (₦, optional)</span><button type="button" onClick={() => setRoiCashflows(values => [...values, ''])} className="rounded-lg border border-emerald-200 px-3 py-1.5 font-semibold text-emerald-800">+ Add period</button></div>{roiCashflows.map((cashflow, index) => <div key={index} className="flex items-center gap-2"><label className="flex-1 font-medium text-neutral-600">Period {index + 1}<input aria-label={`Net cash flow for period ${index + 1}`} type="number" placeholder="Enter value" step="any" value={Number(cashflow) || ''} onChange={event => setRoiCashflows(values => values.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-mono" /></label><button type="button" aria-label={`Remove period ${index + 1}`} onClick={() => setRoiCashflows(values => values.filter((_, itemIndex) => itemIndex !== index))} className="mt-5 rounded-lg border px-3 py-2 text-neutral-600">Remove</button></div>)}</div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-2xl grid sm:grid-cols-3 gap-4">
              <Metric label="Total investment" value={formatNaira(value(roiCalc.result, 'totalInvestment'))} /><Metric label="Total revenue" value={formatNaira(value(roiCalc.result, 'revenue'))} /><Metric label="Total costs" value={formatNaira(value(roiCalc.result, 'totalCosts'))} /><Metric label="Net return" value={formatNaira(value(roiCalc.result, 'netReturn'))} /><Metric label="ROI" value={roiCalc.result?.roiPercent == null ? 'Not available' : `${formatNumber(value(roiCalc.result, 'roiPercent'), 1)}%`} /><Metric label="Payback" value={roiCalc.result?.paybackPeriods == null ? 'Not reached in entered periods' : `${formatNumber(value(roiCalc.result, 'paybackPeriods'), 1)} ${roiPeriod}s`} /><Metric label="Annual / seasonal net cash flow" value={formatNaira(value(roiCalc.result, 'netCashFlow'))} />
            </div>
            <div className="rounded-xl border p-4"><h4 className="font-semibold text-sm mb-3">Cumulative cash flow</h4><div className="space-y-2">{(roiCalc.result?.cumulativeCashFlows as {period:number; netCashFlow:number; cumulativeCashFlow:number}[] | undefined)?.map(row => <div key={row.period} className="grid grid-cols-3 text-xs"><span>Period {row.period}</span><span>{formatNaira(row.netCashFlow)}</span><span className="font-semibold">Cumulative {formatNaira(row.cumulativeCashFlow)}</span></div>)}</div></div>
            <button onClick={() => { if (!roiCalc.result) return; updateToolProject({ toolAnalysis: { ...currentProject.toolAnalysis, roi: roiCalc.result } }); showApplied('ROI results saved to this project and retained with its investment assumptions.'); }} disabled={!roiCalc.result || roiCalc.loading} className="px-5 py-2.5 bg-emerald-600 disabled:bg-neutral-300 text-white text-xs font-semibold rounded-xl">Save Investment Analysis</button>
          </div>}

          {selectedTool === 'whatif' && <div className="space-y-5"><p className="text-sm text-neutral-600">Base values come from your project. Adjust key assumptions to recalculate downstream revenue, profit, ROI, payback and break-even.</p><div className="grid sm:grid-cols-3 gap-4 text-xs">{[['Selling price change (%)', scenarioPrice, setScenarioPrice], ['Yield change (%)', scenarioYield, setScenarioYield], ['Operating cost change (%)', scenarioCostChange, setScenarioCostChange]].map(([label, val, setter]) => <label key={String(label)} className="font-semibold text-neutral-700">{String(label)}<input type="number" placeholder="Enter value" value={Number(val) || ''} onChange={e => (setter as (v:number)=>void)(Number(e.target.value)||0)} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono" /></label>)}</div><div className="p-4 bg-neutral-50 rounded-2xl grid sm:grid-cols-3 gap-4"><Metric label="Base revenue" value={formatNaira(value(scenarioCalc.result,'baseRevenue'))}/><Metric label="Scenario revenue" value={formatNaira(value(scenarioCalc.result,'scenarioRevenue'))}/><Metric label="Base costs" value={formatNaira(value(scenarioCalc.result,'baseCosts'))}/><Metric label="Scenario costs" value={formatNaira(value(scenarioCalc.result,'scenarioCosts'))}/><Metric label="Base profit → scenario" value={`${formatNaira(value(scenarioCalc.result,'baseProfit'))} → ${formatNaira(value(scenarioCalc.result,'scenarioProfit'))}`}/><Metric label="ROI base → scenario" value={`${formatNumber(value(scenarioCalc.result,'baseRoiPercent'),1)}% → ${formatNumber(value(scenarioCalc.result,'roiPercent'),1)}%`}/><Metric label="Payback base → scenario" value={`${formatNumber(value(scenarioCalc.result,'basePaybackPeriods'),1)} → ${formatNumber(value(scenarioCalc.result,'paybackPeriods'),1)} years`}/><Metric label="Break-even base → scenario" value={`${value(scenarioCalc.result,'baseBreakEvenUnits')} → ${value(scenarioCalc.result,'scenarioBreakEvenUnits')} units`}/></div><button onClick={() => { updateToolProject({ whatIf: { ...currentProject.whatIf, priceDeltaPercent: scenarioPrice, yieldDeltaPercent: scenarioYield, inputCostDeltaPercent: scenarioCostChange }, toolAnalysis: { ...currentProject.toolAnalysis, whatIf: scenarioCalc.result ?? undefined } }); showApplied('Scenario results saved to this project and available in Scenario Analysis and its readiness report.'); }} disabled={!scenarioCalc.result || scenarioCalc.loading} className="px-5 py-2.5 bg-emerald-600 disabled:bg-neutral-300 text-white text-xs font-semibold rounded-xl">Save Scenario</button></div>}

          {selectedTool === 'risk' && <div className="space-y-5"><p className="text-sm text-neutral-600">Rate each exposure from 1 (very low) to 5 (very high). The displayed score converts the weighted average to 0–100; higher scores mean higher risk. The default weights follow the risk model and can be adjusted. This is a decision-support indicator, not a prediction of farm success or financial loss.</p><div className="grid sm:grid-cols-2 gap-4">{riskCategories.map((factor, index) => <div key={factor} className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-neutral-700">{factor} risk score (1–5)<input type="number" placeholder="Enter value" min="1" max="5" value={riskScores[index] || ''} onChange={e => setRiskScores(riskScores.map((score,i)=>i===index?Number(e.target.value):score))} className="mt-1 w-full px-3 py-2 rounded-xl border" /></label><label className="text-xs font-semibold text-neutral-700">Weight (%)<input type="number" placeholder="Enter value" min="0" max="100" value={riskWeights[index]} onChange={e => setRiskWeights(riskWeights.map((weight,i)=>i===index?Number(e.target.value):weight))} className="mt-1 w-full px-3 py-2 rounded-xl border" /></label></div>)}</div><div className="p-4 bg-neutral-50 rounded-2xl space-y-3"><span className="text-xs text-neutral-500">Overall risk indicator</span><p className="text-xl font-bold text-neutral-900">{riskCalc.result?.score == null ? 'Enter all six factor scores' : `${formatNumber(value(riskCalc.result, 'score'), 0)} / 100 · ${riskCalc.result.band}`}</p>{(riskCalc.result?.factors as {name:string; score:number; weight:number}[] | undefined)?.map(f=><div key={f.name} className="grid grid-cols-[1fr_2fr_auto] items-center gap-3 text-xs"><span>{f.name} risk</span><div className="h-2 rounded bg-neutral-200"><div className="h-2 rounded bg-amber-500" style={{width:`${f.score*20}%`}}/></div><span>{formatNumber(f.score,1)} · {f.weight}%</span></div>)}</div><div className="rounded-xl border p-4"><h4 className="font-semibold text-sm">Suggested mitigation</h4>{(riskCalc.result?.mitigations as {factor:string;action:string}[] | undefined)?.length ? <ul className="list-disc pl-5 mt-2 text-sm text-neutral-600">{(riskCalc.result?.mitigations as unknown as {factor:string;action:string}[]).map(x=><li key={x.factor}><b>{x.factor}:</b> {x.action}</li>)}</ul> : <p className="text-sm text-neutral-500 mt-2">Complete all risk ratings to see mitigation suggestions.</p>}</div><button onClick={() => { const factors=(riskCalc.result?.factors as {name:string;score:number;weight:number}[]|undefined)??[]; const mitigations=(riskCalc.result?.mitigations as unknown as {factor:string;action:string}[]|undefined)??[]; const saved=factors.map((factor)=>{const level: 'Low'|'Medium'|'High'=factor.score<=2?'Low':factor.score<=3?'Medium':'High'; return {id:`tool-risk-${factor.name.toLowerCase()}`,category:factor.name,exposure:level,impact:level,overall:level,existingControl:'Not recorded',plannedControl:mitigations.find(x=>x.factor===factor.name)?.action??'Review and document a suitable control.',notes:`Risk rating ${factor.score}/5; weight ${factor.weight}%.`};}); updateToolProject({risks:[...currentProject.risks.filter(r=>!riskCategories.includes(r.category)),...saved], toolAnalysis:{...currentProject.toolAnalysis, risk:riskCalc.result??undefined}}); showApplied('Risk factors and mitigation actions saved to the active project report.');}} disabled={!riskCalc.result?.score} className="px-5 py-2.5 bg-emerald-600 disabled:bg-neutral-300 text-white text-xs font-semibold rounded-xl">Save Risk Analysis</button></div>}
        </div>
      )}
    </div>
  );
};
