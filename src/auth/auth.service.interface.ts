import { UserModel } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface IAuthService {
	register(registerDto: RegisterDto): Promise<UserModel | null>;
	validateUser(loginDto: LoginDto): Promise<UserModel | null>;
}
