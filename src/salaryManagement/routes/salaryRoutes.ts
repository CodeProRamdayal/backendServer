import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../common/auth';
import { requirePermission } from '../../common/authorization';
import { validate } from '../../common/validation';
import {
  addStructure, editStructure, readEmployeeSalary, readSalaries,
  readStructures, removeStructure, setEmployeeSalary
} from '../controller/salaryController';

const router = Router();
const amount = (field: string) => body(field)
  .isDecimal({ decimal_digits: '0,2' })
  .isFloat({ min: 0, max: 9999999999.99 });
router.use(authenticate);
router.get('/structures', requirePermission('Read'), readStructures);
router.post('/structures',
  requirePermission('Create'),
  body('name').isString().trim().notEmpty().isLength({ max: 100 }),
  amount('amount'),
  validate,
  addStructure
);
router.patch('/structures/:id',
  requirePermission('Update'),
  param('id').isUUID(),
  body('name').optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }).isFloat({ min: 0, max: 9999999999.99 }),
  validate,
  editStructure
);
router.delete('/structures/:id', requirePermission('Delete'), param('id').isUUID(), validate, removeStructure);
router.get('/',
  requirePermission('Read'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  readSalaries
);
router.get('/employees/:userId', requirePermission('Read'), param('userId').isUUID(), validate, readEmployeeSalary);
router.put('/employees/:userId',
  requirePermission('Update'),
  param('userId').isUUID(),
  amount('salaryAmount'),
  body('salaryStructureId').optional({ nullable: true }).isUUID(),
  body('customAmount').optional({ nullable: true }).isDecimal({ decimal_digits: '0,2' })
    .isFloat({ min: 0, max: 9999999999.99 }),
  body('isDefault').optional().isBoolean(),
  validate,
  setEmployeeSalary
);

export default router;
