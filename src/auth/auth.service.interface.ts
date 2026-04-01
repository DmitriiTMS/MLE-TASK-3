import { User } from "../users/entitys/user.entity";
import { RegisterDto } from "./dto/register.dto";

export interface IAuthService {
    register(user: RegisterDto): Promise<User>
}