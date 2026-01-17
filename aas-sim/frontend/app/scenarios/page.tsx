'use client';

import React from 'react';
import { api } from '../../lib/api';

export default function ScenariosPage() {
  const [running, setRunning] = React.useState(false);
  const [results, setResults] = React.useState<any>(null);

  const runScenario = async (scenario: number) => {
    setRunning(true);
    try {
      const result = scenario === 1 ? await api.runScenario1() : await api.runScenario2();
      setResults(result);
    } catch (error) {
      console.error('Error running scenario:', error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test Scenarios</h1>
        <p className="text-gray-600 mt-2">Run predefined scenarios for validation</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Scenario 1: Basic Test</h3>
          <p className="text-gray-600 mb-4">Run basic scenario with predefined jobs</p>
          <button
            onClick={() => runScenario(1)}
            disabled={running}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {running ? 'Running...' : 'Run Scenario 1'}
          </button>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Scenario 2: Advanced Test</h3>
          <p className="text-gray-600 mb-4">Run advanced scenario with multiple jobs</p>
          <button
            onClick={() => runScenario(2)}
            disabled={running}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {running ? 'Running...' : 'Run Scenario 2'}
          </button>
        </div>
      </div>

      {results && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Scenario Results</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}