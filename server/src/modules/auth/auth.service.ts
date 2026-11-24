import crypto from 'crypto';
import { AuthRepository } from './auth.repository.js';
import { RegisterDto, LoginDto } from './auth.schema.js';
import { PasswordUtil } from '../../utils/password.js';
import { JwtUtil, TokenPayload } from '../../utils/jwt.js';
import { ApiError } from '../../utils/api-error.js';

export class AuthService {
  constructor(private readonly authRepo: AuthRepository = new AuthRepository()) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.authRepo.findUserByEmail(dto.email);
    if (existingEmail) {
      throw ApiError.conflict('An account with this email already exists');
    }

    if (dto.studentId) {
      const existingStudentId = await this.authRepo.findUserByStudentId(dto.studentId);
      if (existingStudentId) {
        throw ApiError.conflict('A student with this student ID already exists');
      }
    }

    const passwordHash = await PasswordUtil.hash(dto.password);

    // Public registration is strictly STUDENT role
    const user = await this.authRepo.createUser({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: 'STUDENT',
      studentId: dto.studentId || null,
    });

    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = JwtUtil.signAccessToken(tokenPayload);
    const familyId = crypto.randomUUID();
    const { token: refreshToken } = JwtUtil.signRefreshToken(tokenPayload, familyId);
    const tokenHash = JwtUtil.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepo.createRefreshToken({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.authRepo.findUserByEmail(dto.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw ApiError.forbidden('Your account is inactive. Please contact administrator.');
    }

    const isMatch = await PasswordUtil.verify(user.passwordHash, dto.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = JwtUtil.signAccessToken(tokenPayload);
    const familyId = crypto.randomUUID();
    const { token: refreshToken } = JwtUtil.signRefreshToken(tokenPayload, familyId);
    const tokenHash = JwtUtil.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepo.createRefreshToken({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(incomingToken: string) {
    let decoded: TokenPayload & { tokenId: string; familyId: string };
    try {
      decoded = JwtUtil.verifyRefreshToken(incomingToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const incomingHash = JwtUtil.hashToken(incomingToken);
    const storedToken = await this.authRepo.findRefreshToken(incomingHash);

    // Reuse detection: if token is missing or already revoked, invalidate entire family!
    if (!storedToken || storedToken.isRevoked) {
      await this.authRepo.revokeTokenFamily(decoded.familyId);
      throw ApiError.unauthorized('Token reuse detected. Session invalidated.');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.authRepo.revokeToken(incomingHash);
      throw ApiError.unauthorized('Refresh token expired');
    }

    // Revoke used refresh token
    await this.authRepo.revokeToken(incomingHash);

    const user = await this.authRepo.findUserById(decoded.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw ApiError.unauthorized('User inactive or not found');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const newAccessToken = JwtUtil.signAccessToken(tokenPayload);
    // Rotate refresh token within the same family
    const { token: newRefreshToken } = JwtUtil.signRefreshToken(tokenPayload, decoded.familyId);
    const newHash = JwtUtil.hashToken(newRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepo.createRefreshToken({
      userId: user.id,
      tokenHash: newHash,
      familyId: decoded.familyId,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(incomingToken?: string) {
    if (incomingToken) {
      try {
        const decoded = JwtUtil.verifyRefreshToken(incomingToken);
        await this.authRepo.revokeTokenFamily(decoded.familyId);
      } catch {
        const hash = JwtUtil.hashToken(incomingToken);
        await this.authRepo.revokeToken(hash).catch(() => {});
      }
    }
  }

  async getMe(userId: string) {
    const user = await this.authRepo.getUserWithActiveGroup(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const activeMembership = user.groupMemberships[0];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      status: user.status,
      activeGroup: activeMembership
        ? {
            id: activeMembership.group.id,
            name: activeMembership.group.name,
            role: activeMembership.role,
            maxMembers: activeMembership.group.maxMembers,
          }
        : null,
    };
  }
}
