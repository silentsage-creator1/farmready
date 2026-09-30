import React, { useState } from 'react';
import { resourcesList, ResourceArticle } from '../../data/resourcesData';
import { Search, BookOpen, Clock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export const ResourcesView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<ResourceArticle | null>(null);

  const filtered = resourcesList.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase()) ||
    r.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Agribusiness Knowledge Hub
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Practical guides on agricultural finance, risk mitigation, and commercial farming in Nigeria.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search guides & topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((art) => (
          <div
            key={art.id}
            className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {art.category}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {art.readTime}
                </span>
              </div>

              <h3 className="font-bold text-neutral-900 text-base leading-snug">{art.title}</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">{art.summary}</p>
            </div>

            <button
              onClick={() => setSelectedArticle(art)}
              className="w-full py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors text-center"
            >
              Read Full Guide
            </button>
          </div>
        ))}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  {selectedArticle.category} · {selectedArticle.readTime}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-950 mt-1">
                  {selectedArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-neutral-400 hover:text-neutral-700 text-base p-1"
              >
                ✕
              </button>
            </div>

            {/* Key Takeaways */}
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
              <p className="font-bold text-emerald-950 uppercase tracking-wider text-[10px]">
                Key Investor Takeaways
              </p>
              <ul className="space-y-1.5 text-neutral-800">
                {selectedArticle.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Content Body */}
            <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed whitespace-pre-line space-y-3 font-normal">
              {selectedArticle.content}
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
