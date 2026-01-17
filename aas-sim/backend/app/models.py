"""Pydantic models for AAS simulation"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Enums for validation
class OperationMode(str, Enum):
    IDLE = "Idle"
    RUNNING = "Running"
    ERROR = "Error"

class OrderType(str, Enum):
    LASER_ENGRAVING = "LaserEngraving"
    TRANSPORT = "Transport"

class OrderState(str, Enum):
    CREATED = "Created"
    IN_PROCESS = "InProcess"
    DONE = "Done"
    ERROR = "Error"

class BillingStatus(str, Enum):
    OPEN = "Open"
    BILLED = "Billed"
    WAIVED = "Waived"

# AAS SubModel: Status
class StatusModel(BaseModel):
    productionProgress: int = Field(..., ge=0, le=100, description="Progress 0-100%")
    operationMode: OperationMode
    heartbeatCounter: int = Field(..., ge=0)
    heartbeatTimestamp: str = Field(..., description="ISO8601 timestamp")

# AAS SubModel: Order
class OrderModel(BaseModel):
    orderNo: str
    orderType: OrderType
    laserText: Optional[str] = None
    transportRequired: bool
    orderState: OrderState
    lastChangeAt: str = Field(..., description="ISO8601 timestamp")

# AAS SubModel: Pose
class PoseModel(BaseModel):
    posX: float
    posY: float
    orientation: float

# AAS SubModel: Operational Data
class OperationalDataModel(BaseModel):
    status: StatusModel
    order: OrderModel
    pose: PoseModel

# AAS SubModel: Usage Billing (Engraver)
class EngraverBillingModel(BaseModel):
    currency: str = "EUR"
    billingStatus: BillingStatus
    orderRef: Optional[str] = None
    lastBilledAt: Optional[str] = None
    lastUpdated: str
    energyConsumed: float = Field(..., ge=0, description="kWh")
    emissionFactor: float = Field(..., ge=0, description="gCO2e/kWh")
    carbonEmissions: float = Field(..., ge=0, description="g")
    costPerEnergyUnit: float = Field(..., ge=0, description="EUR/kWh")
    usageCost: float = Field(..., ge=0, description="EUR")

# AAS SubModel: Usage Billing (AGV)
class AGVBillingModel(BaseModel):
    currency: str = "EUR"
    billingStatus: BillingStatus
    orderRef: Optional[str] = None
    lastBilledAt: Optional[str] = None
    lastUpdated: str
    distanceTraveled: float = Field(..., ge=0, description="meters (billed legs only)")
    costPerMeter: float = Field(..., ge=0, description="EUR/m")
    usageCost: float = Field(..., ge=0, description="EUR")

# Complete Device Models
class EngraverModel(BaseModel):
    deviceId: str
    deviceType: str = "Engraver"
    operationalData: OperationalDataModel
    usageBilling: EngraverBillingModel

class AGVModel(BaseModel):
    deviceId: str
    deviceType: str = "AGV"
    operationalData: OperationalDataModel
    usageBilling: AGVBillingModel

# Request/Response Models
class EnqueueJobRequest(BaseModel):
    orderNo: str = Field(..., min_length=1)
    laserText: str = Field(..., min_length=1)
    site: str = Field(default="JOB_POS1")

class RunCycleRequest(BaseModel):
    site: str = Field(default="JOB_POS1")
    maxJobs: Optional[int] = None

class CycleSummaryResponse(BaseModel):
    site: str
    jobsProcessed: List[str]
    agvBilledMeters: float
    agvCostEUR: float
    engraverEnergyKWh: float
    engraverCO2g: float
    engraverCostEUR: float
    combinedCostEUR: float
    orderRef: str
    startedAt: str
    endedAt: str

# Configuration Models
class EngraverConfigModel(BaseModel):
    emissionFactor_g_per_kWh: Optional[float] = None
    costPerEnergyUnit_EUR_per_kWh: Optional[float] = None
    baseIdle_kWh: Optional[float] = None
    k_laser_kWh_per_sec_at_power1: Optional[float] = None
    default_powerPreset: Optional[str] = None
    seconds_per_letter: Optional[float] = None

class AGVConfigModel(BaseModel):
    costPerMeter_EUR: Optional[float] = None
    speed_m_per_s: Optional[float] = None

class ConfigUpdateRequest(BaseModel):
    currency: Optional[str] = None
    engraver: Optional[EngraverConfigModel] = None
    agv: Optional[AGVConfigModel] = None
    progress_step: Optional[int] = None
    poll_interval_s: Optional[float] = None

# History Models
class RunHistoryModel(BaseModel):
    runId: str
    site: str
    startedAt: str
    endedAt: Optional[str] = None
    status: str  # running, completed, error
    jobsProcessed: List[str]
    cycleSummary: Optional[CycleSummaryResponse] = None
    configSnapshot: Dict[str, Any]
    error: Optional[str] = None

# Queue Models
class QueueJobModel(BaseModel):
    orderNo: str
    laserText: str
    site: str

class QueueResponse(BaseModel):
    queue: List[QueueJobModel]
    length: int

# Combined Billing Response
class CombinedBillingResponse(BaseModel):
    engraver: Dict[str, Any]
    agv: Dict[str, Any]
    combined_cost_eur: float
    currency: str