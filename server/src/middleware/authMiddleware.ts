import { Request, Response, NextFunction } from 'express';
import { TokenService, ITokenPayload } from '../services/tokenService';

export interface AuthenticatedRequest extends Request {
  user?: ITokenPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access Denied. No token provided.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = TokenService.verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      message: 'Access Denied. Invalid or expired token.'
    });
    return;
  }

  req.user = payload;
  next();
};
