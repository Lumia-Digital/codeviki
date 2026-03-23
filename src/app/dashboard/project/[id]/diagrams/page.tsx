'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Download, RefreshCw, ZoomIn, ZoomOut, ChevronRight, Layers, Layout, Database, Boxes, Workflow, GitBranch, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const DIAGRAMS = [
  {
    id: 'arch',
    title: 'System Architecture',
    type: 'Architecture',
    description: 'High-level system design showing frontend, API, and commerce layers',
    diagram: `
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│        (React Server Components + Client Hydration)      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│              Next.js App Router (Edge)                    │
│  ┌────────────┬────────────┬─────────────┬───────────┐  │
│  │   Pages    │   Server   │  Middleware  │    API    │  │
│  │  (RSC)     │  Actions   │  (Auth/i18n) │  Routes  │  │
│  └──────┬─────┴──────┬─────┴──────┬───────┴────┬─────┘  │
│         │            │            │            │         │
│  ┌──────▼────────────▼────────────▼────────────▼──────┐  │
│  │        Commerce Abstraction Layer                   │  │
│  │   (Provider-agnostic interface for all commerce)    │  │
│  └──────┬────────────┬────────────────────┬───────────┘  │
└─────────│────────────│────────────────────│──────────────┘
          │            │                    │
   ┌──────▼─────┐ ┌───▼──────┐  ┌─────────▼──────┐
   │  Shopify   │ │  Saleor  │  │  BigCommerce   │
   │ Storefront │ │  GraphQL │  │    REST API    │
   │    API     │ │   API    │  │               │
   └────────────┘ └──────────┘  └────────────────┘
    `,
  },
  {
    id: 'components',
    title: 'Component Hierarchy',
    type: 'Component Tree',
    description: 'Complete React component tree with relationships',
    diagram: `
                         ┌──────────┐
                         │   App    │
                         │ (Layout) │
                         └────┬─────┘
              ┌───────────────┼────────────────┐
         ┌────▼────┐    ┌─────▼─────┐    ┌────▼────┐
         │ Navbar  │    │   Main    │    │ Footer  │
         └────┬────┘    │  Content  │    └─────────┘
              │         └─────┬─────┘
    ┌─────┬───┴───┐     ┌─────┼──────────┐
  Logo  Search  Cart    │     │          │
                   ┌────▼──┐  │    ┌─────▼─────┐
                   │ Home  │  │    │  Product   │
                   │ Page  │  │    │   Page     │
                   └───┬───┘  │    └─────┬──────┘
                       │      │          │
               ┌───┬───┘      │    ┌─────┼──────┐
         Grid  Carousel    Search  Gallery  Desc  Variants
    `,
  },
  {
    id: 'dataflow',
    title: 'Data Flow',
    type: 'Flow Chart',
    description: 'How data flows through the application from user action to render',
    diagram: `
  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
  │   Browser   │───▶│  Edge CDN    │───▶│  Next.js    │
  │  (Request)  │    │  (Cache Hit?)│    │  Runtime    │
  └─────────────┘    └──────┬───────┘    └──────┬──────┘
                            │                    │
                     ┌──────▼───────┐    ┌──────▼──────┐
                     │   Return     │    │    RSC      │
                     │   Cached     │    │  Rendering  │
                     │   Response   │    └──────┬──────┘
                     └──────────────┘           │
                                         ┌─────▼──────┐
                                         │  Commerce  │
                                         │   Layer    │
                                         └──────┬─────┘
                                                │
                                    ┌───────────┼───────────┐
                               ┌────▼───┐  ┌───▼────┐ ┌───▼────┐
                               │Products│  │  Cart  │ │Collect.│
                               │  API   │  │  API   │ │  API   │
                               └────────┘  └────────┘ └────────┘
    `,
  },
  {
    id: 'deps',
    title: 'Dependency Graph',
    type: 'Dependencies',
    description: 'Package dependencies and their relationships',
    diagram: `
                      ┌──────────────┐
                      │  next-commerce│
                      │    (root)    │
                      └──────┬───────┘
            ┌────────────────┼────────────────┐
       ┌────▼────┐     ┌─────▼─────┐    ┌────▼────┐
       │ next.js │     │   react   │    │  tailwind│
       │ 14.0.4  │     │  18.2.0   │    │  3.4.0  │
       └────┬────┘     └─────┬─────┘    └─────────┘
            │                │
  ┌─────────┼────┐     ┌─────▼─────┐
  │         │    │     │ react-dom │
Server   API  ISR     │  18.2.0   │
Components Routes      └───────────┘
     │
┌────▼──────────┐
│  @headlessui  │ ◀── UI Components
│   /react      │
└────┬──────────┘
     │
┌────▼──────────┐
│  @heroicons   │ ◀── Icons
│   /react      │
└───────────────┘
    `,
  },
  {
    id: 'routing',
    title: 'Route Structure',
    type: 'Route Map',
    description: 'Application routing with all pages and API endpoints',
    diagram: `
  app/
  ├── layout.tsx ─────────────── Root Layout (Navbar + Footer)
  ├── page.tsx ───────────────── Home Page (/)
  ├── error.tsx ──────────────── Error Boundary
  │
  ├── product/
  │   └── [handle]/
  │       └── page.tsx ───────── Product Detail (/product/:handle)
  │
  ├── search/
  │   ├── page.tsx ───────────── Search Results (/search)
  │   └── [collection]/
  │       └── page.tsx ───────── Collection (/search/:collection)
  │
  ├── cart/
  │   └── page.tsx ───────────── Cart Page (/cart)
  │
  └── api/
      └── revalidate/
          └── route.ts ───────── Webhook (POST /api/revalidate)
    `,
  },
  {
    id: 'auth-flow',
    title: 'Authentication Flow',
    type: 'Sequence',
    description: 'Step-by-step authentication and session management flow',
    diagram: `
  Browser              Middleware           Auth API          Database
    │                      │                   │                 │
    │   GET /account       │                   │                 │
    │─────────────────────▶│                   │                 │
    │                      │   Check Cookie    │                 │
    │                      │──────────────────▶│                 │
    │                      │                   │  Verify Token   │
    │                      │                   │────────────────▶│
    │                      │                   │                 │
    │                      │                   │  Session Valid   │
    │                      │                   │◀────────────────│
    │                      │   Allow Request   │                 │
    │                      │◀──────────────────│                 │
    │                      │                   │                 │
    │   Page Content       │                   │                 │
    │◀─────────────────────│                   │                 │
    │                      │                   │                 │
    `,
  },
];

export default function DiagramsPage() {
  const { id } = useParams();
  const [activeDiagram, setActiveDiagram] = useState(DIAGRAMS[0].id);
  const [zoom, setZoom] = useState(100);
  const [projectName, setProjectName] = useState('Project');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProjectName(data.name || 'Project');
        }
      } catch (err) {
        console.error('Fetch project error:', err);
      }
    };
    if (id) fetchProject();
  }, [id]);

  const currentDiagram = DIAGRAMS.find(d => d.id === activeDiagram)!;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <Link href="/dashboard" className="hover:text-primary transition-colors">Projects</Link>
            <ChevronRight size={14} className="opacity-50" />
            <Link href={`/dashboard/project/${id}`} className="hover:text-primary transition-colors max-w-[150px] truncate">{projectName}</Link>
            <ChevronRight size={14} className="opacity-50" />
            <span className="text-foreground">Visual Protocols</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground">Architecture Maps</h1>
          <p className="text-muted-foreground font-medium text-lg max-w-2xl">High-fidelity visualization of system logic and component hierarchies.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] border-border/50 bg-card/50 backdrop-blur-sm">
            <Download size={14} className="mr-2" /> Export Bundle
          </Button>
          <Button className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
            <RefreshCw size={14} className="mr-2" /> Regenerate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-3 pb-4 lg:pb-0 scrollbar-hide">
          {DIAGRAMS.map(d => (
            <button
              key={d.id}
              className={cn(
                "group text-left p-5 border rounded-2xl transition-all min-w-[240px] lg:min-w-0 relative overflow-hidden backdrop-blur-xl",
                activeDiagram === d.id 
                  ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/5 ring-1 ring-primary/20" 
                  : "border-border/50 bg-card/40 hover:border-primary/30 hover:bg-card/60"
              )}
              onClick={() => setActiveDiagram(d.id)}
            >
              <div className="mb-3">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0 border-primary/30 text-primary bg-primary/5">
                  {d.type}
                </Badge>
              </div>
              <h3 className="text-sm font-black uppercase tracking-tight mb-1">{d.title}</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2">{d.description}</p>
            </button>
          ))}
        </div>

        <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/10 overflow-hidden flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between p-5 border-b border-border/40 bg-muted/10">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary bg-primary/5">{currentDiagram.type}</Badge>
              <h2 className="text-base font-black uppercase tracking-tight">{currentDiagram.title}</h2>
            </div>
            <div className="flex items-center gap-1 bg-background/40 p-1 rounded-xl border border-border/50 shadow-inner">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setZoom(z => Math.max(50, z - 10))}>
                <ZoomOut size={16} />
              </Button>
              <span className="text-[10px] font-black text-muted-foreground min-w-[40px] text-center uppercase tracking-widest">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setZoom(z => Math.min(200, z + 10))}>
                <ZoomIn size={16} />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground" onClick={() => setZoom(100)}>
                Reset
              </Button>
            </div>
          </div>
          <div className="p-10 overflow-auto bg-black/40 flex-1 relative scrollbar-hide">
            <div className="w-fit" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <pre className="font-mono text-sm leading-relaxed text-blue-400 group-hover:text-blue-300 transition-colors">
                {currentDiagram.diagram}
              </pre>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 px-6 border-t border-border/40 bg-muted/10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Generated by System Core 01 · Neural Matrix engine</span>
            <div className="flex gap-2">
              {['SVG', 'PNG', 'Mermaid'].map(ext => (
                <Button key={ext} variant="ghost" className="h-7 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5">
                  {ext}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
