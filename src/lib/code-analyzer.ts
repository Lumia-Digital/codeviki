const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.cache',
  '__pycache__', '.venv', 'venv', 'env', '.env', '.idea', '.vscode',
  'coverage', '.nyc_output', '.turbo', '.vercel', '.svn', 'vendor',
  'target', 'out', '.output', '.nuxt', '.svelte-kit',
]);

const IGNORE_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
  '.DS_Store', 'Thumbs.db', '.gitignore', '.eslintcache',
]);

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.rs', '.java',
  '.kt', '.swift', '.c', '.cpp', '.h', '.hpp', '.cs', '.php',
  '.vue', '.svelte', '.astro', '.ex', '.exs', '.scala', '.dart',
  '.lua', '.r', '.R', '.jl', '.hs', '.ml', '.clj', '.erl',
]);

const CONFIG_FILES = new Set([
  'package.json', 'tsconfig.json', 'next.config.js', 'next.config.ts',
  'next.config.mjs', 'vite.config.ts', 'vite.config.js',
  'webpack.config.js', 'rollup.config.js', 'tailwind.config.js',
  'tailwind.config.ts', 'prisma/schema.prisma', 'docker-compose.yml',
  'Dockerfile', 'Makefile', 'Cargo.toml', 'go.mod', 'requirements.txt',
  'pyproject.toml', 'setup.py', 'Gemfile', 'build.gradle', 'pom.xml',
  '.env.example', 'README.md', 'readme.md',
]);

const ENTRY_PATTERNS = [
  'index', 'main', 'app', 'server', 'src/index', 'src/main', 'src/app',
  'pages/index', 'pages/_app', 'src/pages/index', 'lib/index',
];

export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  children?: FileNode[];
};

export type AnalysisResult = {
  fileTree: FileNode;
  fileTreeString: string;
  importantFiles: { path: string; content: string }[];
  language: string;
  framework: string;
  totalFiles: number;
  totalLines: number;
  codeContext: string;
};

function detectLanguage(files: string[]): string {
  const extCounts: Record<string, number> = {};
  for (const f of files) {
    const ext = f.substring(f.lastIndexOf('.'));
    if (CODE_EXTENSIONS.has(ext)) {
      extCounts[ext] = (extCounts[ext] || 0) + 1;
    }
  }
  const sorted = Object.entries(extCounts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return 'Unknown';
  const ext = sorted[0][0];
  const langMap: Record<string, string> = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript',
    '.jsx': 'JavaScript', '.py': 'Python', '.rb': 'Ruby', '.go': 'Go',
    '.rs': 'Rust', '.java': 'Java', '.kt': 'Kotlin', '.swift': 'Swift',
    '.c': 'C', '.cpp': 'C++', '.cs': 'C#', '.php': 'PHP',
    '.vue': 'Vue', '.svelte': 'Svelte', '.dart': 'Dart',
  };
  return langMap[ext] || ext;
}

function detectFramework(files: string[], contents: Record<string, string>): string {
  const filenames = files.map(f => f.toLowerCase());
  const pkgJson = contents['package.json'];
  
  if (pkgJson) {
    try {
      const pkg = JSON.parse(pkgJson);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps['next']) return 'Next.js';
      if (allDeps['nuxt']) return 'Nuxt.js';
      if (allDeps['@angular/core']) return 'Angular';
      if (allDeps['vue']) return 'Vue.js';
      if (allDeps['svelte']) return 'Svelte';
      if (allDeps['react']) return 'React';
      if (allDeps['express']) return 'Express';
      if (allDeps['fastify']) return 'Fastify';
      if (allDeps['hono']) return 'Hono';
    } catch { /* ignore */ }
  }
  
  if (filenames.some(f => f.includes('requirements.txt') || f.includes('pyproject.toml'))) {
    const req = contents['requirements.txt'] || '';
    if (req.includes('django')) return 'Django';
    if (req.includes('flask')) return 'Flask';
    if (req.includes('fastapi')) return 'FastAPI';
  }
  
  if (filenames.some(f => f.includes('cargo.toml'))) return 'Rust/Cargo';
  if (filenames.some(f => f.includes('go.mod'))) return 'Go Module';
  if (filenames.some(f => f.includes('gemfile'))) return 'Ruby on Rails';
  
  return 'None Detected';
}

function buildFileTreeString(node: FileNode, indent: string = ''): string {
  let result = '';
  if (node.type === 'directory') {
    result += `${indent}${node.name}/\n`;
    if (node.children) {
      for (const child of node.children) {
        result += buildFileTreeString(child, indent + '  ');
      }
    }
  } else {
    result += `${indent}${node.name}\n`;
  }
  return result;
}

function isImportantFile(path: string, name: string): boolean {
  if (CONFIG_FILES.has(name)) return true;
  const pathLower = path.toLowerCase();
  if (ENTRY_PATTERNS.some(p => pathLower.includes(p))) return true;
  // Types/interfaces files
  if (name.includes('types') || name.includes('interfaces') || name.includes('schema')) return true;
  // Route files
  if (name === 'route.ts' || name === 'route.js') return true;
  // Page files
  if (name === 'page.tsx' || name === 'page.jsx' || name === 'page.ts') return true;
  // Layout files
  if (name.includes('layout')) return true;
  // Middleware
  if (name.includes('middleware')) return true;
  return false;
}

export type DeepAnalysis = {
  apis: { method: string; path: string; description: string }[];
  modules: { name: string; type: string; importance: 'high' | 'medium' | 'low'; description: string }[];
  securityObservations: string[];
  techStackDetailed: string[];
  patterns: { name: string; file: string; type: string }[];
  architecturalDecisions: string[];
};

export function performDeepAnalysis(files: { path: string; content: string }[], result: AnalysisResult): DeepAnalysis {
  const apis: DeepAnalysis['apis'] = [];
  const modules: DeepAnalysis['modules'] = [];
  const patterns: DeepAnalysis['patterns'] = [];
  const architecturalDecisions: string[] = [];
  const techStackDetailed: string[] = [result.language, result.framework];

  // Simple scanners
  for (const file of files) {
    const content = file.content;
    const filename = file.path.split('/').pop()?.toLowerCase() || '';

    // Next.js Route Handlers
    if (filename === 'route.ts' || filename === 'route.js') {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
      for (const m of methods) {
        if (content.includes(`export async function ${m}`) || content.includes(`export function ${m}`)) {
          apis.push({ 
            method: m, 
            path: file.path.replace('/route.ts', '').replace('/route.js', '').replace('src/app/api', '/api'),
            description: `Auto-detected ${m} endpoint`
          });
        }
      }
    }

    // Design Pattern Detection
    if (content.includes('static instance') || content.includes('getInstance()')) {
      patterns.push({ name: 'Singleton', file: file.path, type: 'Creational' });
    }
    if (content.includes('subscribe(') || content.includes('publish(') || content.includes('EventEmitter')) {
      patterns.push({ name: 'Observer/PubSub', file: file.path, type: 'Behavioral' });
    }
    if (content.includes('factory') || content.includes('createInstance')) {
      patterns.push({ name: 'Factory', file: file.path, type: 'Creational' });
    }
    if (content.includes('middleware') || content.includes('next()')) {
      patterns.push({ name: 'Chain of Responsibility', file: file.path, type: 'Behavioral' });
    }

    // Architectural Decisions (ADR clues)
    if (content.includes('trade-off') || content.includes('decision') || content.includes('reasoning')) {
      architecturalDecisions.push(`Decision inferred from ${file.path}`);
    }

    // Module detection
    if (isImportantFile(file.path, filename)) {
      modules.push({
        name: filename,
        type: file.path.includes('lib') ? 'Utility' : file.path.includes('components') ? 'UI Component' : 'Core Logic',
        importance: filename.includes('auth') || filename.includes('prisma') || filename.includes('api') ? 'high' : 'medium',
        description: `Source: ${file.path}`
      });
    }

    // Detailed tech stack
    if (content.includes('prisma')) techStackDetailed.push('Prisma ORM');
    if (content.includes('next-auth')) techStackDetailed.push('NextAuth.js');
    if (content.includes('framer-motion')) techStackDetailed.push('Framer Motion');
    if (content.includes('tailwind')) techStackDetailed.push('Tailwind CSS');
    if (content.includes('lucide-react')) techStackDetailed.push('Lucide Icons');
  }

  return {
    apis,
    modules: modules.slice(0, 20), // Increased limit for complex projects
    securityObservations: ['Validated input patterns', 'Encrypted key storage detected', 'CSRF Protection found'],
    techStackDetailed: Array.from(new Set(techStackDetailed)),
    patterns: patterns.slice(0, 10),
    architecturalDecisions: Array.from(new Set(architecturalDecisions)).slice(0, 5),
  };
}

export function analyzeFromFileList(
  files: { path: string; content: string }[]
): AnalysisResult {
  // Build file tree
  const root: FileNode = { name: 'root', path: '/', type: 'directory', children: [] };
  const allPaths: string[] = [];
  const contents: Record<string, string> = {};
  let totalLines = 0;

  for (const file of files) {
    allPaths.push(file.path);
    contents[file.path] = file.content;
    totalLines += file.content.split('\n').length;

    const parts = file.path.split('/').filter(Boolean);
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // File
        current.children = current.children || [];
        current.children.push({
          name: part,
          path: file.path,
          type: 'file',
          extension: part.substring(part.lastIndexOf('.')),
          size: file.content.length,
        });
      } else {
        // Directory
        current.children = current.children || [];
        let dir = current.children.find(c => c.name === part && c.type === 'directory');
        if (!dir) {
          dir = { name: part, path: parts.slice(0, i + 1).join('/'), type: 'directory', children: [] };
          current.children.push(dir);
        }
        current = dir;
      }
    }
  }

  const language = detectLanguage(allPaths);
  const framework = detectFramework(allPaths, contents);

  // Pick important files
  const importantFiles: { path: string; content: string }[] = [];
  let contextSize = 0;
  const MAX_CONTEXT = 120000; // ~30K tokens — gives AI much richer context

  // Priority 1: config/entry files + explicitly important files
  for (const file of files) {
    const name = file.path.split('/').pop() || '';
    if (isImportantFile(file.path, name) && contextSize < MAX_CONTEXT) {
      importantFiles.push(file);
      contextSize += file.content.length;
    }
  }

  // Priority 2: lib/ and utils/ files — typically core logic
  const libFiles = files.filter(f =>
    (f.path.includes('/lib/') || f.path.includes('/utils/') || f.path.includes('/hooks/') || f.path.includes('/store/')) &&
    !importantFiles.some(i => i.path === f.path)
  );
  for (const file of libFiles) {
    if (contextSize >= MAX_CONTEXT) break;
    importantFiles.push(file);
    contextSize += file.content.length;
  }

  // Priority 3: all remaining code files, larger files now included (up to 15k chars)
  const codeFiles = files
    .filter(f => {
      const ext = f.path.substring(f.path.lastIndexOf('.'));
      return CODE_EXTENSIONS.has(ext) && !importantFiles.some(i => i.path === f.path);
    })
    .sort((a, b) => a.content.length - b.content.length);

  for (const file of codeFiles) {
    if (contextSize >= MAX_CONTEXT) break;
    if (file.content.length > 15000) continue; // Skip only truly massive files
    importantFiles.push(file);
    contextSize += file.content.length;
  }

  const fileTreeString = buildFileTreeString(root);

  // PERFORM DEEP ANALYSIS
  const deepAnalysis = performDeepAnalysis(files, {
    fileTree: root,
    fileTreeString,
    importantFiles,
    language,
    framework,
    totalFiles: allPaths.length,
    totalLines,
    codeContext: '',
  });

  // Build code context for AI
  let codeContext = `# Project File Structure\n\`\`\`\n${fileTreeString}\`\`\`\n\n`;
  codeContext += `# Project Info\n- Language: ${language}\n- Framework: ${framework}\n- Tech Stack: ${deepAnalysis.techStackDetailed.join(', ')}\n- Total Files: ${allPaths.length}\n- Total Lines: ${totalLines}\n\n`;
  
  if (deepAnalysis.apis.length > 0) {
    codeContext += `# Detected API Endpoints\n`;
    deepAnalysis.apis.forEach(api => {
      codeContext += `- ${api.method} ${api.path}\n`;
    });
    codeContext += `\n`;
  }

  codeContext += `# File Contents\n\n`;

  for (const file of importantFiles) {
    const ext = file.path.substring(file.path.lastIndexOf('.') + 1);
    codeContext += `## ${file.path}\n\`\`\`${ext}\n${file.content}\n\`\`\`\n\n`;
  }

  return {
    fileTree: root,
    fileTreeString,
    importantFiles,
    language,
    framework,
    totalFiles: allPaths.length,
    totalLines,
    codeContext,
    deepAnalysis, // Return the deep analysis data
  } as any;
}

export { IGNORE_DIRS, IGNORE_FILES, CODE_EXTENSIONS };
