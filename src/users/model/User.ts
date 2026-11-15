import {
  BelongsToManySetAssociationsMixin, CreationOptional, DataTypes,
  InferAttributes, InferCreationAttributes, Model
} from 'sequelize';
import { sequelize } from '../../database/config';
import type { Role } from '../../roles/model/Role';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare passwordHash: string;
  declare tokenVersion: CreationOptional<number>;
  declare setRoles: BelongsToManySetAssociationsMixin<Role, string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(254), allowNull: false, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING(10), allowNull: false, validate: { is: /^\d{10}$/ } },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  tokenVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, { sequelize, tableName: 'users', paranoid: true, underscored: true });
