import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db/connection.js';
import { appUrl, corsOrigins, isProduction } from './config/env.js';
import onboardingRoutes from './routes/onboarding.js';
import adminOnboardingRoutes from './routes/admin-onboarding.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import adminRoutes from './routes/admin.js';
import lecturerRoutes from './routes/lecturer.js';
import analyticsRoutes from './routes/analytics.js';
import progressRoutes from './routes/progress.js';
import listRoutes from './routes/list.js';
import uploadRoutes from './routes/upload.js';
import tracksRoutes from './routes/tracks.js';
import checkoutRoutes from './routes/checkout.js';
import premium88Routes from './routes/premium88.js';
import legalRoutes from './routes/legal.js';
import questionsRoutes from './routes/questions.js';
import playbackRoutes from './routes/playback.js';
import webinarRoutes from './routes/webinar.js';
import { optionalAuth, requireAdmin, requireAuth } from './middleware/auth.js';
import { UPLOADS_DIR, ensureUploadsDir } from './services/uploadService.js';
import { isS3Enabled } from './services/s3Upload.js';
import { handleStripeWebhook, processDueInstallments, isStripeEnabled } from './services/stripeService.js';
import { startWebinarReminderScheduler } from './jobs/webinarReminders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || (isProduction() ? 3000 : 3001));

if (isProduction()) {
  app.set('trust proxy', 1);
}

const origins = corsOrigins();
app.use(
  cors(
    origins === true
      ? undefined
      : {
          origin: origins,
          credentials: true,
        }
  )
);

app.post('/api/checkout/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body)) {
      res.status(400).json({ error: 'גוף הבקשה אינו תקין' });
      return;
    }
    const result = await handleStripeWebhook(req.body, req.headers['stripe-signature'] as string | undefined);
    res.json(result);
  } catch (err) {
    const status = (err as { status?: number }).status || 400;
    res.status(status).json({ error: (err as Error).message });
  }
});
app.use(express.json());
ensureUploadsDir();
app.use('/uploads', express.static(UPLOADS_DIR, { fallthrough: false, index: false }));

getDb();

app.get('/api/health', (_req, res) => {
  try {
    getDb();
    res.json({
      status: 'ok',
      service: 'infinite-masterpiece-vod',
      env: process.env.NODE_ENV || 'development',
      appUrl: appUrl(),
      stripe: isStripeEnabled(),
      s3: isS3Enabled(),
    });
  } catch (err) {
    res.status(503).json({ status: 'error', message: (err as Error).message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/lecturer', requireAuth, lecturerRoutes);
app.use('/api/analytics', optionalAuth, analyticsRoutes);
app.use('/api/progress', requireAuth, progressRoutes);
app.use('/api/list', requireAuth, listRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/premium-88', premium88Routes);
app.use('/api/legal', legalRoutes);
app.use('/api/webinar', webinarRoutes);
app.use('/api/questions', requireAuth, questionsRoutes);
app.use('/api/library', optionalAuth, playbackRoutes);
app.use('/api/upload', requireAuth, uploadRoutes);
app.use('/api/admin/onboarding', requireAdmin, adminOnboardingRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);

if (isProduction()) {
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath, { index: false, maxAge: '1h' }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn('Production mode: dist/ not found — run npm run build first');
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `${isProduction() ? 'Infinite Masterpiece' : 'Onboarding API'} running on http://0.0.0.0:${PORT}`
  );
  const runDue = () => {
    void processDueInstallments().catch(() => undefined);
  };
  runDue();
  setInterval(runDue, 60_000);
  startWebinarReminderScheduler();
});
