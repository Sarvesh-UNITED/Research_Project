'use client';

import React from 'react';
import { Zap, Route, DollarSign, FileText, RotateCcw, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useIndividualJobs } from '../../lib/api';

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(amount);
}

function formatTimestamp(timestamp: string) {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

interface JobDetail {
  order_no: string;
  laser_text: string;
  letters: number;
  energy_kWh: number;
  co2_g: number;
  cost_eur: number;
  agv_distance_share: number;
  agv_cost_share: number;
  completed_at: string;
  source: string;
  site: string;
  run_id: string;
}

interface BillingData {
  jobs: JobDetail[];
  summary: {
    total_jobs: number;
    total_letters: number;
    total_energy_kWh: number;
    total_co2_g: number;
    total_engraver_cost_eur: number;
    total_agv_distance_m: number;
    total_agv_cost_eur: number;
    grand_total_eur: number;
  };
  last_updated: string | null;
}

export default function DynamicBillingPage() {
  const { data: billingData, error, mutate } = useIndividualJobs();

  const handleResetBilling = async () => {
    if (!confirm('Are you sure you want to reset all billing data? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/v1/aas/reset-user-billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Billing reset successfully');
        mutate(); // Refresh data
        alert('Billing data cleared successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to reset billing:', errorData);
        alert('Failed to clear billing data. Check console for details.');
      }
    } catch (error) {
      console.error('Failed to reset billing:', error);
      alert('Network error: Could not connect to backend. Ensure backend is running on port 8000.');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">Error loading billing data</div>
          <div className="text-gray-500 text-sm">Please check if the backend is running</div>
        </div>
      </div>
    );
  }

  const jobs = billingData?.jobs || [];
  const summary = billingData?.summary;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-700 to-teal-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Cost Report</h1>
              <p className="text-green-100 text-lg">
                Detailed cost analysis for your executed jobs
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {summary ? formatCurrency(summary.grand_total_eur) : '€0.0000'}
            </div>
            <div className="text-green-200 text-sm">Total Cost</div>
            {billingData?.last_updated && (
              <div className="text-green-300 text-xs mt-1">
                Updated: {formatTimestamp(billingData.last_updated)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* No Jobs State */}
      {jobs.length === 0 && (
        <div className="card-gradient p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Jobs Executed Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Execute jobs using the Composer to see detailed cost breakdowns here.
            Each job will show individual energy consumption, CO2 emissions, and costs.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 text-sm font-medium">💡 Pro Tip</p>
            <p className="text-blue-700 text-sm">
              Try creating batch or individual jobs to see how different text lengths affect costs!
            </p>
          </div>
        </div>
      )}

      {/* Individual Job Cards */}
      {jobs.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Individual Job Breakdown</h2>
              <p className="text-gray-600">Detailed costs for each executed job</p>
            </div>
            <button
              onClick={handleResetBilling}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors duration-200 text-sm font-medium border border-red-200"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset All Data</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, index) => (
              <div key={`${job.run_id}-${job.order_no}`} className="card-gradient overflow-hidden">
                {/* Job Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">"{job.laser_text}"</h3>
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      job.source === 'direct' ? 'bg-blue-100 text-blue-800' :
                        job.source === 'batch' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    )}>
                      {job.source}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Order: {job.order_no}</span>
                    <span>{job.letters} letters</span>
                  </div>
                </div>

                {/* Job Details */}
                <div className="p-4 space-y-4">
                  {/* Engraver Costs */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-blue-700 font-medium">
                      <Zap className="h-4 w-4" />
                      <span>Engraver Consumption</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-blue-600 font-medium">Energy</div>
                        <div className="text-blue-900 font-bold">{job.energy_kWh.toFixed(6)} kWh</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-600 font-medium">CO2</div>
                        <div className="text-green-900 font-bold">{job.co2_g.toFixed(2)} g</div>
                      </div>
                    </div>

                    <div className="bg-blue-100 p-3 rounded-lg text-center">
                      <div className="text-blue-700 text-sm font-medium">Engraver Cost</div>
                      <div className="text-blue-900 text-xl font-bold">{formatCurrency(job.cost_eur)}</div>
                    </div>
                  </div>

                  {/* AGV Costs */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center space-x-2 text-green-700 font-medium">
                      <Route className="h-4 w-4" />
                      <span>AGV Share</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-600 font-medium">Distance</div>
                        <div className="text-green-900 font-bold">{job.agv_distance_share?.toFixed(2) ?? '0.00'} m</div>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg">
                        <div className="text-green-700 font-medium">AGV Cost</div>
                        <div className="text-green-900 font-bold">{formatCurrency(job.agv_cost_share || 0)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Total Cost */}
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-primary-600" />
                        <span className="font-medium text-primary-700">Total Job Cost</span>
                      </div>
                      <div className="text-2xl font-bold text-primary-900">
                        {formatCurrency((job.cost_eur || 0) + (job.agv_cost_share || 0))}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center justify-center text-xs text-gray-500 border-t pt-3">
                    <Clock className="h-3 w-3 mr-1" />
                    Completed: {formatTimestamp(job.completed_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Summary Section */}
      {summary && jobs.length > 0 && (
        <>
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Total Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card-gradient p-6 text-center">
              <div className="text-3xl font-bold text-blue-700">{summary.total_jobs}</div>
              <div className="text-blue-600 font-medium">Total Jobs</div>
            </div>

            <div className="card-gradient p-6 text-center">
              <div className="text-3xl font-bold text-green-700">{summary.total_letters}</div>
              <div className="text-green-600 font-medium">Total Letters</div>
            </div>

            <div className="card-gradient p-6 text-center">
              <div className="text-3xl font-bold text-purple-700">{(summary.total_energy_kWh || 0).toFixed(6)}</div>
              <div className="text-purple-600 font-medium">Total Energy (kWh)</div>
            </div>

            <div className="card-gradient p-6 text-center">
              <div className="text-3xl font-bold text-orange-700">{(summary.total_co2_g || 0).toFixed(2)}</div>
              <div className="text-orange-600 font-medium">Total CO2 (g)</div>
            </div>
          </div>

          <div className="card-gradient p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Final Cost Breakdown</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900 mb-2">
                  {formatCurrency(summary.total_engraver_cost_eur || 0)}
                </div>
                <div className="text-blue-700 font-medium">Engraver Energy</div>
                <div className="text-blue-600 text-sm mt-1">{(summary.total_energy_kWh || 0).toFixed(6)} kWh</div>
              </div>

              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Route className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900 mb-2">
                  {formatCurrency(summary.total_agv_cost_eur || 0)}
                </div>
                <div className="text-green-700 font-medium">AGV Transport</div>
                <div className="text-green-600 text-sm mt-1">{(summary.total_agv_distance_m || 0).toFixed(2)} m</div>
              </div>

              <div className="text-center p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border-2 border-primary-200">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-primary-900 mb-2">
                  {formatCurrency(summary.grand_total_eur || 0)}
                </div>
                <div className="text-primary-700 font-medium">Grand Total</div>
                <div className="text-primary-600 text-sm mt-1">All {summary.total_jobs} jobs</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-700 text-center">
                <strong>Cost per letter:</strong> {formatCurrency((summary.grand_total_eur || 0) / Math.max(summary.total_letters || 0, 1))} •
                <strong> Cost per job:</strong> {formatCurrency((summary.grand_total_eur || 0) / Math.max(summary.total_jobs || 0, 1))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}