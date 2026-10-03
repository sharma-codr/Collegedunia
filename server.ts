import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client setup
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Socratic Tutor Endpoint
  app.post('/api/tutor', async (req, res) => {
    try {
      const {
        competencyId,
        competencyName,
        domainName,
        currentGate,
        gatesPassed,
        userMessage,
        conversationHistory,
      } = req.body;

      const systemInstruction = `You are a rigorous, Socratic staff AI & ML engineering mentor inside the "Corporate AI/ML Engineer Skill OS".
The learner is working on competency: ${competencyName} (${domainName}, ID: ${competencyId}).
Mastery gates in strict order: Know -> Build -> Break -> Debug -> Design -> Prove.
Gates passed: ${gatesPassed} of 5.
Current gate being evaluated: ${currentGate}.

Core Pedagogical Philosophy:
- Don't just teach the ML stack or syntax. Teach how to engineer, test, break, and scale intelligent systems.
- Teach Socratically: ask ONE targeted question or hands-on drill at a time (under 130 words).
- Grade every learner response with uncompromising technical honesty:
  1. State what is technically accurate.
  2. State what is missing, hand-wavy, or flawed.
- Never pass a gate on vague recognition, memorized textbook definitions, or buzzwords.
- When the learner demonstrably satisfies the requirements of the current gate:
  - Start your reply with [PASS]
  - Name the exact artifact or EVIDENCE they must save (e.g., terminal trace, microbenchmark, memory profile, unit test, postmortem).
  - Open the next gate immediately with its first question/task.
- End every single response with exactly ONE concrete question, drill, or challenge.
- Plain text / concise markdown only (no giant markdown tables or bloated summaries).`;

      if (ai) {
        // Format history
        const contents: any[] = [];
        
        // Add conversation history
        if (Array.isArray(conversationHistory)) {
          for (const msg of conversationHistory) {
            if (msg.role === 'user' || msg.role === 'assistant') {
              contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
              });
            }
          }
        }

        // Add latest user message
        contents.push({
          role: 'user',
          parts: [{ text: userMessage || 'Hello mentor, start the drill for this gate.' }],
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        return res.json({ reply: response.text || 'Continue with your explanation.' });
      }

      // Offline / Fallback Socratic Tutor logic for reliable operation
      let fallbackReply = '';
      const textLower = (userMessage || '').toLowerCase();

      if (competencyId === 'C001' || competencyName?.includes('CPU execution')) {
        if (gatesPassed === 0) {
          // Gate: Know
          if (!userMessage || userMessage.includes('begin') || userMessage.includes('start') || userMessage.includes('tutor me')) {
            fallbackReply = `Welcome to C001 (CPU Execution). Before touching ML frameworks, you must master the metal.\n\nHere is your drill for the KNOW gate:\nTrace what happens inside the physical CPU from the moment an instruction like \`ADD R1, R2\` is fetched from memory. In your own words, describe the roles of the Program Counter (PC), Instruction Register (IR), Control Unit, and ALU.\n\nWhat happens to the PC immediately after the instruction is fetched?`;
          } else if (textLower.includes('increment') || textLower.includes('next instruction') || textLower.includes('program counter') || textLower.includes('alu')) {
            fallbackReply = `[PASS]\nEvidence to save: "cpu_fetch_decode_execute_trace.md" - Documenting register state transitions and PC increment behavior.\n\nAccurate breakdown: you correctly noted that the Program Counter (PC) holds the memory address of the next instruction and increments immediately during fetch while the Instruction Register (IR) holds the current opcode for decoding by the Control Unit.\n\nNow entering Gate 2: BUILD.\nTo prove you understand CPU execution without relying on a third-party framework, write or trace a minimal 15-line loop in Python or C that forces the CPU to max out a single core doing pure arithmetic vs one that does an I/O wait. How does the OS scheduler treat the thread in both cases?`;
          } else {
            fallbackReply = `You touched on instruction processing, but your explanation is incomplete. You need to explicitly detail the fetch-decode-execute cycle and what happens to the Program Counter (PC).\n\nWhen the CPU fetches an instruction from memory into the Instruction Register, does the PC remain pointing at that instruction, or does it update immediately? Explain why.`;
          }
        } else if (gatesPassed === 1) {
          // Gate: Build
          fallbackReply = `Understood. In Gate 2 (BUILD): To build proof of CPU behavior, run a process that alternates between high CPU utilization (matrix multiplications in a tight loop) and I/O waiting. What CPU registers store intermediate arithmetic state before writing back to cache?`;
        } else {
          fallbackReply = `Reviewing your analysis for gate ${currentGate}. Identify the exact hardware bottleneck: is it instruction retire stalls, branch misprediction, or L1/L2 cache misses?`;
        }
      } else {
        fallbackReply = `Let's tackle ${competencyName} at gate ${currentGate}.\n\nExplain the foundational mechanism in your own words, and identify the single most critical failure mode that causes production outages with this concept.`;
      }

      return res.json({ reply: fallbackReply });
    } catch (err: any) {
      console.error('Tutor error:', err);
      res.status(500).json({ error: err.message || 'Tutor generation failed' });
    }
  });

  // Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer().catch(console.error);
