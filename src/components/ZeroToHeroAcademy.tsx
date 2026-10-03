import { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  Code2,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Copy,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  BookmarkCheck,
} from 'lucide-react';
import { Competency, FreeResource } from '../data/skillsData';

interface ZeroToHeroAcademyProps {
  competency: Competency;
  onStartDrill: () => void;
  onOpenLab?: () => void;
  hasLab?: boolean;
}

export function ZeroToHeroAcademy({
  competency,
  onStartDrill,
  onOpenLab,
  hasLab,
}: ZeroToHeroAcademyProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'deep_dive' | 'free_spine' | 'code' | 'war_story'>('deep_dive');

  const copyCode = () => {
    navigator.clipboard.writeText(competency.deepDiveLesson.codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Zero':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Foundational':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'Intermediate':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Advanced':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Hero':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col space-y-6 p-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
              {competency.id}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getLevelBadgeColor(competency.level)}`}>
              Level: {competency.level}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {competency.layer}
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {competency.name}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {competency.deepDiveLesson.introduction}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasLab && (
            <button
              onClick={onOpenLab}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Interactive Lab
            </button>
          )}

          <button
            onClick={onStartDrill}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 transition shadow"
          >
            Socratic Gate Drill
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* "Why Tutorials Lie" Alert Box */}
      <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px] font-mono">
            What Breaks When The Happy-Path Tutorial Ends
          </div>
          <p className="text-amber-100/90 mt-1">
            {competency.whyTutorialsLie}
          </p>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('deep_dive')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === 'deep_dive'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📖 Deep Dive & Architecture
        </button>

        <button
          onClick={() => setActiveTab('free_spine')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'free_spine'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Curated Free Resources ({competency.freeLearningResources.length})
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'code'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Runnable Code Drill
        </button>

        <button
          onClick={() => setActiveTab('war_story')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            activeTab === 'war_story'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Production War Story
        </button>
      </div>

      {/* Tab 1: Deep Dive & Derivation */}
      {activeTab === 'deep_dive' && (
        <div className="space-y-5 text-sm">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2 font-mono uppercase tracking-wider text-teal-400">
              <Lightbulb className="w-4 h-4" />
              First-Principles Core Concept
            </h4>
            <p className="text-slate-300 leading-relaxed bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              {competency.deepDiveLesson.coreConcept}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
              Hardware Architecture & Mathematical Flow
            </h4>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-teal-200 overflow-x-auto whitespace-pre leading-relaxed">
              {competency.deepDiveLesson.hardwareOrMathDerivation}
            </pre>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase text-rose-400 tracking-wider mb-2">
              Common Corporate Anti-Patterns to Avoid
            </h4>
            <div className="space-y-1.5">
              {competency.deepDiveLesson.antiPatterns.map((ap, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>{ap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Curated Free Learning Spine */}
      {activeTab === 'free_spine' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400">
            <span className="font-semibold text-teal-300">Verified Free Resource Spine: </span>
            You do not need to pay thousands of dollars for generic bootcamps. The world's top universities (MIT, Harvard, Stanford) and open-source foundations (Linux, PostgreSQL, PyTorch, OWASP) provide the definitive material for free.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {competency.freeLearningResources.map((res, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-teal-500/50 transition group space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-teal-400 font-semibold">{res.provider}</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase text-[10px]">
                      {res.type}
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-white mt-1 group-hover:text-teal-300 transition">
                    {res.title}
                  </h5>

                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    <span className="text-slate-300 font-medium">Recommended: </span>
                    {res.recommendedChapters}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle className="w-3 h-3" /> 100% Free / Open
                  </span>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-mono font-medium"
                  >
                    Open Resource
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Runnable Code Drill */}
      {activeTab === 'code' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Language: <span className="text-teal-300 uppercase">{competency.deepDiveLesson.codeLanguage}</span>
            </span>
            <button
              onClick={copyCode}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition font-mono"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed max-h-[450px]">
            {competency.deepDiveLesson.codeExample}
          </pre>
        </div>
      )}

      {/* Tab 4: Production War Story */}
      {activeTab === 'war_story' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            Real Corporate Production Incident
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {competency.deepDiveLesson.productionCaseStudy}
          </p>
        </div>
      )}
    </div>
  );
}
