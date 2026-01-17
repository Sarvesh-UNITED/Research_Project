'use client';

import React, { useState, useEffect } from 'react';
import { Play, MapPin, Type, CheckCircle, AlertCircle } from 'lucide-react';
import { runDirectJob, validateLaserText, type DirectJobRequest } from '../lib/composerApi';

interface DirectFormProps {
  onNotification: (type: 'success' | 'error', message: string) => void;
}

export default function DirectForm({ onNotification }: DirectFormProps) {
  const [formData, setFormData] = useState<DirectJobRequest>({
    laserText: '',
    site: 'JOB_POS1'
  });
  
  const [validation, setValidation] = useState({
    laserText: { valid: false, message: '' }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate fields on change
  useEffect(() => {
    setValidation({
      laserText: validateLaserText(formData.laserText)
    });
  }, [formData.laserText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.laserText.valid) {
      onNotification('error', 'Please enter valid engraving text');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await runDirectJob(formData);
      
      if (response.success) {
        const orderNo = response.orderNo || 'Unknown';
        onNotification('success', `Direct job ${orderNo} started! Redirecting to track progress...`);
        
        // Reset form
        setFormData({
          laserText: '',
          site: 'JOB_POS1'
        });
        
        // Redirect to overview page to track progress after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        onNotification('error', response.message || 'Job execution failed');
      }
    } catch (error) {
      console.error('Direct job error:', error);
      onNotification('error', error instanceof Error ? error.message : 'Failed to execute job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = validation.laserText.valid;

  return (
    <div className="card-gradient p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Play className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Direct Job Execution</h2>
          <p className="text-blue-600">Run a single engraving job immediately</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auto-generated Order Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <div className="text-sm font-medium text-blue-800">Order Number Auto-Generated</div>
          </div>
          <div className="text-xs text-blue-700 mt-1">
            A unique order number will be generated automatically when you submit the job
          </div>
        </div>

        {/* Laser Text */}
        <div>
          <label htmlFor="laserText" className="block text-sm font-semibold text-gray-700 mb-2">
            Engraving Text *
          </label>
          <div className="relative">
            <Type className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              id="laserText"
              type="text"
              value={formData.laserText}
              onChange={(e) => setFormData({ ...formData, laserText: e.target.value })}
              placeholder="Text to engrave"
              maxLength={50}
              className={`w-full pl-10 pr-16 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                formData.laserText === ''
                  ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  : validation.laserText.valid
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-red-500 focus:ring-red-500'
              }`}
            />
            <div className="absolute right-3 top-3 text-xs text-gray-500">
              {formData.laserText.length}/50
            </div>
          </div>
          {formData.laserText && (
            <div className={`mt-1 text-xs ${validation.laserText.valid ? 'text-green-600' : 'text-red-600'}`}>
              {validation.laserText.message}
            </div>
          )}
        </div>

        {/* Site Selection */}
        <div>
          <label htmlFor="site" className="block text-sm font-semibold text-gray-700 mb-2">
            Target Site *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              id="site"
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value as 'JOB_POS1' | 'JOB_POS2' })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="JOB_POS1">JOB_POS1 (12.0, 8.0)</option>
              <option value="JOB_POS2">JOB_POS2 (15.0, -6.0)</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 ${
            isFormValid && !isSubmitting
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Executing Job...</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              <span>Execute Direct Job</span>
            </>
          )}
        </button>
      </form>

      {/* Job Preview */}
      {isFormValid && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Job Preview</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div><span className="font-medium">Order:</span> Auto-generated (D-MMDDHHMM)</div>
            <div><span className="font-medium">Text:</span> "{formData.laserText}"</div>
            <div><span className="font-medium">Site:</span> {formData.site}</div>
            <div><span className="font-medium">Mode:</span> Individual processing (one round-trip)</div>
          </div>
        </div>
      )}
    </div>
  );
}