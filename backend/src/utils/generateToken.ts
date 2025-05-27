import jwt, { SignOptions } from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  email?: string;
  role?: string;
}

export const generateToken = (
  userId: string,
  additionalData: Partial<Omit<TokenPayload, 'id'>> = {}
): string => {
  const payload: TokenPayload = {
    id: userId,
    ...additionalData
  };
  const options: SignOptions = {
    expiresIn: '1d',
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, options);
};
