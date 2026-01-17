// TypeScript types matching backend AAS models

export type OperationMode = 'Idle' | 'Running' | 'Error';
export type OrderType = 'LaserEngraving' | 'Transport';
export type OrderState = 'Created' | 'InProcess' | 'Done' | 'Error';
export type BillingStatus = 'Open' | 'Billed' | 'Waived';

// AAS SubModels - exact field names
export interface StatusModel {
  productionProgress: number; // 0-100
  operationMode: OperationMode;
  heartbeatCounter: number;
  heartbeatTimestamp: string; // ISO8601
}

export interface OrderModel {
  orderNo: string;
  orderType: OrderType;
  laserText: string | null;
  transportRequired: boolean;
  orderState: OrderState;
  lastChangeAt: string; // ISO8601
}

export interface PoseModel {
  posX: number;
  posY: number;
  orientation: number;
}

export interface OperationalDataModel {
  status: StatusModel;
  order: OrderModel;
  pose: PoseModel;
}

export interface EngraverBillingModel {
  currency: string;
  billingStatus: BillingStatus;
  orderRef: string | null;
  lastBilledAt: string | null;
  lastUpdated: string;
  energyConsumed: number; // kWh
  emissionFactor: number; // gCO2e/kWh
  carbonEmissions: number; // g
  costPerEnergyUnit: number; // EUR/kWh
  usageCost: number; // EUR
}

export interface AGVBillingModel {
  currency: string;
  billingStatus: BillingStatus;
  orderRef: string | null;
  lastBilledAt: string | null;
  lastUpdated: string;
  distanceTraveled: number; // meters (billed legs only)
  costPerMeter: number; // EUR/m
  usageCost: number; // EUR
}

export interface EngraverModel {
  deviceId: string;
  deviceType: 'Engraver';
  operationalData: OperationalDataModel;
  usageBilling: EngraverBillingModel;
}

export interface AGVModel {
  deviceId: string;
  deviceType: 'AGV';
  operationalData: OperationalDataModel;
  usageBilling: AGVBillingModel;
}

// API Request/Response Types
export interface EnqueueJobRequest {
  orderNo: string;
  laserText: string;
  site: string;
}

export interface QueueJobModel {
  orderNo: string;
  laserText: string;
  site: string;
}

export interface QueueResponse {
  queue: QueueJobModel[];
  length: number;
}

export interface CycleSummaryResponse {
  site: string;
  jobsProcessed: string[];
  agvBilledMeters: number;
  agvCostEUR: number;
  engraverEnergyKWh: number;
  engraverCO2g: number;
  engraverCostEUR: number;
  combinedCostEUR: number;
  orderRef: string;
  startedAt: string;
  endedAt: string;
}

export interface RunHistoryModel {
  runId: string;
  site: string;
  startedAt: string;
  endedAt: string | null;
  status: string; // running, completed, error
  jobsProcessed: string[];
  cycleSummary: CycleSummaryResponse | null;
  configSnapshot: Record<string, any>;
  error: string | null;
}

export interface CombinedBillingResponse {
  engraver: {
    orderRef: string | null;
    energy_kWh: number;
    co2_g: number;
    cost_eur: number;
  };
  agv: {
    distance_m: number;
    cost_eur: number;
    orderRef: string | null;
  };
  combined_cost_eur: number;
  currency: string;
  billing_source?: 'user_jobs' | 'scenario_jobs' | 'current_cycle';
  jobs_processed?: string[];
  last_updated?: string;
}

export interface ConfigModel {
  currency: string;
  engraver: {
    emissionFactor_g_per_kWh: number;
    costPerEnergyUnit_EUR_per_kWh: number;
    baseIdle_kWh: number;
    k_laser_kWh_per_sec_at_power1: number;
    default_powerPreset: string;
    seconds_per_letter: number;
  };
  agv: {
    costPerMeter_EUR: number;
    speed_m_per_s: number;
  };
  progress_step: number;
  poll_interval_s: number;
}

export interface CoordsModel {
  HOME: [number, number];
  ENGRAVER_DOCK: [number, number];
  JOB_POS1: [number, number];
  JOB_POS2: [number, number];
  [key: string]: [number, number];
}

export interface CycleStatusResponse {
  engraver_mode: OperationMode;
  agv_mode: OperationMode;
  engraver_progress: number;
  agv_progress: number;
  queue_length: number;
  billing_window_active: boolean;
  agv_pose: PoseModel;
}

// SSE Event Data
export interface SSEEventData {
  timestamp: string;
  devices: {
    engraver: {
      status: StatusModel;
      order: OrderModel;
      pose: PoseModel;
      billing: EngraverBillingModel;
    };
    agv: {
      status: StatusModel;
      order: OrderModel;
      pose: PoseModel;
      billing: AGVBillingModel;
    };
  };
  queue: {
    length: number;
    jobs: QueueJobModel[];
  };
  orchestrator: {
    billing_window_active: boolean;
  };
  combined_billing: {
    engraver_cost: number;
    agv_cost: number;
    total_cost: number;
  };
}