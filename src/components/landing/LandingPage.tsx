import React from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import {
  Sprout,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Users,
  Building,
  BarChart3,
  Scale,
  Compass,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import heroImg from '../../assets/images/hero_farm_nigeria_1790335220953.jpg';

export const LandingPage: React.FC = () => {
  const { setActiveView, createNewAssessment } = useFarmProject();

  const handleStartAssessment = () => {
    createNewAssessment();
    setActiveView('new_assessment');
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. TOP NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-1">
              FarmReady
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                NIGERIA
              </span>
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-emerald-700 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('what-we-assess')}
              className="hover:text-emerald-700 transition-colors"
            >
              What We Assess
            </button>
            <button
              onClick={() => scrollToSection('financial-tools')}
              className="hover:text-emerald-700 transition-colors"
            >
              Financial Tools
            </button>
            <button
              onClick={() => scrollToSection('land-decision')}
              className="hover:text-emerald-700 transition-colors"
            >
              Land Decision
            </button>
            <button
              onClick={() => setActiveView('resources')}
              className="hover:text-emerald-700 transition-colors"
            >
              Resources
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('workspace_entry')}
              className="text-sm font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              Workspace
            </button>
            <button
              onClick={handleStartAssessment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Start Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-12 pb-18 lg:pt-20 lg:pb-24 border-b border-neutral-100 bg-linear-to-b from-emerald-50/40 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-emerald-700" />
                <span>Farm Investment Decision Support</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-950 tracking-tight leading-[1.12] text-balance">
                Make Better Farming Investment Decisions
              </h1>

              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed max-w-2xl font-normal">
                Evaluate the market, financial, operational and risk readiness of your farm idea before committing significant capital.
              </p>

              {/* 5 Focus Pillars */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-neutral-700 pt-2">
                <span className="flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg shadow-2xs">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Market
                </span>
                <span className="text-neutral-300">·</span>
                <span className="flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg shadow-2xs">
                  <Sprout className="w-4 h-4 text-emerald-600" /> Production
                </span>
                <span className="text-neutral-300">·</span>
                <span className="flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg shadow-2xs">
                  <BarChart3 className="w-4 h-4 text-emerald-600" /> Financial
                </span>
                <span className="text-neutral-300">·</span>
                <span className="flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg shadow-2xs">
                  <Users className="w-4 h-4 text-emerald-600" /> People
                </span>
                <span className="text-neutral-300">·</span>
                <span className="flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg shadow-2xs">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" /> Risk
                </span>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={handleStartAssessment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Start Your Assessment</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-base px-6 py-3.5 rounded-xl border border-neutral-300 transition-colors flex items-center justify-center"
                >
                  See How It Works
                </button>
              </div>

              {/* Trust Subtext */}
              <p className="text-xs text-neutral-500 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No account required to start. Results update instantly.</span>
              </p>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-neutral-200/80 shadow-2xl bg-neutral-100 aspect-16/10 lg:aspect-4/3">
                <img
                  src={heroImg}
                  alt="Modern commercial agricultural farm in Nigeria"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {/* Floating Decision Callout Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-neutral-200 shadow-lg">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Central Principle</p>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900 mt-0.5">
                    "What do I need to understand before committing money to this farm?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW FARMREADY WORKS */}
      <section id="how-it-works" className="py-20 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Clear 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 mt-3 tracking-tight">
              How FarmReady Works
            </h2>
            <p className="text-neutral-600 text-base mt-2">
              A systematic decision-support framework designed for prospective farmers, investors, and agribusiness founders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-2xl font-black text-emerald-700 font-mono mb-3">01</div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Tell Us About Your Farm</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Enter information about your proposed crop or livestock enterprise, land status, capital, and manager.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-500">
                Takes ~5–7 minutes
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-2xl font-black text-emerald-700 font-mono mb-3">02</div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Analyze Your Plan</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  FarmReady evaluates your operational feasibility, unit costs, startup capital, break-even, and cash flow.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-500">
                Rigorous financial modeling
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-2xl font-black text-emerald-700 font-mono mb-3">03</div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Understand the Gaps</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  See missing information, unvalidated buyer assumptions, funding deficits, and risks requiring attention.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-500">
                Actionable 7-system diagnosis
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-2xl font-black text-emerald-700 font-mono mb-3">04</div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Get Your Report</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Generate a structured Farm Investment Readiness Report with pre-commitment checklists to guide your next move.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-500">
                Printable & downloadable
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT FARMREADY EVALUATES (7 Systems) */}
      <section id="what-we-assess" className="py-20 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              The Seven Systems
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 mt-3 tracking-tight">
              What FarmReady Evaluates
            </h2>
            <p className="text-neutral-600 text-base mt-2">
              Farming is not just seeds and soil. We audit your project across seven interconnected business engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Market System */}
            <div className="p-6 rounded-2xl border border-neutral-200 bg-white hover:border-emerald-300 transition-colors shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Market System</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Customers, validated off-taker demand, realistic commodity pricing, harvest timing, and sales logistics.
              </p>
            </div>

            {/* 2. Production System */}
            <div className="p-6 rounded-2xl border border-neutral-200 bg-white hover:border-emerald-300 transition-colors shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4">
                <Sprout className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Production System</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Production method, hectare/pen capacity, certified seed/fingerling inputs, cycle length, and expected yield.
              </p>
            </div>

            {/* 3. Financial System */}
            <div className="p-6 rounded-2xl border border-neutral-200 bg-white hover:border-emerald-300 transition-colors shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Financial System</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Capex, operating expenses, working capital buffer, cash flow seasonality, break-even point, and funding gaps.
              </p>
            </div>

            {/* 4. People System */}
            <div className="p-6 rounded-2xl border border-neutral-200 bg-white hover:border-emerald-300 transition-colors shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">People System</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Resident farm manager track record, seasonal weeding/harvesting labor availability, and supervisor integrity.
              </p>
            </div>

            {/* 5. Information System */}
            <div className="p-6 rounded-2xl border border-neutral-200 bg-white hover:border-emerald-300 transition-colors shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Information System</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Daily farm logbooks, input reconciliation, rainfall tracking, mortality logs, and cost variance monitoring.
              </p>
            </div>

            {/* 6. Infrastructure System */}
            <div className="p-6 rounded-2xl border border-neutral-200 bg-white hover:border-emerald-300 transition-colors shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Infrastructure System</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Water security, borehole/irrigation lines, security fence, store shed, tractor access, and access roads.
              </p>
            </div>

            {/* 7. Risk-Control System */}
            <div className="p-6 rounded-2xl border border-neutral-200 bg-white hover:border-emerald-300 transition-colors shadow-2xs md:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Risk-Control System</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Drought insurance, biosecurity controls, pest scouting schedules, cattle encroachment defense, and price hedging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINANCIAL SECTION: DON'T GUESS. TEST YOUR NUMBERS. */}
      <section id="financial-tools" className="py-20 bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                Financial Rigor
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Don't Guess.<br />Test Your Numbers.
              </h2>
              <p className="text-neutral-400 text-base leading-relaxed">
                Never start a commercial farm on rough optimism. FarmReady calculates your exact startup capital, monthly burn rate, break-even yield, and return on investment.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => setActiveView('tools')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
                >
                  <span>Explore Financial Tools</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Realistic Metrics Cards Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                <p className="text-xs text-neutral-400 font-medium">Startup Capital</p>
                <p className="text-2xl font-bold font-mono text-white mt-1">₦4,200,000</p>
                <p className="text-[11px] text-neutral-500 mt-1">Land prep, irrigation, implements & initial inputs</p>
              </div>

              <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                <p className="text-xs text-neutral-400 font-medium">Monthly Operating Cost</p>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">₦475,000</p>
                <p className="text-[11px] text-neutral-500 mt-1">Management, fuel, farm labor & periodic inputs</p>
              </div>

              <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                <p className="text-xs text-neutral-400 font-medium">Expected Revenue</p>
                <p className="text-2xl font-bold font-mono text-white mt-1">₦7,800,000</p>
                <p className="text-[11px] text-neutral-500 mt-1">Based on 35 tonnes @ ₦220,000/tonne</p>
              </div>

              <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                <p className="text-xs text-neutral-400 font-medium">Break-Even Point</p>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">28 tonnes</p>
                <p className="text-[11px] text-neutral-500 mt-1">Requires 80% capacity utilization to clear costs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LAND DECISION SECTION: DO YOU NEED TO BUY LAND YET? */}
      <section id="land-decision" className="py-20 bg-emerald-50/50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Capital Efficiency
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
              Do You Need to Buy Land Yet?
            </h2>
            <p className="text-neutral-600 text-base leading-relaxed">
              Buying land should not automatically be treated as a requirement for starting every agricultural project. FarmReady helps you evaluate capital-preserving alternatives before locking up your cash.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-3">
                1
              </div>
              <h4 className="font-bold text-neutral-900 text-sm mb-1">Outright Purchase</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Best for long-term tree crops (cocoa, oil palm) or permanent processing facilities. Heavy on initial capital.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-emerald-300 ring-2 ring-emerald-500/10 shadow-2xs text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-3">
                2
              </div>
              <h4 className="font-bold text-neutral-900 text-sm mb-1">Agricultural Lease</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Recommended for grains, vegetables, and new farmers. Keeps 80%+ of your capital free for inputs and irrigation.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-3">
                3
              </div>
              <h4 className="font-bold text-neutral-900 text-sm mb-1">Land Partnership</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Partner with existing landowners or communities on a profit-share or crop-share structure.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-3">
                4
              </div>
              <h4 className="font-bold text-neutral-900 text-sm mb-1">Contract Production</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Finance inputs and management with established out-grower farmers who already hold secured farmland.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-3">
                5
              </div>
              <h4 className="font-bold text-neutral-900 text-sm mb-1">Smaller Pilot</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Test soil, market demand and operating assumptions at a scale suited to the crop, site, capital and technical support before expanding.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={handleStartAssessment}
              className="bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Evaluate Your Land Needs in the Assessment</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. FINAL LANDING PAGE CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-neutral-950 tracking-tight">
            Know Before You Commit
          </h2>

          <p className="text-lg text-neutral-600 max-w-xl mx-auto leading-relaxed">
            Turn your farm idea into a structured investment assessment. Identify what needs attention before committing millions of Naira.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleStartAssessment}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <span>Start Assessment</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => setActiveView('workspace_entry')}
              className="w-full sm:w-auto bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-base px-6 py-4 rounded-xl border border-neutral-300 transition-colors"
            >
              Go to Workspace Dashboard
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-neutral-500 pt-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Free to explore
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Grounded in Nigerian reality
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral-950 text-neutral-400 py-12 border-t border-neutral-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Sprout className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-sm">FarmReady Nigeria</span>
            <span className="text-neutral-500 ml-2">© 2026. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap gap-6 text-neutral-400">
            <button onClick={() => setActiveView('workspace_entry')} className="hover:text-white transition-colors">Workspace</button>
            <button onClick={() => setActiveView('tools')} className="hover:text-white transition-colors">Calculators</button>
            <button onClick={() => setActiveView('resources')} className="hover:text-white transition-colors">Agribusiness Resources</button>
            <button onClick={() => setActiveView('help')} className="hover:text-white transition-colors">Help & FAQ</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
