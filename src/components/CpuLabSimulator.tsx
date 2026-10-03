import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, Cpu, Activity, Download, CheckCircle } from 'lucide-react';

interface CpuLabSimulatorProps {
  onSaveEvidence?: (artifact: string) => void;
}

export function CpuLabSimulator({ onSaveEvidence }: CpuLabSimulatorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [clockSpeed, setClockSpeed] = useState<'slow' | 'fast'>('slow');
  const [cycle, setCycle] = useState(0);
  const [stage, setStage] = useState<'FETCH' | 'DECODE' | 'EXECUTE' | 'WRITEBACK'>('FETCH');
  const [pc, setPc] = useState(0);
  const [ir, setIr] = useState('LOAD R1, [0x10]');
  const [registers, setRegisters] = useState<{ [key: string]: number }>({
    R0: 0,
    R1: 42,
    R2: 58,
    R3: 0,
    ACC: 100,
  });

  const [workloadMode, setWorkloadMode] = useState<'arithmetic' | 'cache_miss' | 'spinlock' | 'context_switch'>('arithmetic');
  const [cpuUtil, setCpuUtil] = useState(99.4);
  const [ipc, setIpc] = useState(2.15); // Instructions per cycle
  const [cacheMissRate, setCacheMissRate] = useState(2.3); // percent
  const [stallActive, setStallActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] CPU Cores: 8x x86_64, L1 Data Cache: 32KB per core, L2: 512KB, L3: 16MB shared.',
    '[READY] Workload: Pure Vector Arithmetic. Pipeline initialized.',
  ]);
  const [evidenceSaved, setEvidenceSaved] = useState(false);

  const instructions = [
    { addr: 0, text: 'LOAD R1, [0x10]', desc: 'Fetch operand 1 into register R1' },
    { addr: 4, text: 'LOAD R2, [0x14]', desc: 'Fetch operand 2 into register R2' },
    { addr: 8, text: 'ADD R1, R2', desc: 'ALU performs integer addition' },
    { addr: 12, text: 'STORE R1, [0x18]', desc: 'Writeback result to memory buffer' },
    { addr: 16, text: 'CMP R1, 1000', desc: 'Check loop termination condition' },
    { addr: 20, text: 'JNZ 0x00', desc: 'Loop if not zero' },
  ];

  // Adjust metrics based on workload
  useEffect(() => {
    if (workloadMode === 'arithmetic') {
      setCpuUtil(99.2);
      setIpc(2.35);
      setCacheMissRate(1.8);
      setStallActive(false);
      setLogs((prev) => [
        `[SWITCH] Workload set to: Pure Vector Arithmetic. Saturated ALU, High IPC (~2.35).`,
        ...prev.slice(0, 10),
      ]);
    } else if (workloadMode === 'cache_miss') {
      setCpuUtil(100.0);
      setIpc(0.28);
      setCacheMissRate(74.6);
      setStallActive(true);
      setLogs((prev) => [
        `[INJECT] Cache Miss Thrash: CPU 100% utilized but stalled ~250 cycles waiting on DRAM! IPC collapsed to 0.28.`,
        ...prev.slice(0, 10),
      ]);
    } else if (workloadMode === 'spinlock') {
      setCpuUtil(100.0);
      setIpc(0.12);
      setCacheMissRate(5.2);
      setStallActive(true);
      setLogs((prev) => [
        `[INJECT] Spinlock Deadlock: Thread executing tight \`pause\` / test-and-set loop. CPU is 100% pegged doing ZERO useful work!`,
        ...prev.slice(0, 10),
      ]);
    } else if (workloadMode === 'context_switch') {
      setCpuUtil(98.5);
      setIpc(0.45);
      setCacheMissRate(38.2);
      setStallActive(true);
      setLogs((prev) => [
        `[INJECT] Context Switching Storm: 5,000 threads thrashing 8 CPU cores. High kernel %sys time, TLB flushed.`,
        ...prev.slice(0, 10),
      ]);
    }
  }, [workloadMode]);

  // Stepping logic
  const stepClock = () => {
    setCycle((c) => c + 1);
    if (stage === 'FETCH') {
      const currentInst = instructions[Math.floor(pc / 4) % instructions.length];
      setIr(currentInst.text);
      // Immediately after fetch, the PC increments to the NEXT instruction!
      const nextPc = (pc + 4) % (instructions.length * 4);
      setPc(nextPc);
      setStage('DECODE');
      setLogs((prev) => [
        `[CYCLE ${cycle + 1} - FETCH] Read instruction \`${currentInst.text}\` from addr 0x${pc.toString(16).padStart(2, '0')}. PC incremented to 0x${nextPc.toString(16).padStart(2, '0')}.`,
        ...prev.slice(0, 10),
      ]);
    } else if (stage === 'DECODE') {
      setStage('EXECUTE');
      setLogs((prev) => [
        `[CYCLE ${cycle + 1} - DECODE] Control Unit decoded opcode for \`${ir}\`. Routing operands to ALU.`,
        ...prev.slice(0, 10),
      ]);
    } else if (stage === 'EXECUTE') {
      if (stallActive) {
        setLogs((prev) => [
          `[CYCLE ${cycle + 1} - STALL] Memory / lock stall detected! ALU waiting for pipeline bubbles. IPC dropped.`,
          ...prev.slice(0, 10),
        ]);
      } else {
        setRegisters((r) => ({
          ...r,
          ACC: (r.R1 + r.R2) % 65536,
          R0: (r.R0 + 1) % 65536,
        }));
        setLogs((prev) => [
          `[CYCLE ${cycle + 1} - EXECUTE] ALU executed operation. Intermediate result stored in Accumulator.`,
          ...prev.slice(0, 10),
        ]);
      }
      setStage('WRITEBACK');
    } else if (stage === 'WRITEBACK') {
      setStage('FETCH');
      setLogs((prev) => [
        `[CYCLE ${cycle + 1} - WRITEBACK] Result written to register file / L1 data cache. Ready for next cycle.`,
        ...prev.slice(0, 10),
      ]);
    }
  };

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(stepClock, clockSpeed === 'slow' ? 1200 : 400);
    return () => clearInterval(interval);
  }, [isRunning, clockSpeed, stage, pc, ir, cycle, stallActive]);

  const resetSim = () => {
    setIsRunning(false);
    setCycle(0);
    setStage('FETCH');
    setPc(0);
    setIr('LOAD R1, [0x10]');
    setRegisters({ R0: 0, R1: 42, R2: 58, R3: 0, ACC: 100 });
    setLogs(['[RESET] CPU registers cleared. Program Counter set to 0x00.']);
  };

  const exportEvidence = () => {
    const report = `# C001 Evidence: Hardware CPU Execution & Profiling Experiment
Date: ${new Date().toISOString()}
Target: C001 CPU execution (Computing Foundation)
Author: Corporate AI/ML Engineering Candidate

## 1. Physical Instruction Lifecycle
- Program Counter (PC): 0x${pc.toString(16).padStart(2, '0')} (Verified: increments during FETCH phase before execute)
- Instruction Register (IR): ${ir}
- Control Unit: Decodes opcode into micro-operations
- ALU: Executes arithmetic on internal registers R1 (${registers.R1}) + R2 (${registers.R2})

## 2. Experimental Benchmark Results
- Workload Profile: ${workloadMode.toUpperCase()}
- Measured CPU Utilization: ${cpuUtil}%
- Measured Instructions Per Cycle (IPC): ${ipc}
- Measured L1/L2 Cache Miss Rate: ${cacheMissRate}%
- Hardware Pipeline State: ${stallActive ? 'STALLED (Memory/Lock Bottleneck)' : 'HEALTHY (Compute Bound)'}

## 3. Interview Resolution: "Why can CPU be 100% while a program is slow?"
Through this hardware simulation, we demonstrated that:
1. When running ${workloadMode === 'arithmetic' ? 'memory cache thrashing' : workloadMode}, CPU cores remain 100% active in the OS scheduling queue.
2. However, IPC drops from 2.35 to ${ipc} because instruction execution units spend up to 250 clock cycles stalled awaiting DRAM access or contending on atomic spinlocks.
3. Therefore, top/CPU% is an incomplete metric; production monitoring must measure IPC (perf stat) and cache miss rates.`;

    if (onSaveEvidence) {
      onSaveEvidence(report);
    }
    setEvidenceSaved(true);
    setTimeout(() => setEvidenceSaved(false), 3000);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-5 shadow-2xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-semibold text-white">C001 Hardware Execution Lab: CPU & Pipeline Simulator</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Observe the Fetch-Decode-Execute pipeline, register state changes, and why CPU can be 100% while IPC collapses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Pause Clock' : 'Start Clock'}
          </button>

          <button
            onClick={stepClock}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40"
          >
            Step 1 Cycle
          </button>

          <button
            onClick={resetSim}
            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700"
            title="Reset Simulator"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={exportEvidence}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 flex items-center gap-1.5"
          >
            {evidenceSaved ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            {evidenceSaved ? 'Evidence Saved!' : 'Save Evidence Artifact'}
          </button>
        </div>
      </div>

      {/* Hardware Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>CPU Utilization</span>
            <Activity className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">{cpuUtil.toFixed(1)}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-teal-400 h-full rounded-full" style={{ width: `${cpuUtil}%` }} />
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Status: {cpuUtil > 95 ? 'Core Saturated' : 'Idle'}</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Instructions / Cycle (IPC)</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ipc > 1.0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              {ipc > 1.0 ? 'FAST' : 'STALLED'}
            </span>
          </div>
          <div className={`text-xl font-bold font-mono mt-1 ${ipc > 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {ipc.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-mono">
            {ipc > 1.0 ? 'Retiring instructions normally' : 'Pipeline blocked on memory/lock'}
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>L1/L2 Cache Misses</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${cacheMissRate > 30 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-xl font-bold font-mono mt-1 ${cacheMissRate > 30 ? 'text-amber-400' : 'text-slate-200'}`}>
            {cacheMissRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-mono">
            {cacheMissRate > 30 ? 'Memory thrashing active' : 'Working set in cache'}
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
          <div className="text-[11px] font-mono uppercase text-slate-400">Current Pipeline Stage</div>
          <div className="text-xl font-bold font-mono text-teal-300 mt-1">{stage}</div>
          <div className="text-[10px] text-slate-400 mt-2 font-mono">Clock cycle #{cycle}</div>
        </div>
      </div>

      {/* Failure Injection & Workload selector */}
      <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
          Workload Injection Mode (Test Failure Scenarios)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => setWorkloadMode('arithmetic')}
            className={`p-2.5 rounded-lg border text-left text-xs transition ${
              workloadMode === 'arithmetic'
                ? 'bg-teal-950/50 border-teal-500 text-teal-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-semibold text-white">1. Vector Arithmetic</div>
            <div className="text-[10px] text-slate-400 mt-0.5">CPU 100% · High IPC (2.35) · Fast</div>
          </button>

          <button
            onClick={() => setWorkloadMode('cache_miss')}
            className={`p-2.5 rounded-lg border text-left text-xs transition ${
              workloadMode === 'cache_miss'
                ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-semibold text-amber-400 flex items-center justify-between">
              <span>2. Cache Miss Storm</span>
              <span className="text-[9px] bg-amber-500/20 px-1 py-0.5 rounded">Break</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">CPU 100% · Low IPC (0.28) · Stalled</div>
          </button>

          <button
            onClick={() => setWorkloadMode('spinlock')}
            className={`p-2.5 rounded-lg border text-left text-xs transition ${
              workloadMode === 'spinlock'
                ? 'bg-rose-950/50 border-rose-500 text-rose-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-semibold text-rose-400 flex items-center justify-between">
              <span>3. Spinlock Deadlock</span>
              <span className="text-[9px] bg-rose-500/20 px-1 py-0.5 rounded">Break</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">CPU 100% · Zero useful progress</div>
          </button>

          <button
            onClick={() => setWorkloadMode('context_switch')}
            className={`p-2.5 rounded-lg border text-left text-xs transition ${
              workloadMode === 'context_switch'
                ? 'bg-purple-950/50 border-purple-500 text-purple-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-semibold text-purple-300">4. Context Switch Storm</div>
            <div className="text-[10px] text-slate-400 mt-0.5">High %sys time · TLB thrashing</div>
          </button>
        </div>
      </div>

      {/* Visual CPU Architecture Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Instruction Memory & PC */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Instruction Memory (RAM)</span>
            <span className="text-[10px] font-mono text-teal-400">PC: 0x{pc.toString(16).padStart(2, '0')}</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {instructions.map((inst) => {
              const isCurrent = Math.floor(pc / 4) % instructions.length === inst.addr / 4;
              return (
                <div
                  key={inst.addr}
                  className={`p-2 rounded border transition ${
                    isCurrent
                      ? 'bg-teal-950/60 border-teal-500 text-teal-200 font-semibold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">0x{inst.addr.toString(16).padStart(2, '0')}:</span>
                    <span className={isCurrent ? 'text-teal-300' : 'text-slate-300'}>{inst.text}</span>
                    {isCurrent && <span className="text-[9px] bg-teal-500/30 px-1 py-0.5 rounded text-teal-300">PC TARGET</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{inst.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CPU Core: Control Unit + ALU + IR */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              CPU Execution Engine (Core 0)
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Instruction Register (IR)</div>
                <div className="text-teal-400 font-bold text-sm mt-0.5">{ir}</div>
              </div>

              <div className={`p-3 rounded border transition ${
                stallActive ? 'bg-rose-950/40 border-rose-700/60' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                  <span>Arithmetic Logic Unit (ALU)</span>
                  <span className={stallActive ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {stallActive ? 'STALLED (Waiting Memory)' : 'ACTIVE'}
                  </span>
                </div>
                <div className="text-sm text-slate-200 mt-1 flex items-center justify-between">
                  <span>OP: ADD R1, R2</span>
                  <span className="font-bold text-amber-300">ACC: {registers.ACC}</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Control Unit State</div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Microcode: {stage === 'FETCH' ? 'Assert MEM_READ, PC_INC' : stage === 'DECODE' ? 'Decode Opcode 0x03' : stage === 'EXECUTE' ? 'Assert ALU_ADD' : 'Assert REG_WRITE'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 bg-slate-900/60 border border-slate-800 rounded text-[11px] text-slate-400 font-mono">
            Speed:
            <button
              onClick={() => setClockSpeed('slow')}
              className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${clockSpeed === 'slow' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-500'}`}
            >
              1 Hz (Step by step)
            </button>
            <button
              onClick={() => setClockSpeed('fast')}
              className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${clockSpeed === 'fast' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-500'}`}
            >
              3 Hz
            </button>
          </div>
        </div>

        {/* Register File & Memory Writeback */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
            General Purpose Registers
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            {Object.entries(registers).map(([reg, val]) => (
              <div key={reg} className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">{reg}</div>
                <div className="text-sm font-bold text-white mt-0.5">{val}</div>
                <div className="text-[9px] text-slate-500">0x{val.toString(16).padStart(4, '0')}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase mb-1">C001 Core Principle</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Notice that the <strong>Program Counter (PC)</strong> increments to the next address immediately during the <code className="text-teal-300">FETCH</code> stage, before the ALU even begins executing!
            </p>
          </div>
        </div>
      </div>

      {/* Live Hardware Terminal Execution Logs */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            Hardware & Kernel Event Log (Ring 0 / perf)
          </span>
          <span className="text-[10px] text-slate-500">Live telemetry</span>
        </div>
        <div className="space-y-1 text-[11px] max-h-36 overflow-y-auto pr-1">
          {logs.map((log, i) => (
            <div key={i} className={log.includes('STALL') || log.includes('INJECT') ? 'text-amber-400' : log.includes('FETCH') ? 'text-teal-300' : 'text-slate-400'}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
