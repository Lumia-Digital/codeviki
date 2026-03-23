'use client';

import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: 'hsl(var(--primary) / 0.1)',
        }}
      />
      <path
        id={id}
        style={{
          ...style,
          fill: 'none',
          strokeWidth: 3,
          stroke: 'url(#edge-gradient)',
          strokeDasharray: '5,5',
          animation: 'dashdraw 10s linear infinite',
        }}
        d={edgePath}
      />
      
      {/* Glow Effect Path */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(108, 92, 231, 0.4)"
        strokeWidth={4}
        className="animate-pulse opacity-20"
        style={{ filter: 'blur(4px)' }}
      />
      
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6c5ce7" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8">
              <animate attributeName="offset" values="0;1;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#6c5ce7" stopOpacity="0.2" />
          </linearGradient>
          <style>
            {`
              @keyframes dashdraw {
                from { stroke-dashoffset: 100; }
                to { stroke-dashoffset: 0; }
              }
            `}
          </style>
        </defs>
      </svg>
    </>
  );
}
