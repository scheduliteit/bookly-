
import { Appointment, Client, Service } from './types';

export const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Alex Thompson', email: 'alex@thompson.com', phone: '+1 212 555 0123', lastVisit: '2024-05-10', notes: 'Prefers afternoon sessions.' },
  { id: 'public-2', name: 'James Wilson', email: 'james@london.uk', phone: '+44 20 7946 0958', lastVisit: '2024-05-12', notes: 'International client from London.' },
  { id: '3', name: 'Elena Rodriguez', email: 'elena@design.es', phone: '+34 912 345 678', lastVisit: '2024-05-14' },
  { id: 'public-4', name: 'Sophia Chen', email: 'sophia@singapore.sg', phone: '+65 6789 0123' },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', userId: 'mock-user', clientId: '1', clientName: 'Alex Thompson', service: '30 Minute Meeting', date: '2024-05-20', time: '09:00', duration: 30, status: 'confirmed', price: 150 },
  { id: 'a2', userId: 'mock-user', clientId: 'public-2', clientName: 'James Wilson', service: '60 Minute Meeting', date: '2024-05-20', time: '14:30', duration: 60, status: 'confirmed', price: 300 },
];

export const SERVICES: Service[] = [
  { 
    name: '15 Minute Meeting', 
    price: 75, 
    duration: 15, 
    description: 'Quick check-in or discovery call.', 
    bufferTime: 5,
    color: '#006bff'
  },
  { 
    name: '30 Minute Meeting', 
    price: 150, 
    duration: 30, 
    description: 'Standard session for consulting or review.', 
    bufferTime: 10,
    color: '#10b981'
  },
  { 
    name: '60 Minute Meeting', 
    price: 300, 
    duration: 60, 
    description: 'Deep dive strategic session.', 
    bufferTime: 15,
    color: '#f59e0b'
  },
];
