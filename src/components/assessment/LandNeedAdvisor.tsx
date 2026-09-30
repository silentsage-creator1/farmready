import React, { useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { HelpCircle, Check, AlertTriangle, ArrowRight, Lightbulb } from 'lucide-react';

interface LandNeedAdvisorProps {
  onSelectOption?: (option: string) => void;
}

export const LandNeedAdvisor: React.FC<LandNeedAdvisorProps> = ({ onSelectOption }) => {
  const { currentProject, updateCurrentProject } = useFarmProject();
  const evaluation = currentProject.landEvaluation || {
    alreadyOwns: false,
    longTermEssential: false,
    comparedLeaseVsBuy: false,
    capitalHeavy: false,
  };

  const [owns, setOwns] = useState(evaluation.alreadyOwns);
  const [longTerm, setLongTerm] = useState(evaluation.longTermEssential);
  const [compared, setCompared] = useState(evaluation.comparedLeaseVsBuy);
  const [capitalHeavy, setCapitalHeavy] = useState(evaluation.capitalHeavy);
  const [showOptions, setShowOptions] = useState(true);

  const handleUpdate = (key: string, val: boolean) => {
    let nextOwns = owns;
    let nextLongTerm = longTerm;
    let nextCompared = compared;
    let nextCapitalHeavy = capitalHeavy;

    if (key === 'owns') { setOwns(val); nextOwns = val; }
    if (key === 'longTerm') { setLongTerm(val); nextLongTerm = val; }
    if (key === 'compared') { setCompared(val); nextCompared = val; }
    if (key === 'capitalHeavy') { setCapitalHeavy(val); nextCapitalHeavy = val; }

    updateCurrentProject({
      landEvaluation: {
        alreadyOwns: nextOwns,
        longTermEssential: nextLongTerm,
        comparedLeaseVsBuy: nextCompared,
        capitalHeavy: nextCapitalHeavy,
      }
    });
  };

  // Determine intelligent guidance
  const getGuidance = () => {
    if (owns) {
      return {
        badge: 'Land Secured',
        title: 'Focus Capital on Irrigation and Quality Inputs',
        text: 'Since you already control suitable land, preserve your cash for land preparation, soil testing, certified seeds, and water security rather than real estate expansion.',
        primaryOption: 'Utilize Existing Land'
      };
    }
    if (capitalHeavy && !longTerm) {
      return {
        badge: 'High Capital Risk',
        title: 'Agricultural Lease Strongly Advised',
        text: 'Purchasing land may absorb capital needed for operations. Compare the full local cost and terms of purchase, lease, partnership and a smaller pilot before deciding.',
        primaryOption: 'Agricultural Lease'
      };
    }
    if (longTerm) {
      return {
        badge: 'Long-Horizon Enterprise',
        title: 'Evaluate Long-Term Lease or Staged Purchase',
        text: 'Models with long-lived crops or permanent infrastructure need secure tenure. Compare locally available lease terms, partnership agreements and purchase costs before committing.',
        primaryOption: 'Long-Term Lease or Partnership'
      };
    }
    return {
      badge: 'Flexible Tenure',
      title: 'Compare Lease, Partnership, and Pilot First',
      text: 'Do not rush into buying land until you have verified soil fertility, local community security, and off-take relationships through at least one full production season.',
      primaryOption: 'Lease or Pilot Operation'
    };
  };

  const guidance = getGuidance();

  return (
    <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200/80 p-5 sm:p-6 my-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900">
            Do You Need to Buy Land Yet?
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Land ownership is not automatically required to begin every agricultural project. Evaluate capital-efficient alternatives.
          </p>
        </div>
      </div>

      {/* 4 Diagnostic Questions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-800 font-medium leading-snug">
            Do you already own or control suitable land?
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleUpdate('owns', true)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                owns ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleUpdate('owns', false)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                !owns ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              No
            </button>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-800 font-medium leading-snug">
            Is long-term control essential to your model?
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleUpdate('longTerm', true)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                longTerm ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleUpdate('longTerm', false)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                !longTerm ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              No
            </button>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-800 font-medium leading-snug">
            Have you compared purchasing with leasing?
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleUpdate('compared', true)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                compared ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleUpdate('compared', false)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                !compared ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              No
            </button>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-800 font-medium leading-snug">
            Would buying consume a large % of your capital?
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleUpdate('capitalHeavy', true)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                capitalHeavy ? 'bg-amber-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleUpdate('capitalHeavy', false)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                !capitalHeavy ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              No
            </button>
          </div>
        </div>
      </div>

      {/* Decision Guidance Callout */}
      <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-2xs mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
            {guidance.badge}
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Recommended: {guidance.primaryOption}
          </span>
        </div>
        <h4 className="text-sm font-bold text-neutral-900">{guidance.title}</h4>
        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{guidance.text}</p>
      </div>

      {/* Options to Evaluate Cards */}
      {showOptions && (
        <div>
          <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2.5">
            5 Options to Evaluate
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
            <button
              type="button"
              onClick={() => {
                updateCurrentProject({
                  farmDetails: { ...currentProject.farmDetails, landStatus: 'plan_to_buy' }
                });
                onSelectOption?.('Purchase');
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentProject.farmDetails.landStatus === 'plan_to_buy'
                  ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="font-bold text-neutral-900">1. Purchase</div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Full permanent ownership. High capital lockup. Best for tree crops.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                updateCurrentProject({
                  farmDetails: { ...currentProject.farmDetails, landStatus: 'lease_partner' }
                });
                onSelectOption?.('Lease');
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentProject.farmDetails.landStatus === 'lease_partner'
                  ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="font-bold text-neutral-900 flex items-center justify-between">
                <span>2. Lease</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Compare local lease rates and terms; preserve enough capital for production and operating costs.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                updateCurrentProject({
                  farmDetails: { ...currentProject.farmDetails, landStatus: 'lease_partner' }
                });
                onSelectOption?.('Partnership');
              }}
              className="p-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 text-left transition-all"
            >
              <div className="font-bold text-neutral-900">3. Partnership</div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Community landowner joint venture with harvest profit sharing.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSelectOption?.('Contract Production')}
              className="p-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 text-left transition-all"
            >
              <div className="font-bold text-neutral-900">4. Contract Prod.</div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Out-grower scheme; supply inputs to farmers with land in place.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSelectOption?.('Pilot First')}
              className="p-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 text-left transition-all"
            >
              <div className="font-bold text-neutral-900">5. Pilot First</div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Trial a scale suited to your crop, site, available capital and technical support.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
