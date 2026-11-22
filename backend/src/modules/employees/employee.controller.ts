import type { Request, Response } from 'express';
import { parseInput } from '../../http/validation';
import {
  createEmployeeSchema,
  idParamSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from './employee.schema';
import type { EmployeeService } from './employee.service';

/** HTTP adapter only: parse input, call the service, shape the response. */
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

  create = async (req: Request, res: Response) => {
    const input = parseInput(createEmployeeSchema, req.body);
    const employee = await this.service.create(input);
    res.status(201).location(`/api/v1/employees/${employee.id}`).json(employee);
  };

  update = async (req: Request, res: Response) => {
    const { id } = parseInput(idParamSchema, req.params);
    const input = parseInput(updateEmployeeSchema, req.body);
    res.json(await this.service.update(id, input));
  };

  delete = async (req: Request, res: Response) => {
    const { id } = parseInput(idParamSchema, req.params);
    await this.service.delete(id);
    res.status(204).end();
  };
}
