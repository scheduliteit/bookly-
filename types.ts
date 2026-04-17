
export interface User {
  id: string;
  email: string;
  name: string;
  businessName: string;
  businessCategory?: string;
  services: Service[];
  currency: 'ILS' | 'USD' | 'EUR' | 'GBP';
  workingHours: {
    [key: string]: {
      start: string;
      end: string;
      active: boolean;
    };
  };
  legalData: {
    privacyPolicy: string;
    termsOfService: string;
    gdprStrict: boolean;
  };
  onboardingCompleted: boolean;
  connectedApps?: string[];
  subscriptionPlan?: 'basic' | 'premium';
  role?: 'admin' | 'user';
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit?: string;
  notes?: string;
  userId?: string;
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
  userId: string;
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
