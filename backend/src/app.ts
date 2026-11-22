import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

export interface AppOptions {
  corsOrigin: string;
}

export function createApp({ corsOrigin }: AppOptions): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigin.split(',').map((o) => o.trim()) }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
