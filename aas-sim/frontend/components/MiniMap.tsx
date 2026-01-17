'use client';

import React from 'react';

interface MiniMapProps {
  className?: string;
}

export default function MiniMap({ className }: MiniMapProps) {
  return (
    <div className={`card ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AGV Position Map</h3>
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Mini Map Component</p>
      </div>
    </div>
  );
}