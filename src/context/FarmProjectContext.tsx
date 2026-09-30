import React, { createContext, useContext, useState, useEffect } from 'react';
import { FarmProject, InventoryItem } from '../types';
import { emptyProject } from '../data/demoProject';
import { calculateFinancialMetrics } from '../utils/calculations';

export type AppView = 
  | 'landing'
  | 'workspace_entry'
  | 'dashboard'
  | 'assessments'
  | 'assessment_list'
  | 'new_assessment'
  | 'financial'
  | 'production_analysis'
  | 'cash_flow'
  | 'investment_analysis'
  | 'scenarios'
  | 'what_if'
  | 'risk_analysis'
  | 'report'
  | 'tools'
  | 'inventory'
  | 'reports_archive'
  | 'resources'
  | 'profile'
  | 'settings'
  | 'help';

interface SavedReportItem {
  id: string;
  projectId: string;
  projectName: string;
  farmType: string;
  date: string;
  investment: number;
  status: string;
  projectSnapshot: FarmProject;
  inventorySnapshot: InventoryItem[];
  evaluatorName: string;
}

interface UserProfile {
  fullName: string;
  signedInAt?: string;
  email: string;
  phone: string;
  location: string;
  organization: string;
  avatarUrl?: string;
}

interface AppPreferences {
  defaultAreaUnit: FarmProject['farmDetails']['sizeUnit'];
  showActionAlerts: boolean;
}

const VIEW_PATHS: Record<AppView, string> = {
  landing: '/', workspace_entry: '/workspace-entry', dashboard: '/dashboard', assessments: '/assessments', assessment_list: '/assessment-list',
  new_assessment: '/new-assessment', financial: '/financial-analysis', production_analysis: '/production-analysis',
  cash_flow: '/cash-flow', investment_analysis: '/investment-analysis', scenarios: '/scenarios',
  what_if: '/what-if-simulator', risk_analysis: '/risk-analysis', report: '/readiness-report', tools: '/tools',
  inventory: '/inventory', reports_archive: '/saved-reports', resources: '/resources', profile: '/profile',
  settings: '/settings', help: '/help',
};

const PATH_VIEWS = Object.fromEntries(Object.entries(VIEW_PATHS).map(([view, path]) => [path, view])) as Record<string, AppView>;
const readRoute = (): AppView => PATH_VIEWS[window.location.pathname.replace(/\/$/, '') || '/'] ?? 'landing';

interface FarmProjectContextType {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  currentProject: FarmProject;
  allProjects: FarmProject[];
  selectProject: (id: string) => void;
  updateCurrentProject: (updates: Partial<FarmProject>) => void;
  updateWhatIf: (deltas: Partial<FarmProject['whatIf']>) => void;
  resetWhatIf: () => void;
  createNewAssessment: (farmType?: FarmProject['farmType']) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  clearAssessments: () => void;
  inventoryItems: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  savedReports: SavedReportItem[];
  deleteSavedReport: (id: string) => void;
  activeReport: FarmProject | null;
  activeReportInventory: InventoryItem[];
  activeReportEvaluator: string | null;
  activeReportGeneratedAt: string | null;
  openSavedReport: (id: string, action?: 'download' | 'print') => void;
  activeReportAction: 'download' | 'print' | null;
  clearActiveReportAction: () => void;
  saveCurrentReport: (snapshot?: FarmProject) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  appPreferences: AppPreferences;
  updateAppPreferences: (preferences: Partial<AppPreferences>) => void;
  createWorkspaceBackup: () => string;
  restoreWorkspaceBackup: (backup: string) => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
}

const FarmProjectContext = createContext<FarmProjectContextType | undefined>(undefined);

const STORAGE_KEY_PROJECTS = 'farmready_projects_v1';
const STORAGE_KEY_ACTIVE_ID = 'farmready_active_id_v1';
const STORAGE_KEY_INVENTORY = 'farmready_inventory_v1';
const LEGACY_SEED_PROJECT_IDS = new Set(['demo-maize-001', 'farmready-starter-001']);
// Earlier builds created an assessment immediately on entry and named it from
// the selected farm type. Remove only those exact generated placeholders.
const GENERATED_PLACEHOLDER_NAMES = new Set([
  'New Crop Production Project',
  'New Livestock Project',
  'New Poultry Project',
  'New Fish Farming Project',
  'New Greenhouse Farming Project',
  'New Irrigation Project Project',
  'New Farm Machinery Project',
  'New Agro-Processing Project',
  'New Storage & Warehousing Project',
  'New Farm Expansion Project',
]);
const isGeneratedPlaceholder = (project: Pick<FarmProject, 'id' | 'name' | 'isDemo'>) =>
  LEGACY_SEED_PROJECT_IDS.has(project.id) || Boolean(project.isDemo) || GENERATED_PLACEHOLDER_NAMES.has(project.name.trim());
const defaultUserProfile: UserProfile = { fullName: '', email: '', phone: '', location: '', organization: '', avatarUrl: '' };
const defaultAppPreferences: AppPreferences = { defaultAreaUnit: 'hectares', showActionAlerts: true };

function normalizeProject(project: FarmProject): FarmProject {
  const savedRisk = project.toolAnalysis?.risk;
  const legacyRiskFactors = Array.isArray(savedRisk?.factors) ? savedRisk.factors : [];
  let toolAnalysis = project.toolAnalysis;
  if (savedRisk && savedRisk.averageRating == null && typeof savedRisk.score === 'number') {
    const averageRating = savedRisk.score;
    const score = legacyRiskFactors.length === 6 ? averageRating * 20 : null;
    const band = score == null ? 'Not assessed' : score <= 20 ? 'Very Low' : score <= 40 ? 'Low' : score <= 60 ? 'Moderate' : score <= 80 ? 'High' : 'Very High';
    toolAnalysis = { ...project.toolAnalysis, risk: { ...savedRisk, averageRating, score, band } };
  }
  return {
    ...emptyProject,
    ...project,
    toolAnalysis,
    farmDetails: { ...emptyProject.farmDetails, ...(project.farmDetails ?? {}) },
    productionPlan: { ...emptyProject.productionPlan, ...(project.productionPlan ?? {}) },
    marketPlan: {
      ...emptyProject.marketPlan,
      ...(project.marketPlan ?? {}),
      // Missing legacy buyer volume stays unknown; never infer demand from planned output.
      expectedPurchaseVolumePerCycle: project.marketPlan?.expectedPurchaseVolumePerCycle ?? 0,
    },
    financialModel: {
      ...emptyProject.financialModel,
      ...(project.financialModel ?? {}),
      initialLabour: project.financialModel?.initialLabour ?? 0,
      otherStartupCosts: project.financialModel?.otherStartupCosts ?? 0,
      startupContingency: project.financialModel?.startupContingency ?? 0,
      maxAffordableLoss: project.financialModel?.maxAffordableLoss ?? null,
      monthsUntilPositiveCashFlow: project.financialModel?.monthsUntilPositiveCashFlow ?? null,
      financing: { ...emptyProject.financialModel.financing, ...(project.financialModel?.financing ?? {}) },
    },
    recordKeepingPlan: { ...emptyProject.recordKeepingPlan, ...(project.recordKeepingPlan ?? {}) },
    exitRedesignExpansion: { ...emptyProject.exitRedesignExpansion, ...(project.exitRedesignExpansion ?? {}) },
    risks: project.risks ?? [],
    scenarios: { ...emptyProject.scenarios, ...(project.scenarios ?? {}), saved: project.scenarios?.saved ?? [] },
    whatIf: { ...emptyProject.whatIf, ...(project.whatIf ?? {}) },
    landEvaluation: { ...emptyProject.landEvaluation, ...(project.landEvaluation ?? {}) },
  };
}

export const FarmProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveViewState] = useState<AppView>(readRoute);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [activeReportAction, setActiveReportAction] = useState<'download' | 'print' | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const setActiveView = (view: AppView) => {
    if (view !== 'report') setActiveReportId(null);
    setActiveViewState(view);
    const path = VIEW_PATHS[view];
    if (window.location.pathname !== path) window.history.pushState({ view }, '', path);
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveReportId(null);
      setActiveViewState(readRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Restore only user-created projects. Demo and generated starter records are not real assessments.
  const [allProjects, setAllProjects] = useState<FarmProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seededProjects = parsed.some((project: FarmProject) => isGeneratedPlaceholder(project));
          if (seededProjects) {
            for (let index = localStorage.length - 1; index >= 0; index -= 1) {
              const key = localStorage.key(index);
              if (key?.startsWith('farmready_assessment_step_')) localStorage.removeItem(key);
            }
          }
          return parsed
            .filter((project: FarmProject) => !isGeneratedPlaceholder(project))
            .map((project: FarmProject) => normalizeProject(project));
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId && !LEGACY_SEED_PROJECT_IDS.has(savedId)) {
        const storedProjects = JSON.parse(localStorage.getItem(STORAGE_KEY_PROJECTS) || '[]') as FarmProject[];
        const savedProject = storedProjects.find(project => project.id === savedId);
        if (!savedProject || !isGeneratedPlaceholder(savedProject)) return savedId;
      }
    } catch {
      // fallback
    }
    return emptyProject.id;
  });

  const currentProject = allProjects.find(p => p.id === currentProjectId) || allProjects[0] || emptyProject;

  // Inventory is scoped to each farm project. Migrate the older shared array to the demo project.
  const [inventoryByProject, setInventoryByProject] = useState<Record<string, InventoryItem[]>>(() => {
    try {
      const savedInv = localStorage.getItem(STORAGE_KEY_INVENTORY);
      if (savedInv) {
        const parsed = JSON.parse(savedInv);
        if (Array.isArray(parsed)) return parsed.length ? { [currentProjectId]: parsed as InventoryItem[] } : {};
        if (parsed && typeof parsed === 'object') {
          const projectIds = new Set(allProjects.map(project => project.id));
          return Object.fromEntries(Object.entries(parsed as Record<string, InventoryItem[]>).filter(([projectId]) => projectIds.has(projectId)));
        }
      }
    } catch {
      // fallback
    }
    return {};
  });
  const inventoryItems = inventoryByProject[currentProject.id] ?? [];

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('farmready_profile_v1');
      if (saved) return { ...defaultUserProfile, ...JSON.parse(saved) };
    } catch { /* use local defaults */ }
    return defaultUserProfile;
  });
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(() => {
    try {
      const saved = localStorage.getItem('farmready_preferences_v1');
      if (saved) return { ...defaultAppPreferences, ...JSON.parse(saved) };
    } catch { /* use defaults */ }
    return defaultAppPreferences;
  });

  const [savedReports, setSavedReports] = useState<SavedReportItem[]>(() => {
    try {
      const saved = localStorage.getItem('farmready_reports_v1');
      if (saved) {
        const reports = JSON.parse(saved) as SavedReportItem[];
        const projects = JSON.parse(localStorage.getItem(STORAGE_KEY_PROJECTS) || '[]') as FarmProject[];
        const placeholders = new Set(projects.filter(isGeneratedPlaceholder).map(project => project.id));
        if (placeholders.size > 0) {
          const retainedReports = reports.filter(report => !placeholders.has(report.projectId));
          localStorage.setItem('farmready_reports_v1', JSON.stringify(retainedReports));
          for (let index = localStorage.length - 1; index >= 0; index -= 1) {
            const key = localStorage.key(index);
            if (key?.startsWith('farmready_assessment_step_') && Array.from(placeholders).some(id => key.includes(id))) localStorage.removeItem(key);
          }
          return retainedReports.filter(report => !!report.projectSnapshot).map(report => ({ ...report, inventorySnapshot: report.inventorySnapshot ?? [], evaluatorName: report.evaluatorName ?? '' }));
        }
        return reports.filter(report => !!report.projectSnapshot).map(report => ({ ...report, inventorySnapshot: report.inventorySnapshot ?? [], evaluatorName: report.evaluatorName ?? '' }));
      }
    } catch { /* start with an empty archive */ }
    return [];
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(allProjects));
      if (allProjects.length) localStorage.setItem(STORAGE_KEY_ACTIVE_ID, currentProject.id);
      else localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [allProjects, currentProject.id]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventoryByProject));
    } catch (e) {
      console.warn('Inventory storage save failed:', e);
    }
  }, [inventoryByProject]);

  useEffect(() => {
    try { localStorage.setItem('farmready_profile_v1', JSON.stringify(userProfile)); } catch { /* storage may be unavailable */ }
  }, [userProfile]);

  useEffect(() => {
    try { localStorage.setItem('farmready_preferences_v1', JSON.stringify(appPreferences)); } catch { /* storage may be unavailable */ }
  }, [appPreferences]);

  useEffect(() => {
    try { localStorage.setItem('farmready_reports_v1', JSON.stringify(savedReports)); } catch { /* storage may be unavailable */ }
  }, [savedReports]);

  const activeReport = savedReports.find(report => report.id === activeReportId)?.projectSnapshot ?? null;
  const activeReportInventory = savedReports.find(report => report.id === activeReportId)?.inventorySnapshot ?? [];
  const activeReportEvaluator = savedReports.find(report => report.id === activeReportId)?.evaluatorName ?? null;
  const activeReportGeneratedAt = savedReports.find(report => report.id === activeReportId)?.date ?? null;
  const saveCurrentReport = (snapshot = currentProject) => {
    const metrics = calculateFinancialMetrics(snapshot);
    const report: SavedReportItem = {
      id: `report-${snapshot.id}-${Date.now()}`,
      projectId: snapshot.id,
      projectName: snapshot.name,
      farmType: snapshot.farmType,
      date: new Date().toISOString(),
      investment: metrics.totalStartupCapital,
      status: snapshot.progress >= 100 ? 'Assessment completed' : 'Draft report',
      projectSnapshot: JSON.parse(JSON.stringify(snapshot)),
      inventorySnapshot: JSON.parse(JSON.stringify(inventoryByProject[snapshot.id] ?? [])),
      evaluatorName: userProfile.fullName,
    };
    setSavedReports(previous => [report, ...previous]);
    setActiveReportId(report.id);
  };

  const openSavedReport = (id: string, action?: 'download' | 'print') => {
    if (!savedReports.some(report => report.id === id)) return;
    setActiveReportId(id);
    setActiveReportAction(action ?? null);
    setActiveView('report');
  };

  const clearActiveReportAction = () => setActiveReportAction(null);

  const deleteSavedReport = (id: string) => {
    setSavedReports(previous => previous.filter(report => report.id !== id));
    if (activeReportId === id) setActiveReportId(null);
  };

  const selectProject = (id: string) => {
    setActiveReportId(null);
    setCurrentProjectId(id);
  };

  const updateCurrentProject = (updates: Partial<FarmProject>) => {
    setAllProjects(prev => prev.map(p => {
      if (p.id === currentProject.id) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    }));
  };

  const updateWhatIf = (deltas: Partial<FarmProject['whatIf']>) => {
    updateCurrentProject({
      whatIf: {
        ...currentProject.whatIf,
        ...deltas,
      }
    });
  };

  const resetWhatIf = () => {
    updateCurrentProject({
      whatIf: {
        priceDeltaPercent: 0,
        yieldDeltaPercent: 0,
        inputCostDeltaPercent: 0,
        labourCostDeltaPercent: 0,
      }
    });
  };

  const createNewAssessment = (farmType: FarmProject['farmType'] = 'Crop Production') => {
    const newId = `project-${Date.now()}`;
    const newProj: FarmProject = {
      id: newId,
    name: 'Untitled Assessment',
      farmType,
      stage: 'Your Farm',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
      farmDetails: {
        farmName: '',
        targetProduce: '',
        primaryPurpose: 'Investment',
        expectedStartDate: new Date().toISOString().split('T')[0],
        landStatus: '' as FarmProject['farmDetails']['landStatus'],
        locationState: '',
        farmSize: 0,
        sizeUnit: appPreferences.defaultAreaUnit,
        dailyManager: '',
        farmingExperience: '',
        waterAvailability: '',
        irrigationPresent: false,
        existingEquipment: [],
      },
      productionPlan: {
        product: '',
        productionMethod: '',
        capacity: 0,
        capacityUnit: 'hectares',
        cyclesPerYear: 0,
        gestationMonths: 0,
        salesFrequencyMonths: 0,
        expectedOutputPerCycle: 0,
        outputUnit: 'tonnes',
        expectedLossPercent: 0,
        keyAssumptions: '',
      },
      marketPlan: {
        targetCustomer: '',
        buyerType: '' as FarmProject['marketPlan']['buyerType'],
        customerValidationStatus: '' as FarmProject['marketPlan']['customerValidationStatus'],
        expectedPurchaseVolumePerCycle: 0,
        expectedSellingPrice: 0,
        distanceToMarketKm: 0,
        salesMethod: '' as FarmProject['marketPlan']['salesMethod'],
        existingBuyerRelationships: '',
        processingOpportunities: '',
      },
      financialModel: {
        availableCapital: 0,
        additionalCapitalAvailable: 0,
        maxAffordableLoss: null,
        monthsUntilPositiveCashFlow: null,
        landRentPurchase: 0,
        landPreparation: 0,
        equipmentMachinery: 0,
        infrastructureSetup: 0,
        initialInputs: 0,
        initialWorkingCapital: 0,
        initialLabour: 0,
        otherStartupCosts: 0,
        startupContingency: 0,
        labourCost: 0,
        inputsCost: 0,
        transportCost: 0,
        utilitiesCost: 0,
        maintenanceCost: 0,
        packagingStorageCost: 0,
        insuranceContingencyCost: 0,
        customExpenses: [],
        financing: {
          hasLoan: false,
          loanAmount: 0,
          interestRatePercent: 12,
          durationMonths: 12,
          repaymentFrequency: 'monthly',
          gracePeriodMonths: 0,
        },
      },
      risks: [],
      recordKeepingPlan: { method: '', reviewFrequency: '' },
      exitRedesignExpansion: {
        stopConditions: '',
        redesignConditions: '',
        expansionConditions: '',
        expansionCapitalRequired: 0,
      },
      scenarios: {
        conservative: { yield: 0, price: 0, label: 'Conservative' },
        expected: { yield: 0, price: 0, label: 'Expected' },
        optimistic: { yield: 0, price: 0, label: 'Optimistic' },
      },
      whatIf: {
        priceDeltaPercent: 0,
        yieldDeltaPercent: 0,
        inputCostDeltaPercent: 0,
        labourCostDeltaPercent: 0,
      },
      landEvaluation: {
        alreadyOwns: false,
        longTermEssential: false,
        comparedLeaseVsBuy: false,
        capitalHeavy: true,
      },
    };

    setAllProjects(prev => [newProj, ...prev]);
    setCurrentProjectId(newId);
    setActiveView('new_assessment');
  };

  const deleteProject = (id: string) => {
    const remaining = allProjects.filter(p => p.id !== id);
    const deletedReportIds = new Set(savedReports.filter(report => report.projectId === id).map(report => report.id));
    setAllProjects(remaining);
    setInventoryByProject(previous => Object.fromEntries(Object.entries(previous).filter(([projectId]) => projectId !== id)));
    setSavedReports(previous => previous.filter(report => report.projectId !== id));
    setActiveReportId(previous => previous && deletedReportIds.has(previous) ? null : previous);
    try { localStorage.removeItem(`farmready_assessment_step_${id}`); } catch { /* browser storage can be unavailable */ }
    if (currentProjectId === id) setCurrentProjectId(remaining[0]?.id ?? emptyProject.id);
  };

  const duplicateProject = (id: string) => {
    const src = allProjects.find(p => p.id === id);
    if (!src) return;
    const duplicated: FarmProject = {
      ...JSON.parse(JSON.stringify(src)),
      id: `copy-${Date.now()}`,
      name: `${src.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };
    setAllProjects(prev => [duplicated, ...prev]);
    setCurrentProjectId(duplicated.id);
  };

  const clearAssessments = () => {
    setAllProjects([]);
    setCurrentProjectId(emptyProject.id);
    setInventoryByProject({});
    setSavedReports([]);
    setActiveReportId(null);
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('farmready_assessment_step_')) localStorage.removeItem(key);
    }
    setActiveView('dashboard');
  };

  const updateProjectInventory = (update: (items: InventoryItem[]) => InventoryItem[]) => {
    setInventoryByProject(previous => ({ ...previous, [currentProject.id]: update(previous[currentProject.id] ?? []) }));
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
    };
    updateProjectInventory(prev => [newItem, ...prev]);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    updateProjectInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteInventoryItem = (id: string) => {
    updateProjectInventory(prev => prev.filter(item => item.id !== id));
  };

  const updateUserProfile = (profile: Partial<FarmProjectContextType['userProfile']>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
  };

  const updateAppPreferences = (preferences: Partial<AppPreferences>) => setAppPreferences(previous => ({ ...previous, ...preferences }));

  const createWorkspaceBackup = () => JSON.stringify({
    format: 'farmready-workspace', version: 1, exportedAt: new Date().toISOString(),
    projects: allProjects, activeProjectId: currentProject.id, inventoryByProject, savedReports, userProfile, appPreferences,
  }, null, 2);

  const restoreWorkspaceBackup = (raw: string) => {
    const backup = JSON.parse(raw) as { format?: string; version?: number; projects?: FarmProject[]; activeProjectId?: string; inventoryByProject?: Record<string, InventoryItem[]>; savedReports?: SavedReportItem[]; userProfile?: Partial<UserProfile>; appPreferences?: Partial<AppPreferences> };
    if (backup.format !== 'farmready-workspace' || backup.version !== 1 || !Array.isArray(backup.projects) || backup.projects.length === 0) {
      throw new Error('This file is not a valid FarmReady workspace backup.');
    }
    const projects = backup.projects.map(normalizeProject);
    const projectIds = new Set(projects.map(project => project.id));
    setAllProjects(projects);
    setCurrentProjectId(backup.activeProjectId && projectIds.has(backup.activeProjectId) ? backup.activeProjectId : projects[0].id);
    setInventoryByProject(backup.inventoryByProject && typeof backup.inventoryByProject === 'object' ? backup.inventoryByProject : {});
    setSavedReports(Array.isArray(backup.savedReports) ? backup.savedReports.filter(report => !!report.projectSnapshot).map(report => ({ ...report, projectSnapshot: normalizeProject(report.projectSnapshot), inventorySnapshot: report.inventorySnapshot ?? [], evaluatorName: report.evaluatorName ?? '' })) : []);
    setUserProfile({ ...defaultUserProfile, ...(backup.userProfile ?? {}) });
    const importedPreferences = backup.appPreferences ?? {};
    setAppPreferences({ ...defaultAppPreferences, ...importedPreferences, defaultAreaUnit: ['hectares', 'acres', 'plots'].includes(String(importedPreferences.defaultAreaUnit)) ? importedPreferences.defaultAreaUnit as AppPreferences['defaultAreaUnit'] : defaultAppPreferences.defaultAreaUnit });
    setActiveReportId(null);
    setActiveView('dashboard');
  };

  return (
    <FarmProjectContext.Provider
      value={{
        activeView,
        setActiveView,
        currentProject,
        allProjects,
        selectProject,
        updateCurrentProject,
        updateWhatIf,
        resetWhatIf,
        createNewAssessment,
        deleteProject,
        duplicateProject,
        clearAssessments,
        inventoryItems,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        savedReports,
        deleteSavedReport,
        activeReport,
        activeReportInventory,
        activeReportEvaluator,
        activeReportGeneratedAt,
        openSavedReport,
        activeReportAction,
        clearActiveReportAction,
        saveCurrentReport,
        userProfile,
        updateUserProfile,
        appPreferences,
        updateAppPreferences,
        createWorkspaceBackup,
        restoreWorkspaceBackup,
        isMobileNavOpen,
        setIsMobileNavOpen,
      }}
    >
      {children}
    </FarmProjectContext.Provider>
  );
};

export const useFarmProject = () => {
  const context = useContext(FarmProjectContext);
  if (!context) {
    throw new Error('useFarmProject must be used within a FarmProjectProvider');
  }
  return context;
};
