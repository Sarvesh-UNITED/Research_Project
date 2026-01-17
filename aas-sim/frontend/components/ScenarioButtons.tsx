'use client';

import React, { useState } from 'react';
import { Target, Play } from 'lucide-react';
import { runScenario1, runScenario2 } from '../lib/composerApi';

interface ScenarioButtonsProps {
  onNotification: (type: 'success' | 'error', message: string) => void;
}

export default function ScenarioButtons({ onNotification }: ScenarioButtonsProps) {
  const [loadingScenario, setLoadingScenario] = useState<1 | 2 | null>(null);

  const handleScenario1 = async () => {
    setLoadingScenario(1);
    try {
      const response = await runScenario1();
      
      if (response.success) {
        onNotification('success', 'Scenario 1 (Batch Processing) started! Redirecting to track progress...');
        
        // Redirect to overview page to track progress after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        onNotification('error', response.message || 'Scenario 1 execution failed');
      }
    } catch (error) {
      console.error('Scenario 1 error:', error);
      onNotification('error', error instanceof Error ? error.message : 'Failed to execute Scenario 1');
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleScenario2 = async () => {
    setLoadingScenario(2);
    try {
      const response = await runScenario2();
      
      if (response.success) {
        onNotification('success', 'Scenario 2 (Individual Processing) started! Redirecting to track progress...');
        
        // Redirect to overview page to track progress after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        onNotification('error', response.message || 'Scenario 2 execution failed');
      }
    } catch (error) {
      console.error('Scenario 2 error:', error);
      onNotification('error', error instanceof Error ? error.message : 'Failed to execute Scenario 2');
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div className="card-gradient p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Target className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Research Scenarios</h3>
          <p className="text-purple-600 text-sm">Predefined test cases for comparison</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Scenario 1 */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-bold text-green-800 text-lg">Scenario 1</h4>
              <p className="text-green-600 font-medium text-sm">Batch Processing</p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
          
          <p className="text-green-700 text-sm mb-4 leading-relaxed">
            Multiple jobs at <strong>same site</strong> → one billed round-trip. 
            Tests batch processing efficiency and cost optimization.
          </p>
          
          <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
            <div className="text-xs text-green-800 font-medium mb-1">Jobs:</div>
            <div className="text-xs text-green-700 space-y-1">
              <div>• E-1001: "HELLO" at JOB_POS1</div>
              <div>• E-1002: "WORLD" at JOB_POS1</div>
              <div>• E-1003: "TEST" at JOB_POS1</div>
            </div>
          </div>

          <button
            onClick={handleScenario1}
            disabled={loadingScenario !== null}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              loadingScenario === null
                ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loadingScenario === 1 ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run Batch Scenario</span>
              </>
            )}
          </button>
        </div>

        {/* Scenario 2 */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-bold text-orange-800 text-lg">Scenario 2</h4>
              <p className="text-orange-600 font-medium text-sm">Individual Processing</p>
            </div>
            <div className="text-2xl">🔄</div>
          </div>
          
          <p className="text-orange-700 text-sm mb-4 leading-relaxed">
            Jobs at <strong>different sites</strong> → two billed round-trips. 
            Tests individual processing flexibility and cost impact.
          </p>
          
          <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
            <div className="text-xs text-orange-800 font-medium mb-1">Jobs:</div>
            <div className="text-xs text-orange-700 space-y-1">
              <div>• E-2001: "SMART" at JOB_POS1</div>
              <div>• E-2002: "FACTORY" at JOB_POS2</div>
            </div>
          </div>

          <button
            onClick={handleScenario2}
            disabled={loadingScenario !== null}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              loadingScenario === null
                ? 'bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loadingScenario === 2 ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run Individual Scenario</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Research Note */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          <div className="font-medium text-gray-800 mb-1">Research Comparison</div>
          <div className="text-xs text-gray-600">
            These scenarios help compare batch vs individual processing strategies for cost optimization research.
          </div>
        </div>
      </div>
    </div>
  );
}