
import { app } from './server.js';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

async function start() {
  console.log('[DEV-SERVER] Starting Vite development server...');
  
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use Vite's connect instance as middleware
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DEV-SERVER] EasyBookly Dev Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('[DEV-SERVER] Failed to start:', err);
  process.exit(1);
});
