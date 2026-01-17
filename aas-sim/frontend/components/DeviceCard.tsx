'use client';

import React from 'react';
import { EngraverModel, AGVModel, OperationMode } from '../lib/types';
import { Activity, Zap, Truck, Clock } from 'lucide-react';
import clsx from 'clsx';

interface DeviceCardProps {
  device: EngraverModel | AGVModel;
  className?: string;
}

function getStatusColor(mode: OperationMode) {
  switch (mode) {
    case 'Running': return 'text-success-600 bg-success-50';
    case 'Error': return 'text-error-600 bg-error-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

function formatTimestamp(timestamp: string) {
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return 'Invalid date';
  }
}

export default function DeviceCard({ device, className }: DeviceCardProps) {
  const { operationalData } = device;
  const { status, order, pose } = operationalData;
  
  const isEngraver = device.deviceType === 'Engraver';
  const Icon = isEngraver ? Zap : Truck;

  return (
    <div className={clsx('card', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Icon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{device.deviceType}</h3>
            <p className="text-sm text-gray-500">{device.deviceId}</p>
          </div>
        </div>
        <div className={clsx(
          'px-3 py-1 rounded-full text-sm font-medium',
          getStatusColor(status.operationMode)
        )}>
          <div className="flex items-center space-x-1">
            <Activity className="h-4 w-4" />
            <span>{status.operationMode}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Production Progress</span>
          <span className="text-sm text-gray-500">{status.productionProgress}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${status.productionProgress}%` }}
          />
        </div>
      </div>

      {/* Current Order */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Order</h4>
        {order.orderNo ? (
          <div className="space-y-1 text-sm">
            <div><strong>Order:</strong> {order.orderNo}</div>
            <div><strong>Type:</strong> {order.orderType}</div>
            {order.laserText && <div><strong>Text:</strong> "{order.laserText}"</div>}
            <div><strong>State:</strong> 
              <span className={clsx(
                'ml-2 px-2 py-1 rounded text-xs',
                order.orderState === 'Done' ? 'bg-success-100 text-success-700' :
                order.orderState === 'Error' ? 'bg-error-100 text-error-700' :
                'bg-gray-100 text-gray-700'
              )}>
                {order.orderState}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No active order</p>
        )}
      </div>

      {/* Position (for AGV) */}
      {!isEngraver && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Position</h4>
          <div className="text-sm space-y-1">
            <div><strong>X:</strong> {pose.posX.toFixed(1)}m</div>
            <div><strong>Y:</strong> {pose.posY.toFixed(1)}m</div>
            <div><strong>Orientation:</strong> {pose.orientation.toFixed(1)}°</div>
          </div>
        </div>
      )}

      {/* Heartbeat */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Heartbeat: {status.heartbeatCounter}</span>
        </div>
        <span>{formatTimestamp(status.heartbeatTimestamp)}</span>
      </div>
    </div>
  );
}