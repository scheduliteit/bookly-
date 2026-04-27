
import { auth } from "../firebase";
import { Appointment, Client } from "../types";

export interface GroundingLink {
  uri: string;
  title: string;
}

export class GeminiAssistant {
  private async callBackendAI(endpoint: string, body: any) {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/ai/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`[GEMINI] Backend Error (${endpoint}):`, error);
      throw error;
    }
  }

  async answerClientQuestion(question: string, serviceName: string, businessName: string) {
    try {
      const data = await this.callBackendAI('answer-question', { question, context: { serviceName, businessName } });
      return data.answer;
    } catch (error) {
      return "I'm here to ensure your experience is seamless. Please feel free to book a session and we can discuss all your questions in detail.";
    }
  }

  async getStrategicGrowthAdvice(appointments: Appointment[]) {
    try {
      const data = await this.callBackendAI('growth-advice', { stats: { appointments: appointments.length } });
      return data.advice;
    } catch (error) {
      return "Focus on high-value client retention this week.";
    }
  }

  async analyzeSchedule(appointments: any[], clients: Client[], query: string) {
    try {
      const data = await this.callBackendAI('analyze-schedule', { appointments, query });
      return { text: data.text, links: data.links || [] };
    } catch (error: any) {
      return { text: `Strategic core temporarily offline: ${error.message || "Unknown error"}`, links: [] };
    }
  }

  async generateMeetingBrief(appointment: Appointment) {
    try {
      const data = await this.callBackendAI('meeting-brief', { appointment });
      return data.brief;
    } catch (error) {
      return "Briefing unavailable. Focus on active listening and strategic alignment.";
    }
  }

  async draftReminder(appointment: Appointment, businessName: string) {
    try {
      const data = await this.callBackendAI('draft-reminder', { appointment, businessName });
      return data.draft;
    } catch (error) {
      return `Friendly reminder of your ${appointment.service} session at ${businessName}.`;
    }
  }

  async getSummary(appointments: Appointment[]) {
    try {
      const data = await this.callBackendAI('summary', { appointments });
      return data.summary;
    } catch (error) {
      return "Operations are steady.";
    }
  }
}

export const geminiAssistant = new GeminiAssistant();
