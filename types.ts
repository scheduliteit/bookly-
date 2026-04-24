
export type Currency = 'ILS' | 'USD' | 'EUR' | 'GBP';

export interface User {
  id: string;
  email: string;
  name: string;
  businessName: string;
  businessCategory?: string;
  services: Service[];
  currency: Currency;
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
  createdAt?: string; // ISO string for trial tracking
  timezone?: string;
  loginCount?: number;
  lastLoginAt?: string;
  lastSeenAt?: string;
  googleCalendarTokens?: any;
  outlookCalendarTokens?: any;
  language?: string;
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

export type LocationType = 'online' | 'office' | 'phone' | 'zoom';

export interface Service {
  name: string;
  price: number;
  duration: number; // minutes
  description?: string;
  bufferTime?: number; // minutes after appointment
  color?: string;
  locationType?: LocationType;
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
  locationType?: LocationType;
  meetingLink?: string;
  clientTimezone?: string;
  businessTimezone?: string;
}

export interface BusinessStats {
  totalRevenue: number;
  completedAppointments: number;
  pendingRequests: number;
  clientGrowth: number;
  // New traffic and user engagement metrics
  totalLogins: number;
  totalSignups: number;
  currentlyOnline: number;
  topRegions: { country: string; users: number; code: string }[];
}
