'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import ModernNode, { NodeData } from './ModernNode';
import AnimatedEdge from './AnimatedEdge';
import { Maximize2, RefreshCw, ZoomIn, ZoomOut, MousePointer2, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeTypes = {
  modern: ModernNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top' as any;
    node.sourcePosition = isHorizontal ? 'right' : 'bottom' as any;

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

interface PremiumDiagramProps {
  content: string; // Can be JSON or legacy Mermaid
  title?: string;
  className?: string;
}

export default function PremiumDiagram({ content, title, className }: PremiumDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layouted, setLayouted] = useState(false);

  // Simple parser for legacy Mermaid or generic "Node -> Node" text
  const parseContent = useCallback((text: string) => {
    const nodesMap = new Map<string, Node>();
    const edgesList: Edge[] = [];

    // Try to parse JSON first
    try {
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const data = JSON.parse(text);
        if (data.nodes && data.edges) return data;
      }
    } catch (e) {}

    // Fallback to text parser (Mermaid-lite)
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('graph') || trimmed.startsWith('flowchart') || trimmed.startsWith('subgraph') || trimmed.startsWith('end')) return;

      // Match: Source[Label] -->|EdgeLabel| Target[Label]
      // Regex for individual node components and connections
      // Group 1: Node ID, Group 2: Label
      const nodeRegex = /([a-zA-Z0-9_-]+)(?:[\(\[\{]+(?:"?)(.*?)(?:"?)[\]\)\}\}]+)?/g;
      const connectionRegex = /\s*(-{2,}>|={2,}>|->|\|(.*?)\|)\s*/g;
      
      // Extract all nodes on this line
      const nodesOnLine: { id: string, label?: string }[] = [];
      let nMatch;
      while ((nMatch = nodeRegex.exec(trimmed)) !== null) {
        nodesOnLine.push({ id: nMatch[1], label: nMatch[2] });
      }

      // Extract all arrows/labels on this line
      const connectionsOnLine: { arrow: string, label?: string }[] = [];
      let cMatch;
      while ((cMatch = connectionRegex.exec(trimmed)) !== null) {
        connectionsOnLine.push({ arrow: cMatch[1], label: cMatch[2] });
      }

      // Chain them together: Node0 -> Node1 -> Node2
      for (let i = 0; i < nodesOnLine.length; i++) {
        const node = nodesOnLine[i];
        const nodeId = node.id.trim();
        
        if (!nodesMap.has(nodeId)) {
          nodesMap.set(nodeId, {
            id: nodeId,
            type: 'modern',
            data: { 
              label: (node.label || nodeId).trim(), 
              type: nodeId.toLowerCase().includes('database') ? 'database' : 
                    nodeId.toLowerCase().includes('ai') ? 'ai' : 
                    nodeId.toLowerCase().includes('ui') ? 'ui' : 'default'
            },
            position: { x: 0, y: 0 },
          });
        }

        // Create edge to next node if exists
        if (i < nodesOnLine.length - 1 && connectionsOnLine[i]) {
          const targetNode = nodesOnLine[i+1];
          const targetId = targetNode.id.trim();
          const conn = connectionsOnLine[i];

          edgesList.push({
            id: `e${nodeId}-${targetId}-${index}-${i}`,
            source: nodeId,
            target: targetId,
            label: conn.label || '',
            type: 'animated',
            animated: true,
          });
        }
      }
    });

    return { nodes: Array.from(nodesMap.values()), edges: edgesList };
  }, []);

  useEffect(() => {
    const { nodes: parsedNodes, edges: parsedEdges } = parseContent(content);
    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(parsedNodes, parsedEdges);
    setNodes([...lNodes]);
    setEdges([...lEdges]);
    setLayouted(true);
  }, [content, parseContent, setNodes, setEdges]);

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: lNodes, edges: lEdges } = getLayoutedElements(nodes, edges, direction);
      setNodes([...lNodes]);
      setEdges([...lEdges]);
    },
    [nodes, edges, setNodes, setEdges]
  );

  return (
    <div className={cn("w-full h-[500px] border border-border rounded-2xl bg-muted/50 dark:bg-black/40 relative group overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        elevateEdgesOnSelect
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="rgba(108, 92, 231, 0.15)" 
        />
        
        <Panel position="top-right" className="flex flex-col gap-2 p-2">
          <div className="flex bg-background/80 backdrop-blur-md border border-border rounded-lg p-1.5 shadow-xl gap-1">
            <button 
              onClick={() => onLayout('TB')}
              className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
              title="Layout Vertical"
            >
              <Layout size={16} />
            </button>
            <button 
              onClick={() => onLayout('LR')}
              className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
              title="Layout Horizontal"
            >
              <Layout size={16} className="rotate-90" />
            </button>
            <div className="w-px bg-border mx-1" />
            <button 
              onClick={() => setNodes(nodes => nodes.map(n => ({...n, selected: false})))}
              className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
              title="Clear Selection"
            >
              <MousePointer2 size={16} />
            </button>
          </div>
        </Panel>

        <Controls 
          showInteractive={false} 
          className="!bg-background/80 !backdrop-blur-md !border-border !rounded-lg !overflow-hidden !shadow-2xl !p-1"
        />
        
        <MiniMap 
          nodeColor={(n) => {
            if (n.data?.type === 'scanner') return '#3b82f6';
            if (n.data?.type === 'ai') return '#a855f7';
            return '#6c5ce7';
          }}
          maskColor="rgba(0, 0, 0, 0.5)"
          className="!bg-background/80 !border-border !rounded-lg !overflow-hidden !shadow-2xl !bottom-4 !right-4 !w-32 !h-24 !m-4"
        />
      </ReactFlow>

      {title && (
        <div className="absolute top-4 left-4 z-10">
          <div className="px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border rounded-lg shadow-xl">
            <h4 className="text-xs font-semibold text-white/90">{title}</h4>
          </div>
        </div>
      )}

      {!layouted && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="animate-spin text-primary" size={24} />
            <span className="text-xs text-text-muted font-medium">Computing optimal layout...</span>
          </div>
        </div>
      )}
    </div>
  );
}
