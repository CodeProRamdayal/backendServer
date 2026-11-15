import { EmployeeSalary } from '../salaryManagement/model/EmployeeSalary';
import { SalaryStructure } from '../salaryManagement/model/SalaryStructure';
import { Permission } from '../roles/model/Permission';
import { Role } from '../roles/model/Role';
import { RolePermission } from '../roles/model/RolePermission';
import { UserRole } from '../roles/model/UserRole';
import { User } from '../users/model/User';

User.belongsToMany(Role, { through: UserRole, as: 'roles', foreignKey: 'userId', otherKey: 'roleId' });
Role.belongsToMany(User, { through: UserRole, as: 'users', foreignKey: 'roleId', otherKey: 'userId' });
Role.belongsToMany(Permission, { through: RolePermission, as: 'permissions', foreignKey: 'roleId', otherKey: 'permissionId' });
Permission.belongsToMany(Role, { through: RolePermission, as: 'roles', foreignKey: 'permissionId', otherKey: 'roleId' });
EmployeeSalary.belongsTo(User, { as: 'employee', foreignKey: 'userId' });
User.hasOne(EmployeeSalary, { as: 'salary', foreignKey: 'userId' });
EmployeeSalary.belongsTo(SalaryStructure, { as: 'structure', foreignKey: 'salaryStructureId' });
SalaryStructure.hasMany(EmployeeSalary, { as: 'employees', foreignKey: 'salaryStructureId' });

export { EmployeeSalary, Permission, Role, RolePermission, SalaryStructure, User, UserRole };
