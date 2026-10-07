import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { FarmProject, InventoryItem, InventoryMovement } from '../types';
import { emptyProject } from '../data/demoProject';
import { calculateFinancialMetrics } from '../utils/calculations';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

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
  | 'team_access'
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
  team_access: '/team-access', settings: '/settings', help: '/help',
};

const PATH_VIEWS = Object.fromEntries(Object.entries(VIEW_PATHS).map(([view, path]) => [path, view])) as Record<string, AppView>;
const readRoute = (): AppView => PATH_VIEWS[window.location.pathname.replace(/\/$/, '') || '/'] ?? 'landing';

interface FarmProjectContextType {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  currentProject: FarmProject;
  allProjects: FarmProject[];
  selectProject: (id: string) => void;
  updateCurrentProject: (updates: Partial<FarmProject>) => boolean;
  updateWhatIf: (deltas: Partial<FarmProject['whatIf']>) => void;
  resetWhatIf: () => void;
  createNewAssessment: (farmType?: FarmProject['farmType']) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  clearAssessments: () => void;
  inventoryItems: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  recordInventoryMovement: (id: string, movement: Omit<InventoryMovement, 'id'>) => void;
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
  cloudSyncError: string;
  cloudSyncLoading: boolean;
  requiresSignIn: boolean;
  currentProjectIsOwner: boolean;
  currentProjectPermissions: string[];
  currentProjectAccessKnown: boolean;
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
      landPurchaseCost: project.financialModel?.landPurchaseCost ?? (project.farmDetails?.landStatus === 'lease_partner' ? 0 : project.financialModel?.landRentPurchase ?? 0),
      landRentLeaseCost: project.financialModel?.landRentLeaseCost ?? (project.farmDetails?.landStatus === 'lease_partner' ? project.financialModel?.landRentPurchase ?? 0 : 0),
      startupSeedsCost: project.financialModel?.startupSeedsCost ?? (project.farmType?.toLowerCase().includes('fish') || project.farmType?.toLowerCase().includes('livestock') || project.farmType?.toLowerCase().includes('poultry') ? 0 : project.financialModel?.initialInputs ?? 0),
      startupSeedlingsCost: project.financialModel?.startupSeedlingsCost ?? 0,
      startupAnimalsCost: project.financialModel?.startupAnimalsCost ?? (project.farmType?.toLowerCase().includes('livestock') || project.farmType?.toLowerCase().includes('poultry') ? project.financialModel?.initialInputs ?? 0 : 0),
      startupFingerlingsCost: project.financialModel?.startupFingerlingsCost ?? (project.farmType?.toLowerCase().includes('fish') ? project.financialModel?.initialInputs ?? 0 : 0),
      initialInputs: 0,
      initialLabour: project.financialModel?.initialLabour ?? 0,
      otherStartupCosts: project.financialModel?.otherStartupCosts ?? 0,
      startupContingency: project.financialModel?.startupContingency ?? 0,
      seedCost: project.financialModel?.seedCost ?? 0,
      seedlingsCost: project.financialModel?.seedlingsCost ?? 0,
      fertilizerCost: project.financialModel?.fertilizerCost ?? 0,
      manureCost: project.financialModel?.manureCost ?? 0,
      pesticidesCost: project.financialModel?.pesticidesCost ?? 0,
      herbicidesCost: project.financialModel?.herbicidesCost ?? 0,
      feedCost: project.financialModel?.feedCost ?? 0,
      fishFeedCost: project.financialModel?.fishFeedCost ?? 0,
      medicineCost: project.financialModel?.medicineCost ?? 0,
      vaccineCost: project.financialModel?.vaccineCost ?? 0,
      fuelCost: project.financialModel?.fuelCost ?? 0,
      electricityCost: project.financialModel?.electricityCost ?? 0,
      waterCost: project.financialModel?.waterCost ?? 0,
      irrigationCost: project.financialModel?.irrigationCost ?? 0,
      harvestingCost: project.financialModel?.harvestingCost ?? 0,
      processingCost: project.financialModel?.processingCost ?? 0,
      marketFeesCost: project.financialModel?.marketFeesCost ?? 0,
      sellingAgentFeesCost: project.financialModel?.sellingAgentFeesCost ?? 0,
      animalPenCost: project.financialModel?.animalPenCost ?? 0,
      storageShedCost: project.financialModel?.storageShedCost ?? 0,
      securityCost: project.financialModel?.securityCost ?? 0,
      miscellaneousCost: project.financialModel?.miscellaneousCost ?? 0,
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

function buildPatch(previous: unknown, next: unknown): unknown {
  if (JSON.stringify(previous) === JSON.stringify(next)) return undefined;
  if (previous && next && typeof previous === 'object' && typeof next === 'object' && !Array.isArray(previous) && !Array.isArray(next)) {
    const patch: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
      const value = buildPatch((previous as Record<string, unknown>)[key], (next as Record<string, unknown>)[key]);
      if (value !== undefined) patch[key] = value;
    }
    return patch;
  }
  return next;
}

function changedPatchPaths(previous: unknown, patch: unknown, path = ''): string[] {
  if (patch && typeof patch === 'object' && !Array.isArray(patch)) {
    return Object.entries(patch as Record<string, unknown>).flatMap(([key, value]) => changedPatchPaths((previous as Record<string, unknown> | null)?.[key], value, path ? `${path}.${key}` : key));
  }
  return JSON.stringify(previous) === JSON.stringify(patch) ? [] : [path];
}

function permissionNeededForChange(path: string): string | null {
  const [root, child] = path.split('.');
  if (['id', 'name', 'farmType', 'stage', 'progress'].includes(root)) return 'assessment.edit';
  if (root === 'farmDetails') return ['dailyManager', 'managementResponsibilities', 'farmingExperience'].includes(child) ? 'people.edit' : 'infrastructure.edit';
  if (root === 'marketPlan') return 'market.edit';
  if (root === 'productionPlan') return 'production.edit';
  if (root === 'financialModel' || root === 'scenarios' || root === 'whatIf') return 'financial.edit';
  if (root === 'recordKeepingPlan') return 'information.edit';
  if (root === 'risks' || root === 'exitRedesignExpansion') return 'risk.edit';
  if (root === 'toolAnalysis') return child === 'risk' ? 'risk.edit' : child === 'production' ? 'production.edit' : 'financial.edit';
  return null;
}

export const FarmProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading: authLoading } = useAuth();
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

  const [cloudSyncError, setCloudSyncError] = useState('');
  const [cloudSyncLoading, setCloudSyncLoading] = useState(true);
  const [cloudAccessByProject, setCloudAccessByProject] = useState<Record<string, { isOwner: boolean; permissions: string[] }>>({});
  const cloudHydratedUserId = useRef<string | null>(null);
  const lastSyncedWorkspace = useRef<Record<string, { project: FarmProject; inventory: InventoryItem[]; reports: SavedReportItem[] }>>({});
  const [requiresSignIn, setRequiresSignIn] = useState(() => Boolean(localStorage.getItem('farmready_cloud_owner_v1')));
  const currentProjectAccess = cloudAccessByProject[currentProject.id];
  const currentProjectIsOwner = currentProjectAccess?.isOwner === true;
  const currentProjectPermissions = currentProjectAccess?.permissions ?? [];
  const latestWorkspace = useRef({ projects: allProjects, inventory: inventoryByProject, reports: savedReports });
  latestWorkspace.current = { projects: allProjects, inventory: inventoryByProject, reports: savedReports };

  useEffect(() => {
    if (authLoading) return;
    const userId = session?.user.id;
    const supabaseClient = supabase;
    let cancelled = false;
    if (!userId || !supabaseClient) {
      if (!userId && localStorage.getItem('farmready_cloud_owner_v1')) {
        cloudHydratedUserId.current = null;
        setRequiresSignIn(true);
        setAllProjects([]);
        setInventoryByProject({});
        setSavedReports([]);
        setCurrentProjectId(emptyProject.id);
        setCloudAccessByProject({});
      }
      setCloudSyncLoading(false);
      return () => { cancelled = true; };
    }

    const hydrate = async () => {
      setCloudSyncLoading(true);
      setCloudSyncError('');
      try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !sessionData.session?.access_token) throw new Error('Your session has expired. Sign in again.');
        const headers = { Authorization: `Bearer ${sessionData.session.access_token}` };
        const response = await fetch('/api/team/projects', { headers });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Could not load your farms from shared storage.');
        type CloudProject = { id: string; name: string; farmType: FarmProject['farmType']; data?: { project?: FarmProject; inventory?: InventoryItem[]; reports?: SavedReportItem[] }; isOwner?: boolean; permissions?: string[] };
        let cloudProjects: CloudProject[] = Array.isArray(payload.projects) ? payload.projects : [];
        const previousOwnerId = localStorage.getItem('farmready_cloud_owner_v1');
        const legacyProjects = latestWorkspace.current.projects;

        for (const cloudProject of cloudProjects) {
          const legacyProject = legacyProjects.find(project => project.id === cloudProject.id);
          if (!cloudProject.isOwner || cloudProject.data?.project?.id || !legacyProject || (previousOwnerId && previousOwnerId !== userId)) continue;
          const inventory = latestWorkspace.current.inventory[legacyProject.id] ?? [];
          const reports = latestWorkspace.current.reports.filter(report => report.projectId === legacyProject.id);
          const upgrade = await fetch('/api/team/projects', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ project: legacyProject, inventory, reports }) });
          if (!upgrade.ok) throw new Error(`Could not move “${legacyProject.name}” into shared storage.`);
          cloudProject.data = { project: legacyProject, inventory, reports };
        }

        if (cloudProjects.length === 0 && legacyProjects.length > 0 && (!previousOwnerId || previousOwnerId === userId)) {
          const migrated: CloudProject[] = [];
          for (const project of legacyProjects) {
            const migration = await fetch('/api/team/projects', {
              method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({ project, inventory: latestWorkspace.current.inventory[project.id] ?? [], reports: latestWorkspace.current.reports.filter(report => report.projectId === project.id) }),
            });
            if (!migration.ok) {
              const migrationError = await migration.json().catch(() => ({}));
              throw new Error(migrationError.error || `Could not move “${project.name}” into your account.`);
            }
            migrated.push({ id: project.id, name: project.name, farmType: project.farmType, data: { project, inventory: latestWorkspace.current.inventory[project.id] ?? [], reports: latestWorkspace.current.reports.filter(report => report.projectId === project.id) }, isOwner: true, permissions: [] });
          }
          cloudProjects = migrated;
        }
        if (cancelled) return;

        const projects = cloudProjects.map((entry: { id: string; name: string; farmType: FarmProject['farmType']; data?: { project?: FarmProject; inventory?: InventoryItem[]; reports?: SavedReportItem[] }; isOwner?: boolean }) => normalizeProject({ ...emptyProject, ...(entry.data?.project ?? {}), id: entry.id, name: entry.name, farmType: entry.farmType }));
        const projectIds = new Set(projects.map(project => project.id));
        const nextInventory = Object.fromEntries(cloudProjects.map((entry: { id: string; data?: { inventory?: InventoryItem[] } }) => [entry.id, entry.data?.inventory ?? []]));
        const nextReports = cloudProjects.flatMap((entry: { id: string; data?: { reports?: SavedReportItem[] } }) => (entry.data?.reports ?? []).map(report => ({ ...report, projectId: report.projectId || entry.id })));
        lastSyncedWorkspace.current = Object.fromEntries(projects.map(project => [project.id, { project, inventory: nextInventory[project.id] ?? [], reports: nextReports.filter(report => report.projectId === project.id) }]));
        setAllProjects(projects);
        setInventoryByProject(nextInventory);
        setSavedReports(nextReports);
        setCurrentProjectId(previous => projectIds.has(previous) ? previous : projects[0]?.id ?? emptyProject.id);
        setCloudAccessByProject(Object.fromEntries(cloudProjects.map((entry: { id: string; isOwner?: boolean; permissions?: string[] }) => [entry.id, { isOwner: entry.isOwner === true, permissions: entry.permissions ?? [] }])));
        localStorage.setItem('farmready_cloud_owner_v1', userId);
        setRequiresSignIn(true);
        cloudHydratedUserId.current = userId;
      } catch (error) {
        if (!cancelled) setCloudSyncError(error instanceof Error ? error.message : 'Could not load shared farm data.');
      } finally {
        if (!cancelled) setCloudSyncLoading(false);
      }
    };
    void hydrate();
    return () => { cancelled = true; };
  }, [authLoading, session?.user.id]);

  // Sync to local storage
  useEffect(() => {
    if (cloudSyncLoading) return;
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(allProjects));
      if (allProjects.length) localStorage.setItem(STORAGE_KEY_ACTIVE_ID, currentProject.id);
      else localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [allProjects, currentProject.id, cloudSyncLoading]);

  useEffect(() => {
    if (cloudSyncLoading) return;
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventoryByProject));
    } catch (e) {
      console.warn('Inventory storage save failed:', e);
    }
  }, [inventoryByProject, cloudSyncLoading]);

  useEffect(() => {
    try { localStorage.setItem('farmready_profile_v1', JSON.stringify(userProfile)); } catch { /* storage may be unavailable */ }
  }, [userProfile]);

  useEffect(() => {
    try { localStorage.setItem('farmready_preferences_v1', JSON.stringify(appPreferences)); } catch { /* storage may be unavailable */ }
  }, [appPreferences]);

  useEffect(() => {
    if (cloudSyncLoading) return;
    try { localStorage.setItem('farmready_reports_v1', JSON.stringify(savedReports)); } catch { /* storage may be unavailable */ }
  }, [savedReports, cloudSyncLoading]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || cloudSyncLoading || cloudHydratedUserId.current !== userId || !allProjects.length) return;
    const timer = window.setTimeout(async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase!.auth.getSession();
        if (sessionError || !sessionData.session?.access_token) throw new Error('Sign in again to sync farm changes.');
        const headers = { Authorization: `Bearer ${sessionData.session.access_token}`, 'Content-Type': 'application/json' };
        for (const project of allProjects) {
          const data = { project, inventory: inventoryByProject[project.id] ?? [], reports: savedReports.filter(report => report.projectId === project.id) };
          const knownOwner = cloudAccessByProject[project.id]?.isOwner;
          const previous = lastSyncedWorkspace.current[project.id];
          const patch: Record<string, unknown> = {};
          if (previous) {
            const projectPatch = buildPatch(previous.project, project);
            const inventoryPatch = buildPatch(previous.inventory, data.inventory);
            const reportsPatch = buildPatch(previous.reports, data.reports);
            if (projectPatch && Object.keys(projectPatch as object).length) patch.project = projectPatch;
            if (inventoryPatch !== undefined) patch.inventory = inventoryPatch;
            if (reportsPatch !== undefined) patch.reports = reportsPatch;
            if (!Object.keys(patch).length) continue;
          }
          const response = await fetch('/api/team/projects', {
            method: knownOwner === false ? 'PATCH' : 'POST', headers,
            body: JSON.stringify(knownOwner === false ? { projectId: project.id, patch: patch } : data),
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || `Could not sync “${project.name}”.`);
          if (knownOwner !== false) setCloudAccessByProject(previous => ({ ...previous, [project.id]: { isOwner: true, permissions: previous[project.id]?.permissions ?? [] } }));
          const skipped = new Set<string>(payload.skippedSections ?? []);
          lastSyncedWorkspace.current[project.id] = {
            project: previous && skipped.size ? (skipped.has('assessment') || skipped.has('market') || skipped.has('production') || skipped.has('financial') || skipped.has('people') || skipped.has('information') || skipped.has('infrastructure') || skipped.has('risk') ? previous.project : project) : project,
            inventory: skipped.has('inventory') ? previous?.inventory ?? [] : data.inventory,
            reports: skipped.has('reports') ? previous?.reports ?? [] : data.reports,
          };
          if (payload.skippedSections?.length) setCloudSyncError(`Some changes to ${payload.skippedSections.join(', ')} were not saved because this account lacks permission.`);
          else setCloudSyncError('');
        }
      } catch (error) {
        setCloudSyncError(error instanceof Error ? error.message : 'Could not sync your changes.');
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [allProjects, inventoryByProject, savedReports, cloudSyncLoading, session?.user.id, cloudAccessByProject]);

  const activeReport = savedReports.find(report => report.id === activeReportId)?.projectSnapshot ?? null;
  const activeReportInventory = savedReports.find(report => report.id === activeReportId)?.inventorySnapshot ?? [];
  const activeReportEvaluator = savedReports.find(report => report.id === activeReportId)?.evaluatorName ?? null;
  const activeReportGeneratedAt = savedReports.find(report => report.id === activeReportId)?.date ?? null;
  const saveCurrentReport = (snapshot = currentProject) => {
    if (session && cloudAccessByProject[snapshot.id]?.isOwner === false) {
      setCloudSyncError('Only the farm owner can save a readiness report to this farm.');
      return;
    }
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
    const report = savedReports.find(item => item.id === id);
    if (session && report && cloudAccessByProject[report.projectId]?.isOwner === false) {
      setCloudSyncError('Only the farm owner can remove a saved report.');
      return;
    }
    setSavedReports(previous => previous.filter(report => report.id !== id));
    if (activeReportId === id) setActiveReportId(null);
  };

  const selectProject = (id: string) => {
    setActiveReportId(null);
    setCurrentProjectId(id);
  };

  const updateCurrentProject = (updates: Partial<FarmProject>) => {
    if (!allProjects.some(project => project.id === currentProject.id)) {
      setCloudSyncError('Create or select a farm assessment before saving changes.');
      return false;
    }
    if (session && currentProjectAccess && !currentProjectAccess.isOwner) {
      const unauthorized = changedPatchPaths(currentProject, updates).filter(path => {
        const needed = permissionNeededForChange(path);
        return !needed || !currentProjectAccess.permissions.includes(needed);
      });
      if (unauthorized.length) {
        setCloudSyncError('Your access does not allow changing this part of the farm. Ask the owner to update your permissions.');
        return false;
      }
    }
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
    return true;
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
    const newId = `project-${crypto.randomUUID()}`;
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
        landPurchaseCost: 0,
        landRentLeaseCost: 0,
        landPreparation: 0,
        equipmentMachinery: 0,
        infrastructureSetup: 0,
        initialInputs: 0,
        startupSeedsCost: 0,
        startupSeedlingsCost: 0,
        startupAnimalsCost: 0,
        startupFingerlingsCost: 0,
        initialWorkingCapital: 0,
        initialLabour: 0,
        otherStartupCosts: 0,
        startupContingency: 0,
        labourCost: 0,
        inputsCost: 0,
        seedCost: 0,
        seedlingsCost: 0,
        fertilizerCost: 0,
        manureCost: 0,
        pesticidesCost: 0,
        herbicidesCost: 0,
        feedCost: 0,
        fishFeedCost: 0,
        medicineCost: 0,
        vaccineCost: 0,
        fuelCost: 0,
        transportCost: 0,
        utilitiesCost: 0,
        electricityCost: 0,
        waterCost: 0,
        irrigationCost: 0,
        maintenanceCost: 0,
        packagingStorageCost: 0,
        harvestingCost: 0,
        processingCost: 0,
        marketFeesCost: 0,
        sellingAgentFeesCost: 0,
        animalPenCost: 0,
        storageShedCost: 0,
        securityCost: 0,
        insuranceContingencyCost: 0,
        miscellaneousCost: 0,
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
    if (cloudAccessByProject[id]?.isOwner === false) {
      setCloudSyncError('Only the farm owner can delete this project.');
      return;
    }
    if (session && cloudAccessByProject[id]?.isOwner) {
      void (async () => {
        try {
          const { data } = await supabase!.auth.getSession();
          const response = await fetch('/api/team/projects', { method: 'DELETE', headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: id }) });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || 'Could not delete the shared project.');
        } catch (error) { setCloudSyncError(error instanceof Error ? error.message : 'Could not delete the shared project.'); }
      })();
    }
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
      id: `project-${crypto.randomUUID()}`,
      name: `${src.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };
    setAllProjects(prev => [duplicated, ...prev]);
    setCurrentProjectId(duplicated.id);
  };

  const clearAssessments = () => {
    if (allProjects.some(project => cloudAccessByProject[project.id]?.isOwner === false)) {
      setCloudSyncError('Only the farm owner can clear a shared project. Remove or switch shared farms individually.');
      return;
    }
    if (session) for (const project of allProjects) if (cloudAccessByProject[project.id]?.isOwner) deleteProject(project.id);
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

  const canChangeInventory = (permission: string) => {
    if (!session) return true;
    const access = cloudAccessByProject[currentProject.id];
    return !access || access.isOwner || access.permissions.includes(permission);
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    if (!canChangeInventory('inventory.catalog.edit')) { setCloudSyncError('Your access does not allow adding inventory items. Ask the owner to update your permissions.'); return; }
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
    };
    updateProjectInventory(prev => [newItem, ...prev]);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    const permission = 'status' in updates || 'quantity' in updates ? 'inventory.adjust' : 'inventory.catalog.edit';
    if (!canChangeInventory(permission)) { setCloudSyncError('Your access does not allow that inventory update. Ask the owner to update your permissions.'); return; }
    updateProjectInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const recordInventoryMovement = (id: string, movement: Omit<InventoryMovement, 'id'>) => {
    const permission = movement.type === 'Purchase' ? 'inventory.purchase.record' : movement.type === 'Usage' || movement.type === 'Sale' ? 'inventory.usage.record' : movement.type === 'Loss' ? 'inventory.loss.record' : 'inventory.adjust';
    if (!canChangeInventory(permission)) { setCloudSyncError('Your access does not allow recording this inventory movement. Ask the owner to update your permissions.'); return; }
    updateProjectInventory(prev => prev.map(item => {
      if (item.id !== id) return item;
      const quantity = Math.max(0, Number(movement.quantity) || 0);
      const nextQuantity = movement.type === 'Adjustment'
        ? quantity
        : Math.max(0, item.quantity + (movement.type === 'Purchase' ? quantity : -quantity));
      const unitCost = movement.type === 'Purchase' && Number(movement.unitCost) > 0
        ? ((item.quantity * item.unitCost) + quantity * Number(movement.unitCost)) / Math.max(1, item.quantity + quantity)
        : item.unitCost;
      const status: InventoryItem['status'] = nextQuantity <= 0 ? 'Out of Stock' : nextQuantity <= item.reorderPoint ? 'Low Stock' : 'In Stock';
      const entry: InventoryMovement = { ...movement, quantity, id: `move-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
      return {
        ...item,
        quantity: nextQuantity,
        unitCost,
        status,
        supplier: movement.type === 'Purchase' && movement.supplier ? movement.supplier : item.supplier,
        lastPurchaseDate: movement.type === 'Purchase' ? movement.date : item.lastPurchaseDate,
        purchaseReference: movement.type === 'Purchase' && movement.reference ? movement.reference : item.purchaseReference,
        movements: [entry, ...(item.movements ?? [])],
      };
    }));
  };

  const deleteInventoryItem = (id: string) => {
    if (!canChangeInventory('inventory.delete')) { setCloudSyncError('Your access does not allow deleting inventory items. Ask the owner to update your permissions.'); return; }
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
        recordInventoryMovement,
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
        cloudSyncError,
        cloudSyncLoading: cloudSyncLoading || authLoading || Boolean(session?.user.id && cloudHydratedUserId.current !== session.user.id),
        requiresSignIn,
        currentProjectIsOwner,
        currentProjectPermissions,
        currentProjectAccessKnown: Boolean(currentProjectAccess),
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
