
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Appointment, Client } from "../types";

export interface GroundingLink {
  uri: string;
  title: string;
}

export class GeminiAssistant {
  private getAI() {
    // Try to get from process.env first (injected by Vite)
    let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    // If missing, check if we can get it from window.aistudio (for Veo/Gemini 2.5/3 models)
    if (!apiKey || apiKey === '' || apiKey === 'undefined') {
       // In AI Studio Build, the key might be available via process.env.API_KEY if selected via popup
       // But if we are here, it's likely missing.
       throw new Error("API Key is missing. Please ensure GEMINI_API_KEY is set in your environment or selected via the key selection dialog.");
    }
    
    return new GoogleGenAI({ apiKey });
  }

  async answerClientQuestion(question: string, serviceName: string, businessName: string) {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a helpful assistant for ${businessName}. A client is looking at the "${serviceName}" service and asks: "${question}". 
        Answer professionally and concisely in 2 sentences. If you don't know specific details, invite them to book the session to discuss further.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "I'm here to help! Please feel free to book a session and we can discuss all your questions in detail.";
    }
  }

  async analyzeSchedule(appointments: Appointment[], clients: Client[], query: string) {
    const context = `You are the EasyBookly Operations Core. 
    Business Data Context: ${appointments.length} total bookings.
    Schedule Data: ${JSON.stringify(appointments)}.
    Current Date: ${new Date().toISOString().split('T')[0]}.`;

    let latLng = { latitude: 32.0853, longitude: 34.7818 }; 
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) { /* ignore */ }

    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: [{ parts: [{ text: context }, { text: query }] }],
        config: {
          tools: [
            { googleSearch: {} },
            { googleMaps: {} }
          ],
          toolConfig: {
            retrievalConfig: { latLng }
          },
          temperature: 0.2,
        }
      });

      const groundingLinks: GroundingLink[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      chunks.forEach((chunk: any) => {
        if (chunk.web) groundingLinks.push({ uri: chunk.web.uri, title: chunk.web.title });
        if (chunk.maps) groundingLinks.push({ uri: chunk.maps.uri, title: chunk.maps.title });
      });

      let text = response.text || "";
      if (text.length < 5) {
         text = "Based on your schedule, operations are proceeding as planned.";
      }

      return { text, links: groundingLinks };
    } catch (error) {
      console.error("Gemini Error:", error);
      return { text: "Strategic core temporarily offline.", links: [] };
    }
  }

  async generateMeetingBrief(appointment: Appointment) {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this appointment and generate a strategic briefing. 
        Client: ${appointment.clientName}
        Service: ${appointment.service}
        Note: ${appointment.status} session.
        Provide: 1. Client Psychology (What they really want), 2. Three Strategic Questions to Ask, 3. Success Metric for this meeting. 
        Format as clear sections. Keep it concise and professional.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Briefing unavailable. Focus on active listening and strategic alignment.";
    }
  }

  async draftReminder(appointment: Appointment, businessName: string) {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: `Draft a friendly, professional one-sentence appointment reminder for ${appointment.clientName} for their ${appointment.service} session at ${businessName} on ${appointment.date} at ${appointment.time}.` }] },
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return `Friendly reminder of your ${appointment.service} session at ${businessName}.`;
    }
  }

  async getSummary(appointments: Appointment[]) {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize business performance for these appointments: ${JSON.stringify(appointments)}. 2 sentences max. Highlight if revenue is high.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Operations are steady.";
    }
  }
}

export const geminiAssistant = new GeminiAssistant();
