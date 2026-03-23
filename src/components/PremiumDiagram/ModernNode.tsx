'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { motion } from 'framer-motion';
import { HelpCircle, Code, Box, Cpu, Database, Layout, Settings, Sparkles, FileText, User as UserIcon, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NodeData = Record<string, any> & {
  label: string;
  type?: 'default' | 'scanner' | 'ai' | 'database' | 'ui' | 'logic' | 'entry';
  description?: string;
  icon?: string;
};

const getIcon = (data: NodeData) => {
  const label = data.label.toLowerCase();
  const type = data.type?.toLowerCase() || '';
  
  if (type === 'scanner' || label.includes('scan')) return Cpu;
  if (type === 'ai' || label.includes('ai') || label.includes('logic') || label.includes('intel')) return Sparkles;
  if (type === 'database' || label.includes('db') || label.includes('store') || label.includes('sql')) return Database;
  if (type === 'ui' || label.includes('page') || label.includes('visual') || label.includes('client')) return Layout;
  if (type === 'logic' || label.includes('code') || label.includes('engine')) return Code;
  if (type === 'entry' || label.includes('start') || label.includes('setting')) return Settings;
  if (label.includes('file') || label.includes('doc') || label.includes('model')) return FileText;
  if (label.includes('user') || label.includes('client')) return UserIcon;
  if (label.includes('shield') || label.includes('secure') || label.includes('auth')) return Shield;
  
  return Box;
};

const getTypeStyles = (type?: string) => {
  switch (type) {
    case 'scanner': return 'border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_-5px_rgba(59,130,246,0.2)]';
    case 'ai': return 'border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400 shadow-[0_0_15px_-5px_rgba(168,85,247,0.2)]';
    case 'database': return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]';
    case 'ui': return 'border-pink-500/30 bg-pink-500/5 text-pink-600 dark:text-pink-400 shadow-[0_0_15px_-5px_rgba(236,72,153,0.2)]';
    case 'entry': return 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]';
    default: return 'border-border bg-card/50 text-foreground shadow-sm';
  }
};

const ModernNode = ({ data, selected }: NodeProps<Node<NodeData>>) => {
  const Icon = getIcon(data);
  const styles = getTypeStyles(data.type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "relative px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 min-w-[160px] bg-card/80",
        styles,
        selected ? "ring-2 ring-primary/50 border-primary/50 shadow-[0_0_20px_-2px_rgba(108,92,231,0.3)]" : "hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg bg-background/50 border border-border/50 shadow-inner flex items-center justify-center",
          selected && "border-primary/30"
        )}>
          <Icon size={18} className={cn("transition-colors", selected ? "text-primary animate-pulse" : "opacity-80")} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-foreground leading-tight">
            {data.label}
          </span>
          {data.description && (
            <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 opacity-70">
              {data.description}
            </span>
          )}
        </div>
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!border-border !bg-background !w-2 !h-2 translate-y-[-4px] hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!border-border !bg-background !w-2 !h-2 translate-y-[4px] hover:!scale-125 transition-transform"
      />
      
      {/* Decorative Gradient Glow */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-primary/5 to-transparent -z-10 opacity-30 dark:opacity-50" />
    </motion.div>
  );
};

export default memo(ModernNode);
