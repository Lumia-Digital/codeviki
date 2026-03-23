'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface MermaidDiagramProps {
  code: string;
  title?: string;
  description?: string;
  id?: string;
}

export default function MermaidDiagram({ code, title, description, id = 'diagram' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const sanitizeMermaidCode = (text: string): string => {
      if (!text) return text;

      // ── Pass 0: Normalize escape sequences ─────────────────────────────
      // AI often stores Mermaid as a JSON string with literal \n instead of real newlines.
      let code = text
        .replace(/\\n/g, '\n')   // literal backslash-n → newline
        .replace(/\\t/g, ' ')    // literal backslash-t → space
        .trim();

      const lines = code.split('\n');

      const sanitized = lines.map((line, lineIndex) => {
        const trimmed = line.trim();

        // Skip blank lines
        if (!trimmed) return line;

        // Skip diagram header and structural keywords unchanged
        if (lineIndex === 0 ||
            /^\s*(graph|sequenceDiagram|erDiagram|classDiagram|stateDiagram|flowchart|gantt|pie|journey|mindmap|timeline|gitGraph|subgraph|end|note|participant|actor|activate|deactivate|loop|alt|else|opt|par|and|critical|break|rect|autonumber)\b/i.test(trimmed)) {
          return line;
        }

        // ── Pass 1: Placeholder map ───────────────────────────────────────
        const ph = new Map<string, string>();
        let pi = 0;

        const protect = (str: string) => {
          const k = `\x00P${pi++}\x00`;
          ph.set(k, str);
          return k;
        };

        let s = line;

        // ── Pass 2: Protect valid edge labels  |"label"|  ─────────────────
        s = s.replace(/\|"([^"]*)"\|/g, (m) => protect(m));
        s = s.replace(/\|'([^']*)'\|/g, (m) => protect(m));

        // ── Pass 3: Protect already-valid node label patterns ─────────────
        // 3a: ID["quoted label"] — already quoted, protect as-is for all shapes
        s = s.replace(/([A-Za-z0-9_]+)\s*([\[\(\{<>]{1,2})"([^"]*)"([\]\)\}>]{1,2})/g, (m) => protect(m));

        // 3b: ID[unquoted label] — square brackets only, content = anything except ]
        // Force-quote the label if it contains special chars ( ) { } that confuse Mermaid's parser.
        // e.g.  Params[Parameters (JSON)]  →  Params["Parameters (JSON)"]
        s = s.replace(/([A-Za-z0-9_]+)\s*\[([^\]"]+)\]/g, (_m, id, label) => {
          const cleaned = label.trim().replace(/"/g, "'");
          return protect(`${id}["${cleaned}"]`);
        });

        // 3c: ID(label) — round brackets / stadium shape, content = anything except )
        s = s.replace(/([A-Za-z0-9_]+)\s*\(([^)"]+)\)/g, (m) => protect(m));

        // 3d: ID{label} — curly brackets / diamond shape, content = anything except }
        s = s.replace(/([A-Za-z0-9_]+)\s*\{([^}"]+)\}/g, (m) => protect(m));

        // ── Pass 4: Protect arrow tokens ──────────────────────────────────
        s = s.replace(/(-->|---|==>|==|-\.->|o--|--o|x--|--x|<-->|<->|<==|~~>|~~|->>|<<-|-\.-)/g, (m) => protect(m));

        // ── Pass 4.5: Protect edge labels in  -- "text" -->  format ──────────
        // These are VALID Mermaid edge labels (not node IDs) — must not be converted.
        // Pattern: one or more dashes, optional space, "quoted text", optional space, dashes+arrow
        // We run this BEFORE the bare-string conversion so they don't get misidentified as nodes.
        s = s.replace(/(-{2,}\s*)"([^"]*)"(\s*-{0,1}>?)/g, (m) => protect(m));
        s = s.replace(/(={2,}\s*)"([^"]*)"(\s*={0,1}>?)/g, (m) => protect(m));
        // Also protect: plain-text edge labels surrounded by dashes that have no quotes (already safe)
        // e.g.  A --text--> B   these are already fine in Mermaid, leave them alone

        // ── Pass 5: Convert remaining bare "label" → SafeId["label"] ──────
        // Any "..." still unprotected at this point is a bare quoted node ID — invalid in Mermaid.
        s = s.replace(/"([^"]+)"/g, (_match, label) => {
          // Build a safe ID: keep alphanumeric, replace everything else with _
          const safeId = label
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/^_+|_+$/g, '')
            .replace(/_+/g, '_')
            .substring(0, 32)
            || `node${pi}`;
          return `${safeId}["${label}"]`;
        });

        // ── Pass 6: Restore placeholders ─────────────────────────────────
        ph.forEach((val, key) => { s = s.split(key).join(val); });

        // ── Pass 7: Clean up double-label artifacts ───────────────────────
        // After conversion, patterns like  SafeId["label"]["extra"]  can occur — strip the extra
        s = s.replace(/([A-Za-z0-9_]+)(\["[^"]*"\])(\["[^"]*"\])/g, '$1$2');

        return s;
      });

      return sanitized.join('\n');
    };

    const renderDiagram = async () => {
      if (!containerRef.current || !code) return;
      
      const sanitizedCode = sanitizeMermaidCode(code);
      
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#6c5ce7',
            primaryTextColor: '#f0f0f5',
            primaryBorderColor: '#a855f7',
            lineColor: '#6b6b80',
            secondaryColor: '#1a1a2e',
            tertiaryColor: '#12121a',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            noteBkgColor: '#1a1a2e',
            noteTextColor: '#f0f0f5',
            noteBorderColor: '#6c5ce7',
            edgeLabelBackground: '#12121a',
            clusterBkg: 'rgba(108, 92, 231, 0.1)',
            clusterBorder: '#6c5ce7',
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            padding: 15,
          },
          sequence: {
            diagramMarginX: 20,
            diagramMarginY: 20,
          },
        });
 
        const uniqueId = `mermaid-${id}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, sanitizedCode);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.borderRadius = '12px';
          }
          setRendered(true);
          setError(null);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(`Failed to render diagram: ${(err as Error).message}`);
      }
    };

    renderDiagram();
  }, [code, id]);

  const handleExportPNG = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: '#0a0a0f',
        pixelRatio: 3,
        style: { padding: '20px' },
      });
      const link = document.createElement('a');
      link.download = `${title || 'diagram'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export PNG error:', err);
    }
  }, [title]);

  const handleExportSVG = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toSvg(containerRef.current, {
        backgroundColor: '#0a0a0f',
      });
      const link = document.createElement('a');
      link.download = `${title || 'diagram'}.svg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export SVG error:', err);
    }
  }, [title]);

  const handleExportPDF = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: '#0a0a0f',
        pixelRatio: 3,
      });
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 280;
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });
      const imgHeight = (img.height * imgWidth) / img.width;
      pdf.addImage(dataUrl, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${title || 'diagram'}.pdf`);
    } catch (err) {
      console.error('Export PDF error:', err);
    }
  }, [title]);

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-glass shadow-sm">
      {title && (
        <div className="flex justify-between items-center p-3 md:p-4 border-b border-border bg-white/2 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white mb-0.5">{title}</h3>
            {description && <p className="text-xs text-text-muted">{description}</p>}
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-1 p-1 bg-glass border border-border/50 rounded-lg">
              <button 
                onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} 
                title="Zoom Out"
                className="p-1.5 rounded-md text-text-secondary hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
              </button>
              <span className="text-xs text-text-muted min-w-[36px] text-center font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(z => Math.min(3, z + 0.1))} 
                title="Zoom In"
                className="p-1.5 rounded-md text-text-secondary hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
              <button 
                onClick={() => setZoom(1)} 
                title="Reset Zoom"
                className="p-1.5 rounded-md text-text-secondary hover:bg-white/10 hover:text-white transition-colors ml-1 border-l border-border/50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </button>
            </div>
            <div className="flex gap-1.5">
              <button 
                onClick={handleExportPNG} 
                disabled={!rendered}
                className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-text-secondary hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                PNG
              </button>
              <button 
                onClick={handleExportSVG} 
                disabled={!rendered}
                className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-text-secondary hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed hidden sm:flex"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                SVG
              </button>
              <button 
                onClick={handleExportPDF} 
                disabled={!rendered}
                className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-text-secondary hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed hidden sm:flex"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 min-h-[200px] relative overflow-auto hide-scrollbar">
        {error ? (
          <div className="flex items-center gap-2 p-4 text-error text-sm bg-error/10 border border-error/20 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <span>{error}</span>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          />
        )}
        {!rendered && !error && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-muted text-sm">
            <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
            <span>Rendering diagram...</span>
          </div>
        )}
      </div>
    </div>
  );
}
