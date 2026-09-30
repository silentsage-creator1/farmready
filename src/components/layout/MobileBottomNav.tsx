import React from 'react';
import { useFarmProject, AppView } from '../../context/FarmProjectContext';
import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  Sliders,
  Menu
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView, setIsMobileNavOpen } = useFarmProject();

  const navItems: { view: AppView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'assessments', label: 'Assess', icon: ClipboardList },
    { view: 'financial', label: 'Financial', icon: TrendingUp },
    { view: 'what_if', label: 'Simulator', icon: Sliders },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.view || (item.view === 'assessments' && activeView === 'new_assessment');
        return (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}

      <button
        onClick={() => setIsMobileNavOpen(true)}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">More</span>
      </button>
    </nav>
  );
};
