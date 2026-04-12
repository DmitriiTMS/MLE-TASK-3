import { UserModel } from '@prisma/client';
import { UserEntity } from './entitys/user.entity';

export interface IUserRepository {
	create(user: UserEntity): Promise<UserModel>;
	findByEmail(email: string): Promise<UserModel | null>;
	findById(id: number): Promise<UserModel | null>;
}
