import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { IUserRepository } from './user.repository.interface';
import { UserModel } from '@prisma/client';
import { UserEntity } from './entitys/user.entity';
import { TYPES } from '../common/types/types';
import { PrismaService } from '../common/database/prisma.service';

@injectable()
export class UserRepository implements IUserRepository {
	constructor(@inject(TYPES.PrismaService) private readonly prismaService: PrismaService) { }

	async create(user: UserEntity): Promise<UserModel> {
		try {
			return await this.prismaService.client.userModel.create({
				data: {
					name: user.name,
					email: user.email,
					hasPassword: user.passwordHash,
				},
			});
		} catch (error) {
			throw error;
		}

	}

	async findByEmail(email: string): Promise<UserModel | null> {
		return await this.prismaService.client.userModel.findFirst({
			where: { email },
		});
	}

	async findById(id: number): Promise<UserModel | null> {
		return await this.prismaService.client.userModel.findFirst({
			where: { id },
		});
	}

}
