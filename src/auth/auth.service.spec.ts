import 'reflect-metadata';
import { AuthService } from './auth.service';
import { IUserService } from '../users/user.service.interface';
import { IPasswordHasher } from '../common/utils/hasher/hasher.interface';
import { JwtService } from './jwt/jwt.service';
import { ILogger } from '../common/logger/logger.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserModel } from '@prisma/client';
import { TokensPair } from './jwt/types';
import { IUserRepository } from '../users/user.repository.interface';
import { Container } from 'inversify';
import { IAuthService } from './auth.service.interface';
import { TYPES } from '../common/types/types';

const UserServiceMock = {
	createUser: jest.fn(),
} as jest.Mocked<IUserService>;

const PasswordHasherMock = {
	hash: jest.fn(),
	compare: jest.fn(),
} as jest.Mocked<IPasswordHasher>;

const UserRepositoryMock = {
	create: jest.fn(),
	findByEmail: jest.fn(),
} as jest.Mocked<IUserRepository>;

const LoggerMock = {
	logger: undefined,
	log: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
} as jest.Mocked<ILogger>;

const JwtServiceMock = {
	generateTokens: jest.fn(),
	generateAccessToken: jest.fn(),
	generateRefreshToken: jest.fn(),
	verifyAccessToken: jest.fn(),
	verifyRefreshToken: jest.fn(),
	refreshTokens: jest.fn(),
	decodeToken: jest.fn(),
} as unknown as jest.Mocked<JwtService>;

describe('AuthService', () => {
	let authService: IAuthService;

	beforeEach(() => {
		const container = new Container();
		container.bind<IAuthService>(TYPES.IAuthService).to(AuthService);
		container.bind<IUserService>(TYPES.IUserService).toConstantValue(UserServiceMock);
		container.bind<IPasswordHasher>(TYPES.IPasswordHasher).toConstantValue(PasswordHasherMock);
		container.bind<IUserRepository>(TYPES.IUserRepository).toConstantValue(UserRepositoryMock);
		container.bind<ILogger>(TYPES.ILogger).toConstantValue(LoggerMock);
		container.bind<JwtService>(TYPES.JwtService).toConstantValue(JwtServiceMock);

		authService = container.get<IAuthService>(TYPES.IAuthService);

		jest.clearAllMocks();
	});

	describe('register', () => {
		const registerDto: RegisterDto = {
			name: 'user',
			email: 'user@bk.ru',
			password: '123456',
		};

		const mockUser = {
			id: 1,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: '123456',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockTokens: TokensPair = {
			accessToken: 'access-token-123',
			refreshToken: 'refresh-token-456',
		};

		it('should successfully register a new user and return tokens', async () => {
			UserRepositoryMock.findByEmail.mockResolvedValue(null);
			PasswordHasherMock.hash.mockResolvedValue('hashedPassword');
			UserServiceMock.createUser.mockResolvedValue(mockUser);
			JwtServiceMock.generateTokens.mockReturnValue(mockTokens);

			const result = await authService.register(registerDto);
	
			expect(UserRepositoryMock.findByEmail).toHaveBeenCalledWith(registerDto.email);
			expect(PasswordHasherMock.hash).toHaveBeenCalledWith(registerDto.password);
			expect(UserServiceMock.createUser).toHaveBeenCalledWith({
				name: registerDto.name,
				email: registerDto.email,
				passwordHash: 'hashedPassword',
			});
			expect(JwtServiceMock.generateTokens).toHaveBeenCalledWith({ email: registerDto.email, userId: mockUser.id });
			expect(result).toEqual({
				id: mockUser.id,
				accessToken: mockTokens.accessToken,
				refreshToken: mockTokens.refreshToken,
			});
		});

		it('should return null if user already exists', async () => {
			UserRepositoryMock.findByEmail.mockResolvedValue(mockUser);

			const result = await authService.register(registerDto);

			expect(UserRepositoryMock.findByEmail).toHaveBeenCalledWith(registerDto.email);
			expect(PasswordHasherMock.hash).not.toHaveBeenCalled();
			expect(UserServiceMock.createUser).not.toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it('should return null if user creation fails', async () => {
			UserRepositoryMock.findByEmail.mockResolvedValue(null);
			PasswordHasherMock.hash.mockResolvedValue('hashedPassword');
			UserServiceMock.createUser.mockResolvedValue(null);

			const result = await authService.register(registerDto);

			expect(UserServiceMock.createUser).toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it('should handle password hashing errors', async () => {
			UserRepositoryMock.findByEmail.mockResolvedValue(null);
			PasswordHasherMock.hash.mockRejectedValue(new Error('Hashing failed'));

			await expect(authService.register(registerDto)).rejects.toThrow('Hashing failed');
		});
	});

	describe('login', () => {
		const loginDto: LoginDto = {
			email: 'user@bk.ru',
			password: '123456',
		};

		const mockUser: UserModel = {
			id: 1,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockTokens: TokensPair = {
			accessToken: 'access-token-123',
			refreshToken: 'refresh-token-456',
		};

		it('should successfully login a user and return tokens', async () => {
			jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
			JwtServiceMock.generateTokens.mockReturnValue(mockTokens);

			const result = await authService.login(loginDto);

			expect(authService.validateUser).toHaveBeenCalledWith(loginDto);
			expect(JwtServiceMock.generateTokens).toHaveBeenCalledWith({ email: loginDto.email, userId: mockUser.id });
			expect(result).toEqual({
				id: mockUser.id,
				accessToken: mockTokens.accessToken,
				refreshToken: mockTokens.refreshToken,
			});
		});

		it('should return null if validation fails', async () => {
			jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

			const result = await authService.login(loginDto);

			expect(authService.validateUser).toHaveBeenCalledWith(loginDto);
			expect(JwtServiceMock.generateTokens).not.toHaveBeenCalled();
			expect(result).toBeNull();
		});
	});

	describe('getMe', () => {
		const email = 'john@example.com';
		const mockUser: UserModel = {
			id: 1,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should return user id if user exists', async () => {
			UserRepositoryMock.findByEmail.mockResolvedValue(mockUser);

			const result = await authService.getMe(email);

			expect(UserRepositoryMock.findByEmail).toHaveBeenCalledWith(email);
			expect(result).toEqual({ id: mockUser.id });
		});

		it('should return null if user not found', async () => {
			UserRepositoryMock.findByEmail.mockResolvedValue(null);

			const result = await authService.getMe(email);

			expect(UserRepositoryMock.findByEmail).toHaveBeenCalledWith(email);
			expect(result).toBeNull();
		});
	});

	describe('refreshTokens', () => {
		const refreshToken = 'valid-refresh-token';
		const decodedToken = {
			userId: 1,
			email: 'john@example.com',
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
		};
		const newTokens: TokensPair = {
			accessToken: 'new-access-token',
			refreshToken: 'new-refresh-token',
		};

		it('should successfully refresh tokens', async () => {
			JwtServiceMock.verifyRefreshToken.mockReturnValue(decodedToken);
			JwtServiceMock.refreshTokens.mockReturnValue(newTokens);

			const result = await authService.refreshTokens(refreshToken);

			expect(JwtServiceMock.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
			expect(JwtServiceMock.refreshTokens).toHaveBeenCalledWith(refreshToken);
			expect(LoggerMock.log).toHaveBeenCalledWith(
				'Tokens refreshed successfully',
				decodedToken.email,
			);
			expect(result).toEqual(newTokens);
		});

		it('should return null and log error if refresh token is invalid', async () => {
			JwtServiceMock.verifyRefreshToken.mockReturnValue(null);

			const result = await authService.refreshTokens(refreshToken);

			expect(JwtServiceMock.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
			expect(LoggerMock.error).toHaveBeenCalledWith('Invalid refresh token');
			expect(JwtServiceMock.refreshTokens).not.toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it('should return null if refreshTokens returns null', async () => {
			JwtServiceMock.verifyRefreshToken.mockReturnValue(decodedToken);
			JwtServiceMock.refreshTokens.mockReturnValue(null);

			const result = await authService.refreshTokens(refreshToken);

			expect(JwtServiceMock.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
			expect(JwtServiceMock.refreshTokens).toHaveBeenCalledWith(refreshToken);
			expect(LoggerMock.log).not.toHaveBeenCalled();
			expect(result).toBeNull();
		});
	});

	describe('validateUser', () => {
		const loginDto: LoginDto = {
			email: 'john@example.com',
			password: 'password123',
		};

		const mockUser: UserModel = {
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should return user if credentials are valid', async () => {
			UserRepositoryMock.findByEmail.mockResolvedValue(mockUser);
			PasswordHasherMock.compare.mockResolvedValue(true);

			const result = await authService.validateUser(loginDto);

			expect(UserRepositoryMock.findByEmail).toHaveBeenCalledWith(loginDto.email);
			expect(PasswordHasherMock.compare).toHaveBeenCalledWith(
				loginDto.password,
				mockUser.hasPassword,
			);
			expect(result).toEqual(mockUser);
		});

		it('should return null if user not found', async () => {
			UserRepositoryMock.findByEmail.mockResolvedValue(null);

			const result = await authService.validateUser(loginDto);

			expect(UserRepositoryMock.findByEmail).toHaveBeenCalledWith(loginDto.email);
			expect(PasswordHasherMock.compare).not.toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it('should return null if password is invalid', async () => {
			UserRepositoryMock.findByEmail.mockResolvedValue(mockUser);
			PasswordHasherMock.compare.mockResolvedValue(false);

			const result = await authService.validateUser(loginDto);

			expect(UserRepositoryMock.findByEmail).toHaveBeenCalledWith(loginDto.email);
			expect(PasswordHasherMock.compare).toHaveBeenCalledWith(
				loginDto.password,
				mockUser.hasPassword,
			);
			expect(result).toBeNull();
		});

		it('should handle password comparison errors', async () => {
			UserRepositoryMock.findByEmail.mockResolvedValue(mockUser);
			PasswordHasherMock.compare.mockRejectedValue(new Error('Comparison failed'));

			await expect(authService.validateUser(loginDto)).rejects.toThrow('Comparison failed');
		});
	});
});
