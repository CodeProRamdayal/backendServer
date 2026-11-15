import { Request, Response } from 'express';
import { asyncHandler } from '../../common/errors';
import { createRole, deleteRole, getRole, listPermissions, listRoles, updateRole } from '../services/roleService';

export const readRoles = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await listRoles() });
});

export const readPermissions = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await listPermissions() });
});

export const readRole = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await getRole(req.params.id) });
});

export const addRole = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await createRole(req.body.name, req.body.permissionIds) });
});

export const editRole = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await updateRole(req.params.id, req.body.name, req.body.permissionIds) });
});

export const removeRole = asyncHandler(async (req: Request, res: Response) => {
  await deleteRole(req.params.id);
  res.status(204).send();
});
