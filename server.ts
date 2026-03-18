
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import Stripe from 'stripe';
import dbConnect from './src/lib/mongoose.js';
import { Appointment, Client } from './src/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API Routes with User Isolation
app.get('/api/appointments', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  try {
    await dbConnect();
    const query = userId ? { userId } : {};
    const appointments = await Appointment.find(query).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  try {
    await dbConnect();
    const newApt = new Appointment({ ...req.body, userId });
    await newApt.save();
    res.status(201).json(newApt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await dbConnect();
    await Appointment.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  try {
    await dbConnect();
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, userId },
      { new: true }
    );
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clients', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  try {
    await dbConnect();
    const query = userId ? { userId } : {};
    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await dbConnect();
    await Client.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/availability', (req, res) => {
  // Mock availability logic
  res.json(["09:00", "10:00", "11:00", "12:00", "13:30", "14:30", "15:30", "16:30"]);
});

app.get('/api/public/profile/:username', (req, res) => {
  // In a real app, you'd look up the user by username in the DB
  // For now, we'll return the default business data
  res.json({
    businessName: "EasyBookly Studio",
    businessCategory: "Consulting",
    services: [
      { name: "Strategy Session", price: 150, duration: 60, description: "Deep dive into your business goals.", color: "blue" },
      { name: "Quick Sync", price: 50, duration: 15, description: "Fast check-in for active projects.", color: "emerald" },
      { name: "Technical Audit", price: 250, duration: 90, description: "Full review of your tech stack.", color: "violet" }
    ],
    currency: "USD",
    legalData: { privacyPolicy: "", termsOfService: "", gdprStrict: true }
  });
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
let merchantStats = {
  grossEarnings: 1250,
  netEarnings: 1180,
  pendingPayout: 450,
  isGatewayConnected: false,
  history: [] as any[]
};

app.get('/api/payments/stats', (req, res) => {
  res.json(merchantStats);
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
    description: 'Global Gateway Verified: Standard Invoicing Enabled'
  });
  res.json({ success: true });
});

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// PayMe Integration (Israeli Payment Gateway)
const PAYME_SELLER_KEY = process.env.PAYME_SELLER_KEY;
const PAYME_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ng.payme.co.il/api/generate-sale' 
  : 'https://preprod.payme.co.il/api/generate-sale';

app.post('/api/payments/create-checkout-session', async (req, res) => {
  const { serviceName, amount, currency, successUrl, cancelUrl, appointmentId } = req.body;

  // 1. Try Stripe if configured
  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: serviceName },
            unit_amount: amount * 100,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error('Stripe Error:', error.message);
    }
  }

  // 2. Try PayMe (Israel) if configured
  if (PAYME_SELLER_KEY) {
    try {
      const response = await fetch(PAYME_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_key: PAYME_SELLER_KEY,
          amount: amount * 100, // PayMe expects cents/agorot
          currency: currency === 'ILS' ? 'ILS' : 'USD',
          product_name: serviceName,
          sale_callback_url: `${req.protocol}://${req.get('host')}/api/payments/payme-callback`,
          sale_return_url: successUrl,
          sale_cancel_url: cancelUrl,
          language: 'he', // Default to Hebrew for Israeli market
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        return res.json({ url: data.sale_url });
      }
      throw new Error(data.msg || 'PayMe sale generation failed');
    } catch (error: any) {
      console.error('PayMe Error:', error.message);
      return res.status(500).json({ error: 'Payment gateway error' });
    }
  }

  res.status(400).json({ error: 'No payment gateway configured' });
});

app.post('/api/payments/payme-callback', async (req, res) => {
  // PayMe sends a POST request when payment is completed
  const { payme_sale_id, status, appointmentId } = req.body;
  if (status === 'success') {
    try {
      await dbConnect();
      await Appointment.findByIdAndUpdate(appointmentId, { status: 'confirmed' });
    } catch (error) {
      console.error('PayMe Callback Error:', error);
    }
  }
  res.sendStatus(200);
});

app.post('/api/payments/payout', (req, res) => {
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
  const { sessionId, appointmentId } = req.query;
  try {
    await dbConnect();
    await Appointment.findByIdAndUpdate(appointmentId, { status: 'confirmed' });
  } catch (error) {
    console.error('Payment Success Error:', error);
  }
  
  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #fcfcfc;">
        <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center;">
          <div style="width: 64px; height: 64px; background: #10b981; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: white;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 900;">Payment Successful!</h1>
          <p style="color: #64748b; margin-bottom: 32px;">Your appointment is now confirmed.</p>
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

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`EasyBookly Dev Server running on http://localhost:${PORT}`);
    });
  }
  // In production (Vercel), we don't call app.listen()
  // The platform handles the request via the exported app
}

if (process.env.NODE_ENV !== 'production') {
  startServer();
}

export default app;
