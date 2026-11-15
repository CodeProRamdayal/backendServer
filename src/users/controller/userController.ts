import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { Role, User } from '../../database/models';
import { HttpError } from '../../common/errors';
import { issueToken } from '../../common/auth';
import { asyncHandler } from '../../common/errors';
import { createUser, deleteUser, getUser, listUsers, serializeUser, updateUser } from '../services/userService';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({
    where: { email: String(req.body.email).toLowerCase() },
    include: [{ model: Role, as: 'roles', through: { attributes: [] } }]
  });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password.');
  }
  const roles = user.get('roles') as Role[];
  res.json({
    data: {
      token: issueToken(user),
      user: { id: user.id, name: user.name, email: user.email, roles: roles.map((role) => role.name) }
    }
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await req.authUser!.increment('tokenVersion');
  res.json({ data: { message: 'Logged out successfully.' } });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUser(req.body);
  res.status(201).json({ data: serializeUser(user) });
});

export const readOne = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: serializeUser(await getUser(req.params.id)) });
});

export const readAll = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 25);
  const result = await listUsers(page, limit, req.query.search as string | undefined);
  res.json({ data: { ...result, items: result.items.map(serializeUser) } });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: serializeUser(await updateUser(req.params.id, req.body)) });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await deleteUser(req.params.id);
  res.status(204).send();
});
