'use client';

import React, { useState } from 'react';
import ComposerModeToggle from '../../components/ComposerModeToggle';
import DirectForm from '../../components/DirectForm';
import BatchBuilder from '../../components/BatchBuilder';
import ScenarioButtons from '../../components/ScenarioButtons';
import { Wrench, Target, Zap } from 'lucide-react';

type ComposerMode = 'direct' | 'batch';

export default function ComposerPage() {
  const [mode, setMode] = useState<ComposerMode>('direct');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleModeChange = (newMode: ComposerMode) => {
    setMode(newMode);
  };

  const handleNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-24 right-6 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${notification.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
          }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Job Manager</h1>
              <p className="text-purple-100 text-lg">
                Create and execute jobs directly or in optimized batches
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold mb-1">
              {mode === 'direct' ? '⚡ Individual' : '📦 Batch'}
            </div>
            <div className="text-purple-200 text-sm">Current Mode</div>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center">
        <ComposerModeToggle
          currentMode={mode}
          onModeChange={handleModeChange}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Job Creation */}
        <div className="lg:col-span-2 space-y-6">
          {mode === 'direct' ? (
            <DirectForm onNotification={handleNotification} />
          ) : (
            <BatchBuilder onNotification={handleNotification} />
          )}
        </div>

        {/* Right Column - Scenarios */}
        <div className="space-y-6">
          <ScenarioButtons onNotification={handleNotification} />

          {/* Quick Tips */}
          <div className="card-gradient p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span>Quick Tips</span>
            </h3>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="font-medium text-blue-800 text-sm">Order Number Format</div>
                <div className="text-blue-600 text-xs">Use X-NNNN format (e.g., E-1001, D-2050)</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="font-medium text-green-800 text-sm">Batch Processing</div>
                <div className="text-green-600 text-xs">Same site jobs save up to 67% transport cost</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="font-medium text-purple-800 text-sm">Text Limits</div>
                <div className="text-purple-600 text-xs">1-50 characters per job</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research Context */}
      <div className="card-gradient p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="h-6 w-6 text-indigo-600" />
          <h3 className="text-xl font-semibold text-gray-900">Research Context</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Batch Processing Benefits</h4>
            <p className="text-green-700 text-sm">
              AGV makes one trip per site, processing all jobs continuously.
              Significantly reduces transportation overhead.
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Individual Processing</h4>
            <p className="text-orange-700 text-sm">
              Each job requires a separate AGV round trip. Higher flexibility
              but increased transportation costs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}