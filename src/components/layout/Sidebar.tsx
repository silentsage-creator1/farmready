import React from 'react';
import { useFarmProject, AppView } from '../../context/FarmProjectContext';
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  TrendingUp,
  Wheat,
  Activity,
  Boxes,
  PieChart,
  GitBranch,
  Sliders,
  ShieldAlert,
  FileText,
  BookOpen,
  User,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Sprout
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, isMobileNavOpen, setIsMobileNavOpen } = useFarmProject();

  const handleNav = (view: AppView) => {
    setActiveView(view);
    setIsMobileNavOpen(false);
  };

  const navItemClass = (view: AppView) => {
    const isActive = activeView === view || (view === 'assessments' && activeView === 'assessment_list');
    return `group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-emerald-600 text-white font-semibold shadow-sm'
        : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
    }`;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200 border-r border-neutral-800/80">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800/80">
        <button
          onClick={() => handleNav('dashboard')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
              FarmReady
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40">App</span>
            </span>
          </div>
        </button>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileNavOpen(false)}
          className="lg:hidden p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav links scrollable container */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin">
        {/* WORKSPACE */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-3.5 mb-2">
            Workspace
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full ${navItemClass('dashboard')}`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleNav('assessment_list')}
              className={`w-full ${navItemClass('assessments')}`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Assessments</span>
            </button>
            <button
              onClick={() => handleNav('tools')}
              className={`w-full ${navItemClass('tools')}`}
            >
              <Wrench className="w-4 h-4 shrink-0" />
              <span>Tools</span>
            </button>
          </div>
        </div>

        {/* ANALYSIS */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-3.5 mb-2">
            Analysis
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleNav('financial')}
              className={`w-full ${navItemClass('financial')}`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Financial Analysis</span>
            </button>
            <button onClick={() => handleNav('production_analysis')} className={`w-full ${navItemClass('production_analysis')}`}><Wheat className="w-4 h-4 shrink-0" /><span>Production Analysis</span></button>
            <button
              onClick={() => handleNav('investment_analysis')}
              className={`w-full ${navItemClass('investment_analysis')}`}
            >
              <PieChart className="w-4 h-4 shrink-0" />
              <span>Investment Analysis</span>
            </button>
            <button
              onClick={() => handleNav('scenarios')}
              className={`w-full ${navItemClass('scenarios')}`}
            >
              <GitBranch className="w-4 h-4 shrink-0" />
              <span>Scenarios</span>
            </button>
            <button
              onClick={() => handleNav('what_if')}
              className={`w-full ${navItemClass('what_if')}`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>What-If Simulator</span>
            </button>
            <button
              onClick={() => handleNav('risk_analysis')}
              className={`w-full ${navItemClass('risk_analysis')}`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Risk Analysis</span>
            </button>
            <button onClick={() => handleNav('cash_flow')} className={`w-full ${navItemClass('cash_flow')}`}><Activity className="w-4 h-4 shrink-0" /><span>Cash Flow</span></button>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-3.5 mb-2">Farm Management</div>
          <div className="space-y-1"><button onClick={() => handleNav('inventory')} className={`w-full ${navItemClass('inventory')}`}><Boxes className="w-4 h-4 shrink-0" /><span>Inventory</span></button></div>
        </div>

        {/* REPORTS */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-3.5 mb-2">
            Reports
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleNav('report')}
              className={`w-full ${navItemClass('report')}`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Readiness Report</span>
            </button>
            <button
              onClick={() => handleNav('reports_archive')}
              className={`w-full ${navItemClass('reports_archive')}`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Saved Reports</span>
            </button>
          </div>
        </div>

        {/* LEARN */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-3.5 mb-2">
            Learn
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleNav('resources')}
              className={`w-full ${navItemClass('resources')}`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Resources</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Nav Controls */}
      <div className="p-4 border-t border-neutral-800/80 space-y-1 bg-neutral-950">
        <button
          onClick={() => handleNav('profile')}
          className={`w-full ${navItemClass('profile')}`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => handleNav('team_access')}
          className={`w-full ${navItemClass('team_access')}`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>People &amp; Access</span>
        </button>
        <button
          onClick={() => handleNav('settings')}
          className={`w-full ${navItemClass('settings')}`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </button>
        <button
          onClick={() => handleNav('help')}
          className={`w-full ${navItemClass('help')}`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Help & Support</span>
        </button>
        <button
          onClick={() => {
            if (window.confirm('Clear FarmReady projects, inventory, reports, profile, preferences, and saved assessment steps, then restore the default demo workspace? This cannot be undone.')) {
              const farmReadyKeys = ['farmready_projects_v1', 'farmready_active_id_v1', 'farmready_inventory_v1', 'farmready_profile_v1', 'farmready_preferences_v1', 'farmready_reports_v1'];
              farmReadyKeys.forEach(key => localStorage.removeItem(key));
              for (let index = localStorage.length - 1; index >= 0; index -= 1) {
                const key = localStorage.key(index);
                if (key?.startsWith('farmready_assessment_step_')) localStorage.removeItem(key);
              }
              window.location.reload();
            }
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-amber-400 hover:bg-neutral-900 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Reset Workspace</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 h-screen fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-xs h-full z-50 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
