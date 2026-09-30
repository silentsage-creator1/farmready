import React, { useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { calculateFinancialMetrics, formatNaira } from '../../utils/calculations';
import { Plus, ArrowRight, FileText, Copy, Trash2, Clock, RotateCcw } from 'lucide-react';

export const AssessmentsView: React.FC = () => {
  const { allProjects, savedReports, selectProject, setActiveView, createNewAssessment, duplicateProject, deleteProject, clearAssessments, currentProject } = useFarmProject();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [projectPendingDelete, setProjectPendingDelete] = useState<string | null>(null);
  const projectBeingDeleted = allProjects.find(project => project.id === projectPendingDelete);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Your Farm Investment Assessments
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage and compare your agricultural project evaluations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(allProjects.length > 0 || savedReports.length > 0) && <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Assessments</span>
          </button>}
          <button
            onClick={() => createNewAssessment()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {showClearConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4" role="presentation">
        <section role="alertdialog" aria-modal="true" aria-labelledby="clear-assessments-title" aria-describedby="clear-assessments-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h3 id="clear-assessments-title" className="text-lg font-bold text-neutral-900">Clear saved assessments?</h3>
          <p id="clear-assessments-description" className="mt-2 text-sm leading-6 text-neutral-600">All saved farm projects, report snapshots, inventory and assessment drafts will be removed from this browser. No project will be pre-created. Your profile and app preferences will be kept.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setShowClearConfirm(false)} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Cancel</button>
            <button type="button" onClick={() => { clearAssessments(); setShowClearConfirm(false); }} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Clear assessments</button>
          </div>
        </section>
      </div>}

      {projectBeingDeleted && <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setProjectPendingDelete(null); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="delete-assessment-title" aria-describedby="delete-assessment-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h3 id="delete-assessment-title" className="text-lg font-bold text-neutral-900">Delete this assessment?</h3>
          <p id="delete-assessment-description" className="mt-2 text-sm leading-6 text-neutral-600">“{projectBeingDeleted.name}” and its saved report snapshots, inventory, and assessment draft will be removed from this browser. This cannot be undone.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setProjectPendingDelete(null)} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Cancel</button>
            <button type="button" onClick={() => { deleteProject(projectBeingDeleted.id); setProjectPendingDelete(null); }} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Delete assessment</button>
          </div>
        </section>
      </div>}

      {/* Projects Grid */}
      {allProjects.length === 0 ? <section className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
        <h3 className="text-lg font-bold text-neutral-900">No assessments yet</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-500">You have not created a farm project. Start an assessment when you are ready; the app will not add a sample project for you.</p>
        <button onClick={() => createNewAssessment()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" />Start an Assessment</button>
      </section> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allProjects.map((proj) => {
          const metrics = calculateFinancialMetrics(proj);
          const isSelected = proj.id === currentProject.id;

          return (
            <div
              key={proj.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-neutral-900 line-clamp-1">
                        {proj.name}
                      </h3>
                      {proj.isDemo && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Demo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {proj.farmType} · {proj.farmDetails.farmSize} {proj.farmDetails.sizeUnit}
                    </p>
                  </div>

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    proj.progress === 100
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    {proj.stage}
                  </span>
                </div>

                {/* Planned Investment & Funding Gap */}
                <div className="p-3 bg-neutral-50 rounded-xl grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-neutral-500 text-[11px]">Planned Investment</p>
                    <p className="font-mono font-bold text-neutral-900 mt-0.5">
                      {formatNaira(metrics.totalStartupCapital)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500 text-[11px]">Estimated Profit</p>
                    <p className="font-mono font-bold text-emerald-700 mt-0.5">
                      {formatNaira(metrics.netProfit)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 font-medium">Readiness Progress</span>
                    <span className="font-mono font-bold text-emerald-700">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated: {new Date(proj.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-3 bg-neutral-50/70 border-t border-neutral-100 rounded-b-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateProject(proj.id)}
                    title="Duplicate Project"
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setProjectPendingDelete(proj.id)}
                    title={`Delete assessment ${proj.name}`}
                    aria-label={`Delete assessment ${proj.name}`}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-200/60 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      selectProject(proj.id);
                      setActiveView('report');
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Report</span>
                  </button>

                  <button
                    onClick={() => {
                      selectProject(proj.id);
                      setActiveView('new_assessment');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
};
