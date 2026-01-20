// types.ts - Core type definitions

export enum Role {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum SlotType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
}

export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum ReservationError {
  FULL = 'FULL',
  DUPLICATE = 'DUPLICATE',
  TOO_LATE = 'TOO_LATE',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export type Result<T, E = ReservationError> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface Reservation {
  id: string;
  userId: string;
  date: Date;
  slot: SlotType;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoworkingSettings {
  id: string;
  totalDesks: number;
  morningStartHour: number;
  morningEndHour: number;
  afternoonStartHour: number;
  afternoonEndHour: number;
  updatedAt: Date;
}
