'use client';

import React, { useState } from 'react';
import { Play, Plus, Loader2 } from 'lucide-react';

interface JobInputFormProps {
  onSubmit: (job: {
    orderNo: string;
    laserText: string;
    site: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export default function JobInputForm({ onSubmit, isSubmitting = false }: JobInputFormProps) {
  const [formData, setFormData] = useState({
    orderNo: '',
    laserText: '',
    site: 'JOB_POS1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNo || !formData.laserText) return;
    
    await onSubmit(formData);
    
    // Reset form after successful submission
    setFormData({
      orderNo: '',
      laserText: '',
      site: 'JOB_POS1'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="card-gradient">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Plus className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Add New Laser Job</h3>
          <p className="text-sm text-gray-600">Submit a job to start the billing process</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Number */}
        <div>
          <label htmlFor="orderNo" className="block text-sm font-medium text-gray-700 mb-2">
            Order Number *
          </label>
          <input
            type="text"
            id="orderNo"
            name="orderNo"
            value={formData.orderNo}
            onChange={handleChange}
            placeholder="e.g., ORD-001"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Laser Text */}
        <div>
          <label htmlFor="laserText" className="block text-sm font-medium text-gray-700 mb-2">
            Text to Engrave *
          </label>
          <input
            type="text"
            id="laserText"
            name="laserText"
            value={formData.laserText}
            onChange={handleChange}
            placeholder="e.g., HELLO WORLD"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Site Location */}
        <div>
          <label htmlFor="site" className="block text-sm font-medium text-gray-700 mb-2">
            Job Site
          </label>
          <select
            id="site"
            name="site"
            value={formData.site}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            disabled={isSubmitting}
          >
            <option value="JOB_POS1">Job Position 1</option>
            <option value="JOB_POS2">Job Position 2</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.orderNo || !formData.laserText}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Adding Job...</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              <span>Add Job to Queue</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}