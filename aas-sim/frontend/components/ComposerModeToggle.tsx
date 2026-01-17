'use client';

import React from 'react';
import { Zap, Package } from 'lucide-react';

type ComposerMode = 'direct' | 'batch';

interface ComposerModeToggleProps {
  currentMode: ComposerMode;
  onModeChange: (mode: ComposerMode) => void;
}

export default function ComposerModeToggle({ currentMode, onModeChange }: ComposerModeToggleProps) {
  return (
    <div className="card-gradient p-2 w-fit">
      <div className="flex items-center bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => onModeChange('direct')}
          className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
            currentMode === 'direct'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <Zap className="h-5 w-5" />
          <span>Direct Mode</span>
          <div className="text-xs opacity-80">Individual</div>
        </button>
        
        <button
          onClick={() => onModeChange('batch')}
          className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
            currentMode === 'batch'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
          }`}
        >
          <Package className="h-5 w-5" />
          <span>Batch Mode</span>
          <div className="text-xs opacity-80">Up to 5 jobs</div>
        </button>
      </div>
    </div>
  );
}