import type { Request, Response } from 'express';
import { parseInput } from '../../http/validation';
import { idParamSchema, listEmployeesQuerySchema } from './employee.schema';
import type { EmployeeService } from './employee.service';

export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  list = async (req: Request, res: Response) => {
    const query = parseInput(listEmployeesQuerySchema, req.query);
    res.json(await this.service.list(query));
  };

  get = async (req: Request, res: Response) => {
    const { id } = parseInput(idParamSchema, req.params);
    res.json(await this.service.get(id));
  };
}
