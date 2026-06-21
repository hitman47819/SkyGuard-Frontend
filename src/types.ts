export type ActiveTab = 'features' | 'technology' | 'contact' | 'dashboard' | 'not-found';

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
