
export interface User {
  id: string;
  email: string;
  name: string;
  businessName: string;
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit?: string;
  notes?: string;
}

export interface Service {
  name: string;
  price: number;
  duration: number; // minutes
  description?: string;
  bufferTime?: number; // minutes after appointment
  color?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  service: string;
  date: string; // ISO string
  time: string; // HH:mm
  duration: number; // minutes
  status: AppointmentStatus;
  price: number;
  reminderSent?: boolean;
  reminderTimestamp?: string;
}

export interface BusinessStats {
  totalRevenue: number;
  completedAppointments: number;
  pendingRequests: number;
  clientGrowth: number;
}
