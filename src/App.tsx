/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FarmProjectProvider, useFarmProject } from './context/FarmProjectContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { AssessmentsView } from './components/assessment/AssessmentsView';
import { AssessmentWizard } from './components/assessment/AssessmentWizard';
import { FinancialAnalysisView } from './components/analysis/FinancialAnalysisView';
import { InvestmentAnalysisView } from './components/analysis/InvestmentAnalysisView';
import { ProductionAnalysisView } from './components/analysis/ProductionAnalysisView';
import { CashFlowView } from './components/analysis/CashFlowView';
import { ScenarioAnalysisView } from './components/analysis/ScenarioAnalysisView';
import { WhatIfSimulatorView } from './components/analysis/WhatIfSimulatorView';
import { RiskAnalysisView } from './components/analysis/RiskAnalysisView';
import { ReadinessReportView } from './components/report/ReadinessReportView';
import { ToolsView } from './components/tools/ToolsView';
import { FarmInventoryView } from './components/tools/FarmInventoryView';
import { ReportsArchiveView } from './components/reports/ReportsArchiveView';
import { ResourcesView } from './components/resources/ResourcesView';
import { ProfileView } from './components/account/ProfileView';
import { TeamAccessView } from './components/account/TeamAccessView';
import { WorkspaceEntryView } from './components/account/WorkspaceEntryView';
import { SettingsView } from './components/account/SettingsView';
import { HelpSupportView } from './components/account/HelpSupportView';
import { LandingPage } from './components/landing/LandingPage';
import { X, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const MainAppContent: React.FC = () => {
  const { activeView, setActiveView, allProjects, currentProjectPermissions, currentProjectIsOwner, currentProjectAccessKnown, cloudSyncError, cloudSyncLoading, requiresSignIn } = useFarmProject();
  const { session, loading: authLoading } = useAuth();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const requiredPermission: Record<string, string> = {
    dashboard: 'project.view', assessments: 'project.view', assessment_list: 'project.view', workspace_entry: 'project.view',
    new_assessment: 'assessment.edit', financial: 'financial.view', cash_flow: 'financial.view', investment_analysis: 'financial.view', scenarios: 'financial.view', what_if: 'financial.view',
    production_analysis: 'production.view', risk_analysis: 'risk.view', report: 'reports.view', reports_archive: 'reports.view',
    tools: 'project.view', inventory: 'inventory.view',
  };
  const accessDenied = Boolean(session && currentProjectAccessKnown && !currentProjectIsOwner && requiredPermission[activeView] && !currentProjectPermissions.includes(requiredPermission[activeView]));

  if (authLoading || cloudSyncLoading) return <div className="grid min-h-screen place-items-center bg-neutral-50 p-6 text-center"><div><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" /><p className="mt-3 text-sm text-neutral-600">Loading your secure farm workspace…</p></div></div>;
  if (requiresSignIn && !session) return <div className="min-h-screen bg-neutral-50 p-4 pt-10"><TeamAccessView /></div>;

  if (activeView === 'landing') {
    return <LandingPage />;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-neutral-100/70 text-neutral-900 select-none-headers">
      {/* Desktop Fixed Sidebar & Mobile Drawer */}
      <Sidebar />

      {/* Main App Canvas: Desktop offset by sidebar width (w-64) */}
      <div className="flex-1 lg:pl-64 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Sticky App Header */}
        <TopHeader />

        {/* Scrollable Viewport for App Views */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-10 scrollbar-thin">
          {cloudSyncError && <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">{cloudSyncError}</div>}
          {accessDenied ? <section className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"><h1 className="text-lg font-bold text-amber-950">You don’t have access to this section</h1><p className="mt-2 text-sm text-amber-900">The farm owner controls which areas each person can view or change. Contact the owner if you need access.</p></section> : <>
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'workspace_entry' && <WorkspaceEntryView />}
          {activeView === 'assessments' && (allProjects.length > 0 ? <AssessmentWizard /> : <AssessmentsView />)}
          {activeView === 'assessment_list' && <AssessmentsView />}
          {activeView === 'new_assessment' && <AssessmentWizard />}
          {activeView === 'financial' && <FinancialAnalysisView />}
          {activeView === 'production_analysis' && <ProductionAnalysisView />}
          {activeView === 'cash_flow' && <CashFlowView />}
          {activeView === 'investment_analysis' && <InvestmentAnalysisView />}
          {activeView === 'scenarios' && <ScenarioAnalysisView />}
          {activeView === 'what_if' && <WhatIfSimulatorView />}
          {activeView === 'risk_analysis' && <RiskAnalysisView />}
          {activeView === 'report' && <ReadinessReportView />}
          {activeView === 'tools' && <ToolsView />}
          {activeView === 'inventory' && <FarmInventoryView />}
          {activeView === 'reports_archive' && <ReportsArchiveView />}
          {activeView === 'resources' && <ResourcesView />}
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'team_access' && <TeamAccessView />}
          {activeView === 'settings' && <SettingsView />}
          {activeView === 'help' && <HelpSupportView />}
          </>}
        </main>

        {/* Native Mobile Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>

      {/* Optional App Guide / How-It-Works Modal for quick onboard */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-lg">FarmReady Decision Framework</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm text-neutral-600">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <p className="font-semibold text-xs uppercase tracking-wider text-emerald-700">Central Principle</p>
                <p className="font-bold text-base mt-1">
                  “What do I need to understand before committing money to this farm?”
                </p>
                <p className="text-xs text-emerald-800 mt-1">
                  FarmReady does not say “Start this farm” or “Do not start this farm”. It equips you to evaluate market, financial, operational and risk readiness.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="font-semibold text-neutral-900 text-xs">1. Market System</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Validated buyers vs assumed demand, price sensitivity.</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="font-semibold text-neutral-900 text-xs">2. Production System</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Capacity, seed rate, cycles, loss allowances.</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="font-semibold text-neutral-900 text-xs">3. Financial System</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Capex, working capital, funding gap, break-even.</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="font-semibold text-neutral-900 text-xs">4. People System</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Daily farm manager, worker roles, skills and accountability.</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="font-semibold text-neutral-900 text-xs">5. Information System</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Records, performance monitoring and decision tracking.</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="font-semibold text-neutral-900 text-xs">6. Infrastructure System</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Land, water, storage, transport, power and equipment.</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="font-semibold text-neutral-900 text-xs">7. Risk-Control System</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Weather, pest, biosecurity, storage loss mitigations.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Back to Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <FarmProjectProvider>
      <MainAppContent />
    </FarmProjectProvider>
  );
}
