'use client';

import React from 'react';

interface QueueTableProps {
  className?: string;
}

export default function QueueTable({ className }: QueueTableProps) {
  return (
    <div className={`card ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Queue</h3>
      <div className="text-gray-500">Queue Table Component</div>
    </div>
  );
}