
import { Appointment, Client, Service } from './types';

export const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Noa Cohen', email: 'noa@cohen.co.il', phone: '054-123-4567', lastVisit: '2024-05-10', notes: 'Local client, prefers Hebrew.' },
  { id: 'public-2', name: 'James Wilson', email: 'james@london.uk', phone: '+44 20 7946 0958', lastVisit: '2024-05-12', notes: 'International client from London.' },
  { id: '3', name: 'Itay Levi', email: 'itay@levi.io', phone: '052-987-6543', lastVisit: '2024-05-14' },
  { id: 'public-4', name: 'Sophia Chen', email: 'sophia@singapore.sg', phone: '+65 6789 0123' },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', clientId: '1', clientName: 'Noa Cohen', service: '30 Minute Meeting', date: '2024-05-20', time: '09:00', duration: 30, status: 'confirmed', price: 150 },
  { id: 'a2', clientId: 'public-2', clientName: 'James Wilson', service: '60 Minute Meeting', date: '2024-05-20', time: '14:30', duration: 60, status: 'confirmed', price: 300 },
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
