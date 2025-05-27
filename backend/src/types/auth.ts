import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface DecodedToken {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}
