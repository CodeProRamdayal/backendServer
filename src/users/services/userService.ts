import bcrypt from 'bcryptjs';
import { Includeable, Op } from 'sequelize';
import { sequelize } from '../../database/config';
import { EmployeeSalary, Role, User, UserRole } from '../../database/models';
import { HttpError } from '../../common/errors';

const userIncludes: Includeable[] = [
  { model: Role, as: 'roles', through: { attributes: [] } },
  { model: EmployeeSalary, as: 'salary' }
];

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleIds: string[];
}

export async function createUser(input: CreateUserInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return sequelize.transaction(async (transaction) => {
    const roles = await Role.findAll({ where: { id: { [Op.in]: input.roleIds } }, transaction });
    if (roles.length !== new Set(input.roleIds).size) throw new HttpError(400, 'One or more role IDs are invalid.');
    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash
    }, { transaction });
    if (roles.length) await user.setRoles(roles, { transaction });
    const created = await User.findByPk(user.id, { include: userIncludes, transaction });
    if (!created) throw new HttpError(500, 'Created user could not be retrieved.');
    return created;
  });
}

export async function getUser(id: string) {
  const user = await User.findByPk(id, { include: userIncludes });
  if (!user) throw new HttpError(404, 'User not found.');
  return user;
}

export async function listUsers(page: number, limit: number, search?: string) {
  const where = search ? {
    [Op.or]: [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ]
  } : {};
  const result = await User.findAndCountAll({
    where, include: userIncludes, distinct: true,
    limit, offset: (page - 1) * limit, order: [['createdAt', 'DESC']]
  });
  return { items: result.rows, total: result.count, page, limit };
}

export async function updateUser(id: string, input: Partial<CreateUserInput>) {
  const passwordHash = input.password === undefined ? undefined : await bcrypt.hash(input.password, 12);
  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(id, { transaction });
    if (!user) throw new HttpError(404, 'User not found.');
    const roles = input.roleIds === undefined ? undefined : await Role.findAll({
      where: { id: { [Op.in]: input.roleIds } },
      transaction
    });
    if (roles && roles.length !== new Set(input.roleIds ?? []).size) {
      throw new HttpError(400, 'One or more role IDs are invalid.');
    }

    const updates: Partial<User> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.email !== undefined) updates.email = input.email.toLowerCase();
    if (input.phone !== undefined) updates.phone = input.phone;
    if (passwordHash !== undefined) {
      updates.passwordHash = passwordHash;
      updates.tokenVersion = user.tokenVersion + 1;
    }
    await user.update(updates, { transaction });
    if (roles) await user.setRoles(roles, { transaction });
    const updated = await User.findByPk(id, { include: userIncludes, transaction });
    if (!updated) throw new HttpError(500, 'Updated user could not be retrieved.');
    return updated;
  });
}

export function serializeUser(user: User) {
  const result = user.toJSON() as Record<string, unknown>;
  delete result.passwordHash;
  delete result.tokenVersion;
  return result;
}

export async function deleteUser(id: string) {
  await sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(id, { transaction });
    if (!user) throw new HttpError(404, 'User not found.');
    await EmployeeSalary.destroy({ where: { userId: id }, transaction });
    await UserRole.destroy({ where: { userId: id }, transaction });
    await user.destroy({ transaction });
  });
}
