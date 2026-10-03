import { useState } from 'react';
import { Download, FileText, Trash2, Plus, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { DOMAINS, COMPETENCIES } from '../data/skillsData';

export interface EvidenceItem {
  id: string;
  title: string;
  competencyId: string;
  domainTitle: string;
  timestamp: string;
  content: string;
}

interface EvidenceVaultProps {
  evidenceList: EvidenceItem[];
  onAddEvidence: (title: string, content: string) => void;
  onDeleteEvidence: (id: string) => void;
  masteryScores: { [key: string]: number };
}

export function EvidenceVault({
  evidenceList,
  onAddEvidence,
  onDeleteEvidence,
  masteryScores,
}: EvidenceVaultProps) {
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(
    evidenceList.length > 0 ? evidenceList[0] : null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleExportFullPortfolio = () => {
    let md = `# Corporate AI/ML Engineer Competency & Evidence Portfolio\n`;
    md += `Generated: ${new Date().toISOString()}\n`;
    md += `Candidate: Engineering Portfolio\n\n`;

    md += `## 1. Executive Competency Summary\n\n`;
    let totalGatesPassed = 0;
    Object.values(masteryScores).forEach((v) => (totalGatesPassed += v));
    const totalPossibleGates = COMPETENCIES.length * 5;
    const overallPercentage = Math.round((totalGatesPassed / totalPossibleGates) * 100);

    md += `- Total Competency Gates Passed: ${totalGatesPassed} / ${totalPossibleGates} (${overallPercentage}%)\n`;
    md += `- Total Verified Evidence Artifacts: ${evidenceList.length}\n`;
    md += `- Core Competency Standard: Know → Build → Break → Debug → Design\n\n`;

    md += `## 2. 15-Domain Competency Status\n\n`;
    DOMAINS.forEach((domain) => {
      const comps = COMPETENCIES.filter((c) => c.domainId === domain.id);
      md += `### ${domain.code}: ${domain.title} (${domain.layer})\n`;
      comps.forEach((c) => {
        const score = masteryScores[c.id] || 0;
        const status = score === 5 ? 'MASTERED (5/5)' : `${score}/5 gates passed`;
        md += `- **[${c.id}] ${c.name}**: ${status}\n`;
        md += `  - Interview Test: "${c.interviewQuestion}"\n`;
      });
      md += `\n`;
    });

    md += `## 3. Verified Production Evidence Artifacts\n\n`;
    if (evidenceList.length === 0) {
      md += `_No evidence artifacts recorded yet._\n\n`;
    } else {
      evidenceList.forEach((item, idx) => {
        md += `### Artifact ${idx + 1}: ${item.title} (${item.competencyId})\n`;
        md += `Recorded: ${item.timestamp}\n\n`;
        md += `\`\`\`markdown\n${item.content}\n\`\`\`\n\n`;
      });
    }

    md += `## 4. Flagship Project Architecture: AI-Powered Security Operations Platform\n\n`;
    md += `A unified multi-phase engineering platform progressing across:\n`;
    md += `- V0: Linux & CPU Telemetry Harvesting\n`;
    md += `- V1: SQL Schema Validation & Partitioning\n`;
    md += `- V2: Classical ML Threat Classification (Precision/Recall vs False Positives)\n`;
    md += `- V3: FastAPI High-Throughput Service\n`;
    md += `- V4: Docker & CI/CD Regression Gates\n`;
    md += `- V5: Production MLOps & Experiment Versioning\n`;
    md += `- V6: Telemetry & Drift Observability\n`;
    md += `- V7: LLM Incident Summarization\n`;
    md += `- V8: RAG Knowledge Retrieval\n`;
    md += `- V9: Autonomous SOC Triage Agent with Least-Privilege Controls\n`;
    md += `- V10: Adversarial Hardening & Chaos Testing\n`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'corporate-ai-engineer-evidence-portfolio.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white">Engineering Evidence Vault</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            "Evidence replaces certificates." In real engineering, mastery is proven with benchmark reports, trace logs, unit tests, and incident postmortems.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Evidence
          </button>

          <button
            onClick={handleExportFullPortfolio}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export Portfolio Markdown (.md)
          </button>
        </div>
      </div>

      {evidenceList.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">No Evidence Artifacts Stored Yet</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Pass gates in the Socratic Tutor or click "Save Evidence Artifact" inside the C001 Hardware Lab to record benchmark traces and postmortems here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Artifact List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {evidenceList.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-teal-950/60 border-teal-500 text-teal-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-teal-300">
                      {item.competencyId}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                  </div>
                  <div className="font-medium text-xs text-white mt-1.5 line-clamp-1">{item.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.domainTitle}</div>
                </div>
              );
            })}
          </div>

          {/* Artifact Content Viewer */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            {selectedItem ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedItem.title}</h4>
                    <div className="text-xs font-mono text-teal-400 mt-0.5">
                      Target: {selectedItem.competencyId} · Logged {selectedItem.timestamp}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteEvidence(selectedItem.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-900 transition"
                    title="Delete artifact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                  {selectedItem.content}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select an evidence artifact to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white">Record New Evidence Artifact</h4>

            <div>
              <label className="text-xs font-mono text-slate-400">Artifact Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. C001 Memory Stall vs Arithmetic Microbenchmark Report"
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400">Artifact Content (Markdown / Code / Logs)</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste code snippet, perf stat benchmark results, or test run outputs..."
                rows={6}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newTitle.trim()) {
                    onAddEvidence(newTitle, newContent);
                    setShowAddModal(false);
                    setNewTitle('');
                    setNewContent('');
                  }
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white"
              >
                Save Artifact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
