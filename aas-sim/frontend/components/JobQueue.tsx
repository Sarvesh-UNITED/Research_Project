'use client';

import React from 'react';
import { Clock, MapPin, Zap, Trash2 } from 'lucide-react';

interface QueueJob {
  orderNo: string;
  laserText: string;
  site: string;
  status?: string;
}

interface JobQueueProps {
  jobs: QueueJob[];
  currentJob?: QueueJob | null;
  onRemoveJob?: (orderNo: string) => void;
  className?: string;
}

export default function JobQueue({ jobs, currentJob, onRemoveJob, className }: JobQueueProps) {
  const pendingJobs = (jobs || []).filter(job => job.orderNo !== currentJob?.orderNo);

  return (
    <div className={`card-gradient ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Job Queue</h3>
            <p className="text-sm text-gray-600">{pendingJobs.length} jobs pending</p>
          </div>
        </div>
        {(jobs || []).length > 0 && (
          <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
            Total: {(jobs || []).length}
          </div>
        )}
      </div>

      {/* Current Job */}
      {currentJob && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">🔥 Currently Processing</h4>
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-green-800">{currentJob.orderNo}</div>
                <div className="text-sm text-green-600 flex items-center space-x-4 mt-1">
                  <span className="flex items-center space-x-1">
                    <Zap className="h-3 w-3" />
                    <span>"{currentJob.laserText}"</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{currentJob.site}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">Processing</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Jobs */}
      {pendingJobs.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">⏳ Waiting in Queue</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {pendingJobs.map((job, index) => (
              <div
                key={job.orderNo}
                className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{job.orderNo}</div>
                      <div className="text-sm text-gray-600 flex items-center space-x-4 mt-1">
                        <span className="flex items-center space-x-1">
                          <Zap className="h-3 w-3" />
                          <span>"{job.laserText}"</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.site}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {onRemoveJob && (
                    <button
                      onClick={() => onRemoveJob(job.orderNo)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Remove job"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !currentJob ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No jobs in queue</p>
          <p className="text-sm">Add a job above to start processing</p>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No jobs waiting. Current job is being processed.</p>
        </div>
      )}
    </div>
  );
}