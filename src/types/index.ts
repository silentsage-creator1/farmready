export type FarmType = 
  | 'Crop Production'
  | 'Livestock'
  | 'Poultry'
  | 'Fish Farming'
  | 'Greenhouse Farming'
  | 'Irrigation Project'
  | 'Farm Machinery'
  | 'Agro-Processing'
  | 'Storage & Warehousing'
  | 'Farm Expansion';

export type LandOwnershipStatus = 'owned' | 'plan_to_buy' | 'lease_partner';

export type FarmingObjective = 
  | 'Investment'
  | 'Livelihood'
  | 'Retirement'
  | 'Legacy'
  | 'Social impact'
  | 'Expansion';

export type SystemStatus = 'Prepared' | 'Needs Attention' | 'Weak' | 'Insufficient Information';

export interface SavedWhatIfScenario {
  id: string;
  name: string;
  createdAt: string;
  deltas: { priceDeltaPercent: number; yieldDeltaPercent: number; inputCostDeltaPercent: number; labourCostDeltaPercent: number };
  revenue: number;
  expenses: number;
  profit: number;
  roi: number | null;
  breakEvenUnits: number | null;
}

export interface CostItem {
  id: string;
  name: string;
  category: 'Land' | 'Inputs' | 'Labour' | 'Equipment' | 'Operations' | 'Other';
  amount: number;
  isMonthly?: boolean;
}

export interface RiskItem {
  id: string;
  category: string;
  exposure: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  overall: 'Low' | 'Medium' | 'High';
  existingControl: string;
  plannedControl: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Seeds & Seedlings' | 'Fertilizer & Chemicals' | 'Feed & Nutrition' | 'Tools & Equipment' | 'Harvested Produce' | 'Packaging & Fuel';
  quantity: number;
  unit: string;
  unitCost: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  reorderPoint: number;
  targetStock?: number;
  supplier?: string;
  lastPurchaseDate?: string;
  purchaseReference?: string;
  expiryDate?: string;
  batchNumber?: string;
  storageLocation?: string;
  movements?: InventoryMovement[];
}

export interface InventoryMovement {
  id: string;
  type: 'Purchase' | 'Usage' | 'Sale' | 'Loss' | 'Adjustment';
  quantity: number;
  date: string;
  note?: string;
  supplier?: string;
  unitCost?: number;
  reference?: string;
}

export interface FarmProject {
  id: string;
  name: string;
  farmType: FarmType;
  stage: 'Your Farm' | 'Production & Market' | 'Financial Information' | 'Risks & Management' | 'Review & Submit' | 'Completed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  toolAnalysis?: {
    roi?: Record<string, unknown>;
    loan?: Record<string, unknown>;
    whatIf?: Record<string, unknown>;
    risk?: Record<string, unknown>;
    production?: Record<string, Record<string, unknown>>;
  };

  // 1. Farm Details
  farmDetails: {
    farmName: string;
    targetProduce: string;
    primaryPurpose: FarmingObjective;
    expectedStartDate: string;
    landStatus: LandOwnershipStatus;
    locationState: string;
    farmSize: number;
    sizeUnit: 'hectares' | 'acres' | 'plots';
    dailyManager: string;
    managementResponsibilities?: string;
    farmingExperience: string;
    waterAvailability: string;
    irrigationPresent: boolean;
    existingEquipment: string[];
  };

  // 2. Production & Market
  productionPlan: {
    product: string;
    productionMethod: string;
    capacity: number;
    capacityUnit: string;
    cyclesPerYear: number;
    gestationMonths: number;
    salesFrequencyMonths: number;
    expectedOutputPerCycle: number;
    outputUnit: string;
    expectedLossPercent: number;
    keyAssumptions: string;
  };

  marketPlan: {
    targetCustomer: string;
    buyerType: 'Commercial Processor' | 'Wholesaler / Aggregator' | 'Retailer / End Consumer' | 'Exporter';
    customerValidationStatus: 'Assumed customer' | 'Initial contact made' | 'Validated buyer/customer (MOU/LOI)' | 'Existing buyer relationship';
    expectedPurchaseVolumePerCycle: number;
    expectedSellingPrice: number; // in NGN per unit
    distanceToMarketKm: number;
    salesMethod: 'Farm gate pickup' | 'Direct delivery to factory' | 'Wholesale market hub';
    existingBuyerRelationships: string;
    processingOpportunities: string;
  };

  // 3. Money / Financial
  financialModel: {
    availableCapital: number;
    additionalCapitalAvailable: number;
    maxAffordableLoss: number | null;
    monthsUntilPositiveCashFlow: number | null;
    // Startup Capex
    landRentPurchase: number;
    landPurchaseCost: number;
    landRentLeaseCost: number;
    landPreparation: number;
    equipmentMachinery: number;
    infrastructureSetup: number;
    initialInputs: number;
    startupSeedsCost: number;
    startupSeedlingsCost: number;
    startupAnimalsCost: number;
    startupFingerlingsCost: number;
    initialWorkingCapital: number;
    initialLabour: number;
    otherStartupCosts: number;
    startupContingency: number;
    // Operating items (annualized or per cycle)
    labourCost: number;
    inputsCost: number;
    seedCost: number;
    seedlingsCost: number;
    fertilizerCost: number;
    manureCost: number;
    pesticidesCost: number;
    herbicidesCost: number;
    feedCost: number;
    fishFeedCost: number;
    medicineCost: number;
    vaccineCost: number;
    fuelCost: number;
    transportCost: number;
    utilitiesCost: number;
    electricityCost: number;
    waterCost: number;
    irrigationCost: number;
    maintenanceCost: number;
    packagingStorageCost: number;
    harvestingCost: number;
    processingCost: number;
    marketFeesCost: number;
    sellingAgentFeesCost: number;
    animalPenCost: number;
    storageShedCost: number;
    securityCost: number;
    insuranceContingencyCost: number;
    miscellaneousCost: number;
    customExpenses: CostItem[];
    financing: {
      hasLoan: boolean;
      loanAmount: number;
      interestRatePercent: number;
      durationMonths: number;
      repaymentFrequency: 'monthly' | 'quarterly' | 'annual';
      gracePeriodMonths: number;
    };
  };

  // 4. Risks & Management
  risks: RiskItem[];
  recordKeepingPlan: {
    method: string;
    reviewFrequency: string;
    independentVerifier?: string;
    verificationMethod?: string;
  };

  exitRedesignExpansion: {
    stopConditions: string;
    redesignConditions: string;
    expansionConditions: string;
    expansionCapitalRequired: number;
  };

  // 5. Scenarios & What-If
  scenarios: {
    conservative: { yield: number; price: number; label: string };
    expected: { yield: number; price: number; label: string };
    optimistic: { yield: number; price: number; label: string };
    saved?: SavedWhatIfScenario[];
  };

  whatIf: {
    priceDeltaPercent: number;
    yieldDeltaPercent: number;
    inputCostDeltaPercent: number;
    labourCostDeltaPercent: number;
  };

  landEvaluation: {
    alreadyOwns: boolean;
    longTermEssential: boolean;
    comparedLeaseVsBuy: boolean;
    capitalHeavy: boolean;
    evaluatedAlternative?: 'Lease' | 'Purchase' | 'Partnership' | 'Contract Production' | 'Pilot First';
  };
}

export interface SystemReadiness {
  systemName: string;
  status: SystemStatus;
  percentage: number;
  evidence: string;
  gap: string;
  nextAction: string;
}

export interface FinancialMetrics {
  totalStartupCapital: number;
  monthlyOperatingCost: number;
  annualOperatingExpenses: number;
  expectedAnnualQuantity: number;
  expectedRevenue: number;
  grossProfit: number;
  grossMarginPercent: number;
  netProfit: number;
  netMarginPercent: number;
  roiPercent: number | null;
  breakEvenQuantity: number | null;
  breakEvenRevenue: number | null;
  fundingGap: number;
  paybackPeriodYears: number | null;
  capacityUtilizationAtBreakEven: number | null;
  breakEvenAttainable: boolean | null;
  marketableAnnualQuantity: number;
  annualVariableCosts: number;
  annualFixedCosts: number;
}
