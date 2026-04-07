import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../common/types/types';
import { IAuthService, IRegisterResponse } from './auth.service.interface';
import { IUserService } from '../users/user.service.interface';
import { RegisterDto } from './dto/register.dto';
import { IPasswordHasher } from '../common/utils/hasher/hasher.interface';
import { UserModel } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { JwtService } from './jwt/jwt.service';
import { ILogger } from '../common/logger/logger.interface';
import { TokensPair } from './jwt/types';
import { IUserRepository } from '../users/user.repository.interface';

@injectable()
export class AuthService implements IAuthService {
	constructor(
		@inject(TYPES.IUserService) private readonly userService: IUserService,
		@inject(TYPES.IPasswordHasher) private readonly passwordHasher: IPasswordHasher,
		@inject(TYPES.IUserRepository) private readonly userRepository: IUserRepository,
		@inject(TYPES.ILogger) private readonly logger: ILogger,
		@inject(TYPES.JwtService) private readonly jwtService: JwtService,
	) {}

	async register(registerDto: RegisterDto): Promise<IRegisterResponse | null> {
		const { name, email, password } = registerDto;

		const existUser = await this.userRepository.findByEmail(email);
		if (existUser) {
			return null;
		}

		const passwordHash = await this.passwordHasher.hash(password);
		const createUser = {
			name,
			email,
			passwordHash,
		};

		const createdUser = await this.userService.createUser(createUser);
		if (!createdUser) {
			return null;
		}

		const tokens = this.jwtService.generateTokens({
			userId: createdUser.id,
			email,
		});

		return {
			id: createdUser.id,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		};
	}

	async login(loginDto: LoginDto): Promise<IRegisterResponse | null> {
		const { email } = loginDto;
		const result = await this.validateUser(loginDto);
		if (!result) {
			return null;
		}

		const tokens = this.jwtService.generateTokens({
			userId: result.id,
			email,
		});

		return {
			id: result.id,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		};
	}

	async getMe(email: string): Promise<{ id: number } | null> {
		const user = await this.userRepository.findByEmail(email);
		if (!user) {
			return null;
		}
		return {
			id: user.id,
		};
	}

	async refreshTokens(refreshToken: string): Promise<TokensPair | null> {
		const decoded = this.jwtService.verifyRefreshToken(refreshToken);
		if (!decoded) {
			this.logger.error('Invalid refresh token');
			return null;
		}

		const newTokens = this.jwtService.refreshTokens(refreshToken);
		if (!newTokens) {
			return null;
		}
		this.logger.log('Tokens refreshed successfully', decoded.email);
		return newTokens;
	}

	async validateUser(loginDto: LoginDto): Promise<UserModel | null> {
		const { email, password } = loginDto;
		const user = await this.userRepository.findByEmail(email);
		if (!user) {
			return null;
		}
		const isPasswordValid = await this.passwordHasher.compare(password, user.hasPassword);
		if (!isPasswordValid) {
			return null;
		}
		return user;
	}
}
