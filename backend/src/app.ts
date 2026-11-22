import type { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler';
import { PrismaEmployeeRepository } from './modules/employees/employee.repository';
import { createEmployeeRouter } from './modules/employees/employee.routes';
import { EmployeeService } from './modules/employees/employee.service';

export interface AppOptions {
  corsOrigin: string;
  logger: Logger;
  prisma: PrismaClient;
}

/** Composition root: wires repositories → services → routers. */
export function createApp({ corsOrigin, logger, prisma }: AppOptions): Express {
  const employeeService = new EmployeeService(new PrismaEmployeeRepository(prisma));

  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigin.split(',').map((o) => o.trim()) }));
  app.use(express.json({ limit: '100kb' }));
  app.use(pinoHttp({ logger }));

  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/v1/employees', createEmployeeRouter(employeeService));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
