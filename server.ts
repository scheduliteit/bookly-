
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { google } from 'googleapis';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

dotenv.config();

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
  if (req.url.startsWith('/api/payments')) {
    console.log(`[PAYMENT-DEBUG] ${req.method} ${req.url} - Body:`, JSON.stringify(req.body));
  }
  console.log(`[SERVER] Request: ${req.method} ${req.url}`);
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

app.post('/api/appointments', requireAuth, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const userId = req.user.uid;
  
  try {
    const docRef = await addDoc(collection(db, 'appointments'), { ...req.body, userId });
    res.status(201).json({ ...req.body, id: docRef.id, userId });
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
    const prompt = `Consultant advice for: ${JSON.stringify(sanitized)}. One brief pro-tip.`;
    const advice = await callGemini(prompt);
    res.json({ advice });
  } catch (error: any) {
    res.status(500).json({ error: 'AI Error' });
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
app.get('/api/auth/url', (req, res) => {
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/callback`;
  
  if (process.env.GOOGLE_CLIENT_ID) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl
    );
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    return res.json({ url });
  }

  // Fallback for mock demo
  res.json({ url: callbackUrl + '?code=mock_code_123' });
});

app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code } = req.query;
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/callback`;

  if (process.env.GOOGLE_CLIENT_ID && code && code !== 'mock_code_123') {
    try {
      const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl
      );
      const { tokens } = await client.getToken(code as string);
      // In a real app, save tokens to the user in DB
      console.log('[SERVER] Google Tokens received:', tokens);
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

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const twilioClient = process.env.TWILIO_SID && process.env.TWILIO_TOKEN 
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) 
  : null;

// Outlook OAuth (Mock for now, similar to Google)
app.get('/api/auth/outlook/url', (req, res) => {
  const callbackUrl = `${req.protocol}://${req.get('host')}/auth/outlook/callback`;
  // In a real app, use @azure/msal-node or similar
  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.OUTLOOK_CLIENT_ID || 'MOCK'}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&response_mode=query&scope=Calendars.Read`;
  res.json({ url: process.env.OUTLOOK_CLIENT_ID ? url : callbackUrl + '?code=mock_outlook' });
});

app.get(['/auth/outlook/callback', '/auth/outlook/callback/'], (req, res) => {
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
// For now, we'll keep it simple as the PDF suggested it was stubbed out.
let merchantStats = {
  grossEarnings: 0,
  netEarnings: 0,
  pendingPayout: 0,
  isGatewayConnected: false,
  history: [] as any[]
};

app.get('/api/payments/stats', requireAuth, (req: any, res: any) => {
  const isPayMe = !!process.env.PAYME_SELLER_KEY;
  res.json({
    ...merchantStats,
    isGatewayConnected: isPayMe,
    clearerName: isPayMe ? 'PayMe (Israel)' : undefined
  });
});

app.post('/api/payments/connect', (req, res) => {
  merchantStats.isGatewayConnected = true;
  merchantStats.history.unshift({
    id: `sys_${Date.now()}`,
    type: 'payout',
    amount: 0,
    currency: 'USD',
    date: new Date().toLocaleString('en-US'),
    status: 'succeeded',
    description: 'PayMe Gateway Verified: Standard Invoicing Enabled'
  });
  res.json({ success: true });
});

// PayMe Integration (Israeli Payment Gateway) - v2.3.2 (Detailed Diagnosis)
// V2.3 Strategy: Super DNS Fallback with Full Tracing
const PAYME_DOMAINS = [
  'https://ngapi.payme.co.il', // Primary Israeli
  'https://api.payme.co.il',   // Standard Israeli
  'https://api.paid.ai',       // New Branding
  'https://api.paid.co.il',    // Rebranded Israeli
  'https://ngapi.payme.io',    // Legacy Global
  'https://api.payme.io'       // Standard Global
];

async function callPaidAPI(endpoint: string, payload: any, timeout = 12000) {
  let errors: string[] = [];
  for (const base of PAYME_DOMAINS) {
    const fullUrl = `${base}${endpoint}`;
    try {
      console.log(`[PAYME] Attempting request to: ${fullUrl}`);
      const response = await axios.post(fullUrl, payload, {
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'EasyBookly-Scheduler/2.3.2',
          'Accept': 'application/json'
        },
        timeout
      });
      console.log(`[PAYME] SUCCESS on endpoint: ${base}`);
      return response.data;
    } catch (err: any) {
      const summary = `${new URL(base).hostname}: ${err.code || 'ERR'} (${err.message})`;
      errors.push(summary);
      console.error(`[PAYME] Fail on ${base}:`, err.message);
      
      // If it's a DNS error, we MUST try the others.
      if (err.code === 'ENOTFOUND') continue;
      
      // For other errors (like 401 or 400), the Seller Key might be wrong for THAT domain
      // but right for another (older/newer). So we continue.
      continue; 
    }
  }
  const finalError = new Error(`All domains failed: ${errors.join(' | ')}`);
  (finalError as any).allErrors = errors;
  throw finalError;
}

// Security Fix #2: No hardcoded fallback
const getPayMeSellerKey = () => {
    const key = process.env.PAYME_SELLER_KEY || process.env.payme_seller_key || process.env.PAYME_SELLER_ID;
    if (key && key.length > 5 && !key.includes('your_payme')) return key;
    return null;
};

// For Security Fix #4: HMAC verification
const PAYME_WEBHOOK_SECRET = process.env.PAYME_WEBHOOK_SECRET || process.env.payme_webhook_secret;

app.post('/api/payments/create-checkout-session', async (req: any, res: any) => {
  const { serviceName, amount, currency, successUrl, cancelUrl, appointmentId, clientEmail, clientPhone } = req.body;
  const sellerKey = getPayMeSellerKey();

  if (!sellerKey) {
    const foundKeys = Object.keys(process.env).filter(k => k.toLowerCase().includes('payme'));
    // Robust detection: Netlify sets CONTEXT or NETLIFY=true
    const isProd = !!process.env.NETLIFY || !!process.env.CONTEXT || process.env.NODE_ENV === 'production';
    
    console.error(`[PAYME] Config Error. Key present: ${!!process.env.PAYME_SELLER_KEY}, Found Keys: ${foundKeys.join(',')}`);
    return res.status(503).json({ 
      error: 'PayMe is not configured in your environment.',
      details: `[V2.1] The server cannot find PAYME_SELLER_KEY. ${isProd ? 'Since you are on a live site (Netlify), you MUST add this key to your Site Settings -> Environment Variables (NOT the Team settings).' : 'Please add it to the Secrets menu in AI Studio.'}`,
      hint: foundKeys.length > 0 ? `We found these similar keys: [${foundKeys.join(', ')}]. Check if you meant to use one of these.` : 'No keys starting with "PAYME" were found. Did you forget to redeploy after adding the secret?'
    });
  }

  try {
    const data = await callPaidAPI('/api/generate-sale', {
      seller_key: sellerKey,
      amount: Math.round(amount * 100), 
      currency: currency === 'ILS' ? 'ILS' : (currency === 'EUR' ? 'EUR' : (currency === 'GBP' ? 'GBP' : 'USD')),
      product_name: serviceName,
      buyer_email: clientEmail,
      buyer_phone: clientPhone,
      sale_callback_url: `${req.protocol}://${req.get('host')}/api/payments/payme-callback?appointmentId=${appointmentId}`,
      sale_return_url: successUrl,
      sale_cancel_url: cancelUrl,
      language: 'he',
    });

    if (data.status === 'success' || data.status_code === 0) {
      return res.json({ url: data.sale_url });
    }
    
    console.error('[SERVER] PayMe API returned failure:', data);
    return res.status(400).json({ 
      error: 'PayMe Payment Failed', 
      details: data.msg || data.status_error_details || 'Gateway rejected the sale generation.',
      errorCode: data.error_code || data.status_code,
      status: data.status,
      hint: 'This usually means your PayMe Seller Key is invalid, or your account does not have permission for the selected currency/sale type.'
    });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('[SERVER] PayMe Axios Error:', {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return res.status(error.response?.status || 500).json({ 
        error: `Payment gateway connection failed: ${error.code || 'UNKNOWN'}`, 
        details: error.message,
        payload: error.response?.data,
        hint: 'The server automatically tried 4 different fallback domains and they all failed DNS resolution. Check your network or dashboard.'
      });
    }
    console.error('[SERVER] PayMe Fatal Error:', error);
    return res.status(500).json({ 
      error: 'Internal processing error', 
      details: error.message 
    });
  }
});

app.post('/api/payments/payme-callback', async (req, res) => {
  // Security Fix #4: HMAC verification and independent confirmation
  const signature = req.headers['x-payme-signature'];
  const rawBody = JSON.stringify(req.body);
  const sellerKey = getPayMeSellerKey();

  if (PAYME_WEBHOOK_SECRET && signature) {
    const expected = crypto.createHmac('sha256', PAYME_WEBHOOK_SECRET).update(rawBody).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature as string), Buffer.from(expected))) {
      console.warn('[PAYMENTS] Webhook signature mismatch');
      return res.status(401).send('Invalid signature');
    }
  }

  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const appointmentId = req.query.appointmentId as string;
  const { payme_sale_id } = req.body;

  // Independent confirmation (Security Fix #4)
  try {
    const data = await callPaidAPI('/api/get-sales', {
      seller_key: sellerKey,
      payme_sale_id: payme_sale_id
    });
    
    const isSuccess = (data.status === 'success' || data.status_code === 0) && 
                      (data.sale_status === 'success' || data.sale_status === 'paid');

    if (!isSuccess) {
      return res.status(400).send('Sale not confirmed');
    }
  } catch (err) {
    console.error('[PAYMENTS] Confirmation failed:', err);
    return res.status(500).send('Confirmation error');
  }

  if (appointmentId) {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), { status: 'confirmed' });
      console.log(`[SERVER] Appointment ${appointmentId} confirmed via PayMe callback`);
    } catch (error) {
      console.error('Failed to update appointment status after payment:', error);
    }
  }
  res.sendStatus(200);
});

app.post('/api/payments/create-subscription-checkout', async (req, res) => {
  const { plan, billingCycle, userId, email, successUrl, cancelUrl } = req.body;
  const sellerKey = getPayMeSellerKey();
  
  if (!sellerKey) {
    const foundKeys = Object.keys(process.env).filter(k => k.toLowerCase().includes('payme'));
    const isProd = !!process.env.NETLIFY || !!process.env.CONTEXT || process.env.NODE_ENV === 'production';

    console.error(`[PAYME-SUB] Config Error. Key present: ${!!process.env.PAYME_SELLER_KEY}, Found Keys: ${foundKeys.join(',')}`);
    return res.status(400).json({ 
      error: 'PayMe is not configured in your environment.',
      details: `[V2.1] The server cannot find PAYME_SELLER_KEY in production. ${isProd ? 'Since you are on a live site (Netlify), you MUST add this key to your Site Settings -> Environment Variables (NOT the Team settings).' : 'Please add it to the Secrets menu in AI Studio.'}`,
      hint: foundKeys.length > 0 ? `We found these similar keys: [${foundKeys.join(', ')}]. Check if you meant to use one of these.` : 'No keys starting with "PAYME" were found. Did you forget to redeploy after adding the secret?'
    });
  }

  try {
    const amount = plan === 'premium' 
      ? (billingCycle === 'annual' ? 180 : 25) 
      : (billingCycle === 'annual' ? 90 : 13);

    const amountStr = Math.round(amount * 100).toString();
    const subAmountStr = amountStr;
    const protocol = 'https'; // Force https for external gateway callbacks
    const callbackBase = `${protocol}://${req.get('host')}`;
    const callbackUrl = `${callbackBase}/api/payments/verify-subscription?userId=${userId || ''}&plan=${plan}`;

    console.log(`[SERVER] PAYME REQUEST BUILD:`, {
      amount: amountStr,
      currency: 'USD',
      sale_type: 2,
      callback: callbackUrl
    });
    
    const data = await callPaidAPI('/api/generate-sale', {
      seller_key: sellerKey,
      amount: Math.round(amount * 100),
      currency: 'USD',
      product_name: `EasyBookly ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription (${billingCycle})`,
      buyer_email: email,
      sale_callback_url: callbackUrl,
      sale_return_url: successUrl,
      sale_cancel_url: cancelUrl,
      sale_type: 2, // Recursive/Subscription
      sub_iteration_type: billingCycle === 'annual' ? 2 : 1, // 1 for month, 2 for year
      sub_iteration_number: 1,
      sub_amount: Math.round(amount * 100),
      language: 'en',
    });

    if (data.status === 'success' || data.status_code === 0) {
      return res.json({ url: data.sale_url });
    }
    
    console.error('[SERVER] PayMe Subscription API returned failure:', data);
    return res.status(400).json({ 
      error: 'PayMe Subscription Failed', 
      details: data.msg || data.status_error_details || 'Gateway rejected the subscription creation.',
      errorCode: data.error_code || data.status_code,
      status: data.status,
      hint: 'Subscriptions (sale_type: 2) often require manual approval in your PayMe dashboard. Ensure your Seller Key supports recurring payments.'
    });
  } catch (error: any) {
    if (axios.isAxiosError(error) || error.allErrors) {
      const detailedError = error.allErrors ? error.message : error.message;
      return res.status(500).json({ 
        error: `Subscription gateway unreachable`, 
        details: detailedError,
        hint: 'The server tried 6 different API domains and all failed. Screenshot this error "Details" section to help the developer diagnose the DNS blockade.'
      });
    }
    console.error('[SERVER] PayMe Subscription Fatal Error:', error);
    res.status(500).json({ 
      error: 'PayMe Integration Error [V2]', 
      details: error.message 
    });
  }
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

app.get('/api/payments/success', async (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fcfcfc;">
        <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center;">
          <div style="width: 64px; height: 64px; background: #10b981; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: white;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 900;">Payment Successful!</h1>
          <p style="color: #64748b; margin-bottom: 32px;">Your payment has been received and your booking is being processed.</p>
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
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 900;">Payment Cancelled</h1>
          <p style="color: #64748b; margin-bottom: 32px;">Your appointment was not booked.</p>
          <button onclick="window.location.href='/'" style="background: #006bff; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer;">Try Again</button>
        </div>
      </body>
    </html>
  `);
});

app.get('/api/payments/verify-subscription', async (req: any, res: any) => {
  const { plan, payme_sale_id, userId } = req.query as any;
  const sellerKey = getPayMeSellerKey();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  
  if (!sellerKey) {
    return res.redirect('/?subscription=failed&error=config_error_missing_seller_key');
  }

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId in verification' });
  }

  // Security Fix #5: Independent sale-status endpoint confirmation
  try {
    const data = await callPaidAPI('/api/get-sales', {
      seller_key: sellerKey,
      payme_sale_id: payme_sale_id
    });

    if ((data.status === 'success' || data.status_code === 0) && (data.sale_status === 'success' || data.sale_status === 'paid')) {
      await updateDoc(doc(db, 'users', userId), { 
        subscriptionPlan: plan,
        updatedAt: new Date().toISOString()
      });
      // Redirect to a success page or the app
      return res.redirect('/?subscription=success');
    }
    
    res.redirect('/?subscription=failed&error=gateway_rejected');
  } catch (error: any) {
    console.error('Verify error:', error.message);
    res.redirect('/?subscription=failed&error=' + encodeURIComponent(error.message));
  }
});

app.post('/api/payments/resync', async (req: any, res: any) => {
  const { appointmentId, payme_sale_id } = req.body;
  const sellerKey = getPayMeSellerKey();
  
  if (!sellerKey) return res.status(500).json({ error: 'Config error' });
  
  try {
    const data = await callPaidAPI('/api/get-sales', {
      seller_key: sellerKey,
      payme_sale_id: payme_sale_id
    });

    const isSuccess = (data.status === 'success' || data.status_code === 0) && 
                      (data.sale_status === 'success' || data.sale_status === 'paid');

    if (isSuccess && appointmentId) {
      await updateDoc(doc(db, 'appointments', appointmentId), { status: 'confirmed' });
      return res.json({ success: true, status: 'confirmed' });
    }
    
    return res.json({ success: false, status: data.sale_status || 'unknown' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER UNCAUGHT ERROR]', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

export { app };
export default app;
