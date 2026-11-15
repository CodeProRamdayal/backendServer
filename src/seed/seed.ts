import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { sequelize } from '../database/config';
import { EmployeeSalary, Permission, Role, SalaryStructure, User, UserRole } from '../database/models';
import { isValidEmployeePhone } from '../common/validators';

const employeeCount = 10_000;
const batchSize = 1_000;
const permissionNames = ['Create', 'Read', 'Update', 'Delete', 'Approve'];
const rolePermissions: Record<string, string[]> = {
  System_ADMIN: permissionNames,
  'HR': permissionNames,
  'Full Stack Developer': ['Read'],
  'Software Engineer': ['Read'],
  'Senior Software Engineer': ['Read']
};

function requireSeedPassword(name: string) {
  const value = process.env[name];
  if (!value || value.length < 8) throw new Error(`${name} must be set and contain at least 8 characters.`);
  return value;
}

async function seed() {
  const employeePassword = requireSeedPassword('EMPLOYEE_SEED_PASSWORD');
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = requireSeedPassword('ADMIN_PASSWORD');
  const adminPhone = process.env.ADMIN_PHONE;
  const hrEmail = process.env.HR_Email;
  const hrPassword = requireSeedPassword('HR_PASSWORD');
  if (!adminEmail || !adminPhone || !isValidEmployeePhone(adminPhone)) {
    throw new Error('ADMIN_EMAIL and a 10-digit ADMIN_PHONE are required.');
  }
  if (!hrEmail || !adminPhone || !isValidEmployeePhone(adminPhone)) {
    throw new Error('HR_EMAIL and a 10-digit ADMIN_PHONE are required.');
  }

  await sequelize.authenticate();
  const permissions = await Promise.all(permissionNames.map((name) =>
    Permission.findOrCreate({ where: { name }, defaults: { name } }).then(([permission]) => permission)
  ));
  const permissionMap = new Map(permissions.map((permission) => [permission.name, permission]));
  const roles = new Map<string, Role>();
  for (const [name, names] of Object.entries(rolePermissions)) {
    const [role] = await Role.findOrCreate({ where: { name }, defaults: { name } });
    const assigned = names.map((permissionName) => permissionMap.get(permissionName)!);
    await role.setPermissions(assigned);
    roles.set(name, role);
  }

  const employeeRole = roles.get('Software Engineer')!;
  const passwordHash = await bcrypt.hash(employeePassword, 12);
  for (let start = 1; start <= employeeCount; start += batchSize) {
    const end = Math.min(start + batchSize - 1, employeeCount);
    const users = [];
    for (let number = start; number <= end; number++) {
      const suffix = String(number).padStart(5, '0');
      users.push({
        name: `Employee ${suffix}`,
        email: `employee${suffix}@example.com`,
        phone: String(2_000_000_000 + number),
        passwordHash
      });
    }
    await User.bulkCreate(users, { ignoreDuplicates: true });

    const emails = users.map((user) => user.email);
    const batchUsers = await User.findAll({ where: { email: { [Op.in]: emails } }, attributes: ['id'] });
    await UserRole.bulkCreate(
      batchUsers.map((user) => ({ userId: user.id, roleId: employeeRole.id })),
      { ignoreDuplicates: true }
    );
  }

  let structure = await SalaryStructure.findOne({ where: { name: 'Standard' } });
  if (!structure) structure = await SalaryStructure.create({ name: 'Standard', amount: '50000.00' });
  const adminRole = roles.get('System_ADMIN')!;
  let [admin] = await User.findOrCreate({
    where: { email: adminEmail.toLowerCase() },
    defaults: {
      name: 'System Administrator',
      email: adminEmail.toLowerCase(),
      phone: adminPhone,
      passwordHash: await bcrypt.hash(adminPassword, 12)
    }
  });
  await UserRole.findOrCreate({ where: { userId: admin.id, roleId: adminRole.id }, defaults: { userId: admin.id, roleId: adminRole.id } });

  const hrRole = roles.get('HR')!;
  let [hr] = await User.findOrCreate({
    where: { email: hrEmail.toLowerCase() },
    defaults: {
      name: 'HR',
      email: hrEmail.toLowerCase(),
      phone: '7777777777',
      passwordHash: await bcrypt.hash(hrPassword, 12)
    }
  })

  await UserRole.findOrCreate({ where: { userId: hr.id, roleId: hrRole.id }, defaults: { userId: hr.id, roleId: hrRole.id } });

  const seededEmployees = await User.findAll({
    where: { email: { [Op.like]: 'employee%@example.com' } },
    attributes: ['id'],
    limit: employeeCount
  });
  for (let start = 0; start < seededEmployees.length; start += batchSize) {
    await EmployeeSalary.bulkCreate(
      seededEmployees.slice(start, start + batchSize).map((user) => ({
        userId: user.id,
        salaryStructureId: structure!.id,
        salaryAmount: structure!.amount,
        customAmount: null,
        isDefault: true
      })),
      { ignoreDuplicates: true }
    );
  }

  console.log(`Seeded roles, permissions, administrator, and ${employeeCount} employees.`);
}

seed()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
