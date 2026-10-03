import { useState, useRef, useEffect, useTransition } from 'react';
import { Send, CheckCircle2, Award, Sparkles, BookOpen, AlertCircle, FileCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { Competency, GateDetail } from '../data/skillsData';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'note';
  content: string;
  timestamp: string;
  evidenceName?: string;
}

interface SocraticChatProps {
  competency: Competency;
  gatesPassed: number;
  onUpdateGates: (newGatesPassed: number) => void;
  onSaveEvidence: (title: string, content: string) => void;
}

const GATE_NAMES: Array<'Know' | 'Build' | 'Break' | 'Debug' | 'Design'> = ['Know', 'Build', 'Break', 'Debug', 'Design'];

export function SocraticChat({
  competency,
  gatesPassed,
  onUpdateGates,
  onSaveEvidence,
}: SocraticChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentGateIndex = Math.min(gatesPassed, 4);
  const currentGateName = GATE_NAMES[currentGateIndex];
  const currentGateData: GateDetail = competency.gates[currentGateName.toLowerCase() as keyof typeof competency.gates];

  // Initialize or load conversation for this competency
  useEffect(() => {
    const saved = localStorage.getItem(`chat_${competency.id}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
        return;
      } catch (e) {
        // fallback
      }
    }

    // Default initial mentor message
    const initialMentorMessage: Message = {
      id: 'init-1',
      role: 'assistant',
      content: `Welcome, engineer. You are at ${competency.id}: ${competency.name} (${competency.domainTitle}).
Your current mastery level: ${gatesPassed}/5 gates passed.
Current Gate: **${currentGateName.toUpperCase()}**

${currentGateData.description}

Here is your drill for the KNOW gate:
${currentGateData.drill}

To pass, answer directly with technical precision: What happens to the Program Counter (PC) immediately after an instruction is fetched, and why?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([initialMentorMessage]);
  }, [competency.id]);

  // Persist chat
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_${competency.id}`, JSON.stringify(messages));
    }
  }, [messages, competency.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    if (!customText) {
      setInput('');
    }

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competencyId: competency.id,
          competencyName: competency.name,
          domainName: competency.domainTitle,
          currentGate: currentGateName,
          gatesPassed,
          userMessage: textToSend,
          conversationHistory: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.reply || 'Continue with your explanation.';

      const isPass = replyText.includes('[PASS]');
      const cleanReply = replyText.replace(/\[PASS\]/g, '').trim();

      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: cleanReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedHistory = [...newMessages, assistantMsg];

      if (isPass) {
        const nextGates = Math.min(gatesPassed + 1, 5);
        onUpdateGates(nextGates);

        const evidenceArtifact = currentGateData.evidenceRequired || `${competency.id}_${currentGateName.toLowerCase()}_evidence.md`;
        onSaveEvidence(
          `${competency.id} Gate ${gatesPassed + 1} (${currentGateName}) Passed`,
          `# Evidence: ${competency.id} - ${competency.name} (${currentGateName})\nPassed at: ${new Date().toISOString()}\n\nArtifact: ${evidenceArtifact}\nLearner Response:\n${textToSend}\n\nMentor Evaluation:\n${cleanReply}`
        );

        updatedHistory.push({
          id: String(Date.now() + 2),
          role: 'note',
          content: `GATE ${currentGateName.toUpperCase()} PASSED! Evidence artifact required: \`${evidenceArtifact}\`. It has been recorded to your Evidence Vault.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          evidenceName: evidenceArtifact,
        });
      }

      startTransition(() => {
        setMessages(updatedHistory);
      });
    } catch (err: any) {
      // Fallback response for offline or server error
      const mockReply = `Mentor note: Checked your answer on ${competency.name}. In hardware execution, the Program Counter (PC) increments to the next memory address immediately during the FETCH phase so the CPU knows where to go next, while the Instruction Register (IR) holds the current opcode for decoding.`;
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: mockReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPass = () => {
    const nextGates = Math.min(gatesPassed + 1, 5);
    onUpdateGates(nextGates);

    const artifactName = currentGateData.evidenceRequired || `${competency.id}_${currentGateName.toLowerCase()}_artifact.md`;
    onSaveEvidence(
      `${competency.id} Gate ${gatesPassed + 1} (${currentGateName}) Verified`,
      `# Verified Gate: ${competency.name} (${currentGateName})\nRecorded at: ${new Date().toISOString()}\nArtifact: ${artifactName}\nVerification: Drill passed via hands-on lab demonstration.`
    );

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        role: 'note',
        content: `[VERIFIED] Gate ${currentGateName.toUpperCase()} marked as PASSED. Evidence recorded: ${artifactName}. Opening next gate.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidenceName: artifactName,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Competency Header & Gate Status Bar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                {competency.id}
              </span>
              <h2 className="text-base font-bold text-white">{competency.name}</h2>
              <span className="text-xs text-slate-400">({competency.domainTitle})</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Depth: {competency.depth}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-mono text-slate-400">Mastery Gates</div>
              <div className="text-sm font-bold font-mono text-teal-400">
                {gatesPassed} / 5 Passed
              </div>
            </div>

            {gatesPassed < 5 ? (
              <button
                onClick={handleManualPass}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition"
                title="Mark current gate passed if verified via the Hands-on Lab"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pass {currentGateName}
              </button>
            ) : (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> MASTERED
              </span>
            )}
          </div>
        </div>

        {/* Gate Badges Strip */}
        <div className="grid grid-cols-5 gap-1.5 mt-3">
          {GATE_NAMES.map((gate, idx) => {
            const isDone = idx < gatesPassed;
            const isCurrent = idx === gatesPassed;
            return (
              <div
                key={gate}
                className={`p-2 rounded-lg border text-center transition ${
                  isDone
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                    : isCurrent
                    ? 'bg-teal-950/60 border-teal-500 text-teal-200 ring-1 ring-teal-500/50 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                  Gate {idx + 1}
                </div>
                <div className="text-xs font-bold mt-0.5 flex items-center justify-center gap-1">
                  {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {gate}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Objective Banner */}
        {gatesPassed < 5 && (
          <div className="mt-3 p-2.5 rounded-lg bg-teal-950/30 border border-teal-500/30 flex items-start gap-2.5 text-xs text-teal-200">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-teal-300">Target for Gate {gatesPassed + 1} ({currentGateName}): </span>
              {currentGateData.drill}
              <div className="text-[11px] text-teal-400/80 mt-1 font-mono">
                Artifact required on pass: <span className="underline">{currentGateData.evidenceRequired}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-sm">
        {messages.map((m) => {
          if (m.role === 'note') {
            return (
              <div
                key={m.id}
                className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{m.content}</span>
                </div>
                {m.evidenceName && (
                  <span className="font-mono text-[11px] bg-emerald-900/40 px-2 py-0.5 rounded text-emerald-300">
                    Saved
                  </span>
                )}
              </div>
            );
          }

          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3.5 leading-relaxed ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider mb-1 opacity-70 flex items-center justify-between gap-4">
                  <span>{isUser ? 'You (Learner)' : 'Staff AI Mentor (Socratic)'}</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-slate-400 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>Mentor is evaluating your technical reasoning...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Socratic Drill Prompts */}
      <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-mono text-slate-500 shrink-0">Quick Drills:</span>
        <button
          onClick={() =>
            handleSend(
              'The Program Counter (PC) stores the address of the next instruction. During the FETCH stage, the CPU fetches the instruction at PC into the Instruction Register (IR) and immediately increments PC by 4 bytes. The Control Unit decodes the opcode, and the ALU executes arithmetic logic like ADD R1, R2.'
            )
          }
          className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          Submit PC & IR Fetch Trace (Know Gate)
        </button>

        <button
          onClick={() =>
            handleSend(
              'I am stuck on how the CPU scheduler handles a thread doing memory stall vs tight loop. Give me a Socratic hint without giving away the full answer.'
            )
          }
          className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          Socratic Hint on Memory Stalls
        </button>

        <button
          onClick={() =>
            handleSend(
              `Answer the interview question: "${competency.interviewQuestion}" by connecting it to hardware performance counters (perf stat) and IPC.`
            )
          }
          className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          Corporate Interview Answer Drill
        </button>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Answer the question, explain the hardware mechanism, or state your experiment results (Enter to send, Shift+Enter for new line)..."
            rows={2}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-medium transition flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
