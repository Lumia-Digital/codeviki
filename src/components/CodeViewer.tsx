'use client';

import React, { useEffect, useState } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.min.css';
import { FileCode, X, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeViewerProps {
  filePath: string; // can include #L10 or #L10-L20
  projectId: string;
  onClose?: () => void;
}

export default function CodeViewer({ filePath, projectId, onClose }: CodeViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [cleanPath, setCleanPath] = useState('');
  const [lineRange, setLineRange] = useState<{start: number, end: number} | null>(null);

  useEffect(() => {
    const [path, hash] = filePath.split('#');
    setCleanPath(path);
    
    if (hash && hash.startsWith('L')) {
      const range = hash.substring(1).split('-');
      const start = parseInt(range[0]);
      const end = range[1] ? parseInt(range[1]) : start;
      setLineRange({ start, end });
    } else {
      setLineRange(null);
    }
  }, [filePath]);

  useEffect(() => {
    async function fetchFile() {
      if (!cleanPath || !projectId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/file?path=${encodeURIComponent(cleanPath)}`);
        if (!res.ok) throw new Error('Failed to load file source');
        const data = await res.json();
        setContent(data.content);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFile();
  }, [cleanPath, projectId]);

  // Scroll to line when content or lineRange changes
  useEffect(() => {
    if (!loading && lineRange) {
      setTimeout(() => {
        const el = document.getElementById(`line-${lineRange.start}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [loading, lineRange, content]);

  const extension = filePath.split('.').pop() || '';
  const highlighted = hljs.getLanguage(extension) 
    ? hljs.highlight(content, { language: extension }).value 
    : hljs.highlightAuto(content).value;

  const lines = highlighted.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border-l border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/10 bg-white/[0.02]">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileCode size={16} className="text-primary/70 shrink-0" />
          <span className="text-[13px] font-mono text-muted-foreground/80 truncate">{cleanPath}</span>
          {lineRange && (
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-bold">
              Lines {lineRange.start}{lineRange.end !== lineRange.start ? `-${lineRange.end}` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground" onClick={() => navigator.clipboard.writeText(content)}>
            <Copy size={14} />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground" onClick={onClose}>
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-hidden relative group">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d0d0d]/50 backdrop-blur-sm z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
            <span className="text-xs font-medium text-muted-foreground/50">Pulling source from repository…</span>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center bg-[#0d0d0d] z-10">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
              <X size={24} />
            </div>
            <h3 className="text-sm font-bold text-foreground">Failed to mount file</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">{error}</p>
          </div>
        ) : (
          <div className="h-full w-full overflow-y-auto custom-scrollbar">
            <div className="p-5 font-mono text-[13px] leading-[1.7] selection:bg-primary/30">
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, i) => {
                    const lineNum = i + 1;
                    const isHighlighted = lineRange && lineNum >= lineRange.start && lineNum <= lineRange.end;
                    return (
                      <tr 
                        key={i} 
                        id={`line-${lineNum}`}
                        className={cn(
                          "group/line transition-colors",
                          isHighlighted ? "bg-primary/20" : "hover:bg-white/[0.02]"
                        )}
                      >
                        <td className={cn(
                          "w-10 pr-4 text-right select-none text-[11px] align-top pt-0.5 border-r border-transparent",
                          isHighlighted ? "text-primary border-primary/50 font-bold" : "text-muted-foreground/20"
                        )}>
                          {lineNum}
                        </td>
                        <td className="align-top">
                          <pre className="m-0 bg-transparent whitespace-pre-wrap break-all">
                            <code className="hljs" dangerouslySetInnerHTML={{ __html: line || ' ' }} />
                          </pre>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!loading && !error && (
        <div className="px-4 py-2 bg-white/[0.01] border-t border-border/5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-muted-foreground/40 font-bold">
            <span>{lines.length} Lines</span>
            <span>{extension.toUpperCase()}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary">
            Open in Editor <ExternalLink size={10} className="ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
