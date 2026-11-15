import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../database/config';

export class EmployeeSalary extends Model<InferAttributes<EmployeeSalary>, InferCreationAttributes<EmployeeSalary>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare salaryStructureId: string | null;
  declare salaryAmount: string;
  declare customAmount: string | null;
  declare isDefault: boolean;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

EmployeeSalary.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, unique: true },
  salaryStructureId: { type: DataTypes.UUID, allowNull: true },
  salaryAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
  customAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true, validate: { min: 0 } },
  isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, { sequelize, tableName: 'employee_salaries', paranoid: true, underscored: true });
