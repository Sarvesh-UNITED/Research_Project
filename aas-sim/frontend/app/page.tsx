'use client';

import React, { useState, useCallback } from 'react';
import { useDevices, useCombinedBilling, useCycleStatus, useQueue } from '../lib/api';
import DeviceCard from '../components/DeviceCard';
import CombinedCard from '../components/CombinedCard';
import JobQueue from '../components/JobQueue';
import { RefreshCw, Activity, AlertCircle, Play, Target } from 'lucide-react';

export default function OverviewPage() {
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const { data: devices, error: devicesError, isLoading: devicesLoading } = useDevices(2000);
  const { data: billing, error: billingError, isLoading: billingLoading } = useCombinedBilling(2000);
  const { data: cycleStatus, error: statusError } = useCycleStatus(1000);
  const { data: queueData } = useQueue(2000);

  const handleRunScenario = useCallback(async (scenarioNumber: 1 | 2) => {
    try {
      const response = await fetch(`/api/v1/cycle/scenario${scenarioNumber}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to run scenario ${scenarioNumber}`);
      }

      setNotification({ 
        type: 'success', 
        message: `Scenario ${scenarioNumber} started successfully!` 
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error(`Error running scenario ${scenarioNumber}:`, error);
      setNotification({ 
        type: 'error', 
        message: `Failed to run scenario ${scenarioNumber}. Please try again.` 
      });
      setTimeout(() => setNotification(null), 3000);
    }
  }, []);

  const handleResetUserBilling = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/aas/reset-user-billing', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset user billing');
      }

      setNotification({ 
        type: 'success', 
        message: 'User billing reset successfully!' 
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error resetting user billing:', error);
      setNotification({ 
        type: 'error', 
        message: 'Failed to reset user billing. Please try again.' 
      });
      setTimeout(() => setNotification(null), 3000);
    }
  }, []);

  if (devicesLoading || billingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-gray-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading devices...</span>
        </div>
      </div>
    );
  }

  if (devicesError || billingError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-error-600">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading data. Please check if the backend is running.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-24 right-6 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-3xl">🏭</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Smart Factory Dashboard</h1>
                  <p className="text-primary-100 text-lg">
                    Interactive Asset Administration Shell with real-time billing
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {cycleStatus && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                  <div className="flex items-center space-x-3">
                    <Activity className={`h-6 w-6 ${
                      cycleStatus.billing_window_active ? 'text-success-300' : 'text-gray-300'
                    }`} />
                    <div>
                      <div className={`font-semibold ${
                        cycleStatus.billing_window_active ? 'text-success-200' : 'text-gray-300'
                      }`}>
                        {cycleStatus.billing_window_active ? '🟢 Billing Active' : '⚫ Billing Inactive'}
                      </div>
                      <div className="text-sm text-primary-200">
                        Queue: {queueData?.queue?.length || 0} jobs
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Research Scenarios - Main Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scenario 1 */}
        <div className="card-gradient p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Scenario 1</h2>
              <p className="text-green-600 font-semibold">Batch Processing</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Research Hypothesis:</h4>
            <p className="text-gray-700 leading-relaxed">
              AGV moves <strong>once per site</strong> to collect all jobs. Engraver processes all tasks continuously at that location. This should result in <strong>lower transportation costs</strong> and higher efficiency.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h5 className="font-medium text-green-800 mb-2">Expected Benefits:</h5>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Single round trip per site</li>
              <li>• Reduced AGV operating costs</li>
              <li>• Batch processing efficiency</li>
            </ul>
          </div>

          <button
            onClick={() => handleRunScenario(1)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-3"
          >
            <Play className="h-6 w-6" />
            <span>Run Batch Processing Scenario</span>
          </button>
        </div>

        {/* Scenario 2 */}
        <div className="card-gradient p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Scenario 2</h2>
              <p className="text-orange-600 font-semibold">Individual Processing</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Research Hypothesis:</h4>
            <p className="text-gray-700 leading-relaxed">
              AGV moves <strong>individually for each task</strong>. After each engraving job, AGV returns and then goes for the next job. This should result in <strong>higher transportation costs</strong> but more flexible scheduling.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h5 className="font-medium text-orange-800 mb-2">Expected Trade-offs:</h5>
            <ul className="text-orange-700 text-sm space-y-1">
              <li>• Multiple round trips per job</li>
              <li>• Higher AGV operating costs</li>
              <li>• Maximum scheduling flexibility</li>
            </ul>
          </div>

          <button
            onClick={() => handleRunScenario(2)}
            className="w-full bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-3"
          >
            <Play className="h-6 w-6" />
            <span>Run Individual Processing Scenario</span>
          </button>
        </div>
      </div>

      {/* Live Queue Status */}
      <JobQueue 
        jobs={queueData?.queue || []}
        currentJob={cycleStatus?.current_job}
        className="max-w-4xl mx-auto"
      />

      {/* Combined Billing Card */}
      {billing && (
        <CombinedCard billing={billing} onResetUserBilling={handleResetUserBilling} />
      )}

      {/* Device Cards */}
      {devices && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {devices.engraver && (
            <DeviceCard 
              device={devices.engraver}
              className="h-fit"
            />
          )}
          {devices.agv && (
            <DeviceCard 
              device={devices.agv}
              className="h-fit"
            />
          )}
        </div>
      )}

      {/* Quick Stats */}
      {cycleStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="metric-card metric-card-blue text-center">
            <div className="text-3xl font-bold text-blue-700 mb-2">
              {cycleStatus.engraver_progress}%
            </div>
            <div className="text-sm text-blue-600 font-medium">Engraver Progress</div>
            <div className="progress-bar mt-3">
              <div 
                className="progress-fill" 
                style={{ width: `${cycleStatus.engraver_progress}%` }}
              />
            </div>
          </div>
          <div className="metric-card metric-card-green text-center">
            <div className="text-3xl font-bold text-green-700 mb-2">
              {cycleStatus.agv_progress}%
            </div>
            <div className="text-sm text-green-600 font-medium">AGV Progress</div>
            <div className="progress-bar mt-3">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out shadow-sm" 
                style={{ width: `${cycleStatus.agv_progress}%` }}
              />
            </div>
          </div>
          <div className="metric-card metric-card-yellow text-center">
            <div className="text-2xl font-bold text-yellow-700 mb-2">
              ⚡ {cycleStatus.engraver_mode}
            </div>
            <div className="text-sm text-yellow-600 font-medium">Engraver Mode</div>
          </div>
          <div className="metric-card metric-card-red text-center">
            <div className="text-2xl font-bold text-red-700 mb-2">
              🚚 {cycleStatus.agv_mode}
            </div>
            <div className="text-sm text-red-600 font-medium">AGV Mode</div>
          </div>
        </div>
      )}

      {/* AGV Position */}
      {cycleStatus?.agv_pose && (
        <div className="card-gradient">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🗺️</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">AGV Live Position</h3>
              <p className="text-sm text-gray-600">Real-time location tracking</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border border-blue-200/30">
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {cycleStatus.agv_pose.posX.toFixed(1)}m
              </div>
              <div className="text-sm text-blue-600 font-medium">📍 X Position</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200/30">
              <div className="text-3xl font-bold text-green-700 mb-2">
                {cycleStatus.agv_pose.posY.toFixed(1)}m
              </div>
              <div className="text-sm text-green-600 font-medium">📍 Y Position</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-6 rounded-xl border border-purple-200/30">
              <div className="text-3xl font-bold text-purple-700 mb-2">
                {cycleStatus.agv_pose.orientation.toFixed(1)}°
              </div>
              <div className="text-sm text-purple-600 font-medium">🧭 Orientation</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}