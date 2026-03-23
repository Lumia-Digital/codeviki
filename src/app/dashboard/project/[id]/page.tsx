'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Search, FileText, ChevronRight, Copy, Download, Share2, ArrowLeft, ArrowRight,
  GitBranch, Layers, BookOpen, Code2, Rocket, Settings, Database, Workflow,
  Maximize, Minimize, Sparkles, Loader2, Zap, Shield, CheckCircle, Clock,
  Hash, LayoutList, Brain, AlertTriangle, Star, GitMerge, Lock, TrendingUp,
  Package, BarChart3, Activity, X, Map as MapIcon
} from 'lucide-react';
import type { GeneratedDocs, DocSection, DiagramData } from '@/lib/ai-providers';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

const MarkdownRenderer = dynamic(() => import('@/components/MarkdownRenderer'), { ssr: false });
const MermaidDiagram = dynamic(() => import('@/components/MermaidDiagram'), { ssr: false });
const CodeViewer = dynamic(() => import('@/components/CodeViewer'), { ssr: false });

// ─── Icon mapping ─────────────────────────────────────────────────
const SECTION_ICONS: Record<string, React.ReactNode> = {
  'overview':         <BookOpen size={15} />,
  'architecture':     <Layers size={15} />,
  'getting-started':  <Rocket size={15} />,
  'api-reference':    <Code2 size={15} />,
  'components':       <Workflow size={15} />,
  'data-flow':        <GitBranch size={15} />,
  'deployment':       <Rocket size={15} />,
  'configuration':    <Settings size={15} />,
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Tutorials':    <Sparkles size={14} className="text-emerald-600" />,
  'How-to Guides':<Zap size={14} className="text-amber-500" />,
  'Reference':    <Code2 size={14} className="text-blue-500" />,
  'Explanations': <Layers size={14} className="text-violet-500" />,
  'Documentation':<FileText size={14} className="text-slate-400" />,
};

const CATEGORY_ORDER = ['Tutorials', 'Explanations', 'How-to Guides', 'Reference'];

// ─── Fallbacks ────────────────────────────────────────────────────
const FALLBACK_SECTIONS: DocSection[] = [
  {
    id: 'overview', title: 'Getting Started', order: 1,
    content: `## Getting Started\n\nGenerate documentation by creating a new project from the dashboard.\n\n### Quick Start\n\n1. Click **New Project** in the sidebar\n2. Enter a GitHub URL or upload your code\n3. Add your AI API key\n4. Click **Generate Documentation**\n\nYour AI-powered documentation will appear here with:\n- Detailed architecture analysis\n- Interactive diagrams\n- API reference documentation\n- Code walkthroughs\n- Setup & deployment guides`
  },
];
const FALLBACK_DIAGRAMS: DiagramData[] = [
  { id: 'sample', title: 'Sample Architecture', type: 'flowchart', description: 'Generate a project to see real diagrams', mermaidCode: 'Source["User/Client"] --> Logic["AI Intelligence"]\nLogic --> Output["Visual Documentation"]' },
];

// ─── Helpers ──────────────────────────────────────────────────────
function readingTime(content: string | undefined | null) {
  if (!content) return "0 min read";
  const words = content.split(/\s+/).length;
  const mins = Math.ceil(words / 200);
  return `${mins} min read`;
}

function extractToc(content: string | undefined | null) {
  if (!content) return [];
  return content.split('\n')
    .filter(line => /^#{2,4}\s/.test(line))
    .map(line => ({
      level: (line.match(/^#+/) || [''])[0].length,
      text: line.replace(/^#+\s*/, ''),
      id: line.replace(/^#+\s*/, '').toLowerCase().replace(/[^\w]+/g, '-'),
    }));
}

// ─────────────────────────────────────────────────────────────────
export default function ProjectPage() {
  const { id } = useParams();
  const [docs, setDocs] = useState<GeneratedDocs | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('');
  const [activeTab, setActiveTab] = useState<'docs' | 'diagrams' | 'intelligence'>('docs');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTocId, setActiveTocId] = useState('');
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [explorerTab, setExplorerTab] = useState<'code' | 'chat'>('code');
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Fetch ──────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProjectData(data);
          if (data.docs) {
            setDocs(data.docs);
            // Pick the first section by category order, then by order within category
            const sorted = [...(data.docs.sections || [])].sort((a: DocSection, b: DocSection) => {
              const catA = CATEGORY_ORDER.indexOf(a.category || 'Documentation');
              const catB = CATEGORY_ORDER.indexOf(b.category || 'Documentation');
              const cA = catA === -1 ? 999 : catA;
              const cB = catB === -1 ? 999 : catB;
              if (cA !== cB) return cA - cB;
              return (a.order || 0) - (b.order || 0);
            });
            setActiveSection(sorted[0]?.id || data.docs.sections[0]?.id || '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  // ── Derived ────────────────────────────────────
  const sections = docs?.sections || FALLBACK_SECTIONS;
  const diagrams = docs?.diagrams || FALLBACK_DIAGRAMS;
  const currentSection = sections.find(s => s.id === activeSection) || sections[0];
  const projectName = projectData?.name || 'Project';

  const filteredSections = useMemo(() => sections.filter(s => {
    if (!s) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (s.title || '').toLowerCase().includes(q);
    const contentMatch = (s.content || '').toLowerCase().includes(q);
    const categoryMatch = (s.category || '').toLowerCase().includes(q);
    return titleMatch || contentMatch || categoryMatch;
  }), [sections, searchQuery]);

  const sortedCategories = useMemo(() => Array.from(new Set(filteredSections.map(s => s.category || 'Documentation')))
    .sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    }), [filteredSections]);

  const tocItems = useMemo(() => extractToc(currentSection?.content || ''), [currentSection?.content]);

  // ── Scroll Spy ─────────────────────────────────
  const tocIds = useMemo(() => tocItems.map(t => t.id).join(','), [tocItems]);
  useEffect(() => {
    if (!tocItems.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries.find(e => e.isIntersecting);
        if (active) setActiveTocId(active.target.id);
      },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
    );
    // Small delay to let markdown render
    const timeoutId = setTimeout(() => {
      tocItems.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      });
    }, 300);
    return () => { clearTimeout(timeoutId); observer.disconnect(); };
  }, [currentSection?.id, tocIds]);

  // ── Scroll progress ────────────────────────────
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget;
    const progress = (t.scrollTop / (t.scrollHeight - t.clientHeight)) * 100;
    const bar = document.getElementById('reading-progress-bar');
    if (bar) bar.style.width = `${progress}%`;
  }, []);

  // ── Navigate to section ────────────────────────
  const navigateTo = (sectionId: string) => {
    setActiveSection(sectionId);
    setActiveTocId('');
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Loading ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-4 rounded-xl border border-border/40 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading documentation…</p>
      </div>
    );
  }

  return (
    <>
      {/* Reading progress bar — fixed at top of viewport */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-transparent z-[100] pointer-events-none">
        <div id="reading-progress-bar" className="h-full bg-primary transition-all duration-100 ease-out" style={{ width: '0%' }} />
      </div>

      <div className={cn(
        "flex overflow-hidden transition-all duration-300 rounded-xl border border-border/40 bg-background",
        isFullscreen ? "fixed inset-0 z-[60] rounded-none border-0" : "h-[calc(100vh-140px)]"
      )}>

        {/* ── Left Sidebar (AlphaFold Style) ────────────────────────────── */}
        <aside className="w-[280px] shrink-0 border-r border-border/40 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0a0a0a]">
          {/* Logo & Search */}
          <div className="p-5 space-y-6">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-[13px] bg-slate-50 dark:bg-white/[0.03] border-border/40 focus:ring-1 focus:ring-primary/20 rounded-xl transition-all"
              />
            </div>

            {/* Project Header Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-white dark:bg-black shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
                  <Database size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold truncate text-slate-900 dark:text-white capitalize">{projectName}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{sections.length} sections · {diagrams.length} diagrams</div>
                </div>
              </div>

              {/* Project Pulse (Metadata Card) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-border/10 flex flex-col gap-0.5">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Language</span>
                  <span className="text-[10px] font-bold truncate text-primary/80">{projectData?.analysisData?.language || docs?.language || 'Polyglot'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-border/10 flex flex-col gap-0.5">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Framework</span>
                  <span className="text-[10px] font-bold truncate text-primary/80">{projectData?.analysisData?.framework || docs?.framework || 'In-House'}</span>
                </div>
              </div>
            </div>

            {/* Premium Tab Switcher */}
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-border/20">
              {(['docs', 'diagrams', 'intelligence'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                    activeTab === tab 
                      ? "bg-white dark:bg-[#1a1a1a] text-primary shadow-sm border border-border/20" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {tab === 'docs' ? <FileText size={13}/> : tab === 'diagrams' ? <Layers size={13}/> : <Brain size={13}/>}
                  {tab === 'docs' ? 'Docs' : tab === 'diagrams' ? 'Visuals' : 'Intel'}
                </button>
              ))}
            </div>
          </div>

          {/* Nav list (Refined Styling) */}
          <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {activeTab === 'docs' && (
              <div className="space-y-6 px-3">
                {sortedCategories.map(category => (
                  <div key={category}>
                    <div className="flex items-center gap-2 px-3 py-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      {CATEGORY_ICONS[category] ?? <FileText size={12}/>}
                      {category}
                    </div>
                    <div className="space-y-0.5">
                      {filteredSections
                        .filter(s => (s.category || 'Documentation') === category)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((section, idx) => (
                        <button
                          key={section.id || idx}
                          onClick={() => navigateTo(section.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group border border-transparent",
                            activeSection === section.id
                              ? "bg-primary/5 text-primary border-primary/20 shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125",
                              activeSection === section.id ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
                            )} />
                            <span className="truncate">{section.title}</span>
                          </div>
                          <span className="text-[9px] opacity-0 group-hover:opacity-60 transition-opacity whitespace-nowrap ml-2">
                            {readingTime(section.content)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </nav>

        </aside>

        {/* ── Main Content Area ─────────────────────────── */}
        <main className="flex-1 flex flex-col relative bg-white dark:bg-[#070707] min-w-0">
          {/* Top Toolbar */}
          <header className="h-14 border-b border-border/40 flex items-center justify-between px-6 bg-white/80 dark:bg-[#070707]/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-muted-foreground/40">{projectName}</span>
              <ChevronRight size={14} className="text-muted-foreground/20" />
              <span className="text-foreground capitalize">{activeTab}</span>
              {activeTab === 'docs' && currentSection && (
                <>
                  <ChevronRight size={14} className="text-muted-foreground/20" />
                  <span className="text-primary font-bold tracking-tight truncate max-w-[200px]">{currentSection.title}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-9 gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                <Share2 size={14} /> Share
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 hover:bg-white/5 transition-all"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              </Button>
            </div>
          </header>

          {/* Scrollable Content */}
          <div 
            ref={contentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto custom-scrollbar"
          >
            <AnimatePresence mode="wait">
              {activeTab === 'docs' ? (
                <motion.article
                  key={currentSection?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="p-10 md:p-16 lg:p-24 max-w-4xl mx-auto"
                >
                  <div className="mb-12">
                     <div className="flex items-center gap-3 mb-4">
                       <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border-primary/20 text-primary bg-primary/5">
                        {currentSection?.category || 'Documentation'}
                       </Badge>
                       <span className="text-[11px] text-muted-foreground/60 font-mono tracking-widest uppercase">
                         v1.0.4 · Logic Optimized
                       </span>
                     </div>
                     <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-6 leading-[1.1]">
                        {currentSection?.title}
                     </h1>
                     <div className="flex items-center gap-6 text-[12px] text-muted-foreground font-medium border-t border-border/40 pt-6">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-primary/50" /> {readingTime(currentSection?.content || '')}
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-emerald-500/50" /> AI Verified
                        </div>
                     </div>
                  </div>

                  <MarkdownRenderer content={currentSection?.content || 'Awaiting synchronization with repository nodes...'} />

                  <div className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between">
                     <div className="text-[11px] text-muted-foreground italic">
                        Deconstructed by CodeWiki Intelligence · Staff Engineer Model
                     </div>
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl h-9 text-[11px] font-bold uppercase tracking-widest px-4">
                          <Database size={13} className="mr-2" /> Feedback
                        </Button>
                     </div>
                  </div>
                </motion.article>
              ) : activeTab === 'diagrams' ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                  className="p-8 max-w-5xl mx-auto flex flex-col gap-8 pb-20"
                >
                  {diagrams.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                      <Layers size={32} className="opacity-20" />
                      <p className="text-sm">No diagrams generated yet. Regenerate the project to produce architecture diagrams.</p>
                    </div>
                  )}
                  {diagrams.map((d: DiagramData, idx: number) => (
                    <div key={d.id || idx} className="space-y-3">
                      {d.description && (
                        <p className="text-[13px] text-muted-foreground leading-relaxed px-1">{d.description}</p>
                      )}
                      <MermaidDiagram
                        code={d.mermaidCode}
                        title={d.title}
                        description={d.type}
                        id={d.id}
                      />
                    </div>
                  ))}
                </motion.div>
              ) : activeTab === 'intelligence' ? (
                <motion.div
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ duration: 0.2 }}
                  className="p-8 max-w-5xl mx-auto flex flex-col gap-10 pb-32"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 pb-8 border-b border-border/40">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
                      <Brain size={24} className="text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-foreground tracking-tight uppercase italic">Project Intelligence</h1>
                      <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                        Deep architectural deconstruction and static logic analysis. This dashboard provide a 100% picture of the project's DNA, tech stack foundations, and execution sequence.
                      </p>
                    </div>
                  </div>

                  {/* 01. The Architectural Soul */}
                  <Card className="bg-primary/5 border-primary/20 overflow-hidden relative group shadow-2xl shadow-primary/5">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                      <Sparkles size={160} />
                    </div>
                    <CardHeader className="pb-3 px-8 pt-8">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3">
                        <Zap size={14} className="animate-pulse" /> Logic DNA & Core Rationale
                      </div>
                      <CardTitle className="text-2xl font-black uppercase tracking-tighter">The Architectural Soul</CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-[16px] leading-[1.8] text-slate-700 dark:text-slate-300 font-medium">
                          {docs?.architectureSoul || "The AI is currently performing a deep-layer deconstruction of the project's architectural soul. This involves analyzing entry point density, module resonance, and logic flow patterns to identify the primary engineering philosophy behind the codebase."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 02. Tech Stack Matrix */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 px-1">
                        <Layers size={16} className="text-primary" />
                        <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">Foundations Matrix</h2>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {docs?.techStack?.map((tech, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary"
                            className="h-11 px-5 rounded-2xl border-border/40 bg-card text-[13px] font-bold tracking-tight shadow-md hover:border-primary/50 transition-all hover:-translate-y-0.5"
                          >
                            {tech}
                          </Badge>
                        )) || (projectData?.analysisData?.techStackDetailed || []).map((t: string, idx: number) => (
                           <Badge key={`${t}-${idx}`} variant="secondary" className="h-11 px-5 rounded-2xl border-border/40 bg-card text-[13px] font-bold tracking-tight shadow-md">{t}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* 03. Setup Command Center */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 px-1">
                        <Rocket size={16} className="text-primary" />
                        <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">Execution Protocol</h2>
                      </div>
                      <div className="rounded-3xl border border-border/40 bg-[#0a0a0a] overflow-hidden shadow-2xl ring-1 ring-white/5">
                        <div className="flex items-center gap-2 px-5 py-3 bg-white/[0.03] border-b border-white/5">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 ml-4 font-black tracking-widest uppercase opacity-60">BOOTSTRAP_LITE.log</span>
                        </div>
                        <div className="p-6 font-mono text-[13px] text-slate-300 space-y-4">
                          {docs?.setupSequence?.map((step, idx) => (
                            <div key={idx} className="flex gap-4 group">
                              <span className="text-primary/40 select-none font-black text-[11px] mt-0.5">0{idx + 1}</span>
                              <span className="group-hover:text-primary transition-colors cursor-default">{step}</span>
                            </div>
                          )) || <div className="text-slate-600 italic px-2">Awaiting setup sequence identification...</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 04. Metric Intelligence */}
                  <div className="space-y-5 pt-4">
                    <div className="flex items-center gap-2 px-1">
                      <BarChart3 size={16} className="text-primary" />
                      <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">Structural Resonance</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                      {[
                        { label: 'Primary Language', value: projectData?.analysisData?.language || docs?.language || 'Polyglot', icon: <Code2 size={18} className="text-blue-400" /> },
                        { label: 'Core Framework', value: projectData?.analysisData?.framework || docs?.framework || 'Modern Web', icon: <Rocket size={18} className="text-emerald-400" /> },
                        { label: 'Node Complexity', value: docs?.metadata?.fileCount ? `${docs.metadata.fileCount} Files` : 'High Density', icon: <FileText size={18} className="text-violet-400" /> },
                        { label: 'Logic Volume', value: `${(docs?.metadata?.totalLines || projectData?.analysisData?.totalLines || 0).toLocaleString()} LoC`, icon: <Activity size={18} className="text-amber-400" /> },
                      ].map(card => (
                        <div key={card.label} className="flex flex-col gap-4 p-6 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-xl shadow-lg hover:shadow-primary/5 transition-all hover:bg-card/60 hover:-translate-y-1">
                          <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                            {card.icon} {card.label}
                          </div>
                          <div className="text-2xl font-black text-foreground tracking-tighter">{card.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="opacity-40" />

                  {/* 05. Core Logic Modules */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                      <GitMerge size={16} className="text-primary" />
                      <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">Logical Entry Points</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(projectData?.analysisData?.deepAnalysis?.modules || []).map((mod: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-border/40 bg-white/5 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={cn(
                              "w-3 h-3 rounded-full shrink-0 shadow-lg",
                              mod.importance === 'high' ? "bg-red-500 animate-pulse" : "bg-primary/60"
                            )} />
                            <div className="min-w-0">
                              <div className="text-[14px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{mod.name}</div>
                              <div className="text-[11px] text-muted-foreground/80 mt-0.5">{mod.type} · {mod.description}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0 ml-4",
                            mod.importance === 'high' ? "border-red-500/50 text-red-500 bg-red-500/5" : "border-primary/20 text-primary/70"
                          )}>
                            {mod.importance}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </main>

        {/* ── Right Explorer / Chat ──────────────────── */}
        <aside className={cn(
          "hidden lg:flex transition-all duration-300 border-l border-border/40 flex-col bg-[#0d0d0d]",
          activeFile ? "w-[450px] xl:w-[550px]" : "w-0 overflow-hidden border-l-0"
        )}>
          {activeFile && (
            <>
              {/* Tab Switcher */}
              <div className="flex px-4 pt-4 pb-2 gap-1 border-b border-white/5 bg-white/[0.02]">
                <button 
                  onClick={() => setExplorerTab('code')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all",
                    explorerTab === 'code' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Source Code
                </button>
                <button 
                  onClick={() => setExplorerTab('chat')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all",
                    explorerTab === 'chat' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  AI Analyst
                </button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-auto h-8 w-8 text-muted-foreground/40"
                  onClick={() => setActiveFile(null)}
                >
                  <X size={14} />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden">
                {explorerTab === 'code' ? (
                  <CodeViewer 
                    filePath={activeFile} 
                    projectId={id as string} 
                    onClose={() => setActiveFile(null)}
                  />
                ) : (
                  <div className="flex flex-col h-full bg-[#0a0a0a] p-6">
                    <div className="mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-2">
                        <Sparkles size={14} /> AI Repository Analyst
                      </h3>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        I am currently analyzing <code className="text-primary/70">{activeFile}</code>. Ask me anything about its logic, dependencies, or vulnerabilities.
                      </p>
                    </div>

                      <div className="flex-1 pr-4 overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-[13px] text-foreground/80 leading-relaxed italic">
                          "This module appears to be the core authentication stabilizer. It uses JWT for session persistence and implements an immediate-sync pattern for profile updates."
                        </div>
                        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-[13px] text-primary leading-relaxed font-medium">
                          Explain the security implications of this file.
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-[13px] text-foreground/80 leading-relaxed">
                          The file implements robust sanitization for tokens. However, the use of base64 for images in the session was a potential vector for 413 Payload Too Large errors, which we've mitigated by shifting to the Real-Time Stats sync pattern.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="relative group">
                        <Input 
                          placeholder="Ask about this file..." 
                          className="pr-12 bg-white/[0.03] border-white/10 h-11 text-sm rounded-xl"
                        />
                        <Button size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg shadow-lg">
                          <ArrowRight size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* ── Right ToC ──────────────────────────────── */}
        {activeTab === 'docs' && tocItems.length > 0 && !activeFile && (
          <aside className="hidden xl:flex w-[220px] shrink-0 border-l border-border/40 bg-muted/5 flex-col">
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
                <Hash size={12} /> On this page
              </div>
              <nav className="flex flex-col gap-0.5">
                {tocItems.map((item: { id: string; text: string; level: number }, i: number) => {
                  const isActive = activeTocId === item.id;
                  return (
                    <a
                      key={i}
                      href={`#${item.id}`}
                      onClick={e => {
                        e.preventDefault();
                        const el = document.getElementById(item.id);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setActiveTocId(item.id);
                      }}
                      className={cn(
                        "text-[12px] leading-snug py-2 transition-all border-l-[1.5px] block relative group",
                        item.level === 2 ? "pl-4 font-bold" : item.level === 3 ? "pl-7 font-medium" : "pl-10 text-[11px]",
                        isActive
                          ? "border-primary text-primary bg-primary/[0.03]"
                          : "border-transparent text-muted-foreground/60 hover:text-foreground hover:border-border/60 hover:bg-slate-50 dark:hover:bg-white/[0.01]"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-[-1.5px] top-1/2 -translate-y-1/2 w-[1.5px] h-4 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      )}
                      <span className="truncate block">{item.text}</span>
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
