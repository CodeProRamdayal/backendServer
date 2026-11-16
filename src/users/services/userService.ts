import bcrypt from 'bcryptjs';
import { Includeable, Op, QueryTypes } from 'sequelize';
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
  const searchClause = search ? 'AND (u.name ILIKE :search OR u.email ILIKE :search)' : '';
  const replacements = search ? { search: `%${search}%` } : {};
  const employeeClause = `(
    EXISTS (
      SELECT 1 FROM employee_salaries es
      WHERE es.user_id = u.id AND es.deleted_at IS NULL
    )
    OR NOT EXISTS (
      SELECT 1
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
      WHERE ur.user_id = u.id
        AND ur.deleted_at IS NULL
        AND r.name IN ('System_ADMIN', 'HR', 'HR Management')
    )
  )`;
  const [count] = await sequelize.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM users u
     WHERE u.deleted_at IS NULL AND ${employeeClause} ${searchClause}`,
    { replacements, type: QueryTypes.SELECT }
  );
  const pageRows = await sequelize.query<{ id: string }>(
    `SELECT u.id FROM users u
     WHERE u.deleted_at IS NULL AND ${employeeClause} ${searchClause}
     ORDER BY u.created_at DESC, u.id ASC
     LIMIT :limit OFFSET :offset`,
    {
      replacements: { ...replacements, limit, offset: (page - 1) * limit },
      type: QueryTypes.SELECT
    }
  );
  const ids = pageRows.map((row) => row.id);
  const users = ids.length
    ? await User.findAll({ where: { id: { [Op.in]: ids } }, include: userIncludes })
    : [];
  const usersById = new Map(users.map((user) => [user.id, user]));
  return {
    items: ids.flatMap((id) => {
      const user = usersById.get(id);
      return user ? [user] : [];
    }),
    total: Number(count.total),
    page,
    limit
  };
}

export async function getUserSummary() {
  const employeeClause = `(
    EXISTS (
      SELECT 1 FROM employee_salaries es
      WHERE es.user_id = u.id AND es.deleted_at IS NULL
    )
    OR NOT EXISTS (
      SELECT 1
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
      WHERE ur.user_id = u.id
        AND ur.deleted_at IS NULL
        AND r.name IN ('System_ADMIN', 'HR', 'HR Management')
    )
  )`;
  const [totals] = await sequelize.query<{
    totalEmployees: string;
    totalSalary: string;
  }>(
    `WITH employees AS (
       SELECT u.id FROM users u
       WHERE u.deleted_at IS NULL AND ${employeeClause}
     )
     SELECT
       COUNT(DISTINCT employees.id) AS "totalEmployees",
       COALESCE(SUM(es.salary_amount), 0) AS "totalSalary"
     FROM employees
     LEFT JOIN employee_salaries es
       ON es.user_id = employees.id AND es.deleted_at IS NULL`,
    { type: QueryTypes.SELECT }
  );
  const roles = await sequelize.query<{
    roleId: string;
    roleName: string;
    employeeCount: string;
  }>(
    `WITH employees AS (
       SELECT u.id FROM users u
       WHERE u.deleted_at IS NULL AND ${employeeClause}
     )
     SELECT r.id AS "roleId", r.name AS "roleName",
       COUNT(DISTINCT ur.user_id) AS "employeeCount"
     FROM employees
     INNER JOIN user_roles ur
       ON ur.user_id = employees.id AND ur.deleted_at IS NULL
     INNER JOIN roles r
       ON r.id = ur.role_id AND r.deleted_at IS NULL
     GROUP BY r.id, r.name
     ORDER BY r.name`,
    { type: QueryTypes.SELECT }
  );

  return {
    totalEmployees: Number(totals.totalEmployees),
    totalSalary: Number(totals.totalSalary),
    roleCount: roles.length,
    roles: roles.map((role) => ({
      id: role.roleId,
      name: role.roleName,
      employeeCount: Number(role.employeeCount)
    }))
  };
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
