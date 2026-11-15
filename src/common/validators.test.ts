import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidEmployeePhone } from './validators';

test('employee phone accepts exactly 10 digits', () => {
  assert.equal(isValidEmployeePhone('9876543210'), true);
  assert.equal(isValidEmployeePhone('987654321'), false);
  assert.equal(isValidEmployeePhone('98765432101'), false);
  assert.equal(isValidEmployeePhone('98765A3210'), false);
});
