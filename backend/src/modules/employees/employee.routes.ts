import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import type { EmployeeService } from './employee.service';

export function createEmployeeRouter(service: EmployeeService): Router {
  const controller = new EmployeeController(service);
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.get);

  return router;
}
