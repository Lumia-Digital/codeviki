export const FEATURES = [
  {
    title: 'AI-Powered Analysis',
    description: 'Deep code understanding using GPT-4, Claude, Gemini, or any model of your choice. Our AI analyzes architecture, patterns, and relationships.',
    gradient: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
  },
  {
    title: 'Auto Diagrams',
    description: 'Automatically generate architecture diagrams, dependency graphs, data flow charts, and class hierarchies from your codebase.',
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  },
  {
    title: 'GitHub Integration',
    description: 'Import any public or private GitHub repository. Auto-detect frameworks, analyze structure, and generate docs in minutes.',
    gradient: 'linear-gradient(135deg, #22c55e, #10b981)',
  },
  {
    title: 'Bring Your Own Key',
    description: 'Use your own API keys from OpenAI, Anthropic, Google, Mistral, Cohere, and more. Full control over your AI costs.',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  },
  {
    title: 'Beautiful Output',
    description: 'Professional documentation with multiple themes — Stripe-style, GitHub-style, or Notion-style. Export to PDF, HTML, or Markdown.',
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
  },
  {
    title: 'Team Collaboration',
    description: 'Invite teammates, assign roles, comment on documentation, and collaborate in real-time on your project docs.',
    gradient: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
  },
];

export const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For individual developers exploring AI documentation.',
    features: [
      '2 projects',
      'Bring your own API key',
      'Basic diagrams',
      'Markdown export',
      'Community support',
      'Manual updates',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For professionals who need powerful documentation.',
    features: [
      'Unlimited projects',
      'All AI models included',
      'Advanced diagrams + editing',
      'PDF, HTML & Markdown export',
      '3 team members',
      'Priority support',
      'Auto change detection',
      'Custom themes',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    description: 'For teams needing full-featured documentation.',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'White-label docs',
      'Custom branding',
      'SSO & SAML',
      'Dedicated support',
      'Webhook integration',
      'SLA guarantee',
      'API access',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect Your Code',
    description: 'Paste a GitHub URL or drag & drop your codebase. We support all major languages and frameworks.',
  },
  {
    step: '02',
    title: 'AI Analyzes Everything',
    description: 'Our AI reads every file, understands relationships, and maps the entire architecture of your project.',
  },
  {
    step: '03',
    title: 'Beautiful Docs Ready',
    description: 'Get professional documentation with diagrams, API references, and guides — ready to share or export.',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Engineering Lead at TechFlow',
    text: 'CodeWiki saved us hundreds of hours. Our legacy codebase finally has documentation that new hires can actually understand.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'CTO at DataPipe',
    text: 'The auto-generated architecture diagrams are incredible. It found patterns in our code that even we didn\'t know existed.',
    rating: 5,
  },
  {
    name: 'Priya Patel',
    role: 'Senior Dev at CloudScale',
    text: 'Being able to use my own API key on the free tier is a game changer. The documentation quality rivals hand-written docs.',
    rating: 5,
  },
];

export const SAMPLE_PROJECTS = [
  {
    id: 'proj-1',
    name: 'next-commerce',
    description: 'Next.js e-commerce storefront with headless commerce architecture',
    source: 'github',
    language: 'TypeScript',
    framework: 'Next.js',
    status: 'completed' as const,
    lastUpdated: '2 hours ago',
    pages: 47,
    diagrams: 12,
    coverage: 94,
  },
  {
    id: 'proj-2',
    name: 'fastapi-backend',
    description: 'High-performance Python API with async endpoints and SQLAlchemy',
    source: 'upload',
    language: 'Python',
    framework: 'FastAPI',
    status: 'completed' as const,
    lastUpdated: '1 day ago',
    pages: 23,
    diagrams: 8,
    coverage: 87,
  },
  {
    id: 'proj-3',
    name: 'rust-engine',
    description: 'High-performance game engine written in Rust with ECS architecture',
    source: 'github',
    language: 'Rust',
    framework: 'Actix',
    status: 'processing' as const,
    lastUpdated: 'Just now',
    pages: 0,
    diagrams: 0,
    coverage: 45,
  },
];

export const MOCK_DOC_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    children: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'tech-stack', title: 'Tech Stack' },
      { id: 'getting-started', title: 'Getting Started' },
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture',
    children: [
      { id: 'system-design', title: 'System Design' },
      { id: 'component-map', title: 'Component Map' },
      { id: 'data-flow', title: 'Data Flow' },
    ],
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    children: [
      { id: 'endpoints', title: 'Endpoints' },
      { id: 'authentication', title: 'Authentication' },
      { id: 'error-handling', title: 'Error Handling' },
    ],
  },
  {
    id: 'components',
    title: 'Components',
    children: [
      { id: 'ui-components', title: 'UI Components' },
      { id: 'hooks', title: 'Custom Hooks' },
      { id: 'utilities', title: 'Utilities' },
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment',
    children: [
      { id: 'environment', title: 'Environment Setup' },
      { id: 'ci-cd', title: 'CI/CD Pipeline' },
      { id: 'monitoring', title: 'Monitoring' },
    ],
  },
];

export const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['GPT-5.4', 'GPT-5.4 Pro', 'GPT-5.2'], color: '#10a37f' },
  { id: 'anthropic', name: 'Anthropic', models: ['Claude 4.6 Sonnet', 'Claude 4.6 Opus', 'Claude 4.5 Haiku'], color: '#d4a574' },
  { id: 'google', name: 'Google AI', models: ['Gemini 3.1 Flash Lite', 'Gemini 3 Flash', 'Gemini 2.5 Flash'], color: '#4285f4' },
  { id: 'mistral', name: 'Mistral', models: ['Mistral Large 3', 'Mistral Medium 3', 'Mistral Small 3'], color: '#ff7000' },
  { id: 'cohere', name: 'Cohere', models: ['Command R+', 'Command R', 'Command Light'], color: '#39594d' },
  { id: 'deepseek', name: 'DeepSeek', models: ['DeepSeek V4', 'DeepSeek V3.2', 'DeepSeek R1'], color: '#4d6bfe' },
];
