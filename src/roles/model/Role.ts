import {
  BelongsToManySetAssociationsMixin, CreationOptional, DataTypes,
  InferAttributes, InferCreationAttributes, Model
} from 'sequelize';
import { sequelize } from '../../database/config';
import type { Permission } from './Permission';

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
  declare setPermissions: BelongsToManySetAssociationsMixin<Permission, string>;
}

Role.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, { sequelize, tableName: 'roles', paranoid: true, underscored: true });
