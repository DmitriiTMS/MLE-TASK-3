import { UserDto } from "./dto/user.dto";

export interface IUserService {
    createUser(userDto: UserDto): Promise<any>
}