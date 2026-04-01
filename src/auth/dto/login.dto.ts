import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
    @IsEmail({}, { message: 'Не верно указан [email]' })
    @IsNotEmpty({ message: 'Поле [email] не может быть пустым' })
    email: string = '';

    @IsString({ message: 'Поле [password] должно быть строкой' })
    @IsNotEmpty({ message: 'Поле [password] не может быть пустым' })
    password: string = '';
}