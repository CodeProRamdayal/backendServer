import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errors';

export function validate(req: Request, _res: Response, next: NextFunction) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(new HttpError(400, result.array().map((issue) => issue.msg).join(', ')));
  }
  next();
}
