// API wrapper functions with SWR hooks
import useSWR from 'swr';
import {
  EngraverModel,
  AGVModel,
  QueueResponse,
  ConfigModel,
  CoordsModel,
  RunHistoryModel,
  CombinedBillingResponse,
  EnqueueJobRequest,
  CycleStatusResponse,
  CycleSummaryResponse,
  SSEEventData
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// API Functions
export const api = {
  // Device endpoints
  async getDevices() {
    const response = await fetch(`${BASE_URL}/api/v1/aas/devices`);
    return response.json();
  },

  async getDeviceStatus(device: 'engraver' | 'agv') {
    const response = await fetch(`${BASE_URL}/api/v1/aas/${device}/operational/status`);
    return response.json();
  },

  async getDeviceOrder(device: 'engraver' | 'agv') {
    const response = await fetch(`${BASE_URL}/api/v1/aas/${device}/operational/order`);
    return response.json();
  },

  async getDevicePose(device: 'engraver' | 'agv') {
    const response = await fetch(`${BASE_URL}/api/v1/aas/${device}/operational/pose`);
    return response.json();
  },

  async getDeviceBilling(device: 'engraver' | 'agv') {
    const response = await fetch(`${BASE_URL}/api/v1/aas/${device}/billing`);
    return response.json();
  },

  async getCombinedBilling(): Promise<CombinedBillingResponse> {
    const response = await fetch(`${BASE_URL}/api/v1/aas/combined-billing`);
    return response.json();
  },

  // Queue endpoints
  async getQueue(): Promise<QueueResponse> {
    const response = await fetch(`${BASE_URL}/api/v1/queue`);
    return response.json();
  },

  async enqueueJob(job: EnqueueJobRequest) {
    const response = await fetch(`${BASE_URL}/api/v1/queue/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    return response.json();
  },

  async removeJob(orderNo: string) {
    const response = await fetch(`${BASE_URL}/api/v1/queue/${orderNo}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async clearQueue() {
    const response = await fetch(`${BASE_URL}/api/v1/queue`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Cycle endpoints
  async runCycle(site: string, maxJobs: string = 'all') {
    const response = await fetch(`${BASE_URL}/api/v1/cycle/run?site=${site}&maxJobs=${maxJobs}`, {
      method: 'POST',
    });
    return response.json();
  },

  async getCycleStatus(): Promise<CycleStatusResponse> {
    const response = await fetch(`${BASE_URL}/api/v1/cycle/status`);
    return response.json();
  },

  async runScenario1() {
    const response = await fetch(`${BASE_URL}/api/v1/cycle/scenario1`, {
      method: 'POST',
    });
    return response.json();
  },

  async runScenario2() {
    const response = await fetch(`${BASE_URL}/api/v1/cycle/scenario2`, {
      method: 'POST',
    });
    return response.json();
  },

  // Configuration endpoints
  async getConfig() {
    const response = await fetch(`${BASE_URL}/api/v1/config`);
    return response.json();
  },

  async updateConfig(updates: Partial<ConfigModel>) {
    const response = await fetch(`${BASE_URL}/api/v1/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  async resetConfig() {
    const response = await fetch(`${BASE_URL}/api/v1/config/reset`, {
      method: 'POST',
    });
    return response.json();
  },

  // History endpoints
  async getHistory(limit?: number) {
    const url = limit
      ? `${BASE_URL}/api/v1/history?limit=${limit}`
      : `${BASE_URL}/api/v1/history`;
    const response = await fetch(url);
    return response.json();
  },

  async getRunDetails(runId: string): Promise<RunHistoryModel> {
    const response = await fetch(`${BASE_URL}/api/v1/history/${runId}`);
    return response.json();
  },

  async exportHistoryJSON(limit?: number) {
    const url = limit
      ? `${BASE_URL}/api/v1/history/export/json?limit=${limit}`
      : `${BASE_URL}/api/v1/history/export/json`;
    window.open(url, '_blank');
  },

  async exportHistoryCSV(limit?: number) {
    const url = limit
      ? `${BASE_URL}/api/v1/history/export/csv?limit=${limit}`
      : `${BASE_URL}/api/v1/history/export/csv`;
    window.open(url, '_blank');
  },

  async clearHistory() {
    const response = await fetch(`${BASE_URL}/api/v1/history`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// SWR Hooks
import React from 'react';

export const useDevices = (refreshInterval = 2000) => {
  return useSWR(`${BASE_URL}/api/v1/aas/devices`, fetcher, {
    refreshInterval,
  });
};

export const useDeviceStatus = (device: 'engraver' | 'agv', refreshInterval = 1000) => {
  return useSWR(`${BASE_URL}/api/v1/aas/${device}/operational/status`, fetcher, {
    refreshInterval,
  });
};

export const useQueue = (refreshInterval = 2000) => {
  return useSWR<QueueResponse>(`${BASE_URL}/api/v1/queue`, fetcher, {
    refreshInterval,
  });
};

export const useCombinedBilling = (refreshInterval = 2000) => {
  return useSWR<CombinedBillingResponse>(`${BASE_URL}/api/v1/aas/combined-billing`, fetcher, {
    refreshInterval,
  });
};

export const useConfig = () => {
  return useSWR(`${BASE_URL}/api/v1/config`, fetcher);
};

export const useHistory = (limit?: number) => {
  const url = limit
    ? `${BASE_URL}/api/v1/history?limit=${limit}`
    : `${BASE_URL}/api/v1/history`;
  return useSWR(url, fetcher);
};

export const useCycleStatus = (refreshInterval = 1000) => {
  return useSWR<CycleStatusResponse>(`${BASE_URL}/api/v1/cycle/status`, fetcher, {
    refreshInterval,
  });
};

export const useIndividualJobs = (refreshInterval = 3000) => {
  return useSWR(`${BASE_URL}/api/v1/aas/individual-jobs`, fetcher, {
    refreshInterval,
  });
};

// SSE Hook
export const useSSE = (onMessage?: (data: SSEEventData) => void) => {
  const [data, setData] = React.useState<SSEEventData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    const eventSource = new EventSource(`${BASE_URL}/api/v1/events`);

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const eventData: SSEEventData = JSON.parse(event.data);
        setData(eventData);
        if (onMessage) {
          onMessage(eventData);
        }
      } catch (err) {
        setError('Failed to parse SSE data');
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      setError('SSE connection error');
    };

    return () => {
      eventSource.close();
    };
  }, [onMessage]);

  return { data, error, connected };
};