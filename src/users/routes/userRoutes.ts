import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../common/auth';
import { requirePermission } from '../../common/authorization';
import { validate } from '../../common/validation';
import { isValidEmployeePhone } from '../../common/validators';
import { create, login, logout, readAll, readOne, remove, update } from '../controller/userController';

const router = Router();
const uuid = (field: string) => param(field).isUUID().withMessage(`${field} must be a UUID.`);

router.post('/login', body('email').isEmail(), body('password').isString().notEmpty(), validate, login);
router.use(authenticate);
router.post('/logout', logout);
router.post('/',
  requirePermission('Create'),
  body('name').isString().trim().notEmpty().isLength({ max: 150 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').custom(isValidEmployeePhone),
  body('password').isString().isLength({ min: 8, max: 128 }),
  body('roleIds').isArray({ min: 1 }),
  body('roleIds.*').isUUID(),
  validate,
  create
);
router.get('/',
  requirePermission('Read'),
  query('summary').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 25 }),
  query('search').optional().isString().isLength({ max: 100 }),
  validate,
  readAll
);
router.get('/:id', requirePermission('Read'), uuid('id'), validate, readOne);
router.patch('/:id',
  requirePermission('Update'),
  uuid('id'),
  body('name').optional().isString().trim().notEmpty().isLength({ max: 150 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().custom(isValidEmployeePhone),
  body('password').optional().isString().isLength({ min: 8, max: 128 }),
  body('roleIds').optional().isArray(),
  body('roleIds.*').optional().isUUID(),
  validate,
  update
);
router.delete('/:id', requirePermission('Delete'), uuid('id'), validate, remove);

export default router;
