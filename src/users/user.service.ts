import 'reflect-metadata';
import { injectable } from 'inversify';
import { User } from './entitys/user.entity';
import { IUserService } from './user.service.interface';
import { UserDto } from './dto/user.dto';


@injectable()
export class UserService implements IUserService {

    async createUser(userDto: UserDto) {
        const { name, email, passwordHash } = userDto
        const user = new User(name, email);
        user.setPasswordHash(passwordHash);

        const savedUser = {
            id: 1,
            name: user.name,
            email: user.email,
            password: user.passwordHash
        };
        user.setId(savedUser.id); 
        return user.toDTO();
    }
}