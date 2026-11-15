import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../common/auth';
import { requirePermission } from '../../common/authorization';
import { validate } from '../../common/validation';
import { addRole, editRole, readPermissions, readRole, readRoles, removeRole } from '../controller/roleController';

const router = Router();
router.use(authenticate);
router.get('/permissions', requirePermission('Read'), readPermissions);
router.get('/', requirePermission('Read'), readRoles);
router.get('/:id', requirePermission('Read'), param('id').isUUID(), validate, readRole);
router.post('/',
  requirePermission('Create'),
  body('name').isString().trim().notEmpty().isLength({ max: 100 }),
  body('permissionIds').isArray(),
  body('permissionIds.*').isUUID(),
  validate,
  addRole
);
router.patch('/:id',
  requirePermission('Update'),
  param('id').isUUID(),
  body('name').optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body('permissionIds').optional().isArray(),
  body('permissionIds.*').optional().isUUID(),
  validate,
  editRole
);
router.delete('/:id', requirePermission('Delete'), param('id').isUUID(), validate, removeRole);

export default router;
