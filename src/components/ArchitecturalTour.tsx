'use client';

import React, { useState } from 'react';
import { MousePointer2, ChevronRight, ChevronLeft, Map, FileCode, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  title: string;
  content: string;
  file: string;
}

interface Tour {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
}

interface ArchitecturalToursProps {
  tours: Tour[];
  currentTourId?: string;
  onFileClick: (path: string) => void;
}

export default function ArchitecturalTours({ tours, currentTourId, onFileClick }: ArchitecturalToursProps) {
  const [activeTourId, setActiveTourId] = useState<string | null>(currentTourId || null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Sync with parent state
  React.useEffect(() => {
    if (currentTourId && currentTourId !== activeTourId) {
      setActiveTourId(currentTourId);
      setCurrentStepIndex(0);
      const tour = tours.find(t => t.id === currentTourId);
      if (tour?.steps[0]) onFileClick(tour.steps[0].file);
    }
  }, [currentTourId]);

  const activeTour = tours.find(t => t.id === activeTourId);
  const currentStep = activeTour?.steps[currentStepIndex];

  const handleTourStart = (id: string) => {
    setActiveTourId(id);
    setCurrentStepIndex(0);
    // Auto-open first file
    const firstStep = tours.find(t => t.id === id)?.steps[0];
    if (firstStep) onFileClick(firstStep.file);
  };

  const handleNext = () => {
    if (activeTour && currentStepIndex < activeTour.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onFileClick(activeTour.steps[nextIndex].file);
    }
  };

  const handlePrev = () => {
    if (activeTour && currentStepIndex > 0) {
      const nextIndex = currentStepIndex - 1;
      setCurrentStepIndex(nextIndex);
      onFileClick(activeTour.steps[nextIndex].file);
    }
  };

  if (!activeTour) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Map className="text-primary" size={24} />
            Architectural Tours
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Experience end-to-end narratives of how features work across your codebase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tours.length > 0 ? (
            tours.map(tour => (
              <button
                key={tour.id}
                onClick={() => handleTourStart(tour.id)}
                className="group p-6 rounded-2xl border border-border/40 bg-white dark:bg-white/[0.02] hover:border-primary/50 hover:bg-primary/5 transition-all text-left space-y-4"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Sparkles size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {tour.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {tour.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">
                  Start Exploration <ChevronRight size={12} />
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full p-12 rounded-2xl border border-dashed border-border/60 flex flex-col items-center justify-center text-center gap-4 bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                <Map size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white">No tours available</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  This project hasn't generated any architectural tours yet. Try regenerating with a Pioneer-compatible model.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-black/20">
      {/* Tour Header */}
      <div className="px-8 py-5 border-b border-border/40 bg-white dark:bg-[#0a0a0a] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveTourId(null)} className="h-8 w-8 rounded-lg">
            <ChevronLeft size={18} />
          </Button>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-0.5">Active Tour</div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{activeTour.title}</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-full">
            Step {currentStepIndex + 1} of {activeTour.steps.length}
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentStepIndex === 0} className="h-8 w-8 rounded-lg border-border/40">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} disabled={currentStepIndex === activeTour.steps.length - 1} className="h-8 w-8 rounded-lg border-border/40">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Tour Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {currentStep?.title}
                </h3>
                
                <div 
                  className="p-4 rounded-xl border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors group"
                  onClick={() => currentStep && onFileClick(currentStep.file)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-widest">
                      <FileCode size={14} /> View File Focus
                    </div>
                    <MousePointer2 size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                    {currentStep?.file}
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-[16px] leading-[1.8] text-slate-700 dark:text-slate-300 font-[450]">
                    {currentStep?.content}
                  </p>
                </div>
              </div>

              {/* Next Action Center */}
              {currentStepIndex < activeTour.steps.length - 1 ? (
                <div className="pt-8 border-t border-border/40">
                  <Button 
                    onClick={handleNext}
                    className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold shadow-lg shadow-black/10 hover:opacity-90 transition-opacity group"
                  >
                    Next Step: {activeTour.steps[currentStepIndex + 1].title}
                    <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              ) : (
                <div className="pt-8 border-t border-border/40 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-inner">
                    <Sparkles size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">Tour Complete!</h4>
                    <p className="text-sm text-slate-500">You've successfully explored this architectural flow.</p>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTourId(null)} className="rounded-xl h-11 px-6 font-bold">
                    Back to All Tours
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
