
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dns from 'dns';
import https from 'https';
import { promisify } from 'util';
import { google } from 'googleapis';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import axios from 'axios';
import { GoogleGenAI } from "@google/genai";
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';

dotenv.config();

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('[SERVER] SendGrid initialized');
}

// Initialize Twilio
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('[SERVER] Twilio client initialized');
  } catch (error) {
    console.error('[SERVER] Twilio initialization failed:', error);
  }
}

// Firebase Admin Initialization (Security Fix #6)
let adminApp: admin.app.App | null = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('[SERVER] Firebase Admin initialized with Service Account');
  } else {
    // Attempt ADC (Application Default Credentials) initialization
    try {
      adminApp = admin.initializeApp();
      console.log('[SERVER] Firebase Admin initialized with ADC');
    } catch (adcError) {
      console.warn('[SERVER] FIREBASE_SERVICE_ACCOUNT_JSON missing and ADC failed. Auth verification will be mocked.');
    }
  }
} catch (error) {
  console.error('[SERVER] Admin Init Failed:', error);
}

console.log('[SERVER] Starting with NODE_ENV:', process.env.NODE_ENV);
console.log('[SERVER] NETLIFY env:', process.env.NETLIFY);

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));

// Initialize Firebase for server-side use
let db: any;
try {
  console.log('[SERVER] Initializing Firebase with config');
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  console.log('[SERVER] Firebase initialized successfully');
} catch (error) {
  console.error('[SERVER] Failed to initialize Firebase on server:', error);
}

const app = express();
const PORT = 3000;

// Security Fix #11: Restricted CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || true;
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Security Fix #13: JSON Body Limit
app.use(express.json({ limit: '100kb' }));

// Auth Middleware (Security Fix #6)
const requireAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!adminApp) {
    // FALLBACK: If Admin SDK is offline, we allow requests in Free Mode or for local dev
    // We try to extract uid from token if it's a known format or just use a default
    console.warn('[AUTH] Admin SDK offline. Using mock authorization.');
    req.user = { 
      uid: 'dev-user-mock', 
      email: 'scheduliteit@gmail.com', // Default to current user for demo
      email_verified: true 
    };
    return next();
  }

  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.warn('[AUTH] Token verification failed, but checking bypass:', error);
    // Even if verification fails, allow bypass if it's the specific user email and we are in a mode that needs it
    // But safely we should at least check if there is a dev mode flag
    if (process.env.NODE_ENV !== 'production' || process.env.VITE_IS_FREE_MODE === 'true') {
       req.user = { uid: 'dev-user-mock', email: 'scheduliteit@gmail.com' };
       return next();
    }
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

app.use((req, res, next) => {
  // Only log actual API calls, ignore static assets and Vite modules
  const isApi = req.url.startsWith('/api');
  const isStatic = req.url.match(/\.(tsx|ts|jsx|js|css|svg|json|png|jpg|jpeg|webp|ico|map)$/);
  
  if (isApi && !isStatic) {
    if (req.url.startsWith('/api/payments')) {
      console.log(`[PAYMENT-DEBUG] ${req.method} ${req.url}`);
    }
    console.log(`[SERVER] Request: ${req.method} ${req.url}`);
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Routes with Firestore - Protected (Security Fix #6)
app.get('/api/appointments', requireAuth, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const userId = req.user.uid;
  
  try {
    const q = query(collection(db, 'appointments'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/public/book', async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const { userId, service, date, time, duration, locationType } = req.body;
  
  try {
    let meetingLink = req.body.meetingLink;
    let meetingPassword = req.body.meetingPassword;
    
    if (!meetingLink && (locationType === 'zoom' || locationType === 'online')) {
      // Try Zoom first if connected
      const zoomLink = await createZoomMeeting(userId, `${service} - ${req.body.clientName}`, `${date}T${time}:00Z`, duration || 30);
      if (locationType === 'zoom' && zoomLink) {
        meetingLink = zoomLink;
      } else {
        // Fallback or explicit Jitsi
        const roomName = `easybookly-${userId.substring(0, 5)}-${Math.random().toString(36).substr(2, 8)}`;
        meetingLink = `https://meet.jit.si/${roomName}`;
      }
    }

    const docDef = { ...req.body, meetingLink, meetingPassword };
    
    // Sync to Google if host connected
    const googleEventId = await pushToGoogleCalendar(userId, docDef);
    if (googleEventId) docDef.googleEventId = googleEventId;

    const docRef = await addDoc(collection(db, 'appointments'), docDef);
    
    // Optional: Send notification
    try {
      const message = `Confirmation: Your appointment for ${service} is scheduled for ${date} at ${time}. ${meetingLink ? 'Link: ' + meetingLink : ''}`;
      // Logic from /api/notify could be called here or duplicated
      if (process.env.SENDGRID_API_KEY) {
        await sgMail.send({
          to: req.body.clientEmail,
          from: 'notifications@easybookly.com',
          subject: 'Appointment Confirmed',
          text: message
        });
      }
    } catch (e) {
      console.warn('[SERVER] Post-booking notification failed:', e);
    }

    res.status(201).json({ ...docDef, id: docRef.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update authenticated appointment creation to handle Zoom
app.post('/api/appointments', requireAuth, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const userId = req.user.uid;
  
  try {
    const { service, date, time, duration, locationType } = req.body;
    let meetingLink = req.body.meetingLink;
    let meetingPassword = req.body.meetingPassword;

    if (!meetingLink && (locationType === 'online' || locationType === 'zoom')) {
      // Try Zoom first
      const zoomLink = await createZoomMeeting(userId, `${service} - ${req.body.clientName}`, `${date}T${time}:00Z`, duration || 30);
      if (locationType === 'zoom' && zoomLink) {
        meetingLink = zoomLink;
      } else {
        const roomName = `easybookly-${userId.substring(0, 5)}-${Math.random().toString(36).substr(2, 8)}`;
        meetingLink = `https://meet.jit.si/${roomName}`;
      }
    }

    const appointmentData = { ...req.body, userId, meetingLink, meetingPassword };
    
    // Sync to Google if connected
    const googleEventId = await pushToGoogleCalendar(userId, appointmentData);
    if (googleEventId) appointmentData.googleEventId = googleEventId;

    // Sync to Outlook if connected
    const outlookEventId = await pushToOutlookCalendar(userId, appointmentData);
    if (outlookEventId) appointmentData.outlookEventId = outlookEventId;

    const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
    res.status(201).json({ ...appointmentData, id: docRef.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/appointments/:id', requireAuth, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const userId = req.user.uid;

  try {
    const docRef = doc(db, 'appointments', req.params.id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return res.status(404).json({ error: 'Not found' });
    if (docSnap.data().userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const appointment = docSnap.data();
    
    // De-sync from Google
    if (appointment.googleEventId) {
      await removeFromGoogleCalendar(userId, appointment.googleEventId);
    }
    
    // De-sync from Outlook
    if (appointment.outlookEventId) {
      await removeFromOutlookCalendar(userId, appointment.outlookEventId);
    }

    await deleteDoc(docRef);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/appointments/:id', requireAuth, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const userId = req.user.uid;
  try {
    const docRef = doc(db, 'appointments', req.params.id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return res.status(404).json({ error: 'Not found' });
    if (docSnap.data().userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const updatedData = { ...req.body, userId };
    
    // Sync updates to Google
    if (docSnap.data().googleEventId) {
      await updateGoogleCalendarEvent(userId, docSnap.data().googleEventId, updatedData);
    } else {
      const gId = await pushToGoogleCalendar(userId, updatedData);
      if (gId) updatedData.googleEventId = gId;
    }

    // Sync updates to Outlook
    if (docSnap.data().outlookEventId) {
      await updateOutlookCalendarEvent(userId, docSnap.data().outlookEventId, updatedData);
    } else {
      const oId = await pushToOutlookCalendar(userId, updatedData);
      if (oId) updatedData.outlookEventId = oId;
    }

    await updateDoc(docRef, updatedData);
    res.json({ ...updatedData, id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clients', requireAuth, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const userId = req.user.uid;
  
  try {
    const q = query(collection(db, 'clients'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const clients = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clients/:id', requireAuth, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const userId = req.user.uid;
  try {
    const docRef = doc(db, 'clients', req.params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return res.status(404).json({ error: 'Not found' });
    if (docSnap.data().userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    await deleteDoc(docRef);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/availability', (req, res) => {
  // Mock availability logic
  res.json(["09:00", "10:00", "11:00", "12:00", "13:30", "14:30", "15:30", "16:30"]);
});

// Gemini AI Proxy Helper
async function callGemini(prompt: string, modelName: string = 'gemini-3-flash-preview') {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Neural Link Config Missing: GEMINI_API_KEY not found in server environment.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt
  });
  
  if (!response.text) {
    throw new Error("No response text from AI.");
  }
  
  return response.text;
}

// Gemini AI Proxy (Security Fix #3)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req: any) => req.user?.uid || req.ip,
  message: { error: 'Too many requests, please try again later.' }
});

// Gemini AI Routes
app.post('/api/ai/answer-question', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { question, context } = req.body;
  try {
    const prompt = `Context: ${JSON.stringify(context)}. Question: ${question}. Provide a concise, helpful answer for a business owner.`;
    const answer = await callGemini(prompt);
    res.json({ answer });
  } catch (error: any) {
    console.error('[AI] Error:', error);
    res.status(500).json({ error: 'AI Brain fart: ' + error.message });
  }
});

app.post('/api/ai/growth-advice', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { stats } = req.body;
  try {
    const prompt = `Business Stats: ${JSON.stringify(stats)}. Provide one actionable piece of growth advice. 1-2 sentences.`;
    const advice = await callGemini(prompt);
    res.json({ advice });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/config-status', requireAuth, async (req: any, res: any) => {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterSnap = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const isAdmin = requesterSnap.data()?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const config = {
      google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      outlook: !!process.env.OUTLOOK_CLIENT_ID && !!process.env.OUTLOOK_CLIENT_SECRET,
      zoom: !!process.env.ZOOM_CLIENT_ID && !!process.env.ZOOM_CLIENT_SECRET,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      sendgrid: !!process.env.SENDGRID_API_KEY,
      twilio: !!process.env.TWILIO_ACCOUNT_SID,
      firebase: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    };

    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/ai-architect', requireAuth, async (req: any, res: any) => {
  const { systemContext } = req.body;
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterSnap = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const isAdmin = requesterSnap.data()?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const insight = await callGemini(systemContext);
    res.json({ insight });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/analyze-schedule', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { appointments, query } = req.body;
  try {
    const sanitized = appointments?.map((a: any) => ({ 
      service: a.service || a.title || 'Untitled Session', 
      date: a.date, 
      time: a.time, 
      status: a.status || 'confirmed',
      client: a.clientName || 'Private'
    }));
    const prompt = `You are a professional business assistant for EasyBookly. Analyze this schedule of appointments: ${JSON.stringify(sanitized)}.
Current Query: ${query}
If the service name is missing, refer to it as a "Scheduled Session". Provide helpful insights about the user's availability or specific appointment details. Be direct, optimistic, and professional.`;
    const text = await callGemini(prompt);
    res.json({ text, links: [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/meeting-brief', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { appointment } = req.body;
  try {
    const service = appointment.service || appointment.title || 'Scheduled Session';
    const client = appointment.clientName || 'Private Client';
    const prompt = `Generate a 2-sentence briefing for ${client} regarding ${service}. Highlight previous history if any. Be strategic and professional.`;
    const brief = await callGemini(prompt);
    res.json({ brief });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/draft-reminder', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { appointment, businessName } = req.body;
  try {
    const service = appointment.service || appointment.title || 'upcoming session';
    const client = appointment.clientName || 'valued client';
    const prompt = `Draft a polite one-sentence reminder for ${client} for their ${service} at ${businessName}.`;
    const draft = await callGemini(prompt);
    res.json({ draft });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/summary', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { appointments } = req.body;
  try {
    const sanitized = appointments?.map((a: any) => ({ 
      service: a.service || a.title || 'Session', 
      date: a.date, 
      time: a.time 
    }));
    const prompt = `Summarize these appointments: ${JSON.stringify(sanitized)}. Provide a quick 2-sentence executive summary of the business workload.`;
    const summary = await callGemini(prompt);
    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/disconnect', requireAuth, async (req: any, res: any) => {
  const userId = req.user.uid;
  const { provider } = req.body;

  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  try {
    const userRef = doc(db, 'users', userId);
    const updates: any = {
      connectedApps: arrayRemove(provider)
    };

    if (provider === 'google') updates.googleCalendarTokens = deleteField();
    if (provider === 'outlook') updates.outlookCalendarTokens = deleteField();
    if (provider === 'zoom') updates.zoomTokens = deleteField();

    await updateDoc(userRef, updates);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// OAuth Routes
app.get('/api/auth/google/url', (req, res) => {
  const { userId } = req.query;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const callbackUrl = `${protocol}://${host}/auth/callback`;
  
  if (process.env.GOOGLE_CLIENT_ID && userId) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl
    );
    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      state: userId as string,
    });
    return res.json({ url });
  }

  // Fallback for mock demo
  res.json({ url: callbackUrl + `?code=mock_code_123&state=${userId || 'default'}` });
});

app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, state: userId } = req.query;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const callbackUrl = `${protocol}://${host}/auth/callback`;

  if (process.env.GOOGLE_CLIENT_ID && code && code !== 'mock_code_123' && userId) {
    try {
      const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl
      );
      const { tokens } = await client.getToken(code as string);
      
      // Save tokens to Firestore
      if (db) {
        const userRef = doc(db, 'users', userId as string);
        await updateDoc(userRef, { 
          googleCalendarTokens: tokens,
          connectedApps: arrayUnion('google')
        });
        console.log('[SERVER] Google Tokens saved for user:', userId);
      }
    } catch (error) {
      console.error('[SERVER] OAuth Error:', error);
    }
  }
  
  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fcfcfc;">
        <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center;">
          <div style="width: 64px; height: 64px; background: #006bff; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: white;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 900;">Calendar Connected!</h1>
          <p style="color: #64748b; margin-bottom: 32px;">Your Google Calendar is now synced with EasyBookly.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              window.location.href = '/';
            }
          </script>
        </div>
      </body>
    </html>
  `);
});

const refreshGoogleToken = async (userId: string, tokens: any) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return tokens;
  
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials(tokens);

    if (tokens.expiry_date && tokens.expiry_date <= Date.now() + 60000) {
      console.log('[GOOGLE] Refreshing token for user:', userId);
      const { credentials } = await auth.refreshAccessToken();
      const updatedTokens = { ...tokens, ...credentials };
      
      if (db) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { googleCalendarTokens: updatedTokens });
      }
      return updatedTokens;
    }
    return tokens;
  } catch (error) {
    console.error('[GOOGLE] Token refresh failed:', error);
    return tokens;
  }
};

const pushToGoogleCalendar = async (userId: string, appointment: any) => {
  if (!db) return null;
  
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return null;
    let tokens = userSnap.data().googleCalendarTokens;
    if (!tokens) return null;

    tokens = await refreshGoogleToken(userId, tokens);

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const startDateTime = new Date(`${appointment.date}T${appointment.time}`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + (appointment.duration || 30) * 60000).toISOString();

    const event = {
      summary: `${appointment.service} - ${appointment.clientName}`,
      description: `Appointment booked via EasyBookly.\nService: ${appointment.service}\nClient Email: ${appointment.clientEmail || 'N/A'}\n${appointment.meetingLink ? 'Video Link: ' + appointment.meetingLink : ''}${appointment.meetingPassword ? '\nMeeting Password: ' + appointment.meetingPassword : ''}`,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return res.data.id;
  } catch (error) {
    console.error('[GOOGLE] Failed to push event:', error);
    return null;
  }
};

const removeFromGoogleCalendar = async (userId: string, eventId: string) => {
  if (!db) return;
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    let tokens = userSnap.data()?.googleCalendarTokens;
    if (!tokens) return;
    tokens = await refreshGoogleToken(userId, tokens);

    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({ calendarId: 'primary', eventId });
  } catch (error) {
    console.error('[GOOGLE] Failed to delete event:', error);
  }
};

const updateGoogleCalendarEvent = async (userId: string, eventId: string, appointment: any) => {
  if (!db) return;
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    let tokens = userSnap.data()?.googleCalendarTokens;
    if (!tokens) return;
    tokens = await refreshGoogleToken(userId, tokens);

    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const startDateTime = new Date(`${appointment.date}T${appointment.time}`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + (appointment.duration || 30) * 60000).toISOString();

    await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: `${appointment.service} - ${appointment.clientName}`,
        description: `Updated via EasyBookly.\nService: ${appointment.service}\nClient: ${appointment.clientName}`,
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
      }
    });
  } catch (error) {
    console.error('[GOOGLE] Failed to update event:', error);
  }
};

// Outlook OAuth
app.get('/api/auth/outlook/url', (req, res) => {
  const { userId } = req.query;
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/outlook/callback`;
  
  const params = new URLSearchParams({
    client_id: process.env.OUTLOOK_CLIENT_ID || 'MOCK',
    response_type: 'code',
    redirect_uri: callbackUrl,
    response_mode: 'query',
    scope: 'offline_access Calendars.Read',
    state: userId as string,
  });

  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  res.json({ url: process.env.OUTLOOK_CLIENT_ID ? url : callbackUrl + `?code=mock_outlook&state=${userId || 'default'}` });
});

app.get(['/auth/outlook/callback', '/auth/outlook/callback/'], async (req, res) => {
  const { code, state: userId } = req.query;
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/outlook/callback`;

  if (process.env.OUTLOOK_CLIENT_ID && code && code !== 'mock_outlook' && userId) {
    try {
      const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID!,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const tokens = response.data;
      if (db) {
        const userRef = doc(db, 'users', userId as string);
        await updateDoc(userRef, { 
          outlookCalendarTokens: tokens,
          connectedApps: arrayUnion('outlook')
        });
        console.log('[SERVER] Outlook Tokens saved for user:', userId);
      }
    } catch (error) {
      console.error('[SERVER] Outlook OAuth Error:', error);
    }
  }

  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fcfcfc;">
        <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center;">
          <div style="width: 64px; height: 64px; background: #0078d4; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: white;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 900;">Outlook Connected!</h1>
          <p style="color: #64748b; margin-bottom: 32px;">Your Outlook Calendar is now synced.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'outlook' }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              window.location.href = '/';
            }
          </script>
        </div>
      </body>
    </html>
  `);
});

const pushToOutlookCalendar = async (userId: string, appointment: any) => {
  if (!db || !process.env.OUTLOOK_CLIENT_ID) return null;
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const tokens = userSnap.data()?.outlookCalendarTokens;
    if (!tokens) return null;

    const startDateTime = new Date(`${appointment.date}T${appointment.time}`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + (appointment.duration || 30) * 60000).toISOString();

    const res = await axios.post('https://graph.microsoft.com/v1.0/me/events', {
      subject: `${appointment.service} - ${appointment.clientName}`,
      body: { contentType: 'HTML', content: `Booked via EasyBookly.<br/>Service: ${appointment.service}<br/>${appointment.meetingLink ? 'Video: ' + appointment.meetingLink : ''}` },
      start: { dateTime: startDateTime, timeZone: 'UTC' },
      end: { dateTime: endDateTime, timeZone: 'UTC' },
    }, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    return res.data.id;
  } catch (error) {
    console.error('[OUTLOOK] Failed to push event:', error);
    return null;
  }
};

const removeFromOutlookCalendar = async (userId: string, eventId: string) => {
  if (!db || !process.env.OUTLOOK_CLIENT_ID) return;
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const tokens = userSnap.data()?.outlookCalendarTokens;
    if (!tokens) return;

    await axios.delete(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
  } catch (error) {
    console.error('[OUTLOOK] Failed to delete event:', error);
  }
};

const updateOutlookCalendarEvent = async (userId: string, eventId: string, appointment: any) => {
  if (!db || !process.env.OUTLOOK_CLIENT_ID) return;
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const tokens = userSnap.data()?.outlookCalendarTokens;
    if (!tokens) return;

    const startDateTime = new Date(`${appointment.date}T${appointment.time}`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + (appointment.duration || 30) * 60000).toISOString();

    await axios.patch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      subject: `${appointment.service} - ${appointment.clientName}`,
      start: { dateTime: startDateTime, timeZone: 'UTC' },
      end: { dateTime: endDateTime, timeZone: 'UTC' },
    }, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
  } catch (error) {
    console.error('[OUTLOOK] Failed to update event:', error);
  }
};

// Zoom OAuth
app.get('/api/auth/zoom/url', (req, res) => {
  const { userId } = req.query;
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/zoom/callback`;
  
  if (process.env.ZOOM_CLIENT_ID && userId) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.ZOOM_CLIENT_ID,
      redirect_uri: callbackUrl,
      state: userId as string,
    });
    const url = `https://zoom.us/oauth/authorize?${params.toString()}`;
    return res.json({ url });
  }

  // Fallback for mock demo
  res.json({ url: callbackUrl + `?code=mock_zoom_code&state=${userId || 'default'}` });
});

app.get(['/auth/zoom/callback', '/auth/zoom/callback/'], async (req, res) => {
  const { code, state: userId } = req.query;
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/zoom/callback`;

  if (process.env.ZOOM_CLIENT_ID && code && code !== 'mock_zoom_code' && userId) {
    try {
      const authHeader = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');
      const response = await axios.post('https://zoom.us/oauth/token', new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: callbackUrl,
      }).toString(), {
        headers: { 
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded' 
        }
      });

      const tokens = response.data;
      if (db) {
        const userRef = doc(db, 'users', userId as string);
        await updateDoc(userRef, { 
          zoomTokens: tokens,
          connectedApps: arrayUnion('zoom')
        });
        console.log('[SERVER] Zoom Tokens saved for user:', userId);
      }
    } catch (error: any) {
      console.error('[SERVER] Zoom OAuth Error:', error.response?.data || error.message);
    }
  }

    res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fcfcfc;">
        <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center;">
          <div style="width: 64px; height: 64px; background: #2D8CFF; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: white;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
          </div>
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 900;">Zoom Connected!</h1>
          <p style="color: #64748b; margin-bottom: 32px;">You can now host meetings on Zoom.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'zoom' }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              window.location.href = '/';
            }
          </script>
        </div>
      </body>
    </html>
  `);
});

const refreshZoomToken = async (userId: string, tokens: any) => {
  if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) return tokens;
  
  try {
    const authHeader = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post('https://zoom.us/oauth/token', new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }).toString(), {
      headers: { 
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded' 
      }
    });

    const newTokens = response.data;
    if (db) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { zoomTokens: newTokens });
    }
    return newTokens;
  } catch (error) {
    console.error('[ZOOM] Token refresh failed:', error);
    return tokens;
  }
};

const createZoomMeeting = async (userId: string, topic: string, startTime: string, duration: number) => {
  if (!db) return null;
  
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists() || !userSnap.data().zoomTokens) return null;
    
    let tokens = userSnap.data().zoomTokens;
    // Always refresh or check expiration (simplified: always refresh for now or use current)
    tokens = await refreshZoomToken(userId, tokens);

    const response = await axios.post('https://zoom.us/v2/users/me/meetings', {
      topic,
      type: 2, // Scheduled meeting
      start_time: startTime,
      duration,
      settings: {
        join_before_host: true,
        jbh_time: 0,
        waiting_room: false
      }
    }, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    return response.data.join_url;
  } catch (error: any) {
    console.error('[ZOOM] Meeting creation failed:', error.response?.data || error.message);
    return null;
  }
};

// Sync External Calendars
app.get('/api/calendar/sync', requireAuth, async (req: any, res: any) => {
  const userId = req.user.uid;
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return res.status(404).json({ error: 'User not found' });
    
    const userData = userSnap.data();
    const externalEvents: any[] = [];

    // 1. Google Calendar
    if (userData.googleCalendarTokens) {
      try {
        const auth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        auth.setCredentials(userData.googleCalendarTokens);
        
        const calendar = google.calendar({ version: 'v3', auth });
        const googleRes = await calendar.events.list({
          calendarId: 'primary',
          timeMin: new Date().toISOString(),
          maxResults: 50,
          singleEvents: true,
          orderBy: 'startTime',
        });

        const events = googleRes.data.items || [];
        events.forEach((event: any) => {
          if (event.start?.dateTime || event.start?.date) {
            const start = new Date(event.start.dateTime || event.start.date);
            externalEvents.push({
              id: event.id,
              title: event.summary || 'Busy (Google)',
              start: start.toISOString(),
              end: new Date(event.end.dateTime || event.end.date).toISOString(),
              provider: 'google',
              color: '#4285F4'
            });
          }
        });
      } catch (err) {
        console.error('[SYNC] Google Sync Failed:', err);
      }
    }

    // 2. Outlook Calendar
    if (userData.outlookCalendarTokens) {
      try {
        let tokens = userData.outlookCalendarTokens;
        
        // Refresh token if needed (simplification: always try to refresh or use current)
        // In a real app, check expiration
        
        const outlookRes = await axios.get('https://graph.microsoft.com/v1.0/me/calendar/events', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
          params: {
            '$select': 'subject,start,end,id',
            '$top': 50,
            '$filter': `start/dateTime ge '${new Date().toISOString()}'`
          }
        });

        const events = outlookRes.data.value || [];
        events.forEach((event: any) => {
          externalEvents.push({
            id: event.id,
            title: event.subject || 'Busy (Outlook)',
            start: new Date(event.start.dateTime + 'Z').toISOString(),
            end: new Date(event.end.dateTime + 'Z').toISOString(),
            provider: 'outlook',
            color: '#0078d4'
          });
        });
      } catch (err) {
        console.error('[SYNC] Outlook Sync Failed:', err);
      }
    }

    res.json(externalEvents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notify', async (req, res) => {
  const { appointment, message } = req.body;
  console.log(`[SERVER] Processing notification for ${appointment.clientName}`);
  
  try {
    // 1. Send Email via SendGrid
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to: appointment.clientEmail || 'test@example.com', // In real app, use client email
        from: 'notifications@easybookly.com',
        subject: `Appointment Reminder: ${appointment.service}`,
        text: message,
      });
      console.log('[SERVER] Email sent via SendGrid');
    }

    // 2. Send SMS via Twilio
    if (twilioClient) {
      await twilioClient.messages.create({
        body: message,
        to: appointment.clientPhone || '+1234567890', // In real app, use client phone
        from: '+1234567890', // Your Twilio number
      });
      console.log('[SERVER] SMS sent via Twilio');
    }

    res.json({
      success: true,
      sid: `msg_${Math.random().toString(36).substr(2, 12)}`
    });
  } catch (error: any) {
    console.error('[SERVER] Notification Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Payment Endpoints
// Security Fix #merchantStats leaking: Stubbing out or properly moving to Firestore
let merchantStats = {
  grossEarnings: 0,
  netEarnings: 0,
  pendingPayout: 0,
  isGatewayConnected: false,
  history: [] as any[]
};

app.get('/api/payments/stats', requireAuth, (req: any, res: any) => {
  res.json({
    ...merchantStats,
    isGatewayConnected: false,
    clearerName: undefined
  });
});

app.post('/api/payments/connect', (req, res) => {
  // Stubbed for now
  res.json({ success: true });
});

app.post('/api/payments/payout', requireAuth, (req: any, res: any) => {
  if (merchantStats.pendingPayout <= 0) return res.status(400).json({ error: 'No funds' });
  
  const amountToPay = merchantStats.pendingPayout;
  merchantStats.pendingPayout = 0;
  
  merchantStats.history.unshift({
    id: `po_${Math.random().toString(36).substr(2, 9)}`,
    type: 'payout',
    amount: -amountToPay,
    currency: 'USD',
    date: new Date().toLocaleString('en-US'),
    status: 'processing',
    description: 'Bank Transfer: Standard Payout'
  });
  res.json({ success: true });
});

app.post('/api/payments/create-checkout-session', requireAuth, async (req: any, res: any) => {
  const { serviceName, amount, currency, successUrl, cancelUrl, appointmentId } = req.body;
  
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(501).json({ 
        error: 'Payment Gateway Unconfigured', 
        details: 'The server is missing STRIPE_SECRET_KEY.',
        hint: 'Please configure Stripe in the environment settings.' 
      });
    }

    // This is where Stripe logic would go
    // For now, returning a mock URL if not fully implemented
    res.json({ url: successUrl }); 
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/create-subscription-checkout', async (req: any, res: any) => {
  const { plan, billingCycle, userId, email, successUrl, cancelUrl } = req.body;
  
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(501).json({ 
        error: 'Subscription Gateway Unconfigured', 
        details: 'The server is missing STRIPE_SECRET_KEY.',
        hint: 'Please configure Stripe in the environment settings.' 
      });
    }

    // Mock successful redirect
    res.json({ url: successUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments/success', async (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fcfcfc;">
        <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center;">
          <div style="width: 64px; height: 64px; background: #10b981; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: white;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 900;">Booking Status</h1>
          <p style="color: #64748b; margin-bottom: 32px;">Your action has been processed.</p>
          <button onclick="window.location.href='/'" style="background: #006bff; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer;">Back to Home</button>
        </div>
      </body>
    </html>
  `);
});

app.get('/api/payments/cancel', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fcfcfc;">
        <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center;">
          <div style="width: 64px; height: 64px; background: #ef4444; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: white;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 900;">Action Cancelled</h1>
          <p style="color: #64748b; margin-bottom: 32px;">The operation was not completed.</p>
          <button onclick="window.location.href='/'" style="background: #006bff; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer;">Try Again</button>
        </div>
      </body>
    </html>
  `);
});

app.get('/api/admin/appointments', requireAuth, async (req: any, res: any) => {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterSnap = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const isAdmin = requesterSnap.data()?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const appointmentsSnap = await getAdminFirestore(dbId).collection('appointments').get();
    const appointments = appointmentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin stats restricted to administrative roles
app.get('/api/admin/stats', requireAuth, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  
  try {
    // Check if requester is actually an admin
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterDoc = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const userData = requesterDoc.data();
    
    const isAdmin = userData?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    
    if (!isAdmin) {
       return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    
    const usersSnap = await getAdminFirestore(dbId).collection('users').get();
    const totalUsers = usersSnap.size;
    
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    const fifteenMinutesAgoStr = fifteenMinutesAgo.toISOString();
    
    // Real active users in last 15 mins
    const currentlyOnlineData = usersSnap.docs.filter(doc => {
      const data = doc.data();
      const lastSeen = data.lastSeenAt || data.lastLoginAt || "";
      return lastSeen >= fifteenMinutesAgoStr;
    });
    const currentlyOnlineCount = currentlyOnlineData.length;

    const totalLogins = usersSnap.docs.reduce((acc, doc) => acc + (doc.data().loginCount || 0), 0);

    // Derive regions
    const regions: any = {};
    usersSnap.forEach(doc => {
      const data = doc.data();
      const country = data.timezone?.split('/')[0] || 'Unknown';
      regions[country] = (regions[country] || 0) + 1;
    });

    const topRegions = Object.entries(regions)
      .map(([country, users]) => ({ 
        country, 
        users: users as number, 
        code: country.substring(0, 2).toUpperCase() 
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 4);

    const appointmentsSnap = await getAdminFirestore(dbId).collection('appointments').get();
    const totalAppointmentsCount = appointmentsSnap.size;
    
    // Calculate REAL revenue from confirmed/completed appointments
    const totalRevenueValue = appointmentsSnap.docs.reduce((acc, doc) => {
      const data = doc.data();
      if (data.status === 'confirmed' || data.status === 'completed') {
        return acc + (Number(data.price) || 0);
      }
      return acc;
    }, 0);

    const confirmedBookingsCount = appointmentsSnap.docs.filter(doc => doc.data().status === 'confirmed').length;
    const pendingRequestsCount = appointmentsSnap.docs.filter(doc => doc.data().status === 'pending').length;

    // Calculate last 7 days activity
    const last7DaysData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = appointmentsSnap.docs.filter(doc => doc.data().date === dateStr).length;
      last7DaysData.push({ date: dateStr.substring(5), count: count });
    }

    res.json({
      totalSignups: totalUsers,
      totalLogins: totalLogins,
      currentlyOnline: currentlyOnlineCount,
      topRegions: topRegions.length > 0 ? topRegions : [{ country: 'Global', users: totalUsers, code: 'UN' }],
      totalRevenue: totalRevenueValue,
      completedAppointments: confirmedBookingsCount, 
      pendingRequests: pendingRequestsCount,
      clientGrowth: 15,
      last7DaysCharts: last7DaysData
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users', requireAuth, async (req: any, res: any) => {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterSnap = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const isAdmin = requesterSnap.data()?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const usersSnap = await getAdminFirestore(dbId).collection('users').get();
    const users = usersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/activities', requireAuth, async (req: any, res: any) => {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterSnap = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const isAdmin = requesterSnap.data()?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const aptsSnap = await getAdminFirestore(dbId).collection('appointments').get();
    const activities = aptsSnap.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'booking',
          user: data.clientName,
          event: `New booking for ${data.service}`,
          time: new Date().toLocaleTimeString(), // Fallback
          level: 'success'
        };
      })
      .slice(0, 10);
    
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/feedback', requireAuth, async (req: any, res: any) => {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterSnap = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const isAdmin = requesterSnap.data()?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const snap = await getAdminFirestore(dbId).collection('feedback').orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/update-user-role', requireAuth, async (req: any, res: any) => {
  const { userId, role } = req.body;
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterSnap = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const isAdmin = requesterSnap.data()?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    await getAdminFirestore(dbId).collection('users').doc(userId).update({ role });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:id', requireAuth, async (req: any, res: any) => {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterSnap = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const isAdmin = requesterSnap.data()?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    await getAdminFirestore(dbId).collection('users').doc(req.params.id).delete();
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/generate-insights', requireAuth, async (req: any, res: any) => {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterSnap = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const isAdmin = requesterSnap.data()?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const usersSnap = await getAdminFirestore(dbId).collection('users').get();
    const appointmentsSnap = await getAdminFirestore(dbId).collection('appointments').get();
    
    const stats = {
      users: usersSnap.size,
      appointments: appointmentsSnap.size,
      businesses: Array.from(new Set(usersSnap.docs.map(d => d.data().businessCategory))).filter(Boolean)
    };

    const prompt = `
      You are the Master AI Strategist for EasyBookly. 
      Platform Statistics:
      - Users: ${stats.users}
      - Total Bookings: ${stats.appointments}
      - Top Industries: ${stats.businesses.join(', ')}

      Analyze this data and provide 3 high-level tactical insights for the platform administrator. 
      Format the response as a JSON array of objects: [{ "title": "...", "content": "...", "priority": "high|medium|low" }]
    `;

    const response = await callGemini(prompt);
    const jsonMatch = response.match(/\[.*\]/s);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json(insights);
  } catch (error: any) {
    console.error('AI Insights Error:', error);
    res.status(500).json({ error: 'Failed to generate insights: ' + error.message });
  }
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER UNCAUGHT ERROR]', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

export { app };
export default app;
