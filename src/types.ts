export type ActiveTab = 'features' | 'technology' | 'contact' | 'dashboard' | 'segments' | 'users' | 'invite' | 'not-found';

export interface DroneTarget {
  id: string;
  name: string;
  azimuth: number; // degrees
  elevation: number; // degrees
  range: number; // km
  signalStrength: number; // percentage
  speed: number; // km/h
  altitude: number; // meters
  status: 'tracking' | 'intercepted' | 'lost' | 'standby';
  threatLevel: 'low' | 'medium' | 'high';
  classification: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  module: 'SPECTRUM' | 'OPTICAL' | 'TRIANGULATION' | 'C2_SYSTEM' | 'AI_ADVISORY' | 'COUNTER';
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
}

export interface RFBandInfo {
  name: string;
  frequency: string;
  signalStrength: number;
  status: 'active' | 'scanning' | 'alert' | 'jammed';
  load: number;
}

/* ---------- SEGMENTS ---------- */

export interface Segment {
  id: number;
  segmentNumber: number;
  packetId: number;
  startTime: string;
  endTime: string;
}

export interface SegmentCreateDto {
  segmentNumber: number;
  packetId: number;
  startTime: string;
  endTime: string;
}

export interface SegmentUpdateDto {
  segmentNumber?: number;
  packetId?: number;
  startTime?: string;
  endTime?: string;
}

/* ---------- USERS ---------- */

export type UserRole = 1 | 2 | 3;

export interface User {
  id: number;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
  userrole: UserRole;
  userImage?: string | null;
  createdAt?: string;
}

export interface UpdateUserRequest {
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  userPhone?: string;
  userrole?: UserRole;
}

/* ---------- ANALYTICS ---------- */

export interface DashboardStats {
  totalAIResults: number;
  totalDroneDetections: number;
  uniqueDroneTypes: number;
  averageConfidence: number;
  lastDetectionTime: string | null;
}

export interface TimelinePoint {
  date: string;
  count: number;
}

export interface DroneTypeDistribution {
  droneTypeId: number;
  droneTypeName: string;
  count: number;
  percentage: number;
}

export interface HourlyStat {
  hour: number;
  count: number;
}

export interface ConfidenceStat {
  range: string;
  count: number;
}

export interface RecentDetection {
  id: number;
  name: string;
  detectedAt: string;
  confidence: number;
  droneTypeName: string;
}

/* ---------- API RESPONSE ---------- */

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors: string[] | null;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
}
