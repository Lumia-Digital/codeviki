import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'mistral' | 'deepseek';
export type DocSection = {
  id: string;
  title: string;
  content: string;
  order: number;
  category?: string; // 'Tutorials' | 'How-to Guides' | 'Reference' | 'Explanations'
};

export type DiagramData = {
  id: string;
  title: string;
  type: string;
  mermaidCode: string;
  description: string;
};

export type GeneratedDocs = {
  projectName: string;
  language: string;
  framework: string;
  sections: DocSection[];
  diagrams: DiagramData[];
  metadata: {
    generatedAt: string;
    model: string;
    provider: string;
    fileCount: number;
    totalLines: number;
  };
  architectureSoul?: string;
  techStack?: string[];
  setupSequence?: string[];
  tours?: Array<{
    id: string;
    title: string;
    description: string;
    steps: Array<{
      title: string;
      content: string;
      file: string; // source://...#L...
    }>;
  }>;
};

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────

const CORE_PRINCIPLES = `You are a Google Staff Engineer and World-Class Technical Author. You produce the "Gold Standard" of documentation: deep, analytical, and logically sound narratives.

## STAFF ENGINEER PRINCIPLES: LOGIC DNA & ARCHITECTURAL RATIONALE
- **The "Why", Not Just "How"**: Every explanation must discuss the architectural rationale. Why this pattern? Why this database choice? Why this specific algorithm?
- **Logic DNA**: Deconstruct complex functions into their logical components. Explain the mathematical or logical "DNA" of the solution.
- **Performance & Security**: Explicitly mention performance complexity (Big O) and security considerations (data sanitization, auth boundaries).
- **Line-Level Traceability**: ALWAYS use \`source://path/to/file.ts#L10-L25\` or \`source://file.ts#L5\` to link to exact lines of code.
- **Diátaxis Framework**: Content must be clearly separated into Tutorials (Learning), How-To Guides (Problem-solving), Reference (Information), and Explanations (Understanding).
- **Audience**: Write for Senior/Staff engineers. Avoid superficial high-level fluff.
- **Rich Media**: Use diagrams for complex flows.

## MANDATORY CROSS-LINKING (PIONEER PRECISION)
Every time you mention a file, directory, function, or class, you MUST link it using the source:// protocol.
To be a pioneer, you MUST provide EXACT line ranges for functions and logic blocks.
Examples:
- [auth.ts](source://src/lib/auth.ts)
- [getSession()](source://src/lib/auth.ts#L45-L62)
- The validation logic in [route.ts](source://src/app/api/generate/route.ts#L110-L125)
`;

const BLUEPRINT_PROMPT = `${CORE_PRINCIPLES}

## YOUR TASK: PHASE 1 - ARCHITECTURAL BLUEPRINT
Analyze the provided codebase and generate a comprehensive "Documentation Blueprint". This blueprint will be used to generate deep-dive sections in subsequent steps.

## PIONEER REQUIREMENTS:
1. **The "Soul" of the Project**: Identify the core purpose and the "why" behind the codebase.
2. **Tech Stack & Foundations**: Exhaustively list the build-on technologies (Frameworks, DBs, Auth, UI, Tooling).
3. **Setup Intelligence**: Identify the exact sequence to run the project.
4. **Exhaustive Outlining**: For each Diátaxis category, identify 5-8 distinct, deep-dive topics.

Return ONLY a JSON object:
{
  "projectName": "string",
  "language": "string",
  "framework": "string",
  "blueprint": {
    "architectureOverview": "1,500+ word deep narrative of the system design",
    "keyModules": [{ "name": "string", "role": "string", "impact": "Senior decision rationale" }],
    "techStack": ["Exhaustive list of techs used"],
    "setupSequence": ["Step 1", "Step 2", "..."],
    "sectionOutlines": {
      "Tutorials": ["Topic 1: Project Introduction & Executive Summary (Mandatory High-Level Overview)", "Topic 2: Project Architecture", "... at least 5"],
      "HowToGuides": ["Topic 1: How to add a new feature", "Topic 2: How to test", "... at least 5"],
      "Reference": ["Topic 1: API Surface", "Topic 2: Data Schema", "... at least 5"],
      "Explanations": ["Topic 1: Core Logic Deconstruction", "Topic 2: Performance Design", "... at least 5"]
    }
  },
  "diagrams": []
}`;

const TOUR_PROMPT = (tourTitle: string, tourDescription: string, focalFiles: string[]) => `${CORE_PRINCIPLES}
## YOUR TASK: ARCHITECTURAL TOUR [${tourTitle.toUpperCase()}]
Create a "Guided Architectural Tour" for the feature: ${tourTitle}.
The goal is to walk a new engineer through the logic, step-by-step, across multiple files.

Feature Description: ${tourDescription}
Focal Files to consider: ${focalFiles.join(', ')}

Return ONLY a JSON object with a "steps" key containing the array:
{
  "steps": [
    {
      "title": "Step 1: The Entry Point",
      "content": "Explain what happens here in the narrative style...",
      "file": "source://src/api/handler.ts#L10-L25"
    }
  ]
}
`;

const SECTION_PROMPT = (category: string, topic: string) => `${CORE_PRINCIPLES}
## YOUR TASK: PHASE 2 - DEEP DIVE [${category.toUpperCase()}]
## TOPIC: ${topic}

Using the provided Codebase Context and the Architectural Blueprint, generate an EXHAUSTIVE documentation section for this specific topic.

## MANDATORY DEPTH (STRICT MINIMUMS)
- This specific section MUST exceed 5,000 words of technical narrative just for this topic.
- You MUST provide line-level precision in your links using #LX or #LX-LY.
- LOGIC DECONSTRUCTION: For every core function, explain the logic flow, boundary cases, and Big O complexity.
- RATIONALE: Explain WHY specific technical decisions were made.
- Use real code slices with filenames: \`\`\`ts:path/to/file.ts
- Use GitHub-style alerts (Note, Tip, Important).
- DIAGRAMS: If you include a Mermaid diagram, you MUST wrap it in a triple-backtick block with the "mermaid" identifier.
- COMMANDS: If you include shell/CLI commands, you MUST wrap them in a triple-backtick block with the "terminal" or "bash" identifier.

Return ONLY a JSON object. If you wrap it in a key, use "section".
{
  "id": "string-slug",
  "title": "${topic}",
  "category": "${category}",
  "content": "Professional, deep-dive markdown content for this topic. Aim for 5,000+ words.",
  "order": number
}`;

const VISUALS_PROMPT = `${CORE_PRINCIPLES}
## YOUR TASK: PHASE 4 - VISUAL ARCHITECTURE
Generate an EXHAUSTIVE set of high-fidelity Mermaid diagrams (aim for 10-15) that represent the project's logic, data flow, components, and infrastructure. DO NOT CAP THE NUMBER OF DIAGRAMS.

Return ONLY a JSON object with a "diagrams" array:
{
  "diagrams": [
    {
      "id": "string-slug",
      "title": "Clear Technical Title",
      "type": "flowchart | sequenceDiagram | erDiagram | classDiagram",
      "mermaidCode": "Mermaid syntax here",
      "description": "Deep technical explanation of what this diagram proves about the architecture, logic, and data flow."
    }
  ]
}`;

const SYSTEM_PROMPT = `${CORE_PRINCIPLES}
## MANDATORY CROSS-LINKING (REVOLUTIONARY FEATURE)

Every time you mention a file, directory, function, or class, you MUST link it using the \`source://\` protocol. 
Examples:
- In \`[auth.ts](source://src/lib/auth.ts)\`, we handle...
- The \`[getSession()](source://src/lib/auth.ts)\` function triggers...
- Navigate to the \`[components](source://src/components)\` folder...

This is CRITICAL for the interactive code explorer feature.

## MANDATORY DEPTH REQUIREMENTS (HARD MINIMUMS)

These are STRICTOR minimums. You MUST exceed them:
- Explanation sections (architecture, ADRs): minimum 3,500 words each
- Reference sections (API, schema, types): minimum 3,000 words each
- Tutorial sections (setup, getting started): minimum 2,500 words each
- How-to Guide sections (specific tasks): minimum 2,500 words each
- Project Narrative / Executive Overview: minimum 2,000 words

## CONTENT REQUIREMENTS PER SECTION

1. Opening Narrative — The problem this section solves and its architectural role.
2. Hierarchical Subsections — Use ##, ###, and #### headers.
3. Real Code Slices — Use real code blocks with filename tags: \`\`\`ts:path/to/file.ts
4. High-Fidelity Callouts — Use GitHub-style alerts for caveats and pro-tips.

## MERMAID DIAGRAMS

Generate 4-6 high-quality Mermaid diagrams. Ensure they are complex and representative of real architecture.

## OUTPUT FORMAT

Return ONLY a valid JSON object. No markdown fences around the JSON.

{
  "projectName": "string",
  "language": "string",
  "framework": "string",
  "sections": [
    {
      "id": "id",
      "title": "Title",
      "category": "Tutorials | How-to Guides | Reference | Explanations",
      "content": "Full markdown content with source:// links and deep narrative text.",
      "order": number
    }
  ],
  "diagrams": [
    {
      "id": "id",
      "title": "Title",
      "type": "flowchart | sequenceDiagram | erDiagram | classDiagram",
      "mermaidCode": "syntax",
      "description": "description"
    }
  ]
}

CRITICAL: Inside the JSON "content" fields, represent code blocks using markdown syntax where backticks are literal characters (they are fine inside a JSON string value). Make sure all JSON strings are properly escaped — use \\\\n for newlines and \\\\" for quotes inside values.`;

// ─── User message helper ─────────────────────────────────────────────────────
const USER_MSG = (codeContext: string) =>
  `Analyze this codebase thoroughly and generate EXHAUSTIVE, DEEP technical documentation. ` +
  `Each section must meet the mandatory word count minimums defined in your instructions. ` +
  `Do NOT summarize — write full technical explanations with real code examples from the provided files.\n\n` +
  codeContext;

// ─── OpenAI ──────────────────────────────────────────────────────────────────
export async function generateWithOpenAI(
  apiKey: string,
  model: string,
  codeContext: string
): Promise<GeneratedDocs> {
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: model || 'gpt-5.4',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: USER_MSG(codeContext) },
    ],
    temperature: 0.2,
    max_tokens: 32000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from OpenAI');

  const parsed = JSON.parse(content);
  return {
    ...parsed,
    metadata: {
      ...parsed.metadata,
      generatedAt: new Date().toISOString(),
      model,
      provider: 'openai',
    },
  };
}

// ─── Anthropic ───────────────────────────────────────────────────────────────
export async function generateWithAnthropic(
  apiKey: string,
  model: string,
  codeContext: string
): Promise<GeneratedDocs> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: model || 'claude-4.6-sonnet',
    max_tokens: 32000,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: USER_MSG(codeContext) },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('No response from Anthropic');

  // Try to extract JSON from the response
  let jsonStr = textBlock.text;
  const jsonMatch = jsonStr.match(/\\{[\\s\\S]*\\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  const parsed = JSON.parse(jsonStr);
  return {
    ...parsed,
    metadata: {
      ...parsed.metadata,
      generatedAt: new Date().toISOString(),
      model,
      provider: 'anthropic',
    },
  };
}

// ─── Google ───────────────────────────────────────────────────────────────────
export async function generateWithGoogle(
  apiKey: string,
  model: string,
  codeContext: string
): Promise<GeneratedDocs> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({
      model: model || 'gemini-3.1-flash-lite',
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 16384,
        temperature: 0.2,
      }
    });

    const result = await genModel.generateContent([
      SYSTEM_PROMPT,
      USER_MSG(codeContext),
    ]);

    const text = result.response.text();

    // Attempt to extract the outermost JSON object
    let jsonStr = text.trim();

    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    // Remove trailing commas before closing braces/brackets
    jsonStr = jsonStr.replace(/,\\s*([\\]}])/g, '$1');

    try {
      const parsed = JSON.parse(jsonStr);
      return {
        ...parsed,
        metadata: {
          ...parsed.metadata,
          generatedAt: new Date().toISOString(),
          model,
          provider: 'google',
        },
      };
    } catch (parseError: any) {
      console.error("Gemini JSON Parse Error. Full response sample:", text.substring(0, 1000));
      console.error("Attempted to parse (cleaned):", jsonStr.substring(0, 200) + "...");
      throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.status === 429 || error.message?.includes('429')) {
      throw new Error('API Rate Limit Exceeded: Free tier quota reached. Please wait a minute or use a different AI provider/key.');
    }
    throw new Error(`Google API Error: ${error.message || 'Unknown error'}`);
  }
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────
export async function generateDocs(
  provider: AIProvider,
  apiKey: string,
  model: string,
  codeContext: string
): Promise<GeneratedDocs> {
  // Use Phase-based generation for Maximum Depth
  console.log('[CodeWiki] Starting Multi-Phase Generation...');

  // PHASE 1: GENERATE BLUEPRINT
  const blueprintResponse = await generateWithProvider(provider, apiKey, model, BLUEPRINT_PROMPT, USER_MSG(codeContext));

  // Defensive validation of blueprint structure
  const projectName = blueprintResponse?.projectName || 'Project Architecture';
  const language = blueprintResponse?.language || 'Unknown';
  const framework = blueprintResponse?.framework || 'In-House';
  const diagrams = Array.isArray(blueprintResponse?.diagrams) ? blueprintResponse.diagrams : [];

  // Handle cases where the AI might return blueprint fields at top level or inside a key
  const blueprint = blueprintResponse?.blueprint || {
    architectureOverview: blueprintResponse?.architectureOverview || 'Deep technical analysis required.',
    keyModules: blueprintResponse?.keyModules || [],
    techStack: blueprintResponse?.techStack || [],
    setupSequence: blueprintResponse?.setupSequence || [],
    sectionOutlines: blueprintResponse?.sectionOutlines || {
      Tutorials: [], HowToGuides: [], Reference: [], Explanations: []
    },
    tourOutlines: blueprintResponse?.tourOutlines || []
  };

  const sectionOutlines = blueprint.sectionOutlines || {
    Tutorials: [], HowToGuides: [], Reference: [], Explanations: []
  };

  const sections: DocSection[] = [];
  const categories = ['Tutorials', 'How-to Guides', 'Reference', 'Explanations'];

  // Throttle before starting sections to respect RPM
  await sleep(provider === 'google' ? 8000 : 2000);

  // PHASE 2: GENERATE EACH SECTION INDIVIDUALLY
  let globalOrder = 1;
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const outlineKey = category.replace('How-to ', 'HowTo').replace(' ', '');
    const outline = (sectionOutlines as any)[outlineKey] || [];

    console.log(`[CodeWiki] Generating ${outline.length} segments for category: ${category}...`);

    for (const topic of outline) {
      console.log(`[CodeWiki] Topic: ${topic}...`);
      const sectionPrompt = SECTION_PROMPT(category, topic);
      const sectionUserMsg = `Context:\n${codeContext}\n\nBlueprint:\n${JSON.stringify(blueprint)}`;

      const sectionResponse = await generateWithProvider(provider, apiKey, model, sectionPrompt, sectionUserMsg);
      const actualSection = sectionResponse?.section || (sectionResponse?.id ? sectionResponse : null);

      if (actualSection) {
        sections.push({
          ...actualSection,
          category, // Ensure category is strictly assigned
          order: globalOrder++
        });
      }

      // Delay between topics to respect rate limits
      await sleep(provider === 'google' ? 5000 : 1000);
    }

    // Larger delay between categories
    await sleep(provider === 'google' ? 10000 : 2000);
  }


  // PHASE 4: DEDICATED VISUALS (Ensure Visuals tab is never empty)
  console.log('[CodeWiki] Generating Dedicated Visuals...');
  await sleep(provider === 'google' ? 8000 : 2000);
  const visualsResponse = await generateWithProvider(provider, apiKey, model, VISUALS_PROMPT, `Codebase Context:\n${codeContext}`);
  const finalDiagrams = Array.isArray(visualsResponse?.diagrams) ? visualsResponse.diagrams : (diagrams.length > 0 ? diagrams : []);

  return {
    projectName,
    language,
    framework,
    sections,
    diagrams: finalDiagrams,
    tours: [],
    architectureSoul: blueprint.architectureOverview,
    techStack: blueprint.techStack,
    setupSequence: blueprint.setupSequence,
    metadata: {
      generatedAt: new Date().toISOString(),
      model,
      provider,
      fileCount: 0, // Will be filled by caller
      totalLines: 0,
    },
  };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function sanitizeJson(text: string): any {
  try {
    // 1. Extract the JSON core (between first { and last })
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return {};

    let jsonStr = text.substring(start, end + 1);

    // 2. God Mode Cleaning
    jsonStr = jsonStr
      // Remove potential markdown blocks
      .replace(/```json\n?|\n?```/g, '')
      // Remove trailing commas before closing braces/brackets
      .replace(/,\s*([\]}])/g, '$1')
      // Fix unescaped backslashes that aren't valid JSON escapes
      // (Matches a \ not followed by ", \, /, b, f, n, r, t, u)
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
      // Fix unescaped newlines/tabs inside string values
      // This is the "God Pattern": find strings, and escape internal unescaped control chars
      .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
        return match
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
      });

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn('[CodeWiki] Standard JSON parse failed, trying aggressive recovery...');
      
      // 3. Ultra-Aggressive Recovery — only fix backslashes and non-printable chars
      const ultraClean = jsonStr
        // Remove non-printable chars but keep common whitespace
        .replace(/[^\x20-\x7E\n\r\t]/g, '')
        // Fix backslashes that aren't valid JSON escape sequences
        .replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');

      try {
        return JSON.parse(ultraClean);
      } catch (e2) {
        console.error('[CodeWiki] Aggressive recovery also failed. Raw sample (first 500 chars):', jsonStr.substring(0, 500));
        throw e2; // Let the outer catch handle it
      }
    }
  } catch (err) {
    console.error('[CodeWiki] JSON Sanitization Critical Failure:', err);
    console.error('[CodeWiki] This section will be skipped. AI response could not be parsed.');
    return {};
  }
}

async function generateWithProvider(
  provider: AIProvider,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMsg: string,
  retries = 3
): Promise<any> {
  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await (async () => {
        switch (provider) {
          case 'openai': {
            const client = new OpenAI({ apiKey });
            const res = await client.chat.completions.create({
              model: model || 'gpt-4o',
              messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
              temperature: 0.2,
              max_tokens: 32000,
              response_format: { type: 'json_object' },
            });
            return res.choices[0]?.message?.content || '{}';
          }
          case 'anthropic': {
            const client = new Anthropic({ apiKey });
            const res = await client.messages.create({
              model: model || 'claude-3-5-sonnet-latest',
              max_tokens: 32000,
              system: systemPrompt,
              messages: [{ role: 'user', content: userMsg }],
            });
            return (res.content[0] as any).text || '{}';
          }
          case 'google': {
            const genAI = new GoogleGenerativeAI(apiKey);
            const genModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' });
            const result = await genModel.generateContent([systemPrompt, userMsg]);
            return result.response.text();
          }
          default:
            throw new Error(`Unsupported provider: ${provider}`);
        }
      })();

      return sanitizeJson(result);
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message?.toLowerCase() || '';
      const isRateLimit = error.status === 429 || errorMsg.includes('429') || errorMsg.includes('rate limit');
      const isFetchError = errorMsg.includes('fetch failed') || errorMsg.includes('timeout') || errorMsg.includes('econnreset') || errorMsg.includes('abort');

      if ((isRateLimit || isFetchError) && attempt < retries - 1) {
        const waitTime = isRateLimit ? Math.pow(2, attempt) * 15000 : 2000; // Longer wait for rate limits
        console.warn(`[CodeWiki] ${isRateLimit ? 'Rate limited' : 'Network error'} (${errorMsg}). Retrying in ${waitTime / 1000}s... (Attempt ${attempt + 1}/${retries})`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// ─── API Key Validation ───────────────────────────────────────────────────────
export async function validateApiKey(
  provider: AIProvider,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (provider) {
      case 'openai': {
        const client = new OpenAI({ apiKey });
        await client.models.list();
        return { valid: true };
      }
      case 'anthropic': {
        const client = new Anthropic({ apiKey });
        await client.messages.create({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        });
        return { valid: true };
      }
      case 'google': {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        await model.generateContent('Hi');
        return { valid: true };
      }
      default:
        return { valid: false, error: 'Provider not supported for validation' };
    }
  } catch (err: unknown) {
    const error = err as Error;
    return { valid: false, error: error.message || 'Invalid API key' };
  }
}
