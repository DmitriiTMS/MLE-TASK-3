import { UserModel } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokensPair } from './jwt/types';

export interface IRegisterResponse extends TokensPair {
	id: number;
}

export interface IAuthService {
	register(registerDto: RegisterDto): Promise<IRegisterResponse | null>;
	login(loginDto: LoginDto): Promise<IRegisterResponse | null>;
	refreshTokens(refreshToken: string): Promise<TokensPair | null>;
	getMe(email: string): Promise<{ id: number } | null>;
	validateUser(loginDto: LoginDto): Promise<UserModel | null>;
}
