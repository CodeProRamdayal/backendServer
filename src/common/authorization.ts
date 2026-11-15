import { NextFunction, Request, Response } from 'express';
import { Permission, Role } from '../database/models';
import { HttpError } from './errors';

export function requirePermission(permissionName: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.authUser) throw new HttpError(401, 'Authentication required.');
      const userWithPermissions = await req.authUser.reload({
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }]
      });
      const roles = userWithPermissions.get('roles') as Array<Role & { permissions: Permission[] }>;
      if (!roles.some((role) => role.permissions.some((permission) => permission.name === permissionName))) {
        throw new HttpError(403, 'You do not have permission to perform this action.');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
