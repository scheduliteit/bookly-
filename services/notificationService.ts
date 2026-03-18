
import { Appointment } from '../types';

export const notificationService = {
  async sendReminder(appointment: Appointment, message: string): Promise<{success: boolean, sid: string}> {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment, message })
    });
    return res.json();
  }
};
