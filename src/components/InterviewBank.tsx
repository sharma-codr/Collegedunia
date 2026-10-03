import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle, Search, Lightbulb } from 'lucide-react';
import { COMPETENCIES } from '../data/skillsData';

export function InterviewBank() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('C001');

  const filtered = COMPETENCIES.filter(
    (c) =>
      c.interviewQuestion.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.domainTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white">Corporate AI/ML Interview Question Bank</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            "Interview preparation shouldn't be a separate cram stage. Attach the hard engineering trade-off questions directly to each competency."
          </p>
        </div>

        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search interview questions..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden transition"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="p-4 cursor-pointer hover:bg-slate-900/60 flex items-start justify-between gap-4 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {item.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{item.domainTitle}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1">
                    "{item.interviewQuestion}"
                  </h4>
                </div>

                <div className="shrink-0 text-slate-500 hover:text-slate-300">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950 space-y-3 text-xs leading-relaxed">
                  <div>
                    <div className="font-mono text-slate-400 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5 text-teal-400">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Staff Engineer Model Answer & Technical Rationale:
                    </div>
                    <p className="text-slate-200 bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg leading-relaxed font-sans">
                      {item.modelAnswer}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-slate-900/50 border border-slate-800 text-slate-400">
                      Depth: <span className="text-slate-300">{item.depth}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/50 border border-slate-800 text-slate-400">
                      Prerequisites: <span className="text-slate-300">{item.prerequisites.join(', ')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
