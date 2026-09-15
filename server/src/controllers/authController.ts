import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRawRefreshToken,
  createSession,
  rotateSession,
  revokeSession,
  revokeAllUserSessions,
  getCookieConfig,
} from '../services/authService';
import { registerSchema, loginSchema, passwordChangeSchema } from '../validators/auth';
import { AuthenticatedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists.',
          details: [],
        },
      });
      return;
    }

    const passwordHash = await hashPassword(validated.password);

    const user = await User.create({
      email: validated.email,
      passwordHash,
      status: 'active',
      profile: {
        displayName: validated.displayName || validated.email.split('@')[0],
      },
      preferences: {},
    });

    // Create session and issue tokens
    const rawRefreshToken = generateRawRefreshToken();
    await createSession(user._id, rawRefreshToken, req.headers['user-agent'], req.ip);
    const accessToken = generateAccessToken(user);

    res.cookie('accessToken', accessToken, getCookieConfig('access'));
    res.cookie('refreshToken', rawRefreshToken, getCookieConfig('refresh'));

    res.status(201).json({
      success: true,
      data: {
        user,
      },
      message: 'Account registered successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email }).select('+passwordHash');
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          details: [],
        },
      });
      return;
    }

    if (user.status === 'disabled') {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled. Please contact support.',
          details: [],
        },
      });
      return;
    }

    const isMatch = await verifyPassword(validated.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          details: [],
        },
      });
      return;
    }

    // Create session and issue tokens
    const rawRefreshToken = generateRawRefreshToken();
    await createSession(user._id, rawRefreshToken, req.headers['user-agent'], req.ip);
    const accessToken = generateAccessToken(user);

    res.cookie('accessToken', accessToken, getCookieConfig('access'));
    res.cookie('refreshToken', rawRefreshToken, getCookieConfig('refresh'));

    // Return user without passwordHash
    const safeUser = user.toJSON();

    res.status(200).json({
      success: true,
      data: {
        user: safeUser,
      },
      message: 'Logged in successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (!rawRefreshToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token cookie is missing.',
          details: [],
        },
      });
      return;
    }

    const { newAccessToken, newRefreshToken, user } = await rotateSession(
      rawRefreshToken,
      req.headers['user-agent'],
      req.ip
    );

    res.cookie('accessToken', newAccessToken, getCookieConfig('access'));
    res.cookie('refreshToken', newRefreshToken, getCookieConfig('refresh'));

    res.status(200).json({
      success: true,
      data: {
        user,
      },
      message: 'Session refreshed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (rawRefreshToken) {
      await revokeSession(rawRefreshToken);
    }

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const validated = passwordChangeSchema.parse(req.body);

    const user = await User.findById(req.user.userId).select('+passwordHash');
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const isMatch = await verifyPassword(validated.currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password does not match.',
          details: [],
        },
      });
      return;
    }

    user.passwordHash = await hashPassword(validated.newPassword);
    await user.save();

    // Invalidate all past sessions for security, issue fresh session
    await revokeAllUserSessions(user._id);

    const rawRefreshToken = generateRawRefreshToken();
    await createSession(user._id, rawRefreshToken, req.headers['user-agent'], req.ip);
    const accessToken = generateAccessToken(user);

    res.cookie('accessToken', accessToken, getCookieConfig('access'));
    res.cookie('refreshToken', rawRefreshToken, getCookieConfig('refresh'));

    res.status(200).json({
      success: true,
      data: {},
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}
