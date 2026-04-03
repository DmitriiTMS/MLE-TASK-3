import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../common/types/types';
import { IAuthService } from './auth.service.interface';
import { IUserService } from '../users/user.service.interface';
import { RegisterDto } from './dto/register.dto';
import { IPasswordHasher } from '../common/utils/hasher/hasher.interface';
import { UserModel } from '@prisma/client';
import { UserRepository } from '../users/user.repository';
import { LoginDto } from './dto/login.dto';

@injectable()
export class AuthService implements IAuthService {
	constructor(
		@inject(TYPES.IUserService) private userService: IUserService,
		@inject(TYPES.IPasswordHasher) private passwordHasher: IPasswordHasher,
		@inject(TYPES.IUserRepository) private readonly userRepository: UserRepository,
	) {}

	async register(registerDto: RegisterDto): Promise<UserModel | null> {
		const { name, email, password } = registerDto;
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
		return createdUser;
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
