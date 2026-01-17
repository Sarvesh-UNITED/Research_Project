// API functions for Composer operations
export interface DirectJobRequest {
  laserText: string;
  site: 'JOB_POS1' | 'JOB_POS2';
}

export interface BatchJobItem {
  laserText: string;
}

export interface BatchJobRequest {
  jobs: BatchJobItem[];
  site: 'JOB_POS1' | 'JOB_POS2';
}

export interface ComposerResponse<T = any> {
  success: boolean;
  message: string;
  result?: T;
  results?: T[];
}

export interface ValidationResponse {
  orderNo: string;
  valid: boolean;
  format: string;
  message: string;
}

const API_BASE = '/api/v1/composer';

// Direct job execution
export async function runDirectJob(request: DirectJobRequest): Promise<ComposerResponse> {
  const response = await fetch(`${API_BASE}/direct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Batch job execution
export async function runBatchJobs(request: BatchJobRequest): Promise<ComposerResponse> {
  const response = await fetch(`${API_BASE}/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Scenario 1 execution
export async function runScenario1(): Promise<ComposerResponse> {
  const response = await fetch(`${API_BASE}/scenario1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Scenario 2 execution
export async function runScenario2(): Promise<ComposerResponse> {
  const response = await fetch(`${API_BASE}/scenario2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Order number validation
export async function validateOrderNumber(orderNo: string): Promise<ValidationResponse> {
  const response = await fetch(`${API_BASE}/validate-order/${encodeURIComponent(orderNo)}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

// Client-side validation helpers (order numbers are now auto-generated)

export function validateLaserText(text: string): { valid: boolean; message: string } {
  if (text.length < 1) {
    return { valid: false, message: 'Text cannot be empty' };
  }
  if (text.length > 50) {
    return { valid: false, message: 'Text must be 50 characters or less' };
  }
  return { valid: true, message: 'Valid text length' };
}