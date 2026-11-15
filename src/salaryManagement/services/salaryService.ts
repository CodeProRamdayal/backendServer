import { Op } from 'sequelize';
import { EmployeeSalary, SalaryStructure, User } from '../../database/models';
import { HttpError } from '../../common/errors';

const salaryIncludes = [
  { model: User, as: 'employee', attributes: ['id', 'name', 'email', 'phone'] },
  { model: SalaryStructure, as: 'structure' }
];

export async function listStructures() {
  return SalaryStructure.findAll({ order: [['name', 'ASC']] });
}

export async function createStructure(name: string, amount: string) {
  return SalaryStructure.create({ name, amount });
}

export async function updateStructure(id: string, input: { name?: string; amount?: string }) {
  const structure = await SalaryStructure.findByPk(id);
  if (!structure) throw new HttpError(404, 'Salary structure not found.');
  await structure.update(input);
  return structure;
}

export async function deleteStructure(id: string) {
  const structure = await SalaryStructure.findByPk(id);
  if (!structure) throw new HttpError(404, 'Salary structure not found.');
  await structure.destroy();
}

export async function listSalaries(page: number, limit: number) {
  const result = await EmployeeSalary.findAndCountAll({
    include: salaryIncludes,
    distinct: true,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']]
  });
  return { items: result.rows, total: result.count, page, limit };
}

export async function getEmployeeSalary(userId: string) {
  const salary = await EmployeeSalary.findOne({ where: { userId }, include: salaryIncludes });
  if (!salary) throw new HttpError(404, 'Salary record not found.');
  return salary;
}

export async function assignEmployeeSalary(
  userId: string,
  input: { salaryAmount: string; salaryStructureId?: string | null; customAmount?: string | null; isDefault?: boolean }
) {
  if (!(await User.findByPk(userId))) throw new HttpError(404, 'User not found.');
  if (input.salaryStructureId && !(await SalaryStructure.findByPk(input.salaryStructureId))) {
    throw new HttpError(404, 'Salary structure not found.');
  }
  const salary = await EmployeeSalary.findOne({ where: { userId } });
  if (salary) await salary.update(input);
  else await EmployeeSalary.create({
    userId,
    salaryAmount: input.salaryAmount,
    salaryStructureId: input.salaryStructureId ?? null,
    customAmount: input.customAmount ?? null,
    isDefault: input.isDefault ?? true
  });
  return getEmployeeSalary(userId);
}
