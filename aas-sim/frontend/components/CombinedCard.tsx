'use client';

import React from 'react';
import { CombinedBillingResponse } from '../lib/types';
import { Euro, TrendingUp, Leaf, Zap, Route, User, FlaskConical, RefreshCw, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

interface CombinedCardProps {
  billing: CombinedBillingResponse;
  className?: string;
  onResetUserBilling?: () => void;
}

function getBillingSourceInfo(source: string) {
  switch (source) {
    case 'user_jobs':
      return {
        icon: User,
        label: 'Your Custom Jobs',
        color: 'text-blue-600 bg-blue-50',
        description: 'Costs from your batch and individual jobs'
      };
    case 'scenario_jobs':
      return {
        icon: FlaskConical,
        label: 'Research Scenarios',
        color: 'text-purple-600 bg-purple-50', 
        description: 'Costs from predefined research scenarios'
      };
    default:
      return {
        icon: RefreshCw,
        label: 'Current Cycle',
        color: 'text-gray-600 bg-gray-50',
        description: 'Live billing from current operations'
      };
  }
}

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(amount);
}

export default function CombinedCard({ billing, className, onResetUserBilling }: CombinedCardProps) {
  const engraverPercentage = billing.combined_cost_eur > 0 
    ? (billing.engraver.cost_eur / billing.combined_cost_eur) * 100 
    : 0;
  const agvPercentage = 100 - engraverPercentage;
  
  // Get billing source information 
  const sourceInfo = getBillingSourceInfo(billing.billing_source || 'current_cycle');
  const SourceIcon = sourceInfo.icon;
  const jobsProcessed = billing.jobs_processed || [];

  return (
    <div className={clsx('card', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Combined Billing</h3>
            <p className="text-sm text-gray-500">Total usage costs across all devices</p>
          </div>
        </div>
        
        {/* Billing Source Indicator */}
        <div className={clsx('px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2', sourceInfo.color)}>
          <SourceIcon className="h-4 w-4" />
          <span>{sourceInfo.label}</span>
        </div>
      </div>

      {/* Source Description */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">{sourceInfo.description}</p>
        {jobsProcessed.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <strong>Jobs processed:</strong> {jobsProcessed.join(', ')} ({jobsProcessed.length} total)
          </div>
        )}
      </div>

      {/* Total Cost Highlight */}
      <div className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl mb-6 border border-primary-200">
        <div className="text-center">
          <p className="text-sm font-medium text-primary-700 mb-2">Total Combined Cost</p>
          <p className="text-4xl font-bold text-primary-900">
            {formatCurrency(billing.combined_cost_eur, billing.currency)}
          </p>
        </div>
      </div>

      {/* Device Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Engraver */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Engraver</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Energy:</span>
              <span className="font-medium">{billing.engraver.energy_kWh.toFixed(6)} kWh</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">CO2:</span>
              <span className="font-medium">{billing.engraver.co2_g.toFixed(2)} g</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-blue-700">Cost:</span>
              <span className="text-blue-900">
                {formatCurrency(billing.engraver.cost_eur)}
              </span>
            </div>
            <div className="text-xs text-blue-600 mt-2">
              {engraverPercentage.toFixed(1)}% of total
            </div>
          </div>
        </div>

        {/* AGV */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-3">
            <Route className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">AGV</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Distance:</span>
              <span className="font-medium">{billing.agv.distance_m.toFixed(2)} m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Billed only:</span>
              <span className="font-medium text-xs">DOCK-SITE-DOCK</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-green-700">Cost:</span>
              <span className="text-green-900">
                {formatCurrency(billing.agv.cost_eur)}
              </span>
            </div>
            <div className="text-xs text-green-600 mt-2">
              {agvPercentage.toFixed(1)}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Cost Distribution Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Cost Distribution</span>
          <span className="text-xs text-gray-500">Engraver vs AGV</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="h-full flex">
            <div 
              className="bg-blue-500 transition-all duration-300"
              style={{ width: `${engraverPercentage}%` }}
            />
            <div 
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${agvPercentage}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-blue-600">
            Engraver: {formatCurrency(billing.engraver.cost_eur)}
          </span>
          <span className="text-xs text-green-600">
            AGV: {formatCurrency(billing.agv.cost_eur)}
          </span>
        </div>
      </div>

      {/* Order References */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-4">
          <div>
            <span className="font-medium">Engraver Ref:</span>
            <div className="truncate">{billing.engraver.orderRef || 'None'}</div>
          </div>
          <div>
            <span className="font-medium">AGV Ref:</span>
            <div className="truncate">{billing.agv.orderRef || 'None'}</div>
          </div>
        </div>
        
        {/* Reset Button - only show for user jobs */}
        {billing.billing_source === 'user_jobs' && onResetUserBilling && (
          <div className="flex justify-center">
            <button
              onClick={onResetUserBilling}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors duration-200 text-sm font-medium border border-red-200"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset User Billing</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}