
import { GoogleGenAI } from "@google/genai";
import { auth } from "../firebase";
import { Appointment, Client } from "../types";

export interface GroundingLink {
  uri: string;
  title: string;
}

export class GeminiAssistant {
  private ai: any = null;

  private getAI() {
    if (!this.ai) {
      // Accessing environment variable through multiple possible paths for AI Studio compatibility
      const apiKey = 
        (typeof process !== 'undefined' ? (process.env?.API_KEY || process.env?.GEMINI_API_KEY) : undefined) || 
        (window as any).GEMINI_API_KEY || 
        (window as any).API_KEY ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY ||
        (import.meta as any).env?.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        console.warn("[GEMINI] Warning: API Key missing from environment.");
        throw new Error("Neural Link Offline: API Key not found. Please ensure your intelligence core is configured.");
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  private async callGemini(prompt: string, model: string = 'gemini-flash-latest') {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      
      if (!response || !response.text) {
        throw new Error("Empty response from sentinel.");
      }
      
      return response.text;
    } catch (error: any) {
      console.error("[GEMINI] Frontend Error:", error);
      throw error;
    }
  }

  async answerClientQuestion(question: string, serviceName: string, businessName: string) {
    try {
      const prompt = `You are the High-Performance Virtual Concierge for ${businessName}. A client is inquiring about the "${serviceName}" experience: "${question}". Answer with extreme professionalism, warmth, and a touch of luxury. 2-3 sentences.`;
      return await this.callGemini(prompt);
    } catch (error) {
      return "I'm here to ensure your experience is seamless. Please feel free to book a session and we can discuss all your questions in detail.";
    }
  }

  async getStrategicGrowthAdvice(appointments: Appointment[]) {
    try {
      const sanitized = appointments?.map((a: any) => ({ service: a.service, date: a.date, time: a.time }));
      const prompt = `
        You are a high-level Strategic Business Growth Consultant. 
        Analyze these appointments: ${JSON.stringify(sanitized)}.
        Identify patterns and a bold actionable strategy.
        Response MUST be 1 sentence, high-energy.
      `;
      return await this.callGemini(prompt);
    } catch (error) {
      return "Focus on high-value client retention this week.";
    }
  }

  async analyzeSchedule(appointments: Appointment[], clients: Client[], query: string) {
    try {
      const sanitized = appointments?.map((a: any) => ({ service: a.service, date: a.date, time: a.time, status: a.status }));
      const prompt = `Analyze: ${JSON.stringify(sanitized)}. Query: ${query}`;
      const text = await this.callGemini(prompt);
      return { text, links: [] };
    } catch (error: any) {
      return { text: `Strategic core temporarily offline: ${error.message || "Unknown error"}`, links: [] };
    }
  }

  async generateMeetingBrief(appointment: Appointment) {
    try {
      const prompt = `Briefing for ${appointment.clientName} regarding ${appointment.service}.`;
      return await this.callGemini(prompt);
    } catch (error) {
      return "Briefing unavailable. Focus on active listening and strategic alignment.";
    }
  }

  async draftReminder(appointment: Appointment, businessName: string) {
    try {
      const prompt = `Draft reminder for ${appointment.clientName} at ${businessName}. One sentence.`;
      return await this.callGemini(prompt);
    } catch (error) {
      return `Friendly reminder of your ${appointment.service} session at ${businessName}.`;
    }
  }

  async getSummary(appointments: Appointment[]) {
    try {
      const prompt = `Summarize: ${JSON.stringify(appointments)}. 2 sentences max.`;
      return await this.callGemini(prompt);
    } catch (error) {
      return "Operations are steady.";
    }
  }
}

export const geminiAssistant = new GeminiAssistant();
