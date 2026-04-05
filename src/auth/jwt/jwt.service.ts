import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { DecodedToken, TokenPayload, TokensPair } from './types';
import { TYPES } from '../../common/types/types';
import { IConfigService } from '../../common/config/config.service.interface';
import { ILogger } from '../../common/logger/logger.interface';

@injectable()
export class JwtService {
    constructor(
        @inject(TYPES.IConfigService) private readonly configService: IConfigService,
        @inject(TYPES.ILogger) private readonly logger: ILogger,
    ) {
    }

    public generateTokens(payload: TokenPayload): TokensPair {
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        return { accessToken, refreshToken };
    }

    public generateAccessToken(payload: TokenPayload): string {
        const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET')
        const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN')
        return jwt.sign(payload, accessSecret, {
            expiresIn: accessExpiresIn as jwt.SignOptions['expiresIn']
        });
    }

    public generateRefreshToken(payload: TokenPayload): string {
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')
        const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')
        return jwt.sign(payload, refreshSecret, {
            expiresIn: refreshExpiresIn as jwt.SignOptions['expiresIn']
        });
    }

    public verifyAccessToken(token: string): DecodedToken | null {
        const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
        try {
            const decoded = jwt.verify(token, accessSecret) as DecodedToken;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                this.logger.log('Access token expired');
            } else if (error instanceof jwt.JsonWebTokenError) {
                this.logger.error('Invalid access token');
            }
            return null;
        }
    }

    public verifyRefreshToken(token: string): DecodedToken | null {
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')
        try {
            const decoded = jwt.verify(token, refreshSecret) as DecodedToken;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                this.logger.log('Refresh token expired');
            } else if (error instanceof jwt.JsonWebTokenError) {
                this.logger.error('Invalid refresh token');
            }
            return null;
        }
    }

    public refreshTokens(refreshToken: string): TokensPair | null {
        const decoded = this.verifyRefreshToken(refreshToken);
        if (!decoded) {
            return null;
        }
        const payload: TokenPayload = {
            email: decoded.email,
        };
        return this.generateTokens(payload);
    }

    public decodeToken(token: string): TokenPayload | null {
        try {
            const decoded = jwt.decode(token) as TokenPayload;
            return decoded || null;
        } catch {
            return null;
        }
    }

}
