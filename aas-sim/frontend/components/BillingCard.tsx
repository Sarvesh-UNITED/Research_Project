'use client';

import React from 'react';
import { EngraverBillingModel, AGVBillingModel, BillingStatus } from '../lib/types';
import { Euro, Zap, Route, Leaf, Calendar } from 'lucide-react';
import clsx from 'clsx';

interface BillingCardProps {
  billing: EngraverBillingModel | AGVBillingModel;
  deviceType: 'Engraver' | 'AGV';
  className?: string;
}

function getBillingStatusColor(status: BillingStatus) {
  switch (status) {
    case 'Billed': return 'text-success-600 bg-success-50';
    case 'Waived': return 'text-gray-600 bg-gray-50';
    default: return 'text-warning-600 bg-warning-50';
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

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) return 'Never';
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

function isEngraverBilling(billing: any): billing is EngraverBillingModel {
  return 'energyConsumed' in billing;
}

export default function BillingCard({ billing, deviceType, className }: BillingCardProps) {
  const isEngraver = deviceType === 'Engraver';

  return (
    <div className={clsx('card', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            {isEngraver ? (
              <Zap className="h-5 w-5 text-primary-600" />
            ) : (
              <Route className="h-5 w-5 text-primary-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {deviceType} Billing
            </h3>
            <p className="text-sm text-gray-500">Usage-based charges</p>
          </div>
        </div>
        <div className={clsx(
          'px-3 py-1 rounded-full text-sm font-medium',
          getBillingStatusColor(billing.billingStatus)
        )}>
          {billing.billingStatus}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {isEngraver && isEngraverBilling(billing) ? (
          <>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Energy</span>
              </div>
              <p className="text-xl font-bold text-blue-900">
                {billing.energyConsumed.toFixed(6)} kWh
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">CO2</span>
              </div>
              <p className="text-xl font-bold text-green-900">
                {billing.carbonEmissions.toFixed(2)} g
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Route className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Distance</span>
              </div>
              <p className="text-xl font-bold text-blue-900">
                {(billing as AGVBillingModel).distanceTraveled.toFixed(2)} m
              </p>
              <p className="text-xs text-blue-600 mt-1">Billed legs only</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Euro className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Rate</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency((billing as AGVBillingModel).costPerMeter)}/m
              </p>
            </div>
          </>
        )}
      </div>

      {/* Cost Summary */}
      <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-700">Total Usage Cost</p>
            {billing.orderRef && (
              <p className="text-xs text-primary-600">Ref: {billing.orderRef}</p>
            )}
          </div>
          <p className="text-2xl font-bold text-primary-900">
            {formatCurrency(billing.usageCost, billing.currency)}
          </p>
        </div>
      </div>

      {/* Detailed Rates */}
      {isEngraver && isEngraverBilling(billing) && (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Energy Rate:</span>
            <span className="font-medium">
              {formatCurrency(billing.costPerEnergyUnit)}/kWh
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Emission Factor:</span>
            <span className="font-medium">{billing.emissionFactor} gCO2e/kWh</span>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Last Updated: {formatTimestamp(billing.lastUpdated)}</span>
          </div>
          {billing.lastBilledAt && (
            <span>Billed: {formatTimestamp(billing.lastBilledAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}