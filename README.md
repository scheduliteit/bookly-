# EasyBookly
The ultimate intelligent scheduling platform for modern businesses.

## Sync Status
Last Sync Attempt: 2026-03-18T17:03:15Z
Sync ID: force-sync-v3

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express (Node.js)
- **Deployment**: Netlify (with Netlify Functions)

## Netlify Deployment Guide
1. **GitHub**: Ensure your latest code is pushed to GitHub.
2. **Netlify**: Create a new site from Git.
3. **Build Settings**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Functions Directory: `netlify/functions`
4. **Environment Variables**: Add all keys from `.env.example` to Netlify's environment settings.
5. **Domain**: In Netlify, go to **Domain Management** and add your GoDaddy domain.
6. **GoDaddy**: Update your DNS settings (Nameservers or A/CNAME records) as instructed by Netlify.

## Sync Trigger
This is a manual sync trigger to force the GitHub repository to update.
Timestamp: 2026-03-17T20:15:00Z
Random ID: 508897601969-AAL6THY3TI4EOGTU3IYVNN

## Project Features
- AI-Powered Scheduling
- Real-time Notifications
- Stripe Integration
- Twilio SMS
- Google Calendar Sync
- Custom Booking Pages
- Multi-currency Support
- Client CRM
- Marketing Studio
- Advanced Analytics
