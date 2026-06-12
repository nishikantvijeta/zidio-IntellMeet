import jwt from 'jsonwebtoken';
import { DbUser } from '../repositories/mockDb';

const JWT_SECRET = process.env.JWT_SECRET || 'intellmeet_access_secret_key_2026_xyz';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'intellmeet_refresh_secret_key_2026_abc';

export interface ITokenPayload {
  userId: string;
  email: string;
  username: string;
}

export class TokenService {
  static generateTokens(user: DbUser) {
    const payload: ITokenPayload = {
      userId: user._id,
      email: user.email,
      username: user.username
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): ITokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as ITokenPayload;
    } catch (error) {
      return null;
    }
  }

  static verifyRefreshToken(token: string): ITokenPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as ITokenPayload;
    } catch (error) {
      return null;
    }
  }
}
