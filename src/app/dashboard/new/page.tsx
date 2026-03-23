'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Github, Zap, CheckCircle, Loader2, FolderOpen, Link2, Settings2, FileCode, X, Sparkles } from 'lucide-react';
import { AI_PROVIDERS } from '@/lib/mock-data';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type FileEntry = { path: string; content: string };

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'github' | 'upload'>('github');
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('GPT-5.4');
  const [apiKey, setApiKey] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [options, setOptions] = useState({
    diagrams: true, apiRef: true, walkthrough: true, setup: true, changelog: false, quality: false,
  });

  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider);

  const modelKeyMap: Record<string, string> = {
    'GPT-5.4': 'gpt-5.4', 'GPT-5.4 Pro': 'gpt-5.4-pro', 'GPT-5.2': 'gpt-5.2',
    'Claude 4.6 Sonnet': 'claude-4.6-sonnet', 'Claude 4.6 Opus': 'claude-4.6-opus', 'Claude 4.5 Haiku': 'claude-4.5-haiku',
    'Gemini 3.1 Flash Lite': 'gemini-3.1-flash-lite-preview', 'Gemini 3 Flash': 'gemini-3-flash', 'Gemini 2.5 Flash': 'gemini-2.5-flash',
    'Mistral Large 3': 'mistral-large-3', 'Mistral Medium 3': 'mistral-medium-3', 'Mistral Small 3': 'mistral-small-3',
    'DeepSeek V4': 'deepseek-v4', 'DeepSeek V3.2': 'deepseek-chat', 'DeepSeek R1': 'deepseek-reasoner',
    'Command R+': 'command-r-plus',
  };

  const handleFileUpload = async (fileList: FileList) => {
    const entries: FileEntry[] = [];
    for (const file of Array.from(fileList)) {
      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        for (const [path, entry] of Object.entries(zip.files)) {
          if (!entry.dir && !shouldIgnore(path)) {
            try {
              const content = await entry.async('text');
              entries.push({ path, content });
            } catch { /* binary file, skip */ }
          }
        }
      } else if (!shouldIgnore(file.name)) {
        try {
          const content = await file.text();
          const path = file.webkitRelativePath || file.name;
          entries.push({ path, content });
        } catch { /* binary, skip */ }
      }
    }
    setUploadedFiles(prev => [...prev, ...entries]);
  };

  function shouldIgnore(path: string): boolean {
    const ignore = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', '.DS_Store', 'package-lock.json', 'yarn.lock'];
    return ignore.some(i => path.includes(i));
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files);
  };

  const [savedSettings, setSavedSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/user/settings');
        if (res.ok) {
          const data = await res.json();
          setSavedSettings(data);
          // Auto-fill API key for selected provider if available
          const providerKey = data[`${selectedProvider}Key`];
          if (providerKey) setApiKey(providerKey);
        }
      } catch (err) {
        console.error('Settings fetch failed:', err);
      }
    };
    fetchSettings();
  }, [selectedProvider]);

  const handleGenerate = async () => {
    setError('');
    
    // Use saved key if field is empty but we have one in settings
    let finalApiKey = apiKey;
    if (!finalApiKey && savedSettings) {
      finalApiKey = savedSettings[`${selectedProvider}Key`];
    }

    if (!finalApiKey.trim()) { setError(`Please enter your ${currentProvider?.name} API key or set it in Settings`); return; }
    if (mode === 'github' && !repoUrl.trim()) { setError('Please enter a GitHub URL'); return; }
    if (mode === 'upload' && uploadedFiles.length === 0) { setError('Please upload files first'); return; }

    setProcessing(true);
    setProgress(5);
    setStatusMsg('Preparing...');

    try {
      let files: FileEntry[] = uploadedFiles;

      if (mode === 'github') {
        setStatusMsg('Fetching repository from GitHub...');
        setProgress(10);
        const ghRes = await fetch('/api/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl }),
        });
        const ghData = await ghRes.json();
        if (!ghRes.ok) throw new Error(ghData.error || 'Failed to fetch GitHub repo');
        files = ghData.files;
        setProgress(30);
        setStatusMsg(`Fetched ${files.length} files from ${ghData.repo.fullName}`);
      } else {
        setProgress(20);
        setStatusMsg(`Analyzing ${uploadedFiles.length} uploaded files...`);
      }

      setProgress(40);
      setStatusMsg('AI is analyzing your code architecture...');
      await new Promise(r => setTimeout(r, 500));

      setProgress(55);
      setStatusMsg(`Generating documentation with ${currentProvider?.name || 'AI'}...`);

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          apiKey: finalApiKey,
          provider: selectedProvider,
          model: modelKeyMap[selectedModel] || selectedModel.toLowerCase(),
          tuningOptions: options, // Pass Slicer Tuning options
        }),
      });

      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Documentation generation failed');

      setProgress(85);
      setStatusMsg('Saving to Secure Database...');
      
      // PERSIST TO DATABASE
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mode === 'github' ? repoUrl.split('/').pop() || 'Repo' : 'Uploaded Project',
          description: mode === 'github' ? `Imported from ${repoUrl}` : 'Manually uploaded codebase',
          source: mode,
          repoUrl: mode === 'github' ? repoUrl : null,
          content: JSON.stringify(genData.docs),
          language: genData.docs.language || 'Unknown',
          framework: genData.docs.framework || 'Other',
          pages: genData.docs.sections?.length || 0,
          diagrams: genData.docs.diagrams?.length || 0,
          coverage: 100,
          aiInsights: genData.docs.sections?.find((s: any) => s.id === 'overview')?.content || null,
          analysisData: genData.analysis,
          fileTree: genData.analysis.fileTree,
        }),
      });

      if (!projectRes.ok) {
        const projError = await projectRes.json();
        throw new Error(projError.error || 'Failed to save project to database');
      }

      const projectData = await projectRes.json();

      setProgress(100);
      setStatusMsg('Documentation Synchronized!');
      await new Promise(r => setTimeout(r, 800));

      // Redirect to the real project ID
      router.push(`/dashboard/project/${projectData.id}`);
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      setProcessing(false);
      setProgress(0);
    }
  };

  if (processing) {
    const steps = [
      { label: 'Preparing codebase', pct: 10 },
      { label: 'Fetching repository files', pct: 25 },
      { label: 'Analyzing file structure', pct: 40 },
      { label: 'Understanding architecture', pct: 55 },
      { label: 'Generating documentation', pct: 70 },
      { label: 'Creating diagrams', pct: 85 },
      { label: 'Finalizing output', pct: 95 },
    ];
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto px-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 relative"
        >
          <div className="absolute inset-x-0 h-1 bottom-0 bg-primary/20 rounded-full" />
          <div className="absolute inset-x-0 h-1 bottom-0 bg-primary rounded-full animate-progress-glow" />
          <Zap size={40} className="animate-pulse" />
        </motion.div>
        
        <h2 className="text-3xl font-black tracking-tight mb-2 text-center text-foreground uppercase tracking-widest text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
           Analyzing Source Code
        </h2>
        <div className="text-2xl font-black mb-6 flex items-baseline gap-2">
           {Math.round(progress)} <span className="text-sm font-bold text-muted-foreground">%</span>
        </div>

        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-12 border border-border/50 shadow-inner">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }} 
            className="h-full bg-primary relative"
          >
            <div className="absolute top-0 right-0 h-full w-20 bg-linear-to-r from-transparent to-white/30 blur-sm" />
          </motion.div>
        </div>

        <Card className="w-full bg-card/30 border-border/50 overflow-hidden">
          <CardContent className="p-6 space-y-4">
            {steps.map((step, i) => {
              const isActive = progress >= step.pct - 10 && progress < step.pct;
              const isDone = progress >= step.pct;
              return (
                <div key={i} className={cn(
                  "flex items-center gap-3 text-xs font-bold transition-all duration-300",
                  isDone ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground opacity-50"
                )}>
                  {isDone ? <CheckCircle size={14} /> : isActive ? <Loader2 size={14} className="animate-spin text-primary" /> : <div className="w-3.5 h-3.5 rounded-full border border-current" />}
                  <span className="uppercase tracking-widest">{step.label}</span>
                  {isActive && <span className="ml-auto text-[10px] animate-pulse">Running</span>}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {error && (
          <div className="mt-8 w-full p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-destructive font-bold text-sm">
              <X size={18} /> {error}
            </div>
            <Button variant="outline" size="sm" onClick={() => { setProcessing(false); setError(''); setProgress(0); }}>
              Retry
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
      <div className="mb-12 space-y-4">
        <Badge variant="outline" className="font-black text-[10px] uppercase tracking-[0.2em] px-3 border-primary/20 text-primary bg-primary/5 py-1 w-fit">
          Protocol 01 / Configure Workspace
        </Badge>
        <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground">New Doc Slicer</h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl">Turn any repository into AI-powered interactive documentation.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Source Selector */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h2 className="text-lg font-black tracking-tight uppercase tracking-widest text-[11px] text-muted-foreground">01. Source Identity</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button 
              variant={mode === 'github' ? 'default' : 'outline'}
              className={cn("flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs", mode === 'github' ? "shadow-lg shadow-primary/20" : "border-border/60")}
              onClick={() => setMode('github')}
            >
              <Github size={18} className="mr-3" /> GitHub Repo
            </Button>
            <Button 
              variant={mode === 'upload' ? 'default' : 'outline'}
              className={cn("flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs", mode === 'upload' ? "shadow-lg shadow-primary/20" : "border-border/60")}
              onClick={() => setMode('upload')}
            >
              <Upload size={18} className="mr-3" /> Local Upload
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'github' ? (
              <motion.div 
                key="github"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Repository Link</Label>
                  <div className="relative group">
                    <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      className="pl-11 h-12 rounded-xl bg-card/50 backdrop-blur-sm border-border/50 text-sm font-bold placeholder:font-medium transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/10" 
                      placeholder="https://github.com/alex/my-awesome-app"
                      value={repoUrl}
                      onChange={e => setRepoUrl(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group bg-card/10",
                    dragOver ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-card/30"
                  )}
                >
                  <FolderOpen size={48} className={cn("mx-auto mb-4 transition-all duration-300", dragOver ? "scale-110 text-primary" : "text-muted-foreground/60 group-hover:text-primary/70 group-hover:scale-105")} />
                  <h3 className="text-sm font-black mb-1 uppercase tracking-widest">Target Files</h3>
                  <p className="text-xs text-muted-foreground font-medium">Drop archive or browse local storage</p>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => e.target.files && handleFileUpload(e.target.files)} />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 border border-border/50 rounded-xl overflow-hidden bg-muted/20">
                    <div className="px-4 py-2 border-b border-border/40 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                       <span>{uploadedFiles.length} Blobs Loaded</span>
                       <button onClick={() => setUploadedFiles([])} className="hover:text-foreground">Clear</button>
                    </div>
                    <div className="max-h-40 overflow-y-auto p-2 scrollbar-hide">
                      {uploadedFiles.slice(0, 10).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-background/40 text-[11px] font-medium text-muted-foreground truncate">
                          <FileCode size={12} className="shrink-0 text-primary/70" /> {f.path}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <Separator className="opacity-50" />

        {/* AI Config */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h2 className="text-lg font-black tracking-tight uppercase tracking-widest text-[11px] text-muted-foreground">02. Brain Activation</h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AI_PROVIDERS.map(provider => (
                <button 
                  key={provider.id}
                  onClick={() => { setSelectedProvider(provider.id); setSelectedModel(provider.models[0]); }}
                  className={cn(
                    "flex items-center gap-3 p-3.5 border rounded-2xl transition-all relative overflow-hidden group bg-card/50 backdrop-blur-sm",
                    selectedProvider === provider.id 
                      ? "border-primary/50 shadow-md ring-1 ring-primary/20" 
                      : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className="w-2.5 h-2.5 rounded-full z-10" style={{ background: provider.color }} />
                  <span className={cn("text-xs font-black uppercase tracking-widest z-10", selectedProvider === provider.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                    {provider.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Provider API Token</Label>
              <div className="relative group">
                <Settings2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  type="password"
                  className="pl-11 h-12 rounded-xl bg-card/50 backdrop-blur-sm border-border/50 text-sm font-mono placeholder:font-sans transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/10" 
                  placeholder="sk-••••••••••••••••••••••••••••••••"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
              </div>
            </div>

            {currentProvider && (
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Logic Model</Label>
                <div className="flex flex-wrap gap-2">
                  {currentProvider.models.map(model => (
                    <Button 
                      key={model}
                      variant={selectedModel === model ? 'default' : 'outline'}
                      size="sm"
                      className={cn("rounded-lg text-[10px] h-8 font-black uppercase tracking-widest", selectedModel === model ? "shadow-md shadow-primary/20" : "border-border/50")}
                      onClick={() => setSelectedModel(model)}
                    >
                      {model}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <Separator className="opacity-50" />

        {/* Options */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h2 className="text-lg font-black tracking-tight uppercase tracking-widest text-[11px] text-muted-foreground">03. Slicer Tuning</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'diagrams', label: 'Architecture Slicing', desc: 'Visual flow generation' },
              { key: 'apiRef', label: 'Contract Mapping', desc: 'Auto-document endpoints' },
              { key: 'walkthrough', label: 'Execution Path', desc: 'Logic walkthroughs' },
              { key: 'setup', label: 'Launch Sequence', desc: 'Ops & deployment' },
            ].map(opt => (
              <label 
                key={opt.key}
                className="group flex items-center justify-between p-4 border border-border/50 bg-card/30 backdrop-blur-sm rounded-2xl cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-black uppercase tracking-widest group-hover:text-primary transition-colors">{opt.label}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">{opt.desc}</span>
                </div>
                <Checkbox 
                  checked={options[opt.key as keyof typeof options]}
                  onCheckedChange={checked => setOptions({ ...options, [opt.key]: !!checked })}
                  className="rounded-md h-5 w-5 border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </label>
            ))}
          </div>
        </section>

        <Button 
          onClick={handleGenerate}
          size="lg" 
          className="h-16 w-full mt-6 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-primary/40 transition-all active:scale-[0.98] group"
        >
          <Sparkles size={24} className="mr-3 group-hover:animate-spin-slow" />
          Activate Analysis
        </Button>
      </div>
    </div>
  );
}
