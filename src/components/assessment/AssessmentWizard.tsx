import React, { useEffect, useMemo, useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { FarmProject, FarmType, RiskItem } from '../../types';
import { calculateFinancialMetrics, formatNaira } from '../../utils/calculations';
import { LandNeedAdvisor } from './LandNeedAdvisor';
import { AlertCircle, ArrowRight, Check, ChevronLeft, ChevronRight, ClipboardList, Plus, Save, Trash2 } from 'lucide-react';

const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Abuja (FCT)',
];

const CROPS = ['Yellow Commercial Grain Maize', 'White Food Maize', 'Cassava Tubers', 'Tomatoes', 'Habanero Peppers', 'Soybeans', 'Oil Palm', 'Sorghum', 'Yam Tubers'];
const FARM_TYPES: FarmType[] = [
  'Crop Production', 'Livestock', 'Poultry', 'Fish Farming', 'Greenhouse Farming', 'Irrigation Project',
  'Farm Machinery', 'Agro-Processing', 'Storage & Warehousing', 'Farm Expansion',
];
const AREA_CAPACITY_TYPES: FarmType[] = ['Crop Production', 'Greenhouse Farming', 'Irrigation Project', 'Farm Expansion'];
const STEPS = [
  { key: 'market', label: 'Market', title: 'Market system', description: 'Define who will buy your products, at what price, and how you will reach them.' },
  { key: 'production', label: 'Production', title: 'Production system', description: 'Set the production model, capacity and output assumptions for your farm.' },
  { key: 'financial', label: 'Financial', title: 'Financial system', description: 'Enter the capital, setup costs and operating expenses for this plan.' },
  { key: 'people', label: 'People', title: 'People system', description: 'Identify who is accountable for daily farm operations.' },
  { key: 'information', label: 'Information', title: 'Information system', description: 'Choose how farm activity and performance will be recorded and reviewed.' },
  { key: 'infrastructure', label: 'Infrastructure', title: 'Infrastructure system', description: 'Describe land access, location and essential site resources.' },
  { key: 'risk', label: 'Risk-Control', title: 'Risk-control system', description: 'Record important risks, controls and decision triggers.' },
] as const;

type SystemKey = typeof STEPS[number]['key'];
interface FormSystemState {
  market: FarmProject['marketPlan'];
  production: { farmType: FarmType; details: FarmProject['farmDetails']; plan: FarmProject['productionPlan'] };
  financial: FarmProject['financialModel'];
  people: Pick<FarmProject['farmDetails'], 'dailyManager' | 'farmingExperience'> & { responsibilities?: string };
  information: FarmProject['recordKeepingPlan'];
  infrastructure: Pick<FarmProject['farmDetails'], 'locationState' | 'landStatus' | 'waterAvailability' | 'farmSize'>;
  risk: { risks: RiskItem[]; exit: FarmProject['exitRedesignExpansion'] };
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function hasNonNegativeNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function getSystemFormState(project: FarmProject): FormSystemState {
  return {
    market: project.marketPlan,
    production: { farmType: project.farmType, details: project.farmDetails, plan: project.productionPlan },
    financial: project.financialModel,
    people: { dailyManager: project.farmDetails.dailyManager, farmingExperience: project.farmDetails.farmingExperience, responsibilities: project.farmDetails.managementResponsibilities },
    information: project.recordKeepingPlan || { method: '', reviewFrequency: '' },
    infrastructure: {
      locationState: project.farmDetails.locationState,
      landStatus: project.farmDetails.landStatus,
      waterAvailability: project.farmDetails.waterAvailability,
      farmSize: project.farmDetails.farmSize,
    },
    risk: { risks: project.risks || [], exit: project.exitRedesignExpansion },
  };
}

function getCompletion(state: FormSystemState): Record<SystemKey, boolean> {
  const { market, production, financial, people, information, infrastructure, risk } = state;
  const risks = risk.risks;
  const annualOperatingCost = financial.labourCost + financial.inputsCost + financial.seedCost + financial.fertilizerCost + financial.feedCost +
    financial.fuelCost + financial.transportCost + financial.utilitiesCost + financial.electricityCost + financial.waterCost +
    financial.maintenanceCost + financial.packagingStorageCost + financial.insuranceContingencyCost + financial.miscellaneousCost +
    (financial.customExpenses || []).reduce((sum, item) => sum + item.amount * (item.isMonthly ? 12 : 1), 0);

  return {
    market: hasText(market.targetCustomer) && hasText(market.buyerType) &&
      hasText(market.customerValidationStatus) && hasPositiveNumber(market.expectedSellingPrice) &&
      hasPositiveNumber(market.expectedPurchaseVolumePerCycle),
    production: hasText(production.details.targetProduce) && hasText(production.plan.productionMethod) &&
      hasText(production.details.primaryPurpose) && hasText(production.details.expectedStartDate) &&
      hasPositiveNumber(production.details.farmSize) && hasPositiveNumber(production.plan.capacity) && hasPositiveNumber(production.plan.cyclesPerYear) &&
      hasPositiveNumber(production.plan.expectedOutputPerCycle) && hasPositiveNumber(production.plan.gestationMonths) &&
      hasPositiveNumber(production.plan.salesFrequencyMonths),
    financial: financial.availableCapital >= 0 &&
      hasNonNegativeNumber(financial.maxAffordableLoss) && hasNonNegativeNumber(financial.monthsUntilPositiveCashFlow) &&
      (financial.landPurchaseCost + financial.landRentLeaseCost + financial.landPreparation + financial.equipmentMachinery + financial.infrastructureSetup + financial.startupSeedsCost + financial.startupSeedlingsCost + financial.startupAnimalsCost + financial.startupFingerlingsCost + financial.initialWorkingCapital) > 0 &&
      annualOperatingCost > 0,
    people: hasText(people.dailyManager) && hasText(people.farmingExperience) && hasText(people.responsibilities),
    information: hasText(information.method) && hasText(information.reviewFrequency) && hasText(information.independentVerifier) && hasText(information.verificationMethod),
    infrastructure: hasText(infrastructure.locationState) && hasText(infrastructure.landStatus) &&
      hasPositiveNumber(infrastructure.farmSize) && hasText(infrastructure.waterAvailability),
    risk: risks.length > 0 && risks.every(risk => hasText(risk.category) && hasText(risk.exposure) && hasText(risk.impact) && hasText(risk.plannedControl)) &&
      hasText(risk.exit.stopConditions),
  };
}

function InputField({ label, value, onChange, type = 'text', required = false, min, step, placeholder, suffix }: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date';
  required?: boolean;
  min?: number;
  step?: number;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-800">
      <span className="mb-1.5 block">{label}{required && <span className="text-red-600" aria-hidden="true"> *</span>}</span>
      <span className="flex items-center gap-2">
        <input
          type={type}
          value={type === 'number' && Number(value) === 0 ? '' : value}
          min={type === 'number' ? min ?? 0 : undefined}
          step={type === 'number' ? step ?? 'any' : step}
          placeholder={placeholder ?? (type === 'number' ? 'Enter value' : undefined)}
          required={required}
          onKeyDown={event => {
            if (type === 'number' && (['e', 'E', '+'].includes(event.key) || (event.key === '-' && Number(min ?? 0) >= 0))) event.preventDefault();
          }}
          onPaste={event => {
            if (type === 'number' && Number(min ?? 0) >= 0 && event.clipboardData.getData('text').includes('-')) event.preventDefault();
          }}
          onChange={event => onChange(event.target.value)}
          className="w-full min-w-0 rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-xs outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
        />
        {suffix && <span className="shrink-0 text-xs text-neutral-500">{suffix}</span>}
      </span>
    </label>
  );
}

function SelectField({ label, value, options, onChange, required = false, placeholder = 'Choose an option' }: {
  label: string;
  value: string | number;
  options: Array<{ value: string | number; label: string }>;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-800">
      <span className="mb-1.5 block">{label}{required && <span className="text-red-600" aria-hidden="true"> *</span>}</span>
      <select
        value={value}
        required={required}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-xs outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function RadioCards<T extends string>({ name, value, options, onChange }: {
  name: string;
  value: T;
  options: Array<{ value: T; label: string; description?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label={name}>
      {options.map(option => (
        <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${value === option.value ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/15' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 h-4 w-4 accent-emerald-600"
          />
          <span>
            <span className="block text-sm font-semibold text-neutral-900">{option.label}</span>
            {option.description && <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{option.description}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

export const AssessmentWizard: React.FC = () => {
  const { currentProject, updateCurrentProject, setActiveView, saveCurrentReport } = useFarmProject();
  const readStoredStep = (projectId: string) => {
    try {
      const storedStep = Number(localStorage.getItem(`farmready_assessment_step_${projectId}`));
      return Number.isInteger(storedStep) && storedStep >= 0 && storedStep < STEPS.length ? storedStep : 0;
    } catch {
      return 0;
    }
  };
  const [currentStep, setCurrentStep] = useState(() => readStoredStep(currentProject.id));
  const [saveMessage, setSaveMessage] = useState('Draft auto-saves on this device.');
  const [showLandAdvisor, setShowLandAdvisor] = useState(false);
  const [attemptedContinue, setAttemptedContinue] = useState(false);
  const formState = useMemo(() => getSystemFormState(currentProject), [currentProject]);
  const completion = useMemo(() => getCompletion(formState), [formState]);
  const completedCount = Object.values(completion).filter(Boolean).length;
  const overallProgress = Math.round((completedCount / STEPS.length) * 100);
  const metrics = calculateFinancialMetrics(currentProject);
  const step = STEPS[currentStep];

  const goToStep = (nextStep: number) => {
    const safeStep = Math.max(0, Math.min(STEPS.length - 1, nextStep));
    setCurrentStep(safeStep);
    try {
      localStorage.setItem(`farmready_assessment_step_${currentProject.id}`, String(safeStep));
    } catch {
      // Current step still changes in memory if browser storage is unavailable.
    }
  };

  useEffect(() => {
    setCurrentStep(readStoredStep(currentProject.id));
  }, [currentProject.id]);

  const updateDetails = (patch: Partial<FarmProject['farmDetails']>) =>
    updateCurrentProject({ farmDetails: { ...currentProject.farmDetails, ...patch } });
  const updateProduction = (patch: Partial<FarmProject['productionPlan']>) =>
    updateCurrentProject({ productionPlan: { ...currentProject.productionPlan, ...patch } });
  const updateMarket = (patch: Partial<FarmProject['marketPlan']>) =>
    updateCurrentProject({ marketPlan: { ...currentProject.marketPlan, ...patch } });
  const updateFinancial = (patch: Partial<FarmProject['financialModel']>) =>
    updateCurrentProject({ financialModel: { ...currentProject.financialModel, ...patch } });
  const updateInformation = (patch: Partial<FarmProject['recordKeepingPlan']>) =>
    updateCurrentProject({ recordKeepingPlan: { ...(currentProject.recordKeepingPlan || { method: '', reviewFrequency: '' }), ...patch } });
  const updateRisk = (id: string, patch: Partial<RiskItem>) => {
    const risks = (currentProject.risks || []).map(risk => {
      if (risk.id !== id) return risk;
      const updated = { ...risk, ...patch };
      const hasHigh = updated.exposure === 'High' || updated.impact === 'High';
      const hasMedium = updated.exposure === 'Medium' || updated.impact === 'Medium';
      return { ...updated, overall: hasHigh ? 'High' as const : hasMedium ? 'Medium' as const : 'Low' as const };
    });
    updateCurrentProject({ risks });
  };

  const setFarmType = (farmType: FarmType) => {
    const areaBased = AREA_CAPACITY_TYPES.includes(farmType);
    const capacityUnit = areaBased ? currentProject.farmDetails.sizeUnit :
      farmType === 'Poultry' ? 'birds' : farmType === 'Livestock' ? 'head' :
        farmType === 'Fish Farming' ? 'fish stocked' : farmType === 'Farm Machinery' ? 'service jobs' : 'tonnes';
    const outputUnit = farmType === 'Fish Farming' ? 'kg' :
      farmType === 'Poultry' ? 'birds' : farmType === 'Livestock' ? 'head' :
        farmType === 'Farm Machinery' ? 'service jobs' : 'tonnes';
    updateCurrentProject({
      farmType,
      farmDetails: { ...currentProject.farmDetails, targetProduce: '' },
      productionPlan: { ...currentProject.productionPlan, product: '', capacity: areaBased ? currentProject.farmDetails.farmSize : 0, capacityUnit, outputUnit },
    });
  };

  const saveDraft = () => {
    updateCurrentProject({ progress: overallProgress });
    setSaveMessage(`Draft saved locally · ${new Date().toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}`);
    setAttemptedContinue(false);
  };

  const continueStep = () => {
    saveDraft();
    if (!completion[step.key]) {
      setAttemptedContinue(true);
      setSaveMessage(`Complete the required ${step.label.toLowerCase()} fields to continue. Your draft is saved.`);
      return;
    }
    setAttemptedContinue(false);
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (completedCount === STEPS.length) {
      const completedProject = { ...currentProject, progress: 100, stage: 'Completed' as const, updatedAt: new Date().toISOString() };
      updateCurrentProject({ progress: 100, stage: 'Completed' });
      saveCurrentReport(completedProject);
      setActiveView('report');
    } else {
      setSaveMessage('Complete all seven systems before generating the readiness report. Your draft is saved.');
    }
  };

  const addRisk = () => {
    const risk: RiskItem = {
      id: `risk-${Date.now()}`,
      category: '',
      exposure: '' as RiskItem['exposure'],
      impact: '' as RiskItem['impact'],
      overall: 'Medium',
      existingControl: '',
      plannedControl: '',
    };
    updateCurrentProject({ risks: [...(currentProject.risks || []), risk] });
  };

  const removeRisk = (id: string) => updateCurrentProject({ risks: (currentProject.risks || []).filter(risk => risk.id !== id) });
  const currentStepComplete = completion[step.key];
  const produceOptions = currentProject.farmType === 'Poultry'
    ? ['Broiler poultry birds (meat)', 'Layer poultry birds (eggs)']
    : currentProject.farmType === 'Livestock'
      ? ['Cattle fattening', 'Goat rearing']
      : currentProject.farmType === 'Fish Farming'
        ? ['Catfish', 'Tilapia fish']
        : currentProject.farmType === 'Farm Machinery'
          ? ['Tractor hire services', 'Planting services', 'Harvesting services']
          : currentProject.farmType === 'Agro-Processing'
            ? ['Maize grain', 'Cassava roots', 'Tomatoes', 'Soybeans']
            : currentProject.farmType === 'Storage & Warehousing'
              ? ['Maize grain', 'Cassava', 'Soybeans', 'Rice']
              : CROPS;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-3">
      <header className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Farm investment readiness</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-950">Assessment wizard</h1>
            <p className="mt-1 text-sm text-neutral-500">Complete the seven systems to generate a project-specific readiness report.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setActiveView('assessment_list')} className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
              <ClipboardList className="h-4 w-4" />My Assessments
            </button>
            <div className="rounded-xl bg-neutral-50 px-3.5 py-2 text-right">
              <p className="text-xs text-neutral-500">Completed systems</p>
              <p className="font-mono text-lg font-bold text-neutral-900">{completedCount} / 7</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-700">Overall assessment progress</span>
            <span className="font-mono text-emerald-700">{overallProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-label="Assessment completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overallProgress}>
            <div className="h-full rounded-full bg-emerald-600 transition-all duration-300" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>

        <nav aria-label="Assessment steps" className="mt-6 overflow-x-auto pb-1">
          <ol className="flex min-w-[760px] items-start gap-1 sm:min-w-0 sm:justify-between">
            {STEPS.map((item, index) => {
              const complete = completion[item.key];
              const active = index === currentStep;
              return (
                <li key={item.key} className="flex-1">
                  <button
                    type="button"
                    onClick={() => { goToStep(index); setAttemptedContinue(false); }}
                    aria-current={active ? 'step' : undefined}
                    aria-label={`Step ${index + 1}: ${item.label}${complete ? ', completed' : ''}`}
                    className="group flex w-full flex-col items-center gap-2 px-1 text-center"
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition ${complete ? 'border-emerald-600 bg-emerald-600 text-white' : active ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white text-neutral-500 group-hover:border-emerald-500'}`}>
                      {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                    </span>
                    <span className={`text-[11px] font-semibold ${active ? 'text-neutral-950' : complete ? 'text-emerald-800' : 'text-neutral-500'}`}>{item.label}</span>
                    <span className="sr-only">{complete ? 'Completed' : 'Incomplete'}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <section key={step.key} className="min-h-[420px] rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-8 animate-[fadeIn_180ms_ease-out]">
        <div className="mb-6 border-b border-neutral-100 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Step {currentStep + 1} of 7</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${currentStepComplete ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
              {currentStepComplete ? 'Completed' : 'Incomplete'}
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-neutral-950">{step.title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{step.description}</p>
        </div>

        {step.key === 'market' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <InputField label="Target customer or buyer segment" value={currentProject.marketPlan.targetCustomer} onChange={value => updateMarket({ targetCustomer: value })} required placeholder="e.g. Feed millers in Ibadan" />
            <SelectField label="Buyer category" value={currentProject.marketPlan.buyerType} required onChange={value => updateMarket({ buyerType: value as FarmProject['marketPlan']['buyerType'] })} options={[
              { value: 'Commercial Processor', label: 'Commercial processor' }, { value: 'Wholesaler / Aggregator', label: 'Wholesaler or aggregator' },
              { value: 'Retailer / End Consumer', label: 'Retailer or end consumer' }, { value: 'Exporter', label: 'Exporter' },
            ]} />
            <SelectField label="Customer validation" value={currentProject.marketPlan.customerValidationStatus} required onChange={value => updateMarket({ customerValidationStatus: value as FarmProject['marketPlan']['customerValidationStatus'] })} options={[
              { value: 'Assumed customer', label: 'Assumed; not validated' }, { value: 'Initial contact made', label: 'Initial contact made' },
              { value: 'Validated buyer/customer (MOU/LOI)', label: 'Validated buyer with LOI or agreement' }, { value: 'Existing buyer relationship', label: 'Existing buyer relationship' },
            ]} />
            <InputField label={`Expected selling price per ${currentProject.productionPlan.outputUnit || 'unit'}`} type="number" placeholder="Enter value" min={0} value={currentProject.marketPlan.expectedSellingPrice || ''} onChange={value => updateMarket({ expectedSellingPrice: Number(value) || 0 })} required suffix="₦" />
            <InputField label={`Expected buyer purchase volume per cycle (${currentProject.productionPlan.outputUnit || 'units'})`} type="number" placeholder="Enter value" min={0} value={currentProject.marketPlan.expectedPurchaseVolumePerCycle || ''} onChange={value => updateMarket({ expectedPurchaseVolumePerCycle: Number(value) || 0 })} required />
            <p className="sm:col-span-2 -mt-3 text-xs text-neutral-500">Enter a buyer-backed estimate. Leaving this at zero keeps projected revenue at zero until likely purchase volume is confirmed.</p>
            <InputField label="Distance to primary market" type="number" placeholder="Enter value" min={0} value={currentProject.marketPlan.distanceToMarketKm || ''} onChange={value => updateMarket({ distanceToMarketKm: Number(value) || 0 })} suffix="km" />
            <SelectField label="Sales and delivery method" value={currentProject.marketPlan.salesMethod} onChange={value => updateMarket({ salesMethod: value as FarmProject['marketPlan']['salesMethod'] })} options={[
              { value: 'Farm gate pickup', label: 'Farm gate pickup' }, { value: 'Direct delivery to factory', label: 'Direct delivery to buyer or processor' },
              { value: 'Wholesale market hub', label: 'Wholesale market hub' },
            ]} />
            <div className="sm:col-span-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs leading-relaxed text-blue-900">
              Market estimates are based on your answers. Validate expected price and purchase volume with buyers before relying on projected revenue.
            </div>
          </div>
        )}

        {step.key === 'production' && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-neutral-800">What type of farm are you planning?</p>
              <RadioCards name="Farm type" value={currentProject.farmType} onChange={setFarmType} options={FARM_TYPES.map(type => ({
                value: type,
                label: type,
                description: type === 'Crop Production' ? 'Field and horticultural crops' :
                  type === 'Greenhouse Farming' ? 'Protected crop production' :
                  type === 'Fish Farming' ? 'Aquaculture production' :
                  type === 'Livestock' || type === 'Poultry' ? 'Animal production systems' :
                  type === 'Irrigation Project' ? 'Water and irrigation-supported production' :
                  type === 'Farm Machinery' ? 'Agricultural equipment or mechanization services' :
                  type === 'Agro-Processing' ? 'Processing and value addition' :
                  type === 'Storage & Warehousing' ? 'Storage and post-harvest services' : 'Expansion of an existing farm enterprise',
              }))} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Primary purpose" value={currentProject.farmDetails.primaryPurpose} required onChange={value => updateDetails({ primaryPurpose: value as FarmProject['farmDetails']['primaryPurpose'] })} options={(['Investment', 'Livelihood', 'Retirement', 'Legacy', 'Social impact', 'Expansion'] as const).map(value => ({ value, label: value }))} />
              <InputField label="Expected farm start date" type="date" value={currentProject.farmDetails.expectedStartDate} onChange={value => updateDetails({ expectedStartDate: value })} required />
              <SelectField label={
                currentProject.farmType === 'Poultry' ? 'Poultry enterprise' :
                  currentProject.farmType === 'Livestock' ? 'Livestock enterprise' :
                    currentProject.farmType === 'Fish Farming' ? 'Aquatic product' :
                      currentProject.farmType === 'Farm Machinery' ? 'Service or machinery offered' :
                        currentProject.farmType === 'Agro-Processing' ? 'Commodity to process' :
                          currentProject.farmType === 'Storage & Warehousing' ? 'Product to store' : 'Crop or farm produce'
              } value={currentProject.farmDetails.targetProduce} required onChange={value => {
                updateDetails({ targetProduce: value });
                updateProduction({ product: value });
              }} options={produceOptions.map(value => ({ value, label: value }))} placeholder="Choose a product or service" />
              <InputField label="Production method" value={currentProject.productionPlan.productionMethod} onChange={value => updateProduction({ productionMethod: value })} required placeholder="e.g. Open-field, semi-mechanized" />
              <InputField label="Farm size" type="number" placeholder="Enter value" min={0} step={0.5} value={currentProject.farmDetails.farmSize || ''} onChange={value => {
                const size = Number(value) || 0;
                updateDetails({ farmSize: size });
                if (AREA_CAPACITY_TYPES.includes(currentProject.farmType)) updateProduction({ capacity: size, capacityUnit: currentProject.farmDetails.sizeUnit });
              }} required suffix={currentProject.farmDetails.sizeUnit} />
              {!AREA_CAPACITY_TYPES.includes(currentProject.farmType) && <InputField label="Facility or service capacity per cycle" type="number" placeholder="Enter value" min={0} value={currentProject.productionPlan.capacity || ''} onChange={value => updateProduction({ capacity: Number(value) || 0 })} required suffix={currentProject.productionPlan.capacityUnit} />}
              <SelectField label="Production cycles per year" value={currentProject.productionPlan.cyclesPerYear || ''} required onChange={value => updateProduction({ cyclesPerYear: Number(value) || 0 })} options={[1, 2, 3, 4].map(value => ({ value, label: `${value}${value === 4 ? '+' : ''} cycle${value === 1 ? '' : 's'}` }))} />
              <InputField label="Gestation / growth period" type="number" placeholder="Enter value" min={1} value={currentProject.productionPlan.gestationMonths || ''} onChange={value => updateProduction({ gestationMonths: Number(value) || 0 })} required suffix="months" />
              <InputField label="Harvest / sales frequency" type="number" placeholder="Enter value" min={1} value={currentProject.productionPlan.salesFrequencyMonths || ''} onChange={value => updateProduction({ salesFrequencyMonths: Number(value) || 0 })} required suffix="months" />
              <InputField label="Expected output per cycle" type="number" placeholder="Enter value" min={0} value={currentProject.productionPlan.expectedOutputPerCycle || ''} onChange={value => updateProduction({ expectedOutputPerCycle: Number(value) || 0 })} required suffix={currentProject.productionPlan.outputUnit} />
              <InputField label="Expected production or post-harvest loss" type="number" placeholder="Enter value" min={0} step={0.5} value={currentProject.productionPlan.expectedLossPercent || ''} onChange={value => updateProduction({ expectedLossPercent: Number(value) || 0 })} suffix="%" />
            </div>
            <InputField label="Key production assumptions" value={currentProject.productionPlan.keyAssumptions} onChange={value => updateProduction({ keyAssumptions: value })} placeholder="Optional: season, breed/variety, feed or input assumptions" />
          </div>
        )}

        {step.key === 'financial' && (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <InputField label="Available capital or equity committed" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.availableCapital || ''} onChange={value => updateFinancial({ availableCapital: Number(value) || 0 })} required suffix="₦" />
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-xs font-semibold text-emerald-900">Calculated startup investment</p>
                <p className="mt-1 font-mono text-xl font-bold text-emerald-900">{formatNaira(metrics.totalStartupCapital)}</p>
                <p className="mt-1 text-[11px] text-emerald-800">Land, setup, initial inputs, working capital and contingency</p>
              </div>
            </div>
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-neutral-900">Startup investment (₦)</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600 sm:col-span-2">Enter land purchase as startup investment and annual land rent or lease as an operating cost. Enter ₦0 for whichever does not apply.</p>
                <InputField label="Land purchase" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.landPurchaseCost || ''} onChange={value => updateFinancial({ landPurchaseCost: Number(value) || 0 })} suffix="₦" />
                <InputField label="Annual land rent / lease" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.landRentLeaseCost || ''} onChange={value => updateFinancial({ landRentLeaseCost: Number(value) || 0 })} suffix="₦" />
                <InputField label="Equipment and machinery" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.equipmentMachinery || ''} onChange={value => updateFinancial({ equipmentMachinery: Number(value) || 0 })} suffix="₦" />
                <InputField label="Infrastructure setup" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.infrastructureSetup || ''} onChange={value => updateFinancial({ infrastructureSetup: Number(value) || 0 })} suffix="₦" />
              <InputField label="Initial working capital buffer" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.initialWorkingCapital || ''} onChange={value => updateFinancial({ initialWorkingCapital: Number(value) || 0 })} suffix="₦" />
              <InputField label="Maximum loss you can afford" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.maxAffordableLoss ?? ''} onChange={value => updateFinancial({ maxAffordableLoss: value === '' ? null : Number(value) })} required suffix="₦" />
              <InputField label="Months you can operate before positive cash flow" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.monthsUntilPositiveCashFlow ?? ''} onChange={value => updateFinancial({ monthsUntilPositiveCashFlow: value === '' ? null : Number(value) })} required suffix="months" />
                <InputField label="Land preparation" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.landPreparation || ''} onChange={value => updateFinancial({ landPreparation: Number(value) || 0 })} suffix="₦" />
                <InputField label="Seeds to start with" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.startupSeedsCost || ''} onChange={value => updateFinancial({ startupSeedsCost: Number(value) || 0 })} suffix="₦" />
                <InputField label="One-time setup labour" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.initialLabour || ''} onChange={value => updateFinancial({ initialLabour: Number(value) || 0 })} suffix="₦" />
                <InputField label="Other startup costs" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.otherStartupCosts || ''} onChange={value => updateFinancial({ otherStartupCosts: Number(value) || 0 })} suffix="₦" />
                <InputField label="Startup contingency reserve" type="number" placeholder="Enter value" min={0} value={currentProject.financialModel.startupContingency || ''} onChange={value => updateFinancial({ startupContingency: Number(value) || 0 })} suffix="₦" />
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-neutral-900">Expected annual operating expenses (₦)</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ['labourCost', 'Farm Workers’ Pay'], ['inputsCost', 'Other input costs'], ['seedCost', 'Seeds'],
                  ['fertilizerCost', 'Fertilizer'], ['feedCost', 'Feed'], ['fuelCost', 'Fuel'], ['transportCost', 'Transport'],
                  ['utilitiesCost', 'Other utility costs'], ['electricityCost', 'Electricity'], ['waterCost', 'Water'],
                  ['maintenanceCost', 'Maintenance'], ['packagingStorageCost', 'Packaging and storage'],
                  ['insuranceContingencyCost', 'Insurance and contingency'], ['miscellaneousCost', 'Miscellaneous costs'],
                ] as const).map(([key, label]) => (
                  <InputField key={key} label={label} type="number" placeholder="Enter value" min={0} value={currentProject.financialModel[key] || ''} onChange={value => updateFinancial({ [key]: Number(value) || 0 } as Partial<FarmProject['financialModel']>)} suffix="₦" />
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm sm:grid-cols-3">
              <p>Expected annual revenue <strong className="block font-mono">{formatNaira(metrics.expectedRevenue)}</strong></p>
              <p>Annual operating expenses <strong className="block font-mono">{formatNaira(metrics.annualOperatingExpenses)}</strong></p>
              <p>Estimated operating profit <strong className="block font-mono">{formatNaira(metrics.netProfit)}</strong></p>
            </div>
          </div>
        )}

        {step.key === 'people' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="Who will manage the farm day to day?" value={currentProject.farmDetails.dailyManager} required onChange={value => updateDetails({ dailyManager: value })} options={[
              { value: 'Experienced Farm Manager', label: 'Hired farm manager' }, { value: 'Self (Full-time resident)', label: 'Owner, full-time and on site' },
              { value: 'Self (Part-time / Weekend visits)', label: 'Owner, part-time or remote' }, { value: 'Family Member', label: 'Family member' },
              { value: 'Hired Supervisor', label: 'Hired supervisor' }, { value: 'Not Decided', label: 'Not decided' },
            ]} />
            <SelectField label="Farm management experience" value={currentProject.farmDetails.farmingExperience} required onChange={value => updateDetails({ farmingExperience: value })} options={[
              { value: 'Beginner (<1 yr)', label: 'Beginner (less than 1 year)' }, { value: 'Intermediate (1-3 yrs)', label: 'Intermediate (1–3 years)' },
              { value: 'Experienced (3-5 yrs)', label: 'Experienced (3–5 years)' }, { value: 'Expert (5+ yrs)', label: 'Expert (5+ years)' },
            ]} />
            <div className="sm:col-span-2">
              <InputField label="Who is responsible for daily tasks, worker supervision and reporting?" value={currentProject.farmDetails.managementResponsibilities || ''} onChange={value => updateDetails({ managementResponsibilities: value })} required placeholder="e.g. Farm manager supervises workers and submits weekly production and expense reports" />
            </div>
            <div className="sm:col-span-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
              Assign clear responsibility for daily decisions, worker supervision, input use and reporting. If you plan to manage remotely, identify an on-site contact.
            </div>
          </div>
        )}

        {step.key === 'information' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="How will you keep farm records?" value={currentProject.recordKeepingPlan?.method || ''} required onChange={value => updateInformation({ method: value })} options={[
              { value: 'Paper logbook', label: 'Paper logbook' }, { value: 'Spreadsheet', label: 'Spreadsheet' },
              { value: 'Farm management app', label: 'Farm management app' }, { value: 'Manager or partner reports', label: 'Manager or partner reports' },
              { value: 'Not decided', label: 'Not decided' },
            ]} />
            <SelectField label="How often will you review performance?" value={currentProject.recordKeepingPlan?.reviewFrequency || ''} required onChange={value => updateInformation({ reviewFrequency: value })} options={[
              { value: 'Daily', label: 'Daily' }, { value: 'Weekly', label: 'Weekly' }, { value: 'Monthly', label: 'Monthly' },
              { value: 'At the end of each cycle', label: 'At the end of each cycle' }, { value: 'Not decided', label: 'Not decided' },
            ]} />
            <InputField label="Who will independently check the farm records?" value={currentProject.recordKeepingPlan?.independentVerifier || ''} onChange={value => updateInformation({ independentVerifier: value })} required placeholder="e.g. Owner, accountant, cooperative officer" />
            <InputField label="How will they verify performance?" value={currentProject.recordKeepingPlan?.verificationMethod || ''} onChange={value => updateInformation({ verificationMethod: value })} required placeholder="e.g. Reconcile receipts, sales records and stock counts monthly" />
            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
              {['Production and losses', 'Sales and buyer payments', 'Costs, labour and inventory'].map(item => (
                <div key={item} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700"><Check className="mb-2 h-4 w-4 text-emerald-700" aria-hidden="true" />{item}</div>
              ))}
            </div>
          </div>
        )}

        {step.key === 'infrastructure' && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-neutral-800">What is your land arrangement?</p>
              <RadioCards name="Land arrangement" value={currentProject.farmDetails.landStatus} onChange={value => updateDetails({ landStatus: value as FarmProject['farmDetails']['landStatus'] })} options={[
                { value: 'owned', label: 'Already own land', description: 'Land is already secured.' },
                { value: 'lease_partner', label: 'Lease or partnership', description: 'Use land through a lease or production partnership.' },
                { value: 'plan_to_buy', label: 'Plan to buy land', description: 'Purchase is being considered but not completed.' },
              ]} />
            </div>
            {currentProject.farmDetails.landStatus === 'plan_to_buy' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-950">Compare alternatives before purchasing</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-900">Leasing, partnership, contract production or a smaller pilot may reduce upfront capital needs.</p>
                <button type="button" onClick={() => setShowLandAdvisor(value => !value)} className="mt-2 text-xs font-semibold text-amber-900 underline underline-offset-2">{showLandAdvisor ? 'Hide land advisor' : 'Open land decision advisor'}</button>
                {showLandAdvisor && <div className="mt-4"><LandNeedAdvisor /></div>}
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Farm location (state)" value={currentProject.farmDetails.locationState} required onChange={value => updateDetails({ locationState: value })} options={STATES.map(value => ({ value, label: value }))} />
              <SelectField label="Water availability" value={currentProject.farmDetails.waterAvailability} required onChange={value => updateDetails({ waterAvailability: value })} options={[
                { value: 'Borehole / Well on site', label: 'Borehole or well on site' }, { value: 'River / Stream nearby', label: 'River or stream nearby' },
                { value: 'Seasonal rain only', label: 'Seasonal rain only' }, { value: 'Municipal water', label: 'Municipal water' }, { value: 'None yet', label: 'No water source secured' },
              ]} />
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                Confirm legal access, site suitability, water reliability, storage and transport before committing infrastructure funds.
              </div>
            </div>
          </div>
        )}

        {step.key === 'risk' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="text-sm font-bold text-neutral-900">Farm risks and controls</h3><p className="mt-1 text-xs text-neutral-500">Add the risks most likely to affect this farm and the controls you plan to use.</p></div>
              <button type="button" onClick={addRisk} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"><Plus className="h-4 w-4" />Add a risk</button>
            </div>
            {(currentProject.risks || []).length === 0 && <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">No risks added yet. Add at least one farm-specific risk and planned control.</div>}
            <div className="space-y-3">
              {(currentProject.risks || []).map(risk => (
                <fieldset key={risk.id} className="grid gap-4 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2">
                  <legend className="sr-only">Farm risk</legend>
                  <SelectField label="Risk category" value={risk.category} required onChange={value => updateRisk(risk.id, { category: value })} options={[
                    'Weather / Climate', 'Disease / Pest', 'Market Off-Take', 'Input Prices', 'Theft & Security', 'Transportation', 'Storage Loss', 'Operational / Labour', 'Other',
                  ].map(value => ({ value, label: value }))} />
                  <SelectField label="Exposure" value={risk.exposure} required onChange={value => updateRisk(risk.id, { exposure: value as RiskItem['exposure'] })} options={['Low', 'Medium', 'High'].map(value => ({ value, label: value }))} />
                  <SelectField label="Potential impact" value={risk.impact} required onChange={value => updateRisk(risk.id, { impact: value as RiskItem['impact'] })} options={['Low', 'Medium', 'High'].map(value => ({ value, label: value }))} />
                  <InputField label="Planned risk control" value={risk.plannedControl} onChange={value => updateRisk(risk.id, { plannedControl: value })} required placeholder="e.g. secure a second buyer" />
                  <div className="sm:col-span-2 flex justify-end">
                    <button type="button" onClick={() => removeRisk(risk.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Remove risk</button>
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="grid gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-neutral-800 sm:col-span-2">
                <span className="mb-1.5 block">What conditions would make you stop the project? <span className="text-red-600" aria-hidden="true">*</span></span>
                <textarea rows={3} value={currentProject.exitRedesignExpansion.stopConditions} onChange={event => updateCurrentProject({ exitRedesignExpansion: { ...currentProject.exitRedesignExpansion, stopConditions: event.target.value } })} placeholder="e.g. loss exceeds a defined share of invested capital" className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20" />
              </label>
              <label className="block text-sm font-medium text-neutral-800">
                <span className="mb-1.5 block">When should you redesign the plan?</span>
                <textarea rows={3} value={currentProject.exitRedesignExpansion.redesignConditions} onChange={event => updateCurrentProject({ exitRedesignExpansion: { ...currentProject.exitRedesignExpansion, redesignConditions: event.target.value } })} placeholder="e.g. repeated yield or price below target" className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20" />
              </label>
              <label className="block text-sm font-medium text-neutral-800">
                <span className="mb-1.5 block">What would justify expansion?</span>
                <textarea rows={3} value={currentProject.exitRedesignExpansion.expansionConditions} onChange={event => updateCurrentProject({ exitRedesignExpansion: { ...currentProject.exitRedesignExpansion, expansionConditions: event.target.value } })} placeholder="e.g. validated demand and positive results for two cycles" className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20" />
              </label>
            </div>
          </div>
        )}

        {attemptedContinue && !currentStepComplete && (
          <p className="mt-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="status">
            <AlertCircle className="h-4 w-4 shrink-0" />This system is not complete yet. Your answers are saved; fill the required fields to mark this step complete.
          </p>
        )}
      </section>

      <footer className="sticky bottom-0 z-20 -mx-3 border-t border-neutral-200 bg-white/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-500" aria-live="polite">
            <Save className="h-4 w-4" />{saveMessage}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={saveDraft} className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
              <Save className="h-4 w-4" />Save Draft
            </button>
            <button type="button" disabled={currentStep === 0} onClick={() => { goToStep(currentStep - 1); setAttemptedContinue(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />Previous Step
            </button>
            <button type="button" onClick={continueStep} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700">
              Save &amp; Continue<ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
