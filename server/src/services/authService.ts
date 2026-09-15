import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, IUser } from '../models/User';
import { Session, ISession } from '../models/Session';

const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_DAYS = 7;

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET environment variable is missing');
  }
  return secret;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashFingerprint(val?: string): string | null {
  if (!val) return null;
  return crypto.createHash('sha256').update(val).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(user: IUser | { id: string; email: string }): string {
  const userId = (user as any).id || (user as any)._id?.toString();
  const payload: AccessTokenPayload = {
    userId,
    email: user.email,
  };

  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getAccessSecret()) as AccessTokenPayload;
}

export function generateRawRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export async function createSession(
  userId: Types.ObjectId | string,
  rawRefreshToken: string,
  userAgent?: string,
  ip?: string
): Promise<ISession> {
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    userId: new Types.ObjectId(userId),
    tokenHash,
    expiresAt,
    userAgentHash: hashFingerprint(userAgent),
    createdIpHash: hashFingerprint(ip),
  });

  return session;
}

export async function rotateSession(
  rawRefreshToken: string,
  userAgent?: string,
  ip?: string
): Promise<{ newAccessToken: string; newRefreshToken: string; user: IUser }> {
  const tokenHash = hashToken(rawRefreshToken);
  const session = await Session.findOne({ tokenHash });

  if (!session) {
    const error: any = new Error('Invalid refresh token session');
    error.statusCode = 401;
    error.code = 'INVALID_SESSION';
    throw error;
  }

  // Reuse detection: If a revoked session is presented, someone may have stolen the token!
  if (session.revokedAt) {
    // Revoke all remaining sessions for this user immediately
    await Session.updateMany(
      { userId: session.userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    const error: any = new Error('Compromised session detected. All sessions have been revoked.');
    error.statusCode = 401;
    error.code = 'TOKEN_REUSE_DETECTED';
    throw error;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    const error: any = new Error('Session has expired. Please log in again.');
    error.statusCode = 401;
    error.code = 'SESSION_EXPIRED';
    throw error;
  }

  const user = await User.findById(session.userId);
  if (!user || user.status === 'disabled') {
    const error: any = new Error('User account is inactive or no longer exists');
    error.statusCode = 401;
    error.code = 'USER_INACTIVE';
    throw error;
  }

  // Generate new refresh token and session
  const newRawRefreshToken = generateRawRefreshToken();
  const newSession = await createSession(user._id, newRawRefreshToken, userAgent, ip);

  // Mark old session as revoked and record replacement
  session.revokedAt = new Date();
  session.replacedBySessionId = newSession._id as Types.ObjectId;
  await session.save();

  // Generate new short-lived access token
  const newAccessToken = generateAccessToken(user);

  return {
    newAccessToken,
    newRefreshToken: newRawRefreshToken,
    user,
  };
}

export async function revokeSession(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await Session.updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllUserSessions(userId: Types.ObjectId | string): Promise<void> {
  await Session.updateMany(
    { userId: new Types.ObjectId(userId), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export function getCookieConfig(type: 'access' | 'refresh') {
  const isProd = process.env.NODE_ENV === 'production';
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };

  if (type === 'access') {
    return {
      ...base,
      maxAge: 15 * 60 * 1000, // 15 minutes
    };
  }

  return {
    ...base,
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000, // 7 days
  };
}
