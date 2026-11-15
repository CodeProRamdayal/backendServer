import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../database/config';

export class RolePermission extends Model<InferAttributes<RolePermission>, InferCreationAttributes<RolePermission>> {
  declare id: CreationOptional<string>;
  declare roleId: string;
  declare permissionId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

RolePermission.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  roleId: { type: DataTypes.UUID, allowNull: false },
  permissionId: { type: DataTypes.UUID, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, {
  sequelize,
  tableName: 'role_permissions',
  paranoid: true,
  underscored: true,
  indexes: [{
    unique: true,
    fields: ['role_id', 'permission_id'],
    where: { deletedAt: null }
  }]
});
