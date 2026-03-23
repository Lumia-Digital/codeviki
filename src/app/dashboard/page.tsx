'use client';

import Link from 'next/link';
import { Plus, FileText, Clock, CheckCircle, Loader2, ArrowRight, BarChart3, Calendar, Layers, MoreHorizontal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SAMPLE_PROJECTS } from '@/lib/mock-data';
import { motion, Variants } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Scanning Neural Grid...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] border-primary/20 text-primary bg-primary/5 px-3 py-1 w-fit">
            Central Nerve Center
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground">Projects</h1>
          <p className="text-muted-foreground font-medium text-lg max-w-2xl">Manage and access your intelligently documented codebases.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Button size="lg" className="rounded-xl font-black uppercase tracking-widest text-xs h-12 shadow-lg shadow-primary/20 hover:shadow-xl transition-all" asChild>
            <Link href="/dashboard/new">
              <Plus size={18} className="mr-2" /> New Project
            </Link>
          </Button>
        </motion.div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {projects.map((project, i) => (
          <motion.div key={project.id} variants={itemVariants} className="h-full">
            <Link 
              href={project.status === 'completed' ? `/dashboard/project/${project.id}` : '#'} 
              className="block h-full group"
            >
            <Card className="h-full border border-border/50 bg-card/50 backdrop-blur-xl shadow-xl shadow-black/5 hover:bg-accent/10 hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        project.status === 'completed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                        project.status === 'processing' ? 'bg-yellow-500 animate-pulse' : 'bg-destructive'
                      )} />
                      <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-widest px-2 py-0">
                        {project.language || 'Unknown'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                      <MoreHorizontal size={18} />
                    </Button>
                  </div>
                  <CardTitle className="text-xl font-black mt-4 leading-tight group-hover:text-primary transition-colors">
                    {project.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 pb-6">
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>
                  
                  {project.status === 'completed' && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      <Badge variant="outline" className="gap-1.5 font-bold text-[10px] px-2 border-border/50 bg-muted/30">
                        <FileText size={12} className="text-primary" /> {project.pages} pages
                      </Badge>
                      <Badge variant="outline" className="gap-1.5 font-bold text-[10px] px-2 border-border/50 bg-muted/30">
                        <Layers size={12} className="text-secondary" /> {project.diagrams} diagrams
                      </Badge>
                    </div>
                  )}

                  {project.status === 'processing' && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-500 mb-2">
                        <span className="flex items-center gap-2">
                          <Loader2 size={12} className="animate-spin" /> Analyzing
                        </span>
                        <span>Processing</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }} className="h-full bg-yellow-500" />
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-4 border-t border-border/50 bg-muted/10 h-14">
                  <div className="w-full flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} /> {new Date(project.lastUpdated).toLocaleDateString()}
                    </span>
                    {project.status === 'completed' && (
                      <span className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                        Explore <ArrowRight size={12} />
                      </span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>
        ))}

        {/* New Project CTA Card */}
        <motion.div variants={itemVariants} className="h-full">
          <Link href="/dashboard/new" className="block h-full group">
            <div className="w-full h-full min-h-[250px] border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-all rounded-xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all mb-4 shadow-sm group-hover:shadow-md">
                <Plus size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-foreground transition-colors">Create New Project</h3>
              <p className="text-sm text-muted-foreground font-medium px-4">Import from GitHub or upload your raw source code directly.</p>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
