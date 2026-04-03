import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
	@IsEmail({}, { message: 'Не верно указан [email]' })
	@IsNotEmpty({ message: 'Поле [email] не может быть пустым' })
	email: string;

	@IsString({ message: 'Поле [password] должно быть строкой' })
	@MaxLength(20, { message: 'Поле [password] не должно превышать 20 символов' })
	@IsNotEmpty({ message: 'Поле [password] не может быть пустым' })
	password: string;
}
