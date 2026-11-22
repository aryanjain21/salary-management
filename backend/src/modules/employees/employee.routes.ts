import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import type { EmployeeService } from './employee.service';

export function createEmployeeRouter(service: EmployeeService): Router {
  const controller = new EmployeeController(service);
  const router = Router();

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.get);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
