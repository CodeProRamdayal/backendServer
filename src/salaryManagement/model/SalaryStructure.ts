import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../database/config';

export class SalaryStructure extends Model<InferAttributes<SalaryStructure>, InferCreationAttributes<SalaryStructure>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare amount: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

SalaryStructure.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, { sequelize, tableName: 'salary_structures', paranoid: true, underscored: true });
