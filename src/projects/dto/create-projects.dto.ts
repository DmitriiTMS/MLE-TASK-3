import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectsDto {
	@IsString({ message: 'Поле [name] должно быть строкой' })
	@MaxLength(100, { message: 'Поле [name] не должно превышать 100 символов' })
	@IsNotEmpty({ message: 'Поле [name] не может быть пустым' })
	name: string;

	@IsString({ message: 'Поле [description] должно быть строкой' })
	@MaxLength(1000, { message: 'Поле [description] не должно превышать 1000 символов' })
	@IsOptional()
	description: string;
}
