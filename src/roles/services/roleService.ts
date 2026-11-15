import { Op, Transaction } from 'sequelize';
import { Permission, Role } from '../../database/models';
import { sequelize } from '../../database/config';
import { HttpError } from '../../common/errors';

const roleIncludes = [{ model: Permission, as: 'permissions', through: { attributes: [] } }];

async function findPermissions(ids: string[], transaction?: Transaction) {
  const permissions = await Permission.findAll({ where: { id: { [Op.in]: ids } }, transaction });
  if (permissions.length !== new Set(ids).size) throw new HttpError(400, 'One or more permission IDs are invalid.');
  return permissions;
}

export async function listRoles() {
  return Role.findAll({ include: roleIncludes, order: [['name', 'ASC']] });
}

export async function getRole(id: string) {
  const role = await Role.findByPk(id, { include: roleIncludes });
  if (!role) throw new HttpError(404, 'Role not found.');
  return role;
}

export async function createRole(name: string, permissionIds: string[]) {
  return sequelize.transaction(async (transaction) => {
    const permissions = await findPermissions(permissionIds, transaction);
    const role = await Role.create({ name }, { transaction });
    await role.setPermissions(permissions, { transaction });
    const created = await Role.findByPk(role.id, { include: roleIncludes, transaction });
    if (!created) throw new HttpError(500, 'Created role could not be retrieved.');
    return created;
  });
}

export async function updateRole(id: string, name?: string, permissionIds?: string[]) {
  return sequelize.transaction(async (transaction) => {
    const role = await Role.findByPk(id, { transaction });
    if (!role) throw new HttpError(404, 'Role not found.');
    const permissions = permissionIds === undefined ? undefined : await findPermissions(permissionIds, transaction);
    if (name !== undefined) await role.update({ name }, { transaction });
    if (permissions !== undefined) await role.setPermissions(permissions, { transaction });
    const updated = await Role.findByPk(id, { include: roleIncludes, transaction });
    if (!updated) throw new HttpError(500, 'Updated role could not be retrieved.');
    return updated;
  });
}

export async function deleteRole(id: string) {
  const role = await Role.findByPk(id);
  if (!role) throw new HttpError(404, 'Role not found.');
  await role.destroy();
}

export async function listPermissions() {
  return Permission.findAll({ order: [['name', 'ASC']] });
}
