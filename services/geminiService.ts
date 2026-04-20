
import { auth } from "../firebase";
import { Appointment, Client } from "../types";

export interface GroundingLink {
  uri: string;
  title: string;
}

export class GeminiAssistant {
  private async fetchAI(endpoint: string, body: any) {
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required");
    
    const idToken = await user.getIdToken();
    const response = await fetch(`/api/ai/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "AI Service failure");
    }

    return await response.json();
  }

  async answerClientQuestion(question: string, serviceName: string, businessName: string) {
    try {
      const data = await this.fetchAI('answer-question', { question, serviceName, businessName });
      return data.answer;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "I'm here to ensure your experience is seamless. Please feel free to book a session and we can discuss all your questions in detail.";
    }
  }

  async getStrategicGrowthAdvice(appointments: Appointment[]) {
    try {
      const data = await this.fetchAI('growth-advice', { appointments });
      return data.advice;
    } catch (error) {
      return "Focus on high-value client retention this week.";
    }
  }

  async analyzeSchedule(appointments: Appointment[], clients: Client[], query: string) {
    try {
      // Get location for grounding
      let latLng = { latitude: 32.0853, longitude: 34.7818 }; 
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch (e) { /* ignore */ }

      const data = await this.fetchAI('analyze-schedule', { appointments, query, latLng });
      return { text: data.analysis, links: data.links || [] };
    } catch (error) {
      console.error("Gemini Error:", error);
      return { text: "Strategic core temporarily offline.", links: [] };
    }
  }

  async generateMeetingBrief(appointment: Appointment) {
    try {
      const data = await this.fetchAI('meeting-brief', { appointment });
      return data.brief;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Briefing unavailable. Focus on active listening and strategic alignment.";
    }
  }

  async draftReminder(appointment: Appointment, businessName: string) {
    try {
      const data = await this.fetchAI('draft-reminder', { appointment, businessName });
      return data.draft;
    } catch (error) {
      console.error("Gemini Error:", error);
      return `Friendly reminder of your ${appointment.service} session at ${businessName}.`;
    }
  }

  async getSummary(appointments: Appointment[]) {
    try {
      const data = await this.fetchAI('summary', { appointments });
      return data.summary;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Operations are steady.";
    }
  }
}

export const geminiAssistant = new GeminiAssistant();
