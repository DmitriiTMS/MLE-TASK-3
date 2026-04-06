import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterDto {
	@IsString({ message: 'Поле [name] должно быть строкой' })
	@MaxLength(30, { message: 'Поле [name] не должно превышать 30 символов' })
	@IsNotEmpty({ message: 'Поле [name] не может быть пустым' })
	name: string;

	@IsEmail({}, { message: 'Не верно указан [email]' })
	@IsNotEmpty({ message: 'Поле [email] не может быть пустым' })
	email: string;

	@IsString({ message: 'Поле [password] должно быть строкой' })
	@MaxLength(20, { message: 'Поле [password] не должно превышать 20 символов' })
	@IsNotEmpty({ message: 'Поле [password] не может быть пустым' })
	password: string;
}
