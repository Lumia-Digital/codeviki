import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className, showText = true, size = 36 }: LogoProps) {
  const iconSize = Math.round(size * 0.55);
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        style={{ width: size, height: size }}
        className="rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0"
      >
        <Sparkles size={iconSize} className="animate-spin-slow" />
      </div>
      {showText && (
        <span 
          style={{ fontSize: Math.round(size * 0.55) }}
          className="font-black tracking-tighter uppercase tracking-widest text-foreground"
        >
          Code<span className="text-primary">Viki</span>
        </span>
      )}
    </div>
  );
}
