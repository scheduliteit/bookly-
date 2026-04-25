
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
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

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
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : null;

  if (serviceAccount) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('[SERVER] Firebase Admin initialized');
  } else {
    console.warn('[SERVER] FIREBASE_SERVICE_ACCOUNT_JSON missing. Protected routes will fail.');
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
  if (!adminApp) {
    return res.status(503).json({ error: 'Auth system offline (Missing Service Account)' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
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
    let meetingLink = undefined;
    if (locationType === 'zoom' || locationType === 'online') {
      // Generate a unique Jitsi room name
      const roomName = `easybookly-${userId.substring(0, 5)}-${Math.random().toString(36).substr(2, 8)}`;
      meetingLink = `https://meet.jit.si/${roomName}`;
    }

    const docDef = { ...req.body, meetingLink };
    
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

    if (!meetingLink && (locationType === 'online' || locationType === 'zoom')) {
      const roomName = `easybookly-${userId.substring(0, 5)}-${Math.random().toString(36).substr(2, 8)}`;
      meetingLink = `https://meet.jit.si/${roomName}`;
    }

    const appointmentData = { ...req.body, userId, meetingLink };
    
    // Sync to Google if connected
    const googleEventId = await pushToGoogleCalendar(userId, appointmentData);
    if (googleEventId) appointmentData.googleEventId = googleEventId;

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

    await updateDoc(docRef, { ...req.body, userId });
    res.json({ ...req.body, id: req.params.id, userId });
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

// Gemini AI Proxy (Security Fix #3)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req: any) => req.user?.uid || req.ip,
  message: { error: 'Too many requests, please try again later.' }
});

const callGemini = async (prompt: string, model: string = 'gemini-2.0-flash') => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }]
    }
  );
  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

app.post('/api/ai/answer-question', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { question, serviceName, businessName } = req.body;
  try {
    const prompt = `You are the High-Performance Virtual Concierge for ${businessName}. A client is inquiring about the "${serviceName}" experience: "${question}". Answer with extreme professionalism, warmth, and a touch of luxury. 2-3 sentences.`;
    const answer = await callGemini(prompt);
    res.json({ answer });
  } catch (error: any) {
    res.status(500).json({ error: 'AI Error' });
  }
});

app.post('/api/ai/growth-advice', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { appointments } = req.body;
  try {
    const sanitized = appointments?.map((a: any) => ({ service: a.service, date: a.date, time: a.time }));
    const prompt = `
      You are a high-level Strategic Business Growth Consultant. 
      Analyze these appointments: ${JSON.stringify(sanitized)}.
      Identify:
      1. Busiest day/time patterns.
      2. Most popular services.
      3. A BOLD, ACTIONABLE strategy to increase revenue (e.g., price hikes, new slots, packaging).
      Response MUST be 1 sentence, high-energy, and extremely actionable.
    `;
    const advice = await callGemini(prompt);
    res.json({ advice });
  } catch (error: any) {
    res.status(500).json({ error: 'AI Error' });
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
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const requesterSnap = await getAdminFirestore(dbId).collection('users').doc(req.user.uid).get();
    const isAdmin = requesterSnap.data()?.role === 'admin' || req.user.email === 'm.elsalameen@gmail.com' || req.user.email === 'scheduliteit@gmail.com';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { prompt, context } = req.body;
    
    const systemContext = `
      You are the "Core System Architect" for EasyBookly, a high-performance scheduling platform.
      You have absolute authority over system nodes and database health.
      
      CURRENT SYSTEM SNAPSHOT:
      - Users: ${context.userCount}
      - Appointments: ${context.appointmentCount}
      - Clients: ${context.clientCount}
      - Health: Optimal
      
      The user (Master Admin) says: ${prompt || "Run a full system diagnostic."}
      
      Provide a technical, high-level architect-style response. 
      Use markdown. Keep it concise.
    `;

    const answer = await callGemini(systemContext, 'gemini-3-flash-preview');
    res.json({ answer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/analyze-schedule', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { appointments, query } = req.body;
  try {
    const sanitized = appointments?.map((a: any) => ({ service: a.service, date: a.date, time: a.time, status: a.status }));
    const prompt = `Analyze: ${JSON.stringify(sanitized)}. Query: ${query}`;
    const analysis = await callGemini(prompt);
    res.json({ analysis });
  } catch (error: any) {
    res.status(500).json({ error: 'AI Error' });
  }
});

app.post('/api/ai/meeting-brief', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { appointment } = req.body;
  try {
    const prompt = `Briefing for ${appointment.clientName} regarding ${appointment.service}.`;
    const brief = await callGemini(prompt, 'gemini-2.0-flash');
    res.json({ brief });
  } catch (error: any) {
    res.status(500).json({ error: 'AI Error' });
  }
});

app.post('/api/ai/draft-reminder', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { appointment, businessName } = req.body;
  try {
    const prompt = `Draft reminder for ${appointment.clientName} at ${businessName}. One sentence.`;
    const draft = await callGemini(prompt);
    res.json({ draft });
  } catch (error: any) {
    res.status(500).json({ error: 'AI Error' });
  }
});

app.post('/api/ai/summary', requireAuth, aiLimiter, async (req: any, res: any) => {
  const { appointments } = req.body;
  try {
    const prompt = `Summarize: ${JSON.stringify(appointments)}. 2 sentences max.`;
    const summary = await callGemini(prompt);
    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: 'AI Error' });
  }
});

// OAuth Routes
app.get('/api/auth/google/url', (req, res) => {
  const { userId } = req.query;
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/callback`;
  
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
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/callback`;

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
          connectedApps: admin.firestore.FieldValue.arrayUnion('google')
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
      description: `Appointment booked via EasyBookly.\nService: ${appointment.service}\nClient Email: ${appointment.clientEmail || 'N/A'}\n${appointment.meetingLink ? 'Video Link: ' + appointment.meetingLink : ''}`,
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
          connectedApps: admin.firestore.FieldValue.arrayUnion('outlook')
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
          connectedApps: admin.firestore.FieldValue.arrayUnion('zoom')
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
    // Attempt to parse JSON from AI response
    const jsonMatch = response.match(/\[.*\]/s);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json(insights);
  } catch (error: any) {
    console.error('AI Insights Error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER UNCAUGHT ERROR]', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

export { app };
export default app;
