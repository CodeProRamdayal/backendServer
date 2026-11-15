'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { UUID, STRING, INTEGER, BOOLEAN, DECIMAL, DATE } = Sequelize;
    const timestamps = {
      created_at: { type: DATE, allowNull: false },
      updated_at: { type: DATE, allowNull: false },
      deleted_at: { type: DATE, allowNull: true }
    };

    await queryInterface.createTable('users', {
      id: { type: UUID, primaryKey: true },
      name: { type: STRING(150), allowNull: false },
      email: { type: STRING(254), allowNull: false, unique: true },
      phone: { type: STRING(10), allowNull: false },
      password_hash: { type: STRING, allowNull: false },
      token_version: { type: INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps
    });
    await queryInterface.createTable('roles', {
      id: { type: UUID, primaryKey: true },
      name: { type: STRING(100), allowNull: false, unique: true },
      ...timestamps
    });
    await queryInterface.createTable('permissions', {
      id: { type: UUID, primaryKey: true },
      name: { type: STRING(50), allowNull: false, unique: true },
      ...timestamps
    });
    await queryInterface.createTable('user_roles', {
      id: { type: UUID, primaryKey: true },
      user_id: {
        type: UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      role_id: {
        type: UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'CASCADE'
      },
      ...timestamps
    });
    await queryInterface.addIndex('user_roles', ['user_id', 'role_id'], {
      unique: true,
      name: 'user_roles_user_role_unique',
      where: { deleted_at: null }
    });
    await queryInterface.createTable('role_permissions', {
      id: { type: UUID, primaryKey: true },
      role_id: {
        type: UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: UUID,
        allowNull: false,
        references: { model: 'permissions', key: 'id' },
        onDelete: 'CASCADE'
      },
      ...timestamps
    });
    await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id'], {
      unique: true,
      name: 'role_permissions_role_permission_unique',
      where: { deleted_at: null }
    });
    await queryInterface.createTable('salary_structures', {
      id: { type: UUID, primaryKey: true },
      name: { type: STRING(100), allowNull: false, unique: true },
      amount: { type: DECIMAL(12, 2), allowNull: false },
      ...timestamps
    });
    await queryInterface.createTable('employee_salaries', {
      id: { type: UUID, primaryKey: true },
      user_id: {
        type: UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      salary_structure_id: {
        type: UUID,
        allowNull: true,
        references: { model: 'salary_structures', key: 'id' },
        onDelete: 'SET NULL'
      },
      salary_amount: { type: DECIMAL(12, 2), allowNull: false },
      custom_amount: { type: DECIMAL(12, 2), allowNull: true },
      is_default: { type: BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('employee_salaries');
    await queryInterface.dropTable('salary_structures');
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('user_roles');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('users');
  }
};
