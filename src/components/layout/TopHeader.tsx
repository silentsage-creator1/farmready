import React, { useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { Menu, Bell, Plus, ChevronDown, Check, Sprout } from 'lucide-react';
import { calculateFinancialMetrics, formatNaira } from '../../utils/calculations';
import { calculateAssessmentProgress, evaluateSevenSystems } from '../../utils/readiness';

export const TopHeader: React.FC = () => {
  const {
    activeView,
    setActiveView,
    currentProject,
    allProjects,
    selectProject,
    createNewAssessment,
    userProfile,
    appPreferences,
    setIsMobileNavOpen,
  } = useFarmProject();

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const metrics = calculateFinancialMetrics(currentProject);
  const assessmentProgress = calculateAssessmentProgress(currentProject);
  const notifications = allProjects.length > 0 && appPreferences.showActionAlerts ? [
    ...(metrics.fundingGap > 0 ? [{ title: 'Funding Gap Unresolved', body: `${formatNaira(metrics.fundingGap)} remains unfunded in ${currentProject.name}. Confirm funding before committing.` }] : []),
    ...evaluateSevenSystems(currentProject).filter(system => system.status !== 'Prepared').slice(0, 2).map(system => ({ title: `${system.systemName}: ${system.status}`, body: system.nextAction })),
    ...(assessmentProgress < 100 ? [{ title: `Assessment ${assessmentProgress}% Complete`, body: 'Complete the remaining project questions to strengthen the readiness report.' }] : []),
  ] : [];

  const getTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Dashboard';
      case 'assessments': return 'Your Farm Assessments';
      case 'new_assessment': return 'Farm Investment Assessment';
      case 'financial': return 'Financial Analysis';
      case 'production_analysis': return 'Production Analysis';
      case 'cash_flow': return 'Cash Flow Analysis';
      case 'investment_analysis': return 'Investment Analysis';
      case 'scenarios': return 'Scenario Analysis';
      case 'what_if': return 'What-If Simulator';
      case 'risk_analysis': return 'Risk Analysis';
      case 'report': return 'Farm Investment Readiness Report';
      case 'tools': return 'Practical Tools for Farm Planning';
      case 'inventory': return 'Farm Inventory Management';
      case 'reports_archive': return 'Saved Readiness Reports';
      case 'resources': return 'Agribusiness Knowledge Hub';
      case 'profile': return 'User Profile';
      case 'settings': return 'Platform Settings';
      case 'help': return 'Help & Support';
      default: return 'FarmReady Nigeria';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
      {/* Left zone: mobile hamburger & page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="lg:hidden p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight leading-snug">
            {getTitle()}
          </h1>
          <p className="text-xs text-neutral-500 hidden sm:block">
            {allProjects.length > 0 ? <>Project: <span className="font-semibold text-neutral-800">{currentProject.name}</span></> : 'No farm project yet'}
            {currentProject.isDemo && (
              <span className="ml-2 inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Demo
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right zone: Local-save indicator, Project Selector, New Assessment CTA, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Local storage indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 rounded-full text-[11px] text-neutral-600 font-medium border border-neutral-200">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
          <span>Saved locally</span>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-700 font-mono font-semibold">NGN ₦</span>
        </div>

        {/* Project Switcher Dropdown */}
        {allProjects.length > 0 && <div className="relative">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span className="max-w-[130px] truncate">{currentProject.name}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {isProjectDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setIsProjectDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                Switch Project
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {allProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectProject(p.id);
                      setIsProjectDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  >
                    <div className="truncate pr-2">
                      <p className="font-medium text-neutral-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-neutral-500">{p.farmType} · {p.farmDetails.farmSize} {p.farmDetails.sizeUnit}</p>
                    </div>
                    {p.id === currentProject.id && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-neutral-100">
                <button
                  onClick={() => {
                    createNewAssessment();
                    setIsProjectDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start New Assessment</span>
                </button>
              </div>
            </div>
          )}
        </div>}

        {/* Primary CTA: + New Assessment */}
        <button
          onClick={() => createNewAssessment()}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{allProjects.length > 0 ? 'New Assessment' : 'Start Assessment'}</span>
          <span className="sm:hidden">New</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />}
          </button>

          {isNotificationsOpen && (
            <div
              className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-xl shadow-lg p-3 z-50 text-left"
              onMouseLeave={() => setIsNotificationsOpen(false)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-xs font-bold text-neutral-900">Project Notifications</span>
                <span className="text-[10px] text-neutral-500">{notifications.length} active</span>
              </div>
              <div className="space-y-2.5 pt-2 text-xs">
                {notifications.length ? notifications.map((notice, index) => <div key={`${notice.title}-${index}`} className="p-2 bg-amber-50 rounded-lg border border-amber-100"><p className="font-semibold text-amber-900">{notice.title}</p><p className="text-neutral-600 text-[11px] mt-0.5">{notice.body}</p></div>) : <p className="py-3 text-center text-neutral-500">No open project actions.</p>}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg hover:bg-neutral-100 border border-neutral-200/60 transition-colors"
          >
            <div aria-hidden="true" className="w-7 h-7 sm:w-8 sm:h-8 overflow-hidden rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 shrink-0 grid place-items-center text-[10px] font-bold">
              {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} alt="" className="w-full h-full object-cover" /> : userProfile.fullName.trim().split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'FR'}
            </div>
            <span className="text-xs font-semibold text-neutral-800 hidden md:block">
              {userProfile.fullName.trim().split(/\s+/)[0] || 'Profile'}
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-500 hidden md:block" />
          </button>

          {isUserDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white border border-neutral-200 rounded-xl shadow-lg py-2 z-50"
              onMouseLeave={() => setIsUserDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b border-neutral-100">
                <p className="text-xs font-bold text-neutral-900">{userProfile.fullName}</p>
                <p className="text-[11px] text-neutral-500 truncate">{userProfile.email}</p>
              </div>
              <button
                onClick={() => {
                  setActiveView('profile');
                  setIsUserDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Profile & Bio
              </button>
              <button
                onClick={() => {
                  setActiveView('settings');
                  setIsUserDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Preferences & Units
              </button>
              <div className="border-t border-neutral-100 my-1" />
              <button
                onClick={() => {
                  setActiveView('landing');
                  setIsUserDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
