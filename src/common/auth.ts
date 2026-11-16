import 'dotenv/config';
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { HttpError } from './errors';
import { Role, User } from '../database/models';

declare global {
  namespace Express {
    interface Request {
      authUser?: User;
    }
  }
}

const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
}

export function issueToken(user: User): string {
  return jwt.sign({ sub: user.id, version: user.tokenVersion }, jwtSecret, { expiresIn: '8h' });
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new HttpError(401, 'Authentication required.');
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) throw new HttpError(401, 'Authentication required.');
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      throw new HttpError(401, 'Invalid or expired authentication token.');
    }
    if (typeof payload.sub !== 'string' || typeof payload.version !== 'number') {
      throw new HttpError(401, 'Invalid authentication token.');
    }
    const user = await User.findByPk(payload.sub, {
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }]
    });
    if (!user || user.tokenVersion !== payload.version) {
      throw new HttpError(401, 'Invalid or expired authentication token.');
    }
    req.authUser = user;
    next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    return next(error);
  }
}
