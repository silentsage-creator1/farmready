import React, { useState } from 'react';
import { Search, HelpCircle, ChevronDown, ChevronUp, Mail, AlertCircle } from 'lucide-react';

export const HelpSupportView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const faqs = [
    {
      q: 'How does FarmReady work?',
      a: 'FarmReady evaluates your farm idea across seven operational and financial systems before you commit capital. It analyzes market validation, startup capex, operating costs, break-even yields, and agricultural risks to generate an actionable Farm Investment Readiness Report.'
    },
    {
      q: 'How is my farm assessed?',
      a: 'Assessment is based on explainable benchmarks rather than black-box scores. Each of the seven systems (Market, Production, Financial, People, Information, Infrastructure, and Risk-Control) evaluates concrete evidence from your inputs, identifies unvalidated assumptions, and assigns a readiness status: Prepared, Needs Attention, Weak, or Insufficient Information.'
    },
    {
      q: 'Why does an area say "Needs Attention"?',
      a: 'A "Needs Attention" status means your assessment identified an unaddressed gap—such as relying on assumed buyers without written purchase commitments, having an unresolved funding gap, or lacking irrigation during dry seasons. The report provides a concrete next action to resolve each gap.'
    },
    {
      q: 'How is financial analysis calculated?',
      a: 'Startup capital combines setup costs and the initial working-capital buffer. Expected revenue uses the lower of expected production and entered buyer purchase volume, multiplied by the selling price. Profit and break-even use the entered operating-cost assumptions.'
    },
    {
      q: 'How do I use the calculators?',
      a: 'Navigate to Tools from the sidebar. Calculators show project-based starting values where available. Use each calculator’s Apply or Save action to write its supported inputs or result to the active farm project.'
    },
    {
      q: 'How do I download or print my report?',
      a: 'Open "Readiness Report" from the sidebar. Save a report snapshot to the archive, download a standalone HTML report, or use Print Report and choose Save as PDF in your browser.'
    }
  ];

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          Help & Support
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Find answers and review diagnostic guidance for the assessment and planning tools.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-neutral-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search support articles and diagnostic questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-300 text-sm focus:ring-2 focus:ring-emerald-500/30 bg-white"
        />
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs divide-y divide-neutral-100 overflow-hidden">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div key={idx} className="p-4 sm:p-5">
              <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left gap-4 font-bold text-sm text-neutral-900"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />}
              </button>
              {isOpen && (
                <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed pt-1">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
            <Mail className="w-4 h-4 text-emerald-700" />
            <span>Speak With An Agribusiness Advisor</span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Need guidance on validating off-taker agreements or reviewing your borehole hydrology assumptions in Nigeria?
          </p>
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Contact Support
          </button>
        </div>

        <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3">
          <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-neutral-600" />
            <span>Report an Calculation Issue</span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Did an input rate or price assumption behave unexpectedly? Let our agronomic engineering team know.
          </p>
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Report a Problem
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="text-base font-bold text-neutral-900">Contact FarmReady Support</h4>
              <button onClick={() => setIsContactModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">✕</button>
            </div>

            <div className="space-y-4 text-sm text-neutral-600">
              <p>Support message delivery is not configured in this build, so FarmReady cannot send your message yet. No message will be recorded or shown as sent.</p>
              <div className="flex justify-end">
                <button onClick={() => setIsContactModalOpen(false)} className="px-4 py-2 bg-neutral-900 text-white font-semibold rounded-xl">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
