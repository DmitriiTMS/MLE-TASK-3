import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RegisterDto {

    @IsString({ message: 'Поле [name] должно быть строкой' })
    @IsNotEmpty({ message: 'Поле [name] не может быть пустым' })
    name: string = '';

    @IsEmail({}, { message: 'Не верно указан [email]' })
    @IsNotEmpty({ message: 'Поле [email] не может быть пустым' })
    email: string = '';

    @IsString({ message: 'Поле [password] должно быть строкой' })
    @IsNotEmpty({ message: 'Поле [password] не может быть пустым' })
    password: string = '';
}