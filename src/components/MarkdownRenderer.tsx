'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Marked, Renderer, Tokens } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.min.css';
import dynamic from 'next/dynamic';
import { createRoot } from 'react-dom/client';

const PremiumDiagram = dynamic(() => import('@/components/PremiumDiagram'), { ssr: false });

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onSourceLinkClick?: (path: string) => void;
}

function preProcessMarkdown(content: string) {
  if (!content) return '';
  
  // Auto-wrap Mermaid diagrams that aren't inside code blocks.
  // Strategy: split on double-newlines, detect mermaid blocks, and wrap them.
  const blocks = content.split(/\n\n/);
  let inCodeFence = false;
  
  const processed = blocks.map(block => {
    // Track code fences
    const fenceCount = (block.match(/```/g) || []).length;
    if (inCodeFence) {
      // If we're inside a code fence, check if it closes
      if (fenceCount % 2 === 1) inCodeFence = false;
      return block;
    }
    if (fenceCount % 2 === 1) {
      inCodeFence = true;
      return block;
    }
    
    // Not in a code fence — check if this block looks like raw mermaid
    const trimmed = block.trim();
    if (/^(mermaid\s+)?(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram)\s/i.test(trimmed)) {
      // Strip leading "mermaid " if present
      const cleaned = trimmed.replace(/^mermaid\s+/i, '');
      return `\`\`\`mermaid\n${cleaned}\n\`\`\``;
    }
    
    return block;
  });

  return processed.join('\n\n');
}

export default function MarkdownRenderer({ content, className, onSourceLinkClick }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    const markedInstance = new Marked();
    const renderer = new Renderer();

    // ── Headings ──────────────────────────────────
    renderer.heading = function ({ text, depth }: Tokens.Heading) {
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');

      if (depth === 1) {
        return `
          <h1 id="${id}" class="group relative text-[2.5rem] font-extrabold tracking-tight text-slate-900 dark:text-white mt-0 mb-8 leading-tight">
            ${text}
            <a href="#${id}" class="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-primary/40 hover:text-primary transition-all text-xl font-normal no-underline" aria-hidden="true">#</a>
          </h1>`;
      }
      if (depth === 2) {
        return `
          <h2 id="${id}" class="group relative text-[1.75rem] font-bold tracking-tight text-slate-800 dark:text-slate-100 mt-16 mb-6 pb-4 border-b border-slate-200 dark:border-white/10 leading-snug flex items-center gap-3">
            ${text}
            <a href="#${id}" class="opacity-0 group-hover:opacity-100 text-primary/40 hover:text-primary transition-all text-lg font-normal no-underline" aria-hidden="true">#</a>
          </h2>`;
      }
      if (depth === 3) {
        return `
          <h3 id="${id}" class="group relative text-[1.25rem] font-bold tracking-tight text-slate-800 dark:text-slate-100 mt-12 mb-4 leading-snug">
            <span class="inline-block w-1.5 h-5 bg-primary rounded-full mr-3 align-middle shadow-sm shadow-primary/20"></span>
            ${text}
            <a href="#${id}" class="ml-2 opacity-0 group-hover:opacity-100 text-primary/40 hover:text-primary transition-all text-base font-normal no-underline" aria-hidden="true">#</a>
          </h3>`;
      }
      if (depth === 4) {
        return `<h4 id="${id}" class="group relative text-[1.1rem] font-bold text-slate-800 dark:text-slate-200 mt-8 mb-3 leading-snug">${text}</h4>`;
      }
      if (depth === 5) {
        return `<h5 id="${id}" class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-6 mb-3">${text}</h5>`;
      }
      return `<h6 id="${id}" class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-5 mb-3">${text}</h6>`;
    };

    // ── Code blocks ───────────────────────────────
    renderer.code = function ({ text, lang }: Tokens.Code) {
      // Support lang:filename.ts syntax
      let displayLang = lang || '';
      let fileName = '';
      if (lang && lang.includes(':')) {
        const parts = lang.split(':');
        displayLang = parts[0];
        fileName = parts[1];
      }

      const isTerminal = ['terminal', 'bash', 'sh', 'zsh', 'shell', 'command'].includes(displayLang.toLowerCase());

      if (displayLang === 'mermaid') {
        const id = `premium-diagram-${Math.random().toString(36).substr(2, 9)}`;
        return `
          <div id="${id}" class="premium-diagram-placeholder my-8" data-content="${text.replace(/"/g, '&quot;')}">
            <div class="h-[400px] w-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center border border-border/50">
              <span class="text-xs font-medium text-muted-foreground">Rendering diagram…</span>
            </div>
          </div>`;
      }

      let highlighted: string;
      if (displayLang && hljs.getLanguage(displayLang)) {
        highlighted = hljs.highlight(text, { language: displayLang }).value;
      } else {
        highlighted = hljs.highlightAuto(text).value;
      }

      const escapedCode = text.replace(/'/g, "\\'").replace(/\n/g, '\\n');
      const lines = highlighted.split('\n');
      const lineCount = lines.length;
      const showLineNums = !isTerminal && lineCount > 3;

      const numberedCode = showLineNums
        ? lines.map((line, i) =>
            `<span class="code-line"><span class="code-line-num select-none text-right pr-4 text-muted-foreground/30 text-[11px] w-10 inline-block shrink-0">${i + 1}</span>${line}</span>`
          ).join('\n')
        : isTerminal
        ? lines.map(line => `<span class="flex gap-3"><span class="text-emerald-500/50 shrink-0 select-none">$</span><span class="text-slate-200">${line}</span></span>`).join('\n')
        : highlighted;

      if (isTerminal) {
        return `
          <div class="doc-terminal-block my-8 rounded-xl overflow-hidden bg-[#050505] border border-white/10 shadow-2xl">
            <div class="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
              <div class="flex gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
              </div>
              <span class="text-[10px] font-mono text-slate-500 font-bold tracking-widest uppercase ml-2">Terminal</span>
            </div>
            <div class="p-5 font-mono text-[13px] leading-relaxed overflow-x-auto custom-scrollbar whitespace-pre">${numberedCode}</div>
          </div>`;
      }

      return `
        <div class="doc-code-block group my-6 rounded-xl overflow-hidden border border-border/50 bg-[#0d0d0d] shadow-lg shadow-black/20">
          <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-border/30">
            <div class="flex items-center gap-3">
              <div class="flex gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/20"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400/30 border border-amber-400/20"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400/30 border border-emerald-400/20"></span>
              </div>
              ${fileName
                ? `<span class="text-[12px] font-mono text-muted-foreground/70">${fileName}</span>`
                : displayLang
                ? `<span class="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">${displayLang}</span>`
                : ''
              }
            </div>
            <button
              class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 hover:text-emerald-400 px-2.5 py-1 rounded-md hover:bg-emerald-400/10 transition-all"
              onclick="navigator.clipboard.writeText('${escapedCode}'.replace(/\\\\n/g, '\\n'));const t=this;const o=t.textContent;t.textContent='Copied!';t.classList.add('text-emerald-400');setTimeout(()=>{t.textContent=o;t.classList.remove('text-emerald-400')},2000)"
            >Copy</button>
          </div>
          <pre class="m-0 px-5 py-5 overflow-x-auto text-[13px] leading-[1.7] font-mono custom-scrollbar bg-transparent"><code class="hljs">${showLineNums ? `<span class="flex flex-col">${numberedCode}</span>` : numberedCode}</code></pre>
        </div>`;
    };

    // ── Lists ─────────────────────────────────────
    renderer.list = function (token: Tokens.List) {
      const body = token.items.map((item: Tokens.ListItem) => this.listitem(item)).join('');
      if (token.ordered) {
        return `<ol class="my-5 pl-6 space-y-2 list-decimal marker:text-muted-foreground/50 marker:text-sm">${body}</ol>`;
      }
      return `<ul class="my-5 pl-0 space-y-2 list-none">${body}</ul>`;
    };

    renderer.listitem = function (token: Tokens.ListItem) {
      const text = token.tokens ? this.parser.parse(token.tokens) : token.text;
      if (token.task) {
        const checked = token.checked;
        return `<li class="flex items-start gap-2.5 text-[15px] text-foreground/75 leading-relaxed">
          <span class="mt-[3px] shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center ${checked ? 'bg-primary border-primary' : 'border-border/60'}">
            ${checked ? '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
          </span>
          <span class="${checked ? 'line-through text-muted-foreground/50' : ''}">${text}</span>
        </li>`;
      }
      return `<li class="flex items-start gap-2.5 text-[15px] text-foreground/75 leading-relaxed">
        <span class="mt-[9px] shrink-0 w-1.5 h-1.5 rounded-full bg-primary/50"></span>
        <span>${text}</span>
      </li>`;
    };

    // ── Tables ────────────────────────────────────
    renderer.table = function (token: Tokens.Table) {
      const header = token.header.map((cell: Tokens.TableCell) =>
        `<th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/40 border-b border-border/50 whitespace-nowrap">${this.parser.parseInline(cell.tokens)}</th>`
      ).join('');
      const rows = token.rows.map((row: Tokens.TableCell[], rowIdx: number) =>
        `<tr class="${rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'} hover:bg-primary/5 transition-colors">${row.map((cell: Tokens.TableCell) =>
          `<td class="px-5 py-3 text-[14px] text-foreground/75 border-b border-border/30 align-top leading-relaxed">${this.parser.parseInline(cell.tokens)}</td>`
        ).join('')}</tr>`
      ).join('');

      return `
        <div class="my-7 w-full overflow-x-auto rounded-xl border border-border/50 shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead><tr>${header}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    };

    // ── Paragraphs ────────────────────────────────
    renderer.paragraph = function (token: Tokens.Paragraph) {
      return `<p class="text-[17px] leading-[1.85] text-slate-700 dark:text-slate-300 mb-7 last:mb-0 font-[450] tracking-tight">${this.parser.parseInline(token.tokens)}</p>`;
    };

    // ── Callouts & Blockquotes ────────────────────
    renderer.blockquote = function (token: Tokens.Blockquote) {
      const content = this.parser.parse(token.tokens);
      const alertMatch = content.match(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

      if (alertMatch) {
        const type = alertMatch[1].toUpperCase() as 'NOTE'|'TIP'|'IMPORTANT'|'WARNING'|'CAUTION';
        const cleanContent = content.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, '').replace(/<p[^>]*>/,'<p class="text-[14px] leading-relaxed mb-0">').trim();

        const configs = {
          NOTE:      { border: 'border-blue-500/40',   bg: 'bg-blue-500/5',   titleColor: 'text-blue-400',    bar: 'bg-blue-500',   icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>', label: 'Note' },
          TIP:       { border: 'border-emerald-500/40',bg: 'bg-emerald-500/5', titleColor: 'text-emerald-400', bar: 'bg-emerald-500',icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 5 11.9 4 4 0 0 0-1 2.6V17H8v-.5a4 4 0 0 0-1-2.6A7 7 0 0 1 12 2Z"/></svg>', label: 'Tip' },
          IMPORTANT: { border: 'border-violet-500/40', bg: 'bg-violet-500/5',  titleColor: 'text-violet-400',  bar: 'bg-violet-500', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8Z"/></svg>', label: 'Important' },
          WARNING:   { border: 'border-amber-500/40',  bg: 'bg-amber-500/5',   titleColor: 'text-amber-400',   bar: 'bg-amber-500',  icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>', label: 'Warning' },
          CAUTION:   { border: 'border-red-500/40',    bg: 'bg-red-500/5',     titleColor: 'text-red-400',     bar: 'bg-red-500',    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>', label: 'Caution' },
        };
        const cfg = configs[type];

        return `
          <div class="callout my-6 flex rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden">
            <div class="w-1 shrink-0 ${cfg.bar}"></div>
            <div class="px-5 py-4 flex-1 min-w-0">
              <div class="flex items-center gap-1.5 mb-2 ${cfg.titleColor} font-semibold text-[13px]">
                ${cfg.icon}
                ${cfg.label}
              </div>
              <div class="text-foreground/75 text-[14px] leading-relaxed [&>p]:mb-0">${cleanContent}</div>
            </div>
          </div>`;
      }

      return `
        <blockquote class="my-6 pl-5 border-l-2 border-primary/40 text-foreground/60 italic text-[15px] leading-relaxed">
          ${content}
        </blockquote>`;
    };

    // ── Links ─────────────────────────────────────
    renderer.link = function (token: Tokens.Link) {
      const href = token.href || '';
      const isExternal = href.startsWith('http');
      const isSource = href.startsWith('source://');
      
      if (isSource) {
        const path = href.replace('source://', '');
        return `<a href="#" data-source-path="${path}" class="source-link text-primary font-bold border-b border-primary/30 hover:border-primary transition-all cursor-pointer inline-flex items-center gap-1 group/link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="opacity-70 group-hover/link:translate-x-0.5 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
          ${this.parser.parseInline(token.tokens)}
        </a>`;
      }

      return `<a href="${href}" class="text-primary font-medium underline underline-offset-[3px] decoration-primary/40 hover:decoration-primary transition-colors" ${isExternal ? 'target="_blank" rel="noopener"' : ''} title="${token.title || ''}">${this.parser.parseInline(token.tokens)}</a>`;
    };

    // ── Inline Code ───────────────────────────────
    renderer.codespan = function (token: Tokens.Codespan) {
      return `<code class="font-mono text-[0.875em] px-[5px] py-[2px] rounded-[5px] bg-muted/60 text-foreground/90 border border-border/40">${token.text}</code>`;
    };

    // ── Images ────────────────────────────────────
    renderer.image = function (token: Tokens.Image) {
      const alt = token.text || '';
      const title = token.title || '';
      return `
        <figure class="my-8">
          <img src="${token.href}" alt="${alt}" title="${title}" class="w-full rounded-xl border border-border/40 shadow-lg shadow-black/10" />
          ${alt ? `<figcaption class="mt-3 text-center text-[12px] text-muted-foreground/60 font-medium">${alt}</figcaption>` : ''}
        </figure>`;
    };

    // ── HR ────────────────────────────────────────
    renderer.hr = function () {
      return '<hr class="my-10 border-0 border-t border-border/30" />';
    };

    // ── Strong / Em ───────────────────────────────
    renderer.strong = function (token: Tokens.Strong) {
      const text = this.parser.parseInline(token.tokens);
      return `<strong class="font-semibold text-foreground">${text}</strong>`;
    };

    markedInstance.use({ renderer, gfm: true, breaks: false });

    try {
      const processed = preProcessMarkdown(content);
      const rendered = markedInstance.parse(processed);
      if (typeof rendered === 'string') setHtml(rendered);
    } catch (err) {
      console.error('Marked parsing error:', err);
    }
  }, [content]);

  // Hydrate mermaid diagrams
  useEffect(() => {
    if (!html) return;
    const containers = containerRef.current?.querySelectorAll('.premium-diagram-placeholder');
    if (!containers) return;
    const roots: any[] = [];
    containers.forEach((container) => {
      const diagramContent = container.getAttribute('data-content');
      if (diagramContent) {
        const root = createRoot(container);
        root.render(
          <div className="h-[500px] w-full">
            <PremiumDiagram content={diagramContent} />
          </div>
        );
        roots.push(root);
      }
    });
    return () => {
      roots.forEach(root => { setTimeout(() => root.unmount(), 0); });
    };
  }, [html]);

  // Smooth anchor scroll
  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    const sourcePath = link.getAttribute('data-source-path');

    if (sourcePath && onSourceLinkClick) {
      e.preventDefault();
      onSourceLinkClick(sourcePath);
      return;
    }

    if (href?.startsWith('#')) {
      e.preventDefault();
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [onSourceLinkClick]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('click', handleClick);
      return () => el.removeEventListener('click', handleClick);
    }
  }, [handleClick]);

  return (
    <div
      ref={containerRef}
      className={`doc-article ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
