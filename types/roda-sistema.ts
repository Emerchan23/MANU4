export type RotationDirection = 'clockwise' | 'counterclockwise' | 'stopped';
export type RotationSpeed = 'slow' | 'medium' | 'fast' | 'custom';

export interface WheelState {
  id: string;
  name: string;
  direction: RotationDirection;
  speed: RotationSpeed;
  customSpeed?: number; // RPM
  angle: number; // Current rotation angle in degrees
  isActive: boolean;
  lastUpdated: Date;
}

export interface WheelConfig {
  diameter: number; // in meters
  maxSpeed: number; // max RPM
  minSpeed: number; // min RPM
  acceleration: number; // RPM per second
}

export interface RotationLog {
  id: string;
  wheelId: string;
  action: 'start' | 'stop' | 'speed_change' | 'direction_change';
  timestamp: Date;
  userId: string;
  details: string;
}
