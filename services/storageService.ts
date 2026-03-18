
import { Appointment, Client } from '../types';

const KEYS = {
  APPOINTMENTS: 'bookly_appointments',
  CLIENTS: 'bookly_clients',
  SERVICES: 'bookly_services',
  BUSINESS: 'bookly_business_config',
  SUBSCRIPTION: 'bookly_subscription_plan'
};

export const storageService = {
  getAppointments: (): Appointment[] => {
    const data = localStorage.getItem(KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : [];
  },
  saveAppointments: (data: Appointment[]) => {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(data));
  },
  getClients: (): Client[] => {
    const data = localStorage.getItem(KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },
  saveClients: (data: Client[]) => {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(data));
  },
  getSubscription: (): 'basic' | 'premium' => {
    return (localStorage.getItem(KEYS.SUBSCRIPTION) as any) || 'basic';
  },
  saveSubscription: (plan: 'basic' | 'premium') => {
    localStorage.setItem(KEYS.SUBSCRIPTION, plan);
  }
};
