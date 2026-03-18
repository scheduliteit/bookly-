
import { Appointment, Client } from '../types';
import { storageService } from './storageService';

// This service simulates the latency and behavior of a real production backend.
// To move to a real DB, you only need to change the implementation of these functions.

const LATENCY = 600;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getHeaders = () => {
  const user = localStorage.getItem('bookly_user');
  const userId = user ? JSON.parse(user).id : '';
  return {
    'Content-Type': 'application/json',
    'x-user-id': userId
  };
};

export const api = {
  appointments: {
    list: async (): Promise<Appointment[]> => {
      const res = await fetch('/api/appointments', {
        headers: getHeaders()
      });
      return res.json();
    },
    create: async (data: Appointment): Promise<Appointment> => {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      await fetch(`/api/appointments/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
    },
    update: async (data: Appointment): Promise<Appointment> => {
      const res = await fetch(`/api/appointments/${data.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return res.json();
    }
  },
  clients: {
    list: async (): Promise<Client[]> => {
      const res = await fetch('/api/clients', {
        headers: getHeaders()
      });
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      await fetch(`/api/clients/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
    }
  },
  system: {
    checkAvailability: async (date: string): Promise<string[]> => {
      const res = await fetch(`/api/availability?date=${date}`, {
        headers: getHeaders()
      });
      return res.json();
    }
  }
};
