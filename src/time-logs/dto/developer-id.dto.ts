import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class DeveloperIdDto {
	@IsString({ message: 'Параметр [developerId] должно быть строкой' })
	@Matches(/^\d+$/, { message: 'Параметр [developerId] должен содержать только цифры' })
	@IsNotEmpty({ message: 'Параметр [developerId] не может быть пустым' })
	developerId: string;
}
