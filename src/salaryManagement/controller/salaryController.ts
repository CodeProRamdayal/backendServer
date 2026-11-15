import { Request, Response } from 'express';
import { asyncHandler } from '../../common/errors';
import {
  assignEmployeeSalary, createStructure, deleteStructure, getEmployeeSalary,
  listSalaries, listStructures, updateStructure
} from '../services/salaryService';

export const readStructures = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await listStructures() });
});

export const addStructure = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await createStructure(req.body.name, req.body.amount) });
});

export const editStructure = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await updateStructure(req.params.id, req.body) });
});

export const removeStructure = asyncHandler(async (req: Request, res: Response) => {
  await deleteStructure(req.params.id);
  res.status(204).send();
});

export const readSalaries = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 25);
  res.json({ data: await listSalaries(page, limit) });
});

export const readEmployeeSalary = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await getEmployeeSalary(req.params.userId) });
});

export const setEmployeeSalary = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await assignEmployeeSalary(req.params.userId, req.body) });
});
