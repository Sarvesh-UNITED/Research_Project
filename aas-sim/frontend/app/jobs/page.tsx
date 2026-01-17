'use client';

import React from 'react';

export default function JobsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-warning-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 pointer-events-none"></div>
        <div className="relative z-10 flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-3xl">⚡</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Job Management</h1>
            <p className="text-orange-100 text-lg">
              Manage and monitor job queue and execution processes
            </p>
          </div>
        </div>
      </div>
      
      {/* Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-gradient">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Job Queue</h3>
              <p className="text-sm text-gray-600">Current queued jobs</p>
            </div>
          </div>
          <p className="text-gray-500">Queue management interface will be displayed here</p>
        </div>
        
        <div className="card-gradient">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Execution Status</h3>
              <p className="text-sm text-gray-600">Real-time job execution</p>
            </div>
          </div>
          <p className="text-gray-500">Job execution monitoring will be displayed here</p>
        </div>
      </div>
    </div>
  );
}