'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Play, MapPin, Type, AlertCircle, CheckCircle } from 'lucide-react';
import { runBatchJobs, validateLaserText, type BatchJobItem, type BatchJobRequest } from '../lib/composerApi';

interface BatchBuilderProps {
  onNotification: (type: 'success' | 'error', message: string) => void;
}

export default function BatchBuilder({ onNotification }: BatchBuilderProps) {
  const [site, setSite] = useState<'JOB_POS1' | 'JOB_POS2'>('JOB_POS1');
  const [jobs, setJobs] = useState<BatchJobItem[]>([
    { laserText: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addJob = () => {
    if (jobs.length < 5) {
      setJobs([...jobs, { laserText: '' }]);
    }
  };

  const removeJob = (index: number) => {
    if (jobs.length > 1) {
      setJobs(jobs.filter((_, i) => i !== index));
    }
  };

  const updateJob = (index: number, field: keyof BatchJobItem, value: string) => {
    const newJobs = [...jobs];
    newJobs[index] = { ...newJobs[index], [field]: value };
    setJobs(newJobs);
  };

  const validateJob = (job: BatchJobItem) => {
    const textValid = validateLaserText(job.laserText);
    return {
      laserText: textValid,
      isValid: textValid.valid
    };
  };

  const getJobValidation = (index: number) => {
    return validateJob(jobs[index]);
  };

  const isBatchValid = jobs.length > 0 && jobs.every(job => validateJob(job).isValid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBatchValid) {
      onNotification('error', 'Please fix all validation errors before submitting');
      return;
    }

    const batchRequest: BatchJobRequest = {
      jobs: jobs.filter(job => job.laserText), // Only include filled jobs
      site
    };

    setIsSubmitting(true);
    try {
      const response = await runBatchJobs(batchRequest);
      
      if (response.success) {
        onNotification('success', `Batch of ${batchRequest.jobs.length} jobs started! Redirecting to track progress...`);
        
        // Reset form
        setJobs([{ laserText: '' }]);
        
        // Redirect to overview page to track progress after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        onNotification('error', response.message || 'Batch execution failed');
      }
    } catch (error) {
      console.error('Batch job error:', error);
      onNotification('error', error instanceof Error ? error.message : 'Failed to execute batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-gradient p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
          <Package className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Batch Job Builder</h2>
          <p className="text-green-600">Compose up to 5 jobs for efficient batch processing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Site Selection */}
        <div>
          <label htmlFor="batch-site" className="block text-sm font-semibold text-gray-700 mb-2">
            Target Site (All Jobs) *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              id="batch-site"
              value={site}
              onChange={(e) => setSite(e.target.value as 'JOB_POS1' | 'JOB_POS2')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="JOB_POS1">JOB_POS1 (12.0, 8.0)</option>
              <option value="JOB_POS2">JOB_POS2 (15.0, -6.0)</option>
            </select>
          </div>
        </div>

        {/* Auto-generated Order Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="text-sm font-medium text-green-800">Order Numbers Auto-Generated</div>
          </div>
          <div className="text-xs text-green-700 mt-1">
            Unique order numbers (B-MMDDHHMM01, B-MMDDHHMM02, etc.) will be generated automatically for each job
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Jobs ({jobs.length}/5)</h3>
            <button
              type="button"
              onClick={addJob}
              disabled={jobs.length >= 5}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                jobs.length < 5
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Add Job</span>
            </button>
          </div>

          {jobs.map((job, index) => {
            const validation = getJobValidation(index);

            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-700">Job {index + 1}</h4>
                    <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Auto: B-MMDDHHMM{(index + 1).toString().padStart(2, '0')}
                    </div>
                  </div>
                  {jobs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeJob(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div>
                  {/* Laser Text */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Engraving Text *
                    </label>
                    <div className="relative">
                      <Type className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={job.laserText}
                        onChange={(e) => updateJob(index, 'laserText', e.target.value)}
                        placeholder="Text to engrave"
                        maxLength={50}
                        className={`w-full pl-8 pr-12 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 transition-colors ${
                          job.laserText === ''
                            ? 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                            : validation.laserText.valid
                            ? 'border-green-500 focus:ring-green-500'
                            : 'border-red-500 focus:ring-red-500'
                        }`}
                      />
                      <div className="absolute right-2 top-2 text-xs text-gray-500">
                        {job.laserText.length}/50
                      </div>
                    </div>
                    {job.laserText && (
                      <div className={`mt-1 text-xs ${validation.laserText.valid ? 'text-green-600' : 'text-red-600'}`}>
                        {validation.laserText.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isBatchValid || isSubmitting}
          className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 ${
            isBatchValid && !isSubmitting
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Executing Batch...</span>
            </>
          ) : (
            <>
              <Package className="h-5 w-5" />
              <span>Execute Batch ({jobs.filter(j => j.orderNo && j.laserText).length} jobs)</span>
            </>
          )}
        </button>
      </form>

      {/* Batch Preview */}
      {isBatchValid && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Batch Preview</h4>
          <div className="text-sm text-green-700 space-y-2">
            <div><span className="font-medium">Site:</span> {site}</div>
            <div><span className="font-medium">Jobs:</span> {jobs.filter(j => j.laserText).length}</div>
            <div><span className="font-medium">Mode:</span> Batch processing (one round-trip)</div>
            <div className="space-y-1 pl-4 border-l-2 border-green-300">
              {jobs.filter(j => j.laserText).map((job, i) => (
                <div key={i} className="text-xs">
                  B-MMDDHHMM{(i + 1).toString().padStart(2, '0')}: "{job.laserText}"
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}