import { UserModel } from '@prisma/client';
import { UserDto } from './dto/user.dto';

export interface IUserService {
	createUser(userDto: UserDto): Promise<UserModel | null>;
	getUserOrThrow(userId: number, errorPath?: string):Promise<UserModel | null>
}
