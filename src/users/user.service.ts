import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { UserEntity } from './entitys/user.entity';
import { IUserService } from './user.service.interface';
import { UserDto } from './dto/user.dto';
import { TYPES } from '../common/types/types';
import { UserRepository } from './user.repository';
import { UserModel } from '@prisma/client';

@injectable()
export class UserService implements IUserService {
	constructor(@inject(TYPES.IUserRepository) private readonly userRepository: UserRepository) { }

	async createUser(userDto: UserDto): Promise<UserModel | null> {
		const { name, email, passwordHash } = userDto;
		const user = new UserEntity(name, email);
		user.setPasswordHash(passwordHash);
		return await this.userRepository.create(user);
	}
}
