import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../common/types/types';
import { IAuthService } from './auth.service.interface';
import { User } from '../users/entitys/user.entity';
import { IUserService } from '../users/user.service.interface';
import { RegisterDto } from './dto/register.dto';
import { IPasswordHasher } from '../common/utils/hasher/hasher.interface';

@injectable()
export class AuthService implements IAuthService {
    constructor(
        @inject(TYPES.IUserService) private userService: IUserService,
        @inject(TYPES.IPasswordHasher) private passwordHasher: IPasswordHasher
    ) { }

    async register(userDto: RegisterDto): Promise<User> {
        const { name, email, password } = userDto;
        const passwordHash = await this.passwordHasher.hash(password);
        const createUser = {
            name,
            email,
            passwordHash
        }

        const userId = await this.userService.createUser(createUser)
        return userId
    }

}