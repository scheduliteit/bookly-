
import { Appointment, Client } from '../types';

const KEYS = {
  APPOINTMENTS: 'easybookly_appointments',
  CLIENTS: 'easybookly_clients',
  SERVICES: 'easybookly_services',
  BUSINESS: 'easybookly_business_config',
  SUBSCRIPTION: 'easybookly_subscription_plan'
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
