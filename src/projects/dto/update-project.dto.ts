import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectDto {
	@IsString({ message: 'Поле [name] должно быть строкой' })
	@MaxLength(100, { message: 'Поле [name] не должно превышать 100 символов' })
	@IsOptional()
	name?: string;

	@IsString({ message: 'Поле [description] должно быть строкой' })
	@MaxLength(1000, { message: 'Поле [description] не должно превышать 1000 символов' })
	@IsOptional()
	description?: string;
}
